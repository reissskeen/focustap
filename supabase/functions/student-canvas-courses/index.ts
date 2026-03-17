import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://focustap.com",
  "https://www.focustap.com",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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

  const canvasBaseUrl = Deno.env.get("CANVAS_BASE_URL");
  const canvasApiToken = Deno.env.get("CANVAS_API_TOKEN");

  if (!canvasBaseUrl || !canvasApiToken) {
    return new Response(
      JSON.stringify({ error: "Canvas integration not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Fetch all courses via pagination using /users/self/courses
    const allCourses: any[] = [];
    let url: string | null = `${canvasBaseUrl}/api/v1/users/self/courses?enrollment_state=active&per_page=50&include[]=term`;

    while (url) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${canvasApiToken}` },
      });

      if (!res.ok) {
        const body = await res.text();
        console.error("Canvas API error:", res.status, body);
        return new Response(
          JSON.stringify({ error: "Unable to fetch courses from Canvas. Please try again later." }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      allCourses.push(...data);

      // Parse Link header for pagination
      const linkHeader = res.headers.get("Link");
      url = null;
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        if (nextMatch) url = nextMatch[1];
      }
    }

    // Check which courses exist on our platform
    const { data: existingCourses } = await supabase
      .from("courses")
      .select("id, name, section, lms_course_id");

    // Check which courses the student already joined
    const { data: studentSessions } = await supabase
      .from("student_sessions")
      .select("session_id, sessions(course_id)")
      .eq("user_id", userId);

    const joinedCourseIds = new Set<string>();
    for (const ss of studentSessions || []) {
      const session = ss.sessions as any;
      if (session?.course_id) joinedCourseIds.add(session.course_id);
    }

    // Check which courses the student is waitlisted for
    const { data: waitlistEntries } = await supabase
      .from("course_waitlist")
      .select("course_id")
      .eq("user_id", userId);

    const waitlistedCourseIds = new Set<string>();
    for (const w of waitlistEntries || []) {
      waitlistedCourseIds.add(w.course_id);
    }

    // Check which platform courses have active sessions
    const platformCourseIds = (existingCourses || []).map((c: any) => c.id);
    const { data: activeSessions } = platformCourseIds.length > 0
      ? await supabase
          .from("sessions")
          .select("id, course_id")
          .in("course_id", platformCourseIds)
          .eq("status", "active")
      : { data: [] };

    const activeSessionMap = new Map<string, string>();
    for (const s of activeSessions || []) {
      activeSessionMap.set(s.course_id, s.id);
    }

    const courses = allCourses.map((cc: any) => {
      const lmsId = String(cc.id);
      const matchedCourse = (existingCourses || []).find((ec: any) => ec.lms_course_id === lmsId);
      const activeSessionId = matchedCourse ? activeSessionMap.get(matchedCourse.id) || null : null;
      return {
        canvas_course_id: lmsId,
        name: cc.name,
        course_code: cc.course_code || null,
        term: cc.term?.name || null,
        platform_course_id: matchedCourse?.id || null,
        platform_course_name: matchedCourse?.name || null,
        already_joined: matchedCourse ? joinedCourseIds.has(matchedCourse.id) : false,
        waitlisted: matchedCourse ? waitlistedCourseIds.has(matchedCourse.id) : false,
        active_session_id: activeSessionId,
      };
    });

    return new Response(
      JSON.stringify({ courses }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Canvas student courses error:", err);
    return new Response(
      JSON.stringify({ error: "Unable to fetch Canvas courses. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
