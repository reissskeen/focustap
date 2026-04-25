import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, BarChart3, Clock, Users, Play, GraduationCap, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import StartSessionDialog from "@/components/teacher/StartSessionDialog";
import { format } from "date-fns";

const BG = "#09090f";
const CYAN = "#22d3ee";
const CYAN_DIM = "rgba(34,211,238,0.12)";
const CYAN_BORDER = "rgba(34,211,238,0.25)";
const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";

interface PastSession extends Tables<"sessions"> {
  student_count: number;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Tables<"courses"> | null>(null);
  const [sessions, setSessions] = useState<PastSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user || !courseId) return;

    const load = async () => {
      const [{ data: courseData }, { data: sessionData }] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
        supabase
          .from("sessions")
          .select("*")
          .eq("course_id", courseId)
          .eq("status", "ended")
          .order("start_time", { ascending: false }),
      ]);

      if (!courseData) {
        navigate("/teacher");
        return;
      }

      setCourse(courseData);

      if (sessionData && sessionData.length > 0) {
        const sessionIds = sessionData.map((s) => s.id);
        const { data: studentCounts } = await supabase
          .from("student_sessions")
          .select("session_id")
          .in("session_id", sessionIds);

        const countMap: Record<string, number> = {};
        (studentCounts || []).forEach((r) => {
          countMap[r.session_id] = (countMap[r.session_id] || 0) + 1;
        });

        setSessions(
          sessionData.map((s) => ({ ...s, student_count: countMap[s.id] || 0 }))
        );
      }

      setLoading(false);
    };

    load();
  }, [user, courseId, navigate]);

  const handleSessionStarted = (session: Tables<"sessions">) => {
    navigate("/teacher");
    // Active session view will show automatically on dashboard
    void session;
  };

  const totalStudents = sessions.reduce((n, s) => n + s.student_count, 0);
  const avgStudents =
    sessions.length > 0 ? Math.round(totalStudents / sessions.length) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `2px solid ${CYAN_BORDER}`,
              borderTopColor: CYAN,
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: "flex", flexDirection: "column", gap: 28 }}
          >
            {/* Back + header */}
            <div>
              <button
                onClick={() => navigate("/teacher")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  color: MUTED,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                  marginBottom: 16,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = LIGHT)}
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                <ChevronLeft style={{ width: 15, height: 15 }} />
                Back to Dashboard
              </button>

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: CYAN_DIM,
                      border: `1px solid ${CYAN_BORDER}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <GraduationCap style={{ width: 20, height: 20, color: CYAN }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: CYAN, margin: "0 0 2px" }}>
                      Course
                    </p>
                    <h1 style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: 22, fontWeight: 700, color: LIGHT, margin: 0, lineHeight: 1.2 }}>
                      {course.name}
                    </h1>
                    {course.section && (
                      <p style={{ color: MUTED, fontSize: 13, margin: "3px 0 0" }}>{course.section}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setDialogOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 20px",
                    borderRadius: 9,
                    background: CYAN_DIM,
                    border: `1px solid ${CYAN_BORDER}`,
                    color: CYAN,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,211,238,0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = CYAN_DIM)}
                >
                  <Play style={{ width: 13, height: 13 }} />
                  Start Session
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { icon: BarChart3, label: "Sessions Run", value: sessions.length },
                { icon: Users, label: "Avg Attendance", value: avgStudents || "—" },
                { icon: Calendar, label: "Last Session", value: sessions[0] ? format(new Date(sessions[0].start_time), "MMM d") : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    background: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icon style={{ width: 14, height: 14, color: CYAN }} />
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, margin: 0 }}>
                      {label}
                    </p>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 700, color: LIGHT, margin: 0, letterSpacing: "-0.02em" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Session history */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, margin: 0 }}>
                Session History
              </p>

              {sessions.length === 0 ? (
                <div
                  style={{
                    background: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                    borderRadius: 16,
                    padding: "40px 24px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Clock style={{ width: 22, height: 22, color: MUTED }} />
                  <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>
                    No completed sessions yet. Start a session to see history here.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sessions.map((s, i) => {
                    const start = new Date(s.start_time);
                    const end = s.end_time ? new Date(s.end_time) : null;
                    const durationMin = end
                      ? Math.round((end.getTime() - start.getTime()) / 60000)
                      : null;

                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 + i * 0.04 }}
                        style={{
                          background: CARD_BG,
                          border: `1px solid ${CARD_BORDER}`,
                          borderRadius: 14,
                          padding: "14px 20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: MUTED, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 14, color: LIGHT, margin: 0 }}>
                              {format(start, "EEEE, MMM d, yyyy")}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3 }}>
                              <span style={{ color: MUTED, fontSize: 12 }}>
                                {format(start, "h:mm a")}
                                {end && ` – ${format(end, "h:mm a")}`}
                              </span>
                              {durationMin !== null && (
                                <span style={{ color: MUTED, fontSize: 12 }}>
                                  · {durationMin}m
                                </span>
                              )}
                              {s.student_count > 0 && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: MUTED, fontSize: 12 }}>
                                  <Users style={{ width: 11, height: 11 }} />
                                  {s.student_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/teacher/session/${s.id}/report`)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            borderRadius: 8,
                            background: CARD_BG,
                            border: `1px solid ${CARD_BORDER}`,
                            color: MUTED,
                            fontSize: 12,
                            fontWeight: 500,
                            fontFamily: "inherit",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            transition: "border-color 0.15s, color 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = CYAN_BORDER;
                            e.currentTarget.style.color = CYAN;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = CARD_BORDER;
                            e.currentTarget.style.color = MUTED;
                          }}
                        >
                          <BarChart3 style={{ width: 12, height: 12 }} />
                          View Report
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <StartSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courses={course ? [course] : []}
        userId={user!.id}
        onSessionStarted={handleSessionStarted}
      />
    </div>
  );
}
