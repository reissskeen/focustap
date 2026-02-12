import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Zap, Clock, Wifi, WifiOff, Play, Loader2, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ImportCanvasCourses from "@/components/student/ImportCanvasCourses";
import CanvasCoursesList from "@/components/student/CanvasCoursesList";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useHeartbeat, type ConnectionStatus } from "@/hooks/useHeartbeat";

interface EnrolledCourse {
  id: string;
  name: string;
  section: string | null;
}

interface ActiveSessionInfo {
  session_id: string;
  course_name: string;
  section: string | null;
  start_time: string;
}

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

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(null);
  const [todayFocus, setTodayFocus] = useState(0);

  // Heartbeat for active session
  const { status: heartbeatStatus, focusSeconds } = useHeartbeat({
    sessionId: activeSession?.session_id,
    userId: user?.id,
    enabled: !!activeSession,
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // 1. Get courses the student has participated in
      const { data: studentSessions } = await supabase
        .from("student_sessions")
        .select("session_id, focus_seconds, sessions(id, course_id, status, start_time, courses(id, name, section))")
        .eq("user_id", user.id);

      if (studentSessions) {
        // Unique courses
        const courseMap = new Map<string, EnrolledCourse>();
        let activeFound: ActiveSessionInfo | null = null;

        // Today's focus total
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        let todayTotal = 0;

        for (const ss of studentSessions) {
          const session = ss.sessions as any;
          const course = session?.courses as any;
          if (course && !courseMap.has(course.id)) {
            courseMap.set(course.id, { id: course.id, name: course.name, section: course.section });
          }
          // Check if this session is currently active
          if (session?.status === "active") {
            activeFound = {
              session_id: session.id,
              course_name: course?.name ?? "Unknown",
              section: course?.section ?? null,
              start_time: session.start_time,
            };
          }
          // Sum today's focus
          if (new Date(session?.start_time) >= todayStart) {
            todayTotal += ss.focus_seconds;
          }
        }

        setCourses(Array.from(courseMap.values()));
        setActiveSession(activeFound);
        setTodayFocus(todayTotal);
      }

      // Also check for active sessions in courses where student is enrolled (even if not yet joined)
      // This lets them see "Active Class Now" for classes they haven't joined yet today
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
                {courses.length} class{courses.length !== 1 ? "es" : ""} enrolled
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/join")}>
                <Plus className="w-4 h-4" /> Join Class
              </Button>
              <ImportCanvasCourses onCoursesImported={() => window.location.reload()} />
              <ConnectionIndicator status={activeSession ? heartbeatStatus : "idle"} />
            </div>
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
                {formatTime(activeSession ? todayFocus + focusSeconds : todayFocus)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Classes</span>
              </div>
              <p className="font-display text-2xl font-bold">{courses.length}</p>
            </div>
            <div className="glass-card rounded-xl p-4 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Focus Status</span>
              </div>
              <p className="font-display text-lg font-bold">
                {activeSession
                  ? heartbeatStatus === "connected"
                    ? "Focused"
                    : "Paused"
                  : "No active session"}
              </p>
            </div>
          </motion.div>

          {/* Active Session Banner */}
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="glass-card rounded-xl p-6 border-l-4 border-l-focus-active">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-focus-active"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                      <span className="text-sm font-semibold text-focus-active">Active Class Now</span>
                    </div>
                    <h2 className="font-display text-xl font-bold">{activeSession.course_name}</h2>
                    {activeSession.section && (
                      <p className="text-sm text-muted-foreground">{activeSession.section}</p>
                    )}
                  </div>
                  <Button className="gap-2" onClick={() => navigate(`/session/${activeSession.session_id}`)}>
                    <Play className="w-4 h-4" /> Go to Session
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Canvas Courses with Join/Waitlist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="font-display text-lg font-semibold mb-4">My Courses</h2>
            {user && <CanvasCoursesList userId={user.id} />}

            {/* Fallback: courses from past sessions */}
            {courses.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Previously Attended</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <div key={course.id} className="glass-card rounded-xl p-5 space-y-1">
                      <h3 className="font-display font-semibold">{course.name}</h3>
                      {course.section && (
                        <p className="text-sm text-muted-foreground">{course.section}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
