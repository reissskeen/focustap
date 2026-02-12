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

    const { courses } = await req.json();
    if (!Array.isArray(courses) || courses.length === 0) {
      return new Response(JSON.stringify({ error: "No courses provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which are already imported
    const canvasIds = courses.map((c: any) => String(c.canvas_id));
    const { data: existing } = await supabase
      .from("courses")
      .select("lms_course_id")
      .eq("teacher_user_id", userId)
      .in("lms_course_id", canvasIds);

    const existingSet = new Set(
      (existing || []).map((c: { lms_course_id: string | null }) => c.lms_course_id)
    );

    const toInsert = courses
      .filter((c: any) => !existingSet.has(String(c.canvas_id)))
      .map((c: any) => ({
        teacher_user_id: userId,
        name: c.name,
        section: c.course_code || null,
        lms_course_id: String(c.canvas_id),
      }));

    if (toInsert.length === 0) {
      return new Response(
        JSON.stringify({ imported: [], message: "All selected courses are already imported" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("courses")
      .insert(toInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to import courses" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imported: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("canvas-import error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
