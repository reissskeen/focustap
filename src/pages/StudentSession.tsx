import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Send, Download, Copy, Check, Loader2, Wifi, WifiOff, ChevronLeft, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import FocusTimer from "@/components/FocusTimer";
import NotesEditor from "@/components/NotesEditor";
import SeatPicker from "@/components/SeatPicker";
import FocusViolationOverlay from "@/components/FocusViolationOverlay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useFocusAudit } from "@/hooks/useFocusAudit";
import { focusGuard } from "@/services/focusGuard";
import { format } from "date-fns";
import type { SeatLayout } from "@/components/teacher/SeatLayoutEditor";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const StudentSession = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const seatLabel = searchParams.get("seat") || null;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [initialContent, setInitialContent] = useState<object | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedFocusSeconds, setSavedFocusSeconds] = useState(0);
  const [needsSeatPick, setNeedsSeatPick] = useState(false);
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);
  const [takenLabels, setTakenLabels] = useState<string[]>([]);
  const [sessionInfo, setSessionInfo] = useState({
    course: "Loading…",
    teacher: "",
    date: format(new Date(), "MMM d, yyyy"),
    session: sessionId || "demo",
  });

  const editorRef = useRef<{ getText: () => string } | null>(null);

  // Heartbeat system — starts from saved focus seconds so refresh doesn't reset
  const { status: heartbeatStatus } = useHeartbeat({
    sessionId,
    userId: user?.id,
    enabled: !submitted && !loading,
    initialFocusSeconds: savedFocusSeconds,
  });

  // Focus-guard: violation detection, overlay, and audit log
  const focusAudit = useFocusAudit({
    sessionId,
    userId: user?.id,
    enabled: !submitted && !loading && !needsSeatPick,
  });

  // Fetch session info
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      const { data } = await supabase
        .from("sessions")
        .select("id, start_time, course_id, courses(name, section, teacher_user_id)")
        .eq("id", sessionId)
        .maybeSingle();

      if (data) {
        const course = data.courses as { teacher_user_id?: string; name?: string } | null;
        let teacherName = "Unknown Teacher";
        if (course?.teacher_user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", course.teacher_user_id)
            .maybeSingle();
          teacherName = profile?.display_name ?? "Unknown Teacher";
        }
        setSessionInfo({
          course: course?.name ?? "Unknown Course",
          teacher: teacherName,
          date: format(new Date(data.start_time), "MMM d, yyyy"),
          session: sessionId,
        });
      }
    };
    fetchSession();
  }, [sessionId]);

  // Join session + load existing notes
  useEffect(() => {
    const joinAndLoad = async () => {
      if (!sessionId || !user) return;
      const uid = user.id;

      // Fetch seat layout for this session's course
      const { data: sessionRow } = await supabase
        .from("sessions")
        .select("courses(seat_layout)")
        .eq("id", sessionId)
        .maybeSingle();
      const rawLayout = (sessionRow?.courses as { seat_layout?: unknown } | null)?.seat_layout;
      const layout: SeatLayout | null = rawLayout ? (rawLayout as SeatLayout) : null;

      // Check if already joined — preserve joined_at, focus_seconds, and submitted state on refresh
      const { data: existing } = await supabase
        .from("student_sessions")
        .select("focus_seconds, seat_label, submitted_at, last_heartbeat")
        .eq("user_id", uid)
        .eq("session_id", sessionId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("student_sessions").insert({
          user_id: uid,
          session_id: sessionId,
          joined_at: new Date().toISOString(),
          ...(seatLabel ? { seat_label: seatLabel } : {}),
        });
      } else {
        setSavedFocusSeconds(existing.focus_seconds ?? 0);
        if (existing.submitted_at) setSubmitted(true);
        // Warn if another device is actively sending heartbeats for this student
        if (existing.last_heartbeat) {
          const msSinceHeartbeat = Date.now() - new Date(existing.last_heartbeat).getTime();
          if (msSinceHeartbeat < 15_000) {
            toast.warning("You appear to be joined on another device. Focus time will only be counted once.");
          }
        }
        // Update seat_label if provided and not already set
        if (seatLabel && !existing.seat_label) {
          await supabase
            .from("student_sessions")
            .update({ seat_label: seatLabel })
            .eq("user_id", uid)
            .eq("session_id", sessionId);
        }
      }

      // Show seat picker if course has a layout and this student hasn't picked yet
      const studentHasSeat = existing?.seat_label != null || seatLabel != null;
      if (!studentHasSeat && layout) {
        const { data: takenRows } = await supabase
          .from("student_sessions")
          .select("seat_label")
          .eq("session_id", sessionId)
          .not("seat_label", "is", null);
        const taken = (takenRows ?? []).map((r) => r.seat_label as string).filter(Boolean);
        setSeatLayout(layout);
        setTakenLabels(taken);
        setNeedsSeatPick(true);
      }

      // Upsert note_docs
      await supabase
        .from("note_docs")
        .upsert(
          { user_id: uid, session_id: sessionId },
          { onConflict: "user_id,session_id" }
        );

      // Fetch existing note content
      const { data: noteDoc } = await supabase
        .from("note_docs")
        .select("content_json")
        .eq("user_id", uid)
        .eq("session_id", sessionId)
        .maybeSingle();

      if (noteDoc?.content_json && Object.keys(noteDoc.content_json as object).length > 0) {
        setInitialContent(noteDoc.content_json as object);
      }

      setLoading(false);
    };
    joinAndLoad();
  }, [sessionId, user]);

  // Auto-save notes to DB
  const handleContentChange = useCallback(
    async (json: object) => {
      if (!sessionId || !user || submitted) return;
      setSaveStatus("saving");
      const { error } = await supabase
        .from("note_docs")
        .update({ content_json: json as Record<string, unknown>, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("session_id", sessionId);
      setSaveStatus(error ? "error" : "saved");
    },
    [sessionId, user, submitted]
  );

  // Track note saves for FEI scoring
  const noteSaveCountRef = useRef(0);
  const handleNoteSave = useCallback(async () => {
    if (!sessionId || !user || submitted) return;
    noteSaveCountRef.current += 1;
    await supabase
      .from("student_sessions")
      .update({ note_save_count: noteSaveCountRef.current })
      .eq("user_id", user.id)
      .eq("session_id", sessionId);
  }, [sessionId, user, submitted]);

  const handleSeatSelect = useCallback(
    async (label: string) => {
      if (!sessionId || !user) return;
      await supabase
        .from("student_sessions")
        .update({ seat_label: label })
        .eq("user_id", user.id)
        .eq("session_id", sessionId);
      setNeedsSeatPick(false);
    },
    [sessionId, user]
  );

  // Focus update is now handled by useHeartbeat hook
  // FocusTimer is kept for visual display only
  const handleFocusUpdate = useCallback(() => {}, []);

  // Submit notes — attendance record lives only in student_sessions
  const handleSubmit = async () => {
    if (!sessionId || !user) return;
    const now = new Date().toISOString();
    await supabase
      .from("student_sessions")
      .update({ submitted_at: now })
      .eq("user_id", user.id)
      .eq("session_id", sessionId);
    setSubmitted(true);
    toast.success("Notes submitted successfully!");
  };

  // Copy plain text — suppress focus violations while the clipboard dialog is open
  const handleCopy = async () => {
    focusGuard.suppressFor(2000);
    const editorEl = document.querySelector(".tiptap");
    const text = editorEl?.textContent ?? "";
    if (text) {
      await navigator.clipboard.writeText(text);
    }
    setCopied(true);
    toast.success("Notes copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const saveLabel =
    saveStatus === "saving" ? "Saving…" :
    saveStatus === "saved" ? "Saved" :
    saveStatus === "error" ? "Save error" : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {needsSeatPick && seatLayout && (
        <SeatPicker
          layout={seatLayout}
          takenLabels={takenLabels}
          courseName={sessionInfo.course}
          onSelect={handleSeatSelect}
        />
      )}
      <FocusViolationOverlay
        active={focusAudit.overlayActive}
        suspended={focusAudit.suspended}
        violationCount={focusAudit.violationCount}
        countdownSeconds={focusAudit.countdownSeconds}
        onDismiss={focusAudit.dismiss}
        onExpired={focusAudit.onExpired}
      />
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Session Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate("/student")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                color: "#8585a0",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: "0 0 0 0",
                marginBottom: 20,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e8e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8585a0")}
            >
              <ChevronLeft style={{ width: 15, height: 15 }} />
              Back
            </button>
            <div className="flex items-center gap-3 mb-1">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold">{sessionInfo.course}</h1>
              <div className="ml-auto flex items-center gap-2">
                {!submitted && !focusAudit.suspended && (
                  <button
                    onClick={focusAudit.enterFullscreen}
                    title="Enable focus mode (fullscreen)"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "none",
                      border: "1px solid rgba(139,108,255,0.22)",
                      borderRadius: 6,
                      color: "#8585a0",
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "3px 8px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "border-color 0.13s, color 0.13s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(139,108,255,0.5)";
                      e.currentTarget.style.color = "#8b6cff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(139,108,255,0.22)";
                      e.currentTarget.style.color = "#8585a0";
                    }}
                  >
                    <Maximize2 style={{ width: 11, height: 11 }} />
                    Focus Mode
                  </button>
                )}
                {heartbeatStatus === "connected" ? (
                  <Wifi className="w-3.5 h-3.5 text-focus-active" />
                ) : heartbeatStatus === "disconnected" ? (
                  <WifiOff className="w-3.5 h-3.5 text-destructive" />
                ) : null}
                {saveLabel && (
                  <span className="text-xs text-muted-foreground">{saveLabel}</span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {sessionInfo.teacher} · {sessionInfo.date}
            </p>
          </motion.div>

          {/* Main Layout */}
          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            {/* Notes Editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="min-h-[500px]"
            >
              <NotesEditor
                initialContent={initialContent}
                onContentChange={handleContentChange}
                onNoteSave={handleNoteSave}
                readOnly={submitted || focusAudit.suspended}
                cacheKey={user ? `notes-${user.id}-${sessionId}` : undefined}
              />
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <FocusTimer sessionActive={!submitted} initialSeconds={savedFocusSeconds} onFocusUpdate={handleFocusUpdate} />

              <div className="glass-card rounded-xl p-5 space-y-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitted}
                  className="w-full gap-2"
                >
                  {submitted ? (
                    <><Check className="w-4 h-4" /> Submitted</>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Notes</>
                  )}
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleCopy}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSession;
