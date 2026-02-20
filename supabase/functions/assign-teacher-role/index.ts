import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { access_code } = await req.json();
    const expectedCode = Deno.env.get("TEACHER_ACCESS_CODE");

    if (!expectedCode || access_code !== expectedCode) {
      return new Response(JSON.stringify({ error: "Invalid access code" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to insert the teacher role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if already a teacher
    const { data: existing } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "teacher")
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ ok: true, message: "Already a teacher" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: "teacher" });

    if (insertError) {
      console.error("Role assignment failed:", insertError);
      return new Response(JSON.stringify({ error: "Unable to assign teacher role. Please try again or contact support." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unexpected error in assign-teacher-role:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
