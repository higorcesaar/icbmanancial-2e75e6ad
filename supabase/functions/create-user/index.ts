import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-jwt",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isServiceRole = authHeader === SERVICE_ROLE || authHeader.startsWith(`Bearer ${SERVICE_ROLE}`);

    if (!isServiceRole) {
      return new Response(JSON.stringify({ error: "Unauthorized - service role required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    console.log("Service role authenticated request");

    const body = await req.json();
    const { action } = body;

    if (action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "change_password") {
      // body.user_id here is the profiles.id; fetch the actual auth user_id
      const { data: prof, error: pErr } = await admin
        .from("profiles").select("user_id").eq("id", body.user_id).maybeSingle();
      if (pErr) throw pErr;
      const targetId = prof?.user_id ?? body.user_id;
      const { error } = await admin.auth.admin.updateUserById(targetId, { password: body.new_password });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // default: create
    const { email, password, display_name, role } = body;
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { display_name },
    });
    if (cErr) throw cErr;

    if (role && created.user) {
      await admin.from("user_roles").upsert({ user_id: created.user.id, role });
    }

    return new Response(JSON.stringify({ success: true, user: created.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-user error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
