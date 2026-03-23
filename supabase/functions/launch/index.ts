import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://focustap.org",
  "https://www.focustap.org",
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

  // Validate auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Create authenticated client using the user's JWT — respects RLS
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Verify the user's token
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const courseId = url.searchParams.get("course_id");
  const sectionId = url.searchParams.get("section_id");
  const roomId = url.searchParams.get("room_id");

  let session = null;

  // Helper to enrich session with teacher name (uses RLS policy for teacher profile visibility)
  const enrichSession = async (sessionData: any) => {
    if (!sessionData) return null;
    const course = sessionData.courses;
    if (course?.teacher_user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", course.teacher_user_id)
        .maybeSingle();
      return { ...sessionData, _teacher_name: profile?.display_name ?? "Unknown Teacher" };
    }
    return { ...sessionData, _teacher_name: "Unknown Teacher" };
  };

  // Priority 1: Direct session_id lookup
  if (sessionId) {
    const { data } = await supabase
      .from("sessions")
      .select("id, status, course_id, courses(name, section, teacher_user_id)")
      .eq("id", sessionId)
      .eq("status", "active")
      .maybeSingle();
    session = await enrichSession(data);
  }

  // Priority 2: course_id + section_id
  if (!session && courseId) {
    const courseQuery = supabase
      .from("courses")
      .select("id")
      .eq("lms_course_id", courseId);
    if (sectionId) courseQuery.eq("section", sectionId);

    const { data: course } = await courseQuery.maybeSingle();
    if (course) {
      const { data } = await supabase
        .from("sessions")
        .select("id, status, course_id, courses(name, section, teacher_user_id)")
        .eq("course_id", course.id)
        .eq("status", "active")
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      session = await enrichSession(data);
    }
  }

  // Priority 3: room_id (room_tag)
  if (!session && roomId) {
    const { data: room } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_tag", roomId)
      .maybeSingle();

    if (room) {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("sessions")
        .select("id, status, course_id, courses(name, section, teacher_user_id)")
        .eq("room_id", room.id)
        .eq("status", "active")
        .lte("start_time", now)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      session = await enrichSession(data);
    }
  }

  if (!session) {
    return new Response(
      JSON.stringify({ error: "No active class session" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const courseMeta = session.courses as any;

  return new Response(
    JSON.stringify({
      session_id: session.id,
      course_name: courseMeta?.name ?? "Unknown Course",
      section: courseMeta?.section ?? null,
      teacher_name: session._teacher_name,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
