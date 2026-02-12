import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Plus, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import ImportCanvasCourses from "@/components/teacher/ImportCanvasCourses";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Tables<"courses">[]>([]);
  const [activeSession, setActiveSession] = useState<Tables<"sessions"> | null>(null);
  const [activeCourse, setActiveCourse] = useState<Tables<"courses"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateCourse, setShowCreateCourse] = useState(false);

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

  const handleCanvasImported = (imported: Tables<"courses">[]) => {
    setCourses((prev) => [...prev, ...imported]);
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
                  <Button onClick={() => setShowCreateCourse(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create Course
                  </Button>
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
                      <ImportCanvasCourses onCoursesImported={handleCanvasImported} />
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowCreateCourse(true)}>
                        <Plus className="w-4 h-4" /> Add Course
                      </Button>
                      <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
                        <Play className="w-4 h-4" /> Start Session
                      </Button>
                    </div>
                  </div>

                  {/* Course list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                      <div key={course.id} className="glass-card rounded-xl p-5 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold">{course.name}</h3>
                          {course.lms_course_id && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Canvas</Badge>
                          )}
                        </div>
                        {course.section && (
                          <p className="text-sm text-muted-foreground">{course.section}</p>
                        )}
                      </div>
                    ))}
                  </div>
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
