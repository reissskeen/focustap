import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Send, Download, Copy, Check, Loader2, Wifi, WifiOff, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import FocusTimer from "@/components/FocusTimer";
import NotesEditor from "@/components/NotesEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { format } from "date-fns";

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

      // Check if already joined — preserve joined_at and focus_seconds on refresh
      const { data: existing } = await supabase
        .from("student_sessions")
        .select("focus_seconds, seat_label")
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
        // Update seat_label if provided and not already set
        if (seatLabel && !existing.seat_label) {
          await supabase
            .from("student_sessions")
            .update({ seat_label: seatLabel })
            .eq("user_id", uid)
            .eq("session_id", sessionId);
        }
      }

      // Upsert note_docs
      await supabase
        .from("note_docs")
        .upsert(
          { user_id: uid, session_id: sessionId },
          { onConflict: "user_id,session_id" }
        );

      // Fetch existing note content + submitted status
      const { data: noteDoc } = await supabase
        .from("note_docs")
        .select("content_json, submitted_at")
        .eq("user_id", uid)
        .eq("session_id", sessionId)
        .maybeSingle();

      if (noteDoc) {
        if (noteDoc.content_json && Object.keys(noteDoc.content_json as object).length > 0) {
          setInitialContent(noteDoc.content_json as object);
        }
        if (noteDoc.submitted_at) {
          setSubmitted(true);
        }
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

  // Focus update is now handled by useHeartbeat hook
  // FocusTimer is kept for visual display only
  const handleFocusUpdate = useCallback(() => {}, []);

  // Submit notes
  const handleSubmit = async () => {
    if (!sessionId || !user) return;
    const now = new Date().toISOString();
    await Promise.all([
      supabase
        .from("note_docs")
        .update({ submitted_at: now })
        .eq("user_id", user.id)
        .eq("session_id", sessionId),
      supabase
        .from("student_sessions")
        .update({ submitted_at: now })
        .eq("user_id", user.id)
        .eq("session_id", sessionId),
    ]);
    setSubmitted(true);
    toast.success("Notes submitted successfully!");
  };

  // Copy plain text
  const handleCopy = async () => {
    // Extract text from the editor's DOM
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
                readOnly={submitted}
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
