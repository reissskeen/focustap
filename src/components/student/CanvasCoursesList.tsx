import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Play, Clock, Loader2, Bell, BellOff, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CanvasCourse {
  canvas_course_id: string;
  name: string;
  course_code: string | null;
  term: string | null;
  platform_course_id: string | null;
  platform_course_name: string | null;
  already_joined: boolean;
  waitlisted: boolean;
  active_session_id: string | null;
}

interface CanvasCoursesListProps {
  userId: string;
}

const CanvasCoursesList = ({ userId }: CanvasCoursesListProps) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke("student-canvas-courses", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      setCourses(data.courses || []);
    } catch (err: any) {
      setError(err.message || "Failed to load Canvas courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [userId]);

  const handleJoinWaitlist = async (course: CanvasCourse) => {
    if (!course.platform_course_id) return;
    setActionLoading(course.canvas_course_id);
    try {
      const { error } = await supabase
        .from("course_waitlist")
        .insert({ user_id: userId, course_id: course.platform_course_id });

      if (error) throw error;
      toast.success(`You'll be auto-joined when ${course.platform_course_name || course.name} starts!`);
      // Update local state
      setCourses(prev => prev.map(c =>
        c.canvas_course_id === course.canvas_course_id ? { ...c, waitlisted: true } : c
      ));
    } catch (err: any) {
      toast.error(err.message || "Failed to join waitlist");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveWaitlist = async (course: CanvasCourse) => {
    if (!course.platform_course_id) return;
    setActionLoading(course.canvas_course_id);
    try {
      const { error } = await supabase
        .from("course_waitlist")
        .delete()
        .eq("user_id", userId)
        .eq("course_id", course.platform_course_id);

      if (error) throw error;
      toast.success("Removed from waitlist");
      setCourses(prev => prev.map(c =>
        c.canvas_course_id === course.canvas_course_id ? { ...c, waitlisted: false } : c
      ));
    } catch (err: any) {
      toast.error(err.message || "Failed to leave waitlist");
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoinSession = async (course: CanvasCourse) => {
    if (!course.active_session_id) return;
    setActionLoading(course.canvas_course_id);
    try {
      const { error } = await supabase
        .from("student_sessions")
        .upsert(
          { user_id: userId, session_id: course.active_session_id },
          { onConflict: "user_id,session_id" }
        );
      if (error) throw error;
      navigate(`/session/${course.active_session_id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join session");
    } finally {
      setActionLoading(null);
    }
  };

  // For prototype: auto-create platform course if needed, then navigate
  const handleEnterClass = async (course: CanvasCourse) => {
    setActionLoading(course.canvas_course_id);
    try {
      let courseId = course.platform_course_id;
      if (!courseId) {
        // Auto-create a course record for this Canvas course
        const { data, error } = await supabase
          .from("courses")
          .insert({
            name: course.name,
            section: course.course_code,
            lms_course_id: course.canvas_course_id,
            teacher_user_id: userId, // prototype: student creates it
          })
          .select("id")
          .single();
        if (error) throw error;
        courseId = data.id;
      }
      navigate(`/course/${courseId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to enter class");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading Canvas courses…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-6 text-center text-muted-foreground">
        <p className="text-sm">{error}</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={fetchCourses}>
          Retry
        </Button>
      </div>
    );
  }

  if (courses.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {courses.map((course, i) => {
        const isLoading = actionLoading === course.canvas_course_id;
        const hasActiveSession = !!course.active_session_id;
        const isOnPlatform = !!course.platform_course_id;

        return (
          <motion.div
            key={course.canvas_course_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`glass-card rounded-xl p-5 space-y-3 ${
              hasActiveSession ? "border-l-4 border-l-focus-active" : ""
            }`}
          >
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-sm leading-tight">
                {course.platform_course_name || course.name}
              </h3>
              {course.course_code && (
                <p className="text-xs text-muted-foreground">{course.course_code}</p>
              )}
              {course.term && (
                <p className="text-xs text-muted-foreground">{course.term}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              {hasActiveSession ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-focus-active"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    <span className="text-xs font-medium text-focus-active">Live Now</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleJoinSession(course)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Join Session
                    </Button>
                  </div>
                </>
              ) : isOnPlatform ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">No active session</span>
                  </div>
                  {course.waitlisted ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => handleLeaveWaitlist(course)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
                      Waitlisted
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => handleJoinWaitlist(course)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                      Join Waitlist
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="text-xs">Pending professor setup</span>
                </div>
              )}
            </div>

            {/* Enter Class button - always available for prototype */}
            <Button
              size="sm"
              variant="ghost"
              className="w-full gap-1.5 mt-1 text-primary"
              onClick={() => handleEnterClass(course)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              Enter Class
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CanvasCoursesList;
