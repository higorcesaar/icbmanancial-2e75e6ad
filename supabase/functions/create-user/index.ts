import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "delete") {
      const { error } = await supabase.auth.admin.deleteUser(body.user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "change_password") {
      const { data: prof, error: pErr } = await supabase
        .from("profiles").select("user_id").eq("id", body.user_id).maybeSingle();
      if (pErr) throw pErr;
      const targetId = prof?.user_id ?? body.user_id;
      const { error } = await supabase.auth.admin.updateUserById(targetId, { password: body.new_password });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, display_name, role } = body;
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { display_name },
    });
    if (cErr) throw cErr;

    if (role && created.user) {
      await supabase.from("user_roles").upsert({ user_id: created.user.id, role });
      await supabase.from("profiles").upsert({ id: created.user.id, display_name, email });
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
