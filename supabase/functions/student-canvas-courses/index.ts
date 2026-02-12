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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Verify user
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub as string;
  const userEmail = claimsData.claims.email as string;

  const canvasBaseUrl = Deno.env.get("CANVAS_BASE_URL");
  const canvasApiToken = Deno.env.get("CANVAS_API_TOKEN");

  if (!canvasBaseUrl || !canvasApiToken) {
    return new Response(
      JSON.stringify({ error: "Canvas integration not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Search for user in Canvas by email
    const searchUrl = `${canvasBaseUrl}/api/v1/users?search_term=${encodeURIComponent(userEmail)}&per_page=5`;
    const userRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${canvasApiToken}` },
    });

    if (!userRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to search Canvas for your account" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const canvasUsers = await userRes.json();
    
    // Find exact email match
    const canvasUser = canvasUsers.find(
      (u: any) => u.email?.toLowerCase() === userEmail.toLowerCase() || u.login_id?.toLowerCase() === userEmail.toLowerCase()
    );

    if (!canvasUser) {
      return new Response(
        JSON.stringify({ error: "No Canvas account found for your email", courses: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get student's Canvas courses (as student enrollment)
    const coursesUrl = `${canvasBaseUrl}/api/v1/users/${canvasUser.id}/courses?enrollment_type=student&enrollment_state=active&state[]=available&per_page=50&include[]=term`;
    const coursesRes = await fetch(coursesUrl, {
      headers: { Authorization: `Bearer ${canvasApiToken}` },
    });

    if (!coursesRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch Canvas courses" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const canvasCourses = await coursesRes.json();

    // Get existing courses in our system to show which ones are already imported
    const { data: existingCourses } = await supabase
      .from("courses")
      .select("id, name, section, lms_course_id");

    const existingLmsIds = new Set((existingCourses || []).map((c: any) => c.lms_course_id).filter(Boolean));

    // Check which courses the student has already joined via student_sessions
    const { data: studentSessions } = await supabase
      .from("student_sessions")
      .select("session_id, sessions(course_id)")
      .eq("user_id", userId);

    const joinedCourseIds = new Set<string>();
    for (const ss of studentSessions || []) {
      const session = ss.sessions as any;
      if (session?.course_id) joinedCourseIds.add(session.course_id);
    }

    // Map Canvas courses and indicate availability
    const courses = canvasCourses.map((cc: any) => {
      const lmsId = String(cc.id);
      const matchedCourse = (existingCourses || []).find((ec: any) => ec.lms_course_id === lmsId);
      return {
        canvas_course_id: lmsId,
        name: cc.name,
        course_code: cc.course_code || null,
        term: cc.term?.name || null,
        // Whether a course exists in our platform matching this Canvas course
        platform_course_id: matchedCourse?.id || null,
        platform_course_name: matchedCourse?.name || null,
        already_joined: matchedCourse ? joinedCourseIds.has(matchedCourse.id) : false,
      };
    });

    return new Response(
      JSON.stringify({ courses }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Canvas student courses error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error fetching Canvas courses" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
