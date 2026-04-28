import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Zap, Clock, Wifi, WifiOff, Play, Loader2, MapPin, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useHeartbeat, type ConnectionStatus } from "@/hooks/useHeartbeat";
import { format } from "date-fns";

// ── types ─────────────────────────────────────────────────────────────────

interface AttendedCourse {
  id: string;
  name: string;
  section: string | null;
}

interface ActiveSessionInfo {
  session_id: string;
  course_name: string;
  course_code: string | null;
  section: string | null;
  room: string | null;
  instructor_name: string | null;
  start_time: string;
}

// ── helpers ───────────────────────────────────────────────────────────────

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
};

const ConnectionIndicator = ({ status }: { status: ConnectionStatus }) => {
  const config = {
    connected: { color: "bg-focus-active", label: "Connected", Icon: Wifi },
    disconnected: { color: "bg-destructive", label: "Disconnected", Icon: WifiOff },
    idle: { color: "bg-focus-inactive", label: "Idle", Icon: Wifi },
  }[status];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`w-2.5 h-2.5 rounded-full ${config.color}`}
        animate={status === "connected" ? { scale: [1, 1.3, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <config.Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
};

// ── component ─────────────────────────────────────────────────────────────

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendedCourses, setAttendedCourses] = useState<AttendedCourse[]>([]);
  // Session the student is currently IN (joined student_sessions row)
  const [myActiveSession, setMyActiveSession] = useState<ActiveSessionInfo | null>(null);
  // Live sessions from institution the student hasn't joined yet
  const [availableSessions, setAvailableSessions] = useState<ActiveSessionInfo[]>([]);
  const [todayFocus, setTodayFocus] = useState(0);

  const { status: heartbeatStatus, focusSeconds } = useHeartbeat({
    sessionId: myActiveSession?.session_id,
    userId: user?.id,
    enabled: !!myActiveSession,
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // ── 1. Past sessions this student attended ─────────────────────────
      const { data: studentSessions } = await supabase
        .from("student_sessions")
        .select(
          "session_id, focus_seconds, sessions(id, course_id, status, start_time, courses(id, name, section, course_code, room, instructor_name))"
        )
        .eq("user_id", user.id);

      const courseMap = new Map<string, AttendedCourse>();
      let activeFound: ActiveSessionInfo | null = null;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      let todayTotal = 0;
      const joinedSessionIds = new Set<string>();

      if (studentSessions) {
        for (const ss of studentSessions) {
          const session = ss.sessions as Record<string, unknown> | null;
          const course = session?.courses as Record<string, unknown> | null;
          const courseId = course?.id as string | undefined;

          if (courseId && !courseMap.has(courseId)) {
            courseMap.set(courseId, {
              id: courseId,
              name: course?.name as string,
              section: (course?.section as string) ?? null,
            });
          }

          joinedSessionIds.add(ss.session_id);

          if (session?.status === "active") {
            activeFound = {
              session_id: session.id as string,
              course_name: (course?.name as string) ?? "Unknown",
              course_code: (course?.course_code as string) ?? null,
              section: (course?.section as string) ?? null,
              room: (course?.room as string) ?? null,
              instructor_name: (course?.instructor_name as string) ?? null,
              start_time: session.start_time as string,
            };
          }

          if (new Date((session?.start_time as string) ?? 0) >= todayStart) {
            todayTotal += ss.focus_seconds;
          }
        }
      }

      setAttendedCourses(Array.from(courseMap.values()));
      setMyActiveSession(activeFound);
      setTodayFocus(todayTotal);

      // ── 2. Live sessions from the student's institution ────────────────
      // Get the student's institution_id from their profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("institution_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.institution_id) {
        // All active sessions from courses in this institution
        const { data: instSessions } = await supabase
          .from("sessions")
          .select(
            "id, start_time, courses!inner(id, name, section, course_code, room, instructor_name, institution_id)"
          )
          .eq("status", "active")
          .eq("courses.institution_id", profile.institution_id);

        if (instSessions) {
          const available: ActiveSessionInfo[] = instSessions
            .filter((s) => !joinedSessionIds.has(s.id))
            .map((s) => {
              const course = s.courses as Record<string, unknown>;
              return {
                session_id: s.id,
                course_name: (course.name as string) ?? "Unknown",
                course_code: (course.course_code as string) ?? null,
                section: (course.section as string) ?? null,
                room: (course.room as string) ?? null,
                instructor_name: (course.instructor_name as string) ?? null,
                start_time: s.start_time,
              };
            });
          setAvailableSessions(available);
        }
      }

      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // All sessions to highlight (joined + available)
  const liveCount = (myActiveSession ? 1 : 0) + availableSessions.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="font-display text-2xl font-bold">My Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {attendedCourses.length} class{attendedCourses.length !== 1 ? "es" : ""} attended
                {liveCount > 0 && (
                  <span className="ml-2 text-focus-active font-medium">
                    · {liveCount} live now
                  </span>
                )}
              </p>
            </div>
            <ConnectionIndicator status={myActiveSession ? heartbeatStatus : "idle"} />
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8"
          >
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Today's Focus</span>
              </div>
              <p className="font-display text-2xl font-bold">
                {formatTime(myActiveSession ? todayFocus + focusSeconds : todayFocus)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Classes</span>
              </div>
              <p className="font-display text-2xl font-bold">{attendedCourses.length}</p>
            </div>
            <div className="glass-card rounded-xl p-4 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Focus Status</span>
              </div>
              <p className="font-display text-lg font-bold">
                {myActiveSession
                  ? heartbeatStatus === "connected"
                    ? "Focused"
                    : "Paused"
                  : "No active session"}
              </p>
            </div>
          </motion.div>

          {/* ── Active session (student is already in) ── */}
          {myActiveSession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <SessionCard
                session={myActiveSession}
                label="In session"
                labelColor="text-focus-active"
                borderColor="border-l-focus-active"
                onJoin={() => navigate(`/session/${myActiveSession.session_id}`)}
                buttonLabel="Go to Session"
              />
            </motion.div>
          )}

          {/* ── Available sessions from institution ── */}
          {availableSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <h2 className="font-display text-base font-semibold mb-3">
                Classes happening now
              </h2>
              <div className="space-y-3">
                {availableSessions.map((s) => (
                  <SessionCard
                    key={s.session_id}
                    session={s}
                    label="Live now"
                    labelColor="text-primary"
                    borderColor="border-l-primary"
                    onJoin={() => navigate(`/session/${s.session_id}`)}
                    buttonLabel="Join Now"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Previously attended courses ── */}
          {attendedCourses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-display text-base font-semibold mb-3">Previously Attended</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attendedCourses.map((course) => (
                  <div key={course.id} className="glass-card rounded-xl p-5 space-y-1">
                    <h3 className="font-display font-semibold">{course.name}</h3>
                    {course.section && (
                      <p className="text-sm text-muted-foreground">{course.section}</p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 mt-2 text-primary"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      View →
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {!myActiveSession && availableSessions.length === 0 && attendedCourses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center py-16"
            >
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-muted-foreground text-sm">
                No sessions yet. Classes will appear here automatically when your professor starts one.
              </p>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

// ── SessionCard sub-component ──────────────────────────────────────────────

function SessionCard({
  session,
  label,
  labelColor,
  borderColor,
  onJoin,
  buttonLabel,
}: {
  session: ActiveSessionInfo;
  label: string;
  labelColor: string;
  borderColor: string;
  onJoin: () => void;
  buttonLabel: string;
}) {
  return (
    <div className={`glass-card rounded-xl p-6 border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-current"
              style={{ color: "inherit" }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
          </div>
          <h2 className="font-display text-xl font-bold truncate">
            {session.course_code ? `${session.course_code} — ` : ""}{session.course_name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            {session.section && (
              <span className="text-sm text-muted-foreground">{session.section}</span>
            )}
            {session.instructor_name && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" /> {session.instructor_name}
              </span>
            )}
            {session.room && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {session.room}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Started {format(new Date(session.start_time), "h:mm a")}
            </span>
          </div>
        </div>
        <Button className="gap-2 shrink-0" onClick={onJoin}>
          <Play className="w-4 h-4" /> {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

export default StudentDashboard;
