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

    // Get user's email from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile?.email) {
      return new Response(
        JSON.stringify({ error: "Could not find your email in your profile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const canvasBaseUrl = Deno.env.get("CANVAS_BASE_URL")!.replace(/\/+$/, "");
    const canvasToken = Deno.env.get("CANVAS_API_TOKEN")!;

    // Find Canvas user by email
    const searchUrl = `${canvasBaseUrl}/api/v1/accounts/self/users?search_term=${encodeURIComponent(profile.email)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${canvasToken}` },
    });

    if (!searchRes.ok) {
      const text = await searchRes.text();
      console.error("Canvas user search failed:", searchRes.status, text);
      return new Response(
        JSON.stringify({ error: "Failed to search Canvas for your account" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const canvasUsers = await searchRes.json();
    if (!Array.isArray(canvasUsers) || canvasUsers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No Canvas account found for your email", courses: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const canvasUserId = canvasUsers[0].id;

    // Fetch courses where this user is a teacher
    const coursesUrl = `${canvasBaseUrl}/api/v1/users/${canvasUserId}/courses?enrollment_type=teacher&per_page=100&include[]=term`;
    const coursesRes = await fetch(coursesUrl, {
      headers: { Authorization: `Bearer ${canvasToken}` },
    });

    if (!coursesRes.ok) {
      const text = await coursesRes.text();
      console.error("Canvas courses fetch failed:", coursesRes.status, text);
      return new Response(
        JSON.stringify({ error: "Failed to fetch courses from Canvas" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const canvasCourses = await coursesRes.json();

    // Get already-imported lms_course_ids for this teacher
    const { data: existingCourses } = await supabase
      .from("courses")
      .select("lms_course_id")
      .eq("teacher_user_id", userId)
      .not("lms_course_id", "is", null);

    const importedIds = new Set(
      (existingCourses || []).map((c: { lms_course_id: string | null }) => c.lms_course_id)
    );

    const courses = canvasCourses.map((c: any) => ({
      canvas_id: String(c.id),
      name: c.name,
      course_code: c.course_code || null,
      already_imported: importedIds.has(String(c.id)),
    }));

    return new Response(JSON.stringify({ courses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("canvas-courses error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
