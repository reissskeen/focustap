import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import StartSessionDialog from "@/components/teacher/StartSessionDialog";
import CreateCourseForm from "@/components/teacher/CreateCourseForm";
import ActiveSessionView from "@/components/teacher/ActiveSessionView";
import SeatLayoutEditor, { type SeatLayout } from "@/components/teacher/SeatLayoutEditor";
import DashboardGreeting from "@/components/teacher/dashboard/DashboardGreeting";
import LiveSessionHero, { type NextClassInfo } from "@/components/teacher/dashboard/LiveSessionHero";
import StatStrip from "@/components/teacher/dashboard/StatStrip";
import WeekSchedule, { type WeekSessionItem } from "@/components/teacher/dashboard/WeekSchedule";
import CourseHealthList, { type CourseStats } from "@/components/teacher/dashboard/CourseHealthList";

const BG = "#09090f";
const CYAN = "#22d3ee";
const MUTED = "#8585a0";

// ── helpers ────────────────────────────────────────────────────────────────

function weekBounds(offsetWeeks = 0) {
  const now = new Date();
  const dow = now.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now);
  mon.setDate(now.getDate() + daysToMon + offsetWeeks * 7);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { start: mon, end: sun };
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// ── types ──────────────────────────────────────────────────────────────────

interface StudentSessionRow {
  session_id: string;
  user_id: string;
  focus_score: number | null;
  suspended_at: string | null;
}

