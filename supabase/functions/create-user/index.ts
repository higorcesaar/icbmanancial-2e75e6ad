import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json();
    const { action } = body;

    // ---- PUBLIC ACTION: reject_request_self (no auth needed, used right after pending signup if user cancels) ----
    // No public actions for now — all admin actions below

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem realizar esta ação" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { data: prof } = await admin
        .from("profiles").select("user_id").eq("id", body.user_id).maybeSingle();
      const targetId = prof?.user_id ?? body.user_id;

      await admin.from("user_roles").delete().eq("user_id", targetId);
      await admin.from("profiles").delete().eq("user_id", targetId);

      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error && (error as any).status !== 404) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "change_password") {
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

    if (action === "approve_request") {
      // Approves a pending profile: mark approved+active, give 'ministra' role,
      // and create a member entry with the request photo.
      const { data: prof, error: pErr } = await admin
        .from("profiles").select("*").eq("id", body.profile_id).maybeSingle();
      if (pErr) throw pErr;
      if (!prof) throw new Error("Solicitação não encontrada");

      await admin.from("profiles").update({
        status: 'approved',
        is_active: true,
        avatar_url: prof.request_photo_url ?? prof.avatar_url,
      }).eq("id", prof.id);

      await admin.from("user_roles").upsert({ user_id: prof.user_id, role: 'ministra' });

      // Create member if not exists with same name
      const { data: existingMember } = await admin
        .from("members").select("id").eq("name", prof.display_name).maybeSingle();
      if (!existingMember) {
        await admin.from("members").insert({
          name: prof.display_name ?? prof.email,
          photo_url: prof.request_photo_url,
          status: 'active',
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject_request") {
      const { data: prof } = await admin
        .from("profiles").select("user_id").eq("id", body.profile_id).maybeSingle();
      if (prof?.user_id) {
        await admin.from("user_roles").delete().eq("user_id", prof.user_id);
        await admin.from("profiles").delete().eq("user_id", prof.user_id);
        await admin.auth.admin.deleteUser(prof.user_id).catch(() => {});
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "change_role") {
      // Server-side authorization for role changes (cannot trust client isAdmin flag)
      const allowed = ["admin", "ministra"];
      if (!allowed.includes(body.role)) {
        return new Response(JSON.stringify({ error: "Função inválida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: prof } = await admin
        .from("profiles").select("user_id").eq("id", body.user_id).maybeSingle();
      const targetId = prof?.user_id ?? body.user_id;
      // Prevent admin from removing their own admin role (lockout protection)
      if (targetId === userData.user.id && body.role !== "admin") {
        return new Response(JSON.stringify({ error: "Você não pode remover seu próprio acesso de administrador" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await admin.from("user_roles").delete().eq("user_id", targetId);
      await admin.from("user_roles").insert({ user_id: targetId, role: body.role });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle_active") {
      const { data: prof } = await admin
        .from("profiles").select("user_id, is_active").eq("id", body.user_id).maybeSingle();
      if (!prof) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Prevent self-deactivation
      if (prof.user_id === userData.user.id) {
        return new Response(JSON.stringify({ error: "Você não pode desativar a si mesma" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await admin.from("profiles").update({ is_active: !prof.is_active }).eq("id", body.user_id);
      return new Response(JSON.stringify({ success: true, is_active: !prof.is_active }), {
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
    // Do not leak internal error details to client
    return new Response(JSON.stringify({ error: "Não foi possível concluir a operação. Tente novamente." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
