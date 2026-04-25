import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, BookOpen, BarChart3, GraduationCap, LayoutGrid, Trash2, X } from "lucide-react";
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

// Design tokens
const CYAN = "#22d3ee";
const CYAN_DIM = "rgba(34,211,238,0.12)";
const CYAN_BORDER = "rgba(34,211,238,0.25)";
const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";
const BG = "#09090f";

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

  const handleLayoutSaved = (layout: SeatLayout) => {
    if (!layoutEditing) return;
    setCourses((prev) =>
      prev.map((c) =>
        c.id === layoutEditing.id ? { ...c, seat_layout: layout as unknown as Tables<"courses">["seat_layout"] } : c
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <Navbar />
        <div className="pt-24 pb-8 px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `2px solid ${CYAN_BORDER}`,
                borderTopColor: CYAN,
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: MUTED, fontSize: 14 }}>Loading dashboard…</p>
          </motion.div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {activeSession && activeCourse ? (
            <ActiveSessionView
              session={activeSession}
              course={activeCourse}
              onSessionEnded={handleSessionEnded}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: "flex", flexDirection: "column", gap: 32 }}
            >
              {/* No courses yet — empty state */}
              {courses.length === 0 && !showCreateCourse ? (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                    borderRadius: 20,
                    padding: "64px 32px",
                    textAlign: "center",
                    backdropFilter: "blur(12px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: CYAN_DIM,
                      border: `1px solid ${CYAN_BORDER}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BookOpen style={{ width: 28, height: 28, color: CYAN }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <h1
                      style={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontSize: 24,
                        fontWeight: 700,
                        color: LIGHT,
                        margin: 0,
                      }}
                    >
                      Welcome to FocusTap
                    </h1>
                    <p
                      style={{
                        color: MUTED,
                        fontSize: 15,
                        maxWidth: 400,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      Create your first course to start running live class sessions with real-time
                      attendance and focus tracking.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateCourse(true)}
                    style={{
                      marginTop: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 22px",
                      borderRadius: 10,
                      background: CYAN_DIM,
                      border: `1px solid ${CYAN_BORDER}`,
                      color: CYAN,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(34,211,238,0.2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = CYAN_DIM)
                    }
                  >
                    <Plus style={{ width: 16, height: 16 }} />
                    Create Course
                  </button>
                </motion.div>
              ) : showCreateCourse || courses.length === 0 ? (
                <CreateCourseForm userId={user!.id} onCourseCreated={handleCourseCreated} />
              ) : (
                /* Has courses, no active session */
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                  {/* ── Page header ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                    className="sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: CYAN,
                          margin: 0,
                        }}
                      >
                        Professor View
                      </p>
                      <h1
                        style={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontSize: 26,
                          fontWeight: 700,
                          color: LIGHT,
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        Teacher Dashboard
                      </h1>
                      <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>
                        {courses.length} course{courses.length !== 1 ? "s" : ""} · No active session
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 12,
                        flexWrap: "wrap",
                      }}
                      className="sm:mt-0"
                    >
                      <button
                        onClick={() => navigate("/analytics")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "8px 16px",
                          borderRadius: 9,
                          background: CARD_BG,
                          border: `1px solid ${CARD_BORDER}`,
                          color: MUTED,
                          fontSize: 13,
                          fontWeight: 500,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          transition: "border-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = CYAN_BORDER;
                          e.currentTarget.style.color = LIGHT;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = CARD_BORDER;
                          e.currentTarget.style.color = MUTED;
                        }}
                      >
                        <BarChart3 style={{ width: 14, height: 14 }} />
                        Analytics
                      </button>

                      <button
                        onClick={() => setShowCreateCourse(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "8px 16px",
                          borderRadius: 9,
                          background: CARD_BG,
                          border: `1px solid ${CARD_BORDER}`,
                          color: MUTED,
                          fontSize: 13,
                          fontWeight: 500,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          transition: "border-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = CYAN_BORDER;
                          e.currentTarget.style.color = LIGHT;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = CARD_BORDER;
                          e.currentTarget.style.color = MUTED;
                        }}
                      >
                        <Plus style={{ width: 14, height: 14 }} />
                        Add Course
                      </button>

                      <button
                        onClick={() => setDialogOpen(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "8px 20px",
                          borderRadius: 9,
                          background: CYAN_DIM,
                          border: `1px solid ${CYAN_BORDER}`,
                          color: CYAN,
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(34,211,238,0.2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = CYAN_DIM)
                        }
                      >
                        <Play style={{ width: 14, height: 14 }} />
                        Start Session
                      </button>
                    </div>
                  </motion.div>

                  {/* ── Courses grid ── */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: MUTED,
                        margin: 0,
                      }}
                    >
                      Your Courses
                    </p>
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      style={{ gap: 16 }}
                    >
                      {courses.map((course, i) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08 + i * 0.05 }}
                          style={{
                            background: CARD_BG,
                            border: `1px solid ${CARD_BORDER}`,
                            borderRadius: 16,
                            padding: 20,
                            backdropFilter: "blur(12px)",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 14,
                            transition: "border-color 0.15s, background 0.15s",
                            cursor: "pointer",
                            position: "relative",
                          }}
                          onClick={() => navigate(`/teacher/course/${course.id}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = CYAN_BORDER;
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = CARD_BORDER;
                            e.currentTarget.style.background = CARD_BG;
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: CYAN_DIM,
                              border: `1px solid ${CYAN_BORDER}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <GraduationCap style={{ width: 16, height: 16, color: CYAN }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p
                              style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                                fontWeight: 600,
                                fontSize: 15,
                                color: LIGHT,
                                margin: 0,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                paddingRight: 28,
                              }}
                            >
                              {course.name}
                            </p>
                            {course.section && (
                              <p
                                style={{
                                  color: MUTED,
                                  fontSize: 13,
                                  margin: "3px 0 0",
                                }}
                              >
                                {course.section}
                              </p>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setLayoutEditing(course); }}
                              style={{
                                marginTop: 10,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: "rgba(34,211,238,0.06)",
                                border: `1px solid rgba(34,211,238,0.14)`,
                                color: MUTED,
                                fontSize: 11,
                                fontWeight: 500,
                                fontFamily: "inherit",
                                cursor: "pointer",
                                transition: "border-color 0.13s, color 0.13s, background 0.13s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = CYAN_BORDER;
                                e.currentTarget.style.color = CYAN;
                                e.currentTarget.style.background = CYAN_DIM;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "rgba(34,211,238,0.14)";
                                e.currentTarget.style.color = MUTED;
                                e.currentTarget.style.background = "rgba(34,211,238,0.06)";
                              }}
                            >
                              <LayoutGrid style={{ width: 11, height: 11 }} />
                              {course.seat_layout ? "Edit Layout" : "Set Layout"}
                            </button>
                          </div>

                          {/* Delete controls — top-right corner */}
                          {deletingId === course.id ? (
                            <div
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                                style={{
                                  padding: "3px 9px",
                                  borderRadius: 6,
                                  background: "rgba(239,68,68,0.12)",
                                  border: "1px solid rgba(239,68,68,0.35)",
                                  color: "#ef4444",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  fontFamily: "inherit",
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 5,
                                  background: "none",
                                  border: `1px solid ${CARD_BORDER}`,
                                  color: MUTED,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                <X style={{ width: 10, height: 10 }} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingId(course.id); }}
                              title="Delete course"
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                background: "none",
                                border: `1px solid transparent`,
                                color: MUTED,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0,
                                transition: "border-color 0.13s, color 0.13s, background 0.13s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
                                e.currentTarget.style.color = "#ef4444";
                                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "transparent";
                                e.currentTarget.style.color = MUTED;
                                e.currentTarget.style.background = "none";
                              }}
                            >
                              <Trash2 style={{ width: 12, height: 12 }} />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
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