// ── component ──────────────────────────────────────────────────────────────

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Tables<"courses">[]>([]);
  const [activeSession, setActiveSession] = useState<Tables<"sessions"> | null>(null);
  const [activeCourse, setActiveCourse] = useState<Tables<"courses"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [layoutEditing, setLayoutEditing] = useState<Tables<"courses"> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // dashboard data
  const [teacherName, setTeacherName] = useState("Professor");
  const [recentSessions, setRecentSessions] = useState<Tables<"sessions">[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, StudentSessionRow[]>>({});
  const [totalSessionsRun, setTotalSessionsRun] = useState(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const firstName = profile?.display_name?.split(" ")[0] || "Professor";
      setTeacherName(firstName);

      // Courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_user_id", user.id);
      const teacherCourses = coursesData || [];
      setCourses(teacherCourses);

      // Active session
      if (teacherCourses.length > 0) {
        const { data: sessions } = await supabase
          .from("sessions")
          .select("*")
          .eq("created_by", user.id)
          .eq("status", "active")
          .order("start_time", { ascending: false })
          .limit(1);
        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          setActiveSession(session);
          setActiveCourse(teacherCourses.find((c) => c.id === session.course_id) || null);
        }
      }

      // Recent sessions (last 5 weeks) for dashboard stats + schedule
      const fiveWeeksAgo = new Date();
      fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 35);
      const { data: recentData } = await supabase
        .from("sessions")
        .select("*")
        .eq("created_by", user.id)
        .gte("start_time", fiveWeeksAgo.toISOString())
        .order("start_time", { ascending: false });
      const recent = recentData || [];
      setRecentSessions(recent);

      // Total sessions run (all time)
      const { count } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("status", "ended");
      setTotalSessionsRun(count || 0);

      // Student sessions for recent sessions
      const sessionIds = recent.map((s) => s.id);
      if (sessionIds.length > 0) {
        const { data: ssData } = await supabase
          .from("student_sessions")
          .select("session_id, user_id, focus_score, suspended_at")
          .in("session_id", sessionIds);
        const map: Record<string, StudentSessionRow[]> = {};
        (ssData || []).forEach((ss) => {
          const row = ss as StudentSessionRow;
          if (!map[row.session_id]) map[row.session_id] = [];
          map[row.session_id].push(row);
        });
        setStudentMap(map);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  // ── Realtime: pick up auto-started or auto-ended sessions ─────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`teacher-sessions-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `created_by=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Tables<"sessions"> | undefined;
          const old = payload.old as Tables<"sessions"> | undefined;

          if (payload.eventType === "INSERT" && updated?.status === "active") {
            // Auto-started session — show it immediately
            setActiveSession(updated);
            setActiveCourse((prev) => prev ?? courses.find((c) => c.id === updated.course_id) ?? null);
          }

          if (payload.eventType === "UPDATE") {
            if (updated?.status === "ended" && old?.status === "active") {
              // Session ended (manual or auto)
              setActiveSession((prev) => (prev?.id === updated.id ? null : prev));
              setActiveCourse((prev) => {
                if (activeSession?.id === updated.id) return null;
                return prev;
              });
            }
            if (updated?.status === "active") {
              setActiveSession(updated);
              setActiveCourse(courses.find((c) => c.id === updated.course_id) ?? null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, courses, activeSession]);

  // ── derived data ──────────────────────────────────────────────────────────

  const { weekSessions, lastWeekSessions, courseMap } = useMemo(() => {
    const thisWeek = weekBounds(0);
    const lastWeek = weekBounds(-1);
    const cmap = Object.fromEntries(courses.map((c) => [c.id, c]));
    return {
      weekSessions: recentSessions.filter((s) => {
        const t = new Date(s.start_time);
        return t >= thisWeek.start && t <= thisWeek.end;
      }),
      lastWeekSessions: recentSessions.filter((s) => {
        const t = new Date(s.start_time);
        return t >= lastWeek.start && t <= lastWeek.end;
      }),
      courseMap: cmap,
    };
  }, [recentSessions, courses]);

  const statsData = useMemo(() => {
    const weekScores = weekSessions.flatMap((s) =>
      (studentMap[s.id] || [])
        .map((ss) => ss.focus_score)
        .filter((v): v is number => v !== null)
    );
    const lastWeekScores = lastWeekSessions.flatMap((s) =>
      (studentMap[s.id] || [])
        .map((ss) => ss.focus_score)
        .filter((v): v is number => v !== null)
    );

    const allStudentIds = new Set(
      recentSessions.flatMap((s) => (studentMap[s.id] || []).map((ss) => ss.user_id))
    );

    const recentRows = recentSessions.flatMap((s) => studentMap[s.id] || []);
    const alertedIds = new Set(
      recentRows
        .filter(
          (ss) =>
            ss.suspended_at !== null ||
            (ss.focus_score !== null && ss.focus_score < 60)
        )
        .map((ss) => ss.user_id)
    );

    return {
      avgFocusThisWeek: avg(weekScores),
      avgFocusLastWeek: avg(lastWeekScores),
      activeStudents: allStudentIds.size,
      attentionAlerts: alertedIds.size,
    };
  }, [weekSessions, lastWeekSessions, recentSessions, studentMap]);

  const weekScheduleItems: WeekSessionItem[] = useMemo(() => {
    const DAY_OFFSET: Record<string, number> = {
      Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
    };

    const realItems: WeekSessionItem[] = weekSessions.map((s) => ({
      id: s.id,
      courseId: s.course_id,
      courseName: courseMap[s.course_id]?.name || "Unknown",
      section: courseMap[s.course_id]?.section || null,
      room: courseMap[s.course_id]?.room || null,
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status,
      studentCount: (studentMap[s.id] || []).length,
    }));

    const weekMon = weekBounds(0).start;
    const scheduledItems: WeekSessionItem[] = [];

    for (const course of courses) {
      if (!course.meeting_days || !course.start_time) continue;
      for (const day of course.meeting_days) {
        const offset = DAY_OFFSET[day];
        if (offset === undefined) continue;

        const date = new Date(weekMon);
        date.setDate(weekMon.getDate() + offset);
        const [hh, mm] = course.start_time.split(":").map(Number);
        date.setHours(hh, mm, 0, 0);

        const hasRealSession = realItems.some((ri) => {
          if (ri.courseId !== course.id) return false;
          const riDate = new Date(ri.startTime);
          return (
            riDate.getFullYear() === date.getFullYear() &&
            riDate.getMonth() === date.getMonth() &&
            riDate.getDate() === date.getDate()
          );
        });
        if (hasRealSession) continue;

        let endDateStr: string | null = null;
        if (course.end_time) {
          const endDate = new Date(weekMon);
          endDate.setDate(weekMon.getDate() + offset);
          const [eh, em] = course.end_time.split(":").map(Number);
          endDate.setHours(eh, em, 0, 0);
          endDateStr = endDate.toISOString();
        }

        scheduledItems.push({
          id: `scheduled-${course.id}-${day}`,
          courseId: course.id,
          courseName: course.name,
          section: course.section,
          room: course.room,
          startTime: date.toISOString(),
          endTime: endDateStr,
          status: "scheduled",
          studentCount: 0,
        });
      }
    }

    return [...realItems, ...scheduledItems];
  }, [weekSessions, courseMap, studentMap, courses]);

  const courseStatsData: CourseStats[] = useMemo(
    () =>
      courses.map((course) => {
        const courseSessions = recentSessions.filter(
          (s) => s.course_id === course.id
        );
        const rows = courseSessions.flatMap((s) => studentMap[s.id] || []);
        const scores = rows
          .map((r) => r.focus_score)
          .filter((v): v is number => v !== null);
        const focusPct = avg(scores);
        const studentCount = new Set(rows.map((r) => r.user_id)).size;

        // Flagged = suspended or very low focus score in any recent session
        const flaggedIds = new Set(
          rows
            .filter(
              (r) =>
                r.suspended_at !== null ||
                (r.focus_score !== null && r.focus_score < 60)
            )
            .map((r) => r.user_id)
        );

        return {
          course,
          focusPct,
          flaggedCount: flaggedIds.size,
          studentCount,
        };
      }),
    [courses, recentSessions, studentMap]
  );

  const nextClass: NextClassInfo | null = useMemo(() => {
    if (activeSession) return null;
    const now = new Date();
    const upcoming = weekScheduleItems
      .filter((item) => item.status !== "ended" && new Date(item.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    if (!upcoming.length) return null;
    const next = upcoming[0];
    return {
      courseName: next.courseName,
      section: next.section,
      startTime: new Date(next.startTime),
      room: next.room,
    };
  }, [activeSession, weekScheduleItems]);

  // Active-session student count (live count)
  const activeStudentCount = activeSession
    ? (studentMap[activeSession.id] || []).length
    : 0;

  // Last focus % for the active course
  const lastFocusPct = useMemo(() => {
    if (!activeCourse) return null;
    const lastSession = recentSessions.find(
      (s) => s.course_id === activeCourse.id && s.status === "ended"
    );
    if (!lastSession) return null;
    const rows = studentMap[lastSession.id] || [];
    return avg(
      rows.map((r) => r.focus_score).filter((v): v is number => v !== null)
    );
  }, [activeCourse, recentSessions, studentMap]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleSessionStarted = (session: Tables<"sessions">) => {
    setActiveSession(session);
    setActiveCourse(courses.find((c) => c.id === session.course_id) || null);
  };

  const handleSessionEnded = () => {
    setActiveSession(null);
    setActiveCourse(null);
  };

  const handleCourseCreated = (course: Tables<"courses">) => {
    setCourses((prev) => [...prev, course]);
    setShowCreateCourse(false);
  };

  const handleLayoutSaved = (layout: SeatLayout) => {
    if (!layoutEditing) return;
    setCourses((prev) =>
      prev.map((c) =>
        c.id === layoutEditing.id
          ? { ...c, seat_layout: layout as unknown as Tables<"courses">["seat_layout"] }
          : c
      )
    );
  };

  const handleDeleteCourse = async (courseId: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (error) {
      toast.error("Failed to delete course: " + error.message);
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setDeletingId(null);
    toast.success("Course deleted");
  };

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <Navbar />
        <div
          className="pt-24 pb-8 px-4 flex items-center justify-center"
          style={{ minHeight: "100vh" }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `2px solid rgba(34,211,238,0.25)`,
              borderTopColor: CYAN,
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Navbar />

      <div className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">

          {/* Active session → full-page takeover */}
          {activeSession && activeCourse ? (
            <ActiveSessionView
              session={activeSession}
              course={activeCourse}
              onSessionEnded={handleSessionEnded}
            />
          ) : showCreateCourse ? (
            <CreateCourseForm
              userId={user!.id}
              onCourseCreated={handleCourseCreated}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              {/* Greeting */}
              <DashboardGreeting
                name={teacherName}
                onAnalytics={() => navigate("/analytics")}
              />

              {/* Hero */}
              <LiveSessionHero
                activeSession={null}
                activeCourse={null}
                courses={courses}
                onStartSession={() => setDialogOpen(true)}
                onEditLayout={setLayoutEditing}
                onAddCourse={() => setShowCreateCourse(true)}
                studentCount={activeStudentCount}
                lastFocusPct={lastFocusPct}
                nextClass={nextClass}
              />

              {/* Stat strip — only shown when there's data */}
              {(courses.length > 0 || totalSessionsRun > 0) && (
                <StatStrip
                  avgFocusThisWeek={statsData.avgFocusThisWeek}
                  avgFocusLastWeek={statsData.avgFocusLastWeek}
                  sessionsRun={totalSessionsRun}
                  courseCount={courses.length}
                  activeStudents={statsData.activeStudents}
                  attentionAlerts={statsData.attentionAlerts}
                />
              )}

              {/* Two-column body */}
              {courses.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1fr",
                    gap: 16,
                  }}
                  className="max-[900px]:grid-cols-1"
                >
                  <WeekSchedule
                    sessions={weekScheduleItems}
                    onNavigateToCourse={(id) => navigate(`/teacher/course/${id}`)}
                  />
                  <CourseHealthList
                    courseStats={courseStatsData}
                    deletingId={deletingId}
                    setDeletingId={setDeletingId}
                    onAddCourse={() => setShowCreateCourse(true)}
                    onCourseClick={(id) => navigate(`/teacher/course/${id}`)}
                    onEditLayout={setLayoutEditing}
                    onDeleteCourse={handleDeleteCourse}
                  />
                </div>
              )}

              {/* Zero courses — just show empty state below hero */}
              {courses.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    textAlign: "center",
                    color: MUTED,
                    fontSize: 13,
                    paddingTop: 8,
                  }}
                >
                  Create a course to start tracking engagement.
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <StartSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courses={courses}
        userId={user!.id}
        onSessionStarted={handleSessionStarted}
      />

      <AnimatePresence>
        {layoutEditing && (
          <SeatLayoutEditor
            courseId={layoutEditing.id}
            courseName={layoutEditing.name}
            initialLayout={layoutEditing.seat_layout as SeatLayout | null}
            onClose={() => setLayoutEditing(null)}
            onSaved={handleLayoutSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherDashboard;
