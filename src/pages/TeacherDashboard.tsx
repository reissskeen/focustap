import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Plus, BookOpen, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ButtonColorful } from "@/components/ui/button-colorful";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import StartSessionDialog from "@/components/teacher/StartSessionDialog";
import CreateCourseForm from "@/components/teacher/CreateCourseForm";
import ActiveSessionView from "@/components/teacher/ActiveSessionView";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Tables<"courses">[]>([]);
  const [activeSession, setActiveSession] = useState<Tables<"sessions"> | null>(null);
  const [activeCourse, setActiveCourse] = useState<Tables<"courses"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [pastSessions, setPastSessions] = useState<Array<Tables<"sessions"> & { course_name: string }>>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Fetch teacher's courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_user_id", user.id);

      const teacherCourses = coursesData || [];
      setCourses(teacherCourses);

      // Check for an active session
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
          const course = teacherCourses.find((c) => c.id === session.course_id) || null;
          setActiveCourse(course);
        }

        // Fetch past ended sessions (last 10)
        const { data: ended } = await supabase
          .from("sessions")
          .select("*")
          .eq("created_by", user.id)
          .eq("status", "ended")
          .order("end_time", { ascending: false })
          .limit(10);

        if (ended) {
          const courseMap = Object.fromEntries(teacherCourses.map((c) => [c.id, c.name]));
          setPastSessions(
            ended.map((s) => ({ ...s, course_name: courseMap[s.course_id] || "Unknown" }))
          );
        }
      }

      setLoading(false);
    };

    load();
  }, [user]);

  const handleSessionStarted = (session: Tables<"sessions">) => {
    setActiveSession(session);
    const course = courses.find((c) => c.id === session.course_id) || null;
    setActiveCourse(course);
  };

  const handleSessionEnded = () => {
    setActiveSession(null);
    setActiveCourse(null);
  };

  const handleCourseCreated = (course: Tables<"courses">) => {
    setCourses((prev) => [...prev, course]);
    setShowCreateCourse(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-8 px-4 flex items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {activeSession && activeCourse ? (
            <ActiveSessionView
              session={activeSession}
              course={activeCourse}
              onSessionEnded={handleSessionEnded}
            />
          ) : (
            /* Pre-session state */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* No courses yet */}
              {courses.length === 0 && !showCreateCourse ? (
                <div className="glass-card rounded-xl p-12 text-center space-y-4">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h1 className="font-display text-2xl font-bold">Welcome, Teacher!</h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Create a course to start running class sessions with live attendance and focus tracking.
                  </p>
                  <ButtonColorful onClick={() => setShowCreateCourse(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create Course
                  </ButtonColorful>
                </div>
              ) : showCreateCourse || courses.length === 0 ? (
                <CreateCourseForm userId={user!.id} onCourseCreated={handleCourseCreated} />
              ) : (
                /* Has courses, no active session */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold">Teacher Dashboard</h1>
                      <p className="text-sm text-muted-foreground">
                        {courses.length} course{courses.length !== 1 ? "s" : ""} · No active session
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <ButtonColorful variant="outline" size="sm" className="gap-2" onClick={() => setShowCreateCourse(true)}>
                        <Plus className="w-4 h-4" /> Add Course
                      </ButtonColorful>
                      <ButtonColorful size="sm" gradient="green" className="gap-2" onClick={() => setDialogOpen(true)}>
                        <Play className="w-4 h-4" /> Start Session
                      </ButtonColorful>
                    </div>
                  </div>

                  {/* Course list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                      <div key={course.id} className="glass-card rounded-xl p-5 space-y-1">
                        <h3 className="font-display font-semibold">{course.name}</h3>
                        {course.section && (
                          <p className="text-sm text-muted-foreground">{course.section}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Demo Report Link */}
                  <div className="space-y-3">
                    <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" /> Demo Analytics
                    </h2>
                    <div className="glass-card rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">Demo Session — Reiss, Jesse, Phil</p>
                        <p className="text-xs text-muted-foreground">Example session report with sample data</p>
                      </div>
                      <ButtonColorful variant="outline" size="sm" className="gap-1.5"
                        onClick={() => navigate("/teacher/session/e93a2ded-d912-4de0-92bd-ffe55e62368d/report")}>
                        <BarChart3 className="h-3.5 w-3.5" /> View Report
                      </ButtonColorful>
                    </div>
                  </div>

                  {/* Past Sessions */}
                  {pastSessions.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="font-display text-lg font-semibold">Past Sessions</h2>
                      <div className="space-y-2">
                        {pastSessions.map((s) => (
                          <div key={s.id} className="glass-card rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-foreground">{s.course_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(s.start_time).toLocaleDateString()} · {new Date(s.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </p>
                            </div>
                            <ButtonColorful variant="outline" size="sm" className="gap-1.5"
                              onClick={() => navigate(`/teacher/session/${s.id}/report`)}>
                              <BarChart3 className="h-3.5 w-3.5" /> Report
                            </ButtonColorful>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <StartSessionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                courses={courses}
                userId={user!.id}
                onSessionStarted={handleSessionStarted}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
