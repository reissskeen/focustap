import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, ArrowLeft, Plus, Trash2, FileText, FileSpreadsheet,
  Presentation, Download, Loader2, FolderOpen, Wifi, WifiOff,
  Plug, PlugZap, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import NotesEditor from "@/components/NotesEditor";
import FocusTimer from "@/components/FocusTimer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { exportToDocx, exportToXlsx, exportToPptx } from "@/lib/exportNotes";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface NoteDoc {
  id: string;
  title: string;
  content_json: object | null;
  updated_at: string;
}

const CourseWorkspace = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState("Loading…");
  const [notes, setNotes] = useState<NoteDoc[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [initialContent, setInitialContent] = useState<object | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // Connection/check-in state
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Heartbeat - only active when connected
  const { status: heartbeatStatus, focusSeconds } = useHeartbeat({
    sessionId: sessionId ?? undefined,
    userId: user?.id,
    enabled: connected && !!sessionId,
  });

  // Fetch course info + notes
  useEffect(() => {
    if (!courseId || !user) return;
    const load = async () => {
      const [{ data: course }, { data: notesList }] = await Promise.all([
        supabase.from("courses").select("name, section").eq("id", courseId).maybeSingle(),
        supabase
          .from("course_notes")
          .select("id, title, content_json, updated_at")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .order("updated_at", { ascending: false }),
      ]);

      if (course) setCourseName(`${course.name}${course.section ? ` – ${course.section}` : ""}`);
      const mapped = (notesList || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content_json: n.content_json as object | null,
        updated_at: n.updated_at,
      }));
      setNotes(mapped);

      if (mapped.length > 0) {
        setActiveNoteId(mapped[0].id);
        setInitialContent(mapped[0].content_json as object | null);
      }
      setLoading(false);
    };
    load();
  }, [courseId, user]);

  // Connect: find or create session, then join it
  const handleConnect = async () => {
    if (!courseId || !user) return;
    setConnecting(true);
    try {
      // 1. Look for an active session for this course
      let { data: session } = await supabase
        .from("sessions")
        .select("id")
        .eq("course_id", courseId)
        .eq("status", "active")
        .maybeSingle();

      // 2. If none, create one (prototype mode)
      if (!session) {
        const { data: newSession, error: createErr } = await supabase
          .from("sessions")
          .insert({
            course_id: courseId,
            created_by: user.id,
            status: "active",
          })
          .select("id")
          .single();
        if (createErr) throw createErr;
        session = newSession;
      }

      // 3. Join the session (upsert student_sessions)
      const { error: joinErr } = await supabase
        .from("student_sessions")
        .upsert(
          {
            user_id: user.id,
            session_id: session!.id,
            joined_at: new Date().toISOString(),
          },
          { onConflict: "user_id,session_id" }
        );
      if (joinErr) throw joinErr;

      setSessionId(session!.id);
      setConnected(true);
      toast.success("Connected! You're checked in and focus tracking has started.");
    } catch (err: any) {
      toast.error(err.message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    setConnected(false);
    setSessionId(null);
    toast.info("Disconnected from class session");
  };

  // Switch active note
  const switchNote = (note: NoteDoc) => {
    setActiveNoteId(note.id);
    setInitialContent(note.content_json);
  };

  // Create new note
  const createNote = async () => {
    if (!courseId || !user || !newTitle.trim()) return;
    const { data, error } = await supabase
      .from("course_notes")
      .insert({ user_id: user.id, course_id: courseId, title: newTitle.trim() })
      .select("id, title, content_json, updated_at")
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }
    const newNote: NoteDoc = { id: data.id, title: data.title, content_json: data.content_json as object | null, updated_at: data.updated_at };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(data.id);
    setInitialContent(data.content_json as object | null);
    setShowNewDialog(false);
    setNewTitle("");
    toast.success("Note created!");
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    if (!user) return;
    await supabase.from("course_notes").delete().eq("id", noteId).eq("user_id", user.id);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (activeNoteId === noteId) {
      const remaining = notes.filter((n) => n.id !== noteId);
      if (remaining.length > 0) {
        setActiveNoteId(remaining[0].id);
        setInitialContent(remaining[0].content_json);
      } else {
        setActiveNoteId(null);
        setInitialContent(null);
      }
    }
    toast.success("Note deleted");
  };

  // Save note content
  const handleContentChange = useCallback(
    async (json: object) => {
      if (!activeNoteId || !user) return;
      setSaveStatus("saving");
      const { error } = await supabase
        .from("course_notes")
        .update({ content_json: json as any, updated_at: new Date().toISOString() })
        .eq("id", activeNoteId)
        .eq("user_id", user.id);
      setSaveStatus(error ? "error" : "saved");
      setNotes((prev) =>
        prev.map((n) => (n.id === activeNoteId ? { ...n, content_json: json, updated_at: new Date().toISOString() } : n))
      );
    },
    [activeNoteId, user]
  );

  // Save to Files
  const saveToFiles = async () => {
    if (!user || !courseId || !activeNoteId) return;
    const activeNote = notes.find((n) => n.id === activeNoteId);
    if (!activeNote) return;
    const blob = new Blob([JSON.stringify(activeNote.content_json)], { type: "application/json" });
    const path = `${user.id}/${courseId}/${activeNote.title.replace(/[^a-zA-Z0-9-_ ]/g, "")}.json`;
    const { error } = await supabase.storage.from("course-files").upload(path, blob, { upsert: true });
    if (error) {
      toast.error("Failed to save to files: " + error.message);
    } else {
      toast.success("Saved to Files folder!");
    }
  };

  // Export handlers
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const exportFilename = activeNote?.title || "notes";
  const contentJson = activeNote?.content_json || { type: "doc", content: [] };

  const handleExportDocx = () => exportToDocx(contentJson, exportFilename);
  const handleExportXlsx = () => exportToXlsx(contentJson, exportFilename);
  const handleExportPptx = () => exportToPptx(contentJson, exportFilename);

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
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3 mb-1">
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
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold">{courseName}</h1>
              <div className="ml-auto flex items-center gap-3">
                {connected && (
                  <div className="flex items-center gap-2">
                    {heartbeatStatus === "connected" ? (
                      <Wifi className="w-3.5 h-3.5 text-focus-active" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-destructive" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {heartbeatStatus === "connected" ? "Connected" : "Reconnecting…"}
                    </span>
                  </div>
                )}
                {saveLabel && <span className="text-xs text-muted-foreground">{saveLabel}</span>}
              </div>
            </div>
          </motion.div>

          {/* Connect Banner */}
          {!connected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6"
            >
              <div className="glass-card rounded-xl p-8 text-center border-2 border-dashed border-primary/30">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Plug className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="font-display text-xl font-bold mb-2">Ready to check in?</h2>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Connect to start your focus tracking, log attendance, and let your professor know you're here.
                  </p>
                  <Button
                    size="lg"
                    className="gap-2 px-8"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Connecting…</>
                    ) : (
                      <><PlugZap className="w-5 h-5" /> Connect</>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Main Layout */}
          <div className="grid lg:grid-cols-[250px_1fr_300px] gap-6">
            {/* Sidebar - Notes List */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-sm font-semibold">Notes</h3>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setNewTitle(""); setShowNewDialog(true); }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-[400px] overflow-auto">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors group ${
                        note.id === activeNoteId ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                      }`}
                      onClick={() => switchNote(note)}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate flex-1">{note.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No notes yet. Create one!</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              {activeNoteId && (
                <div className="glass-card rounded-xl p-4 space-y-2">
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={saveToFiles}>
                    <FolderOpen className="w-3.5 h-3.5" /> Save to Files
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Download className="w-3.5 h-3.5" /> Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleExportDocx}>
                        <FileText className="w-4 h-4 mr-2" /> Google Docs (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportXlsx}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPptx}>
                        <Presentation className="w-4 h-4 mr-2" /> Slides (.pptx)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </motion.div>

            {/* Editor */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="min-h-[500px]">
              {activeNoteId ? (
                <NotesEditor
                  key={activeNoteId}
                  initialContent={initialContent}
                  onContentChange={handleContentChange}
                  cacheKey={user ? `cnotes-${user.id}-${activeNoteId}` : undefined}
                />
              ) : (
                <div className="glass-card rounded-xl flex items-center justify-center h-full min-h-[500px]">
                  <div className="text-center space-y-3">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Create a note to get started</p>
                    <Button size="sm" onClick={() => { setNewTitle(""); setShowNewDialog(true); }}>
                      <Plus className="w-4 h-4 mr-1" /> New Note
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right Sidebar - Focus & Connection */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              {connected && (
                <>
                  <FocusTimer sessionActive={connected} onFocusUpdate={() => {}} />

                  <div className="glass-card rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-focus-active"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                      <span className="text-sm font-semibold text-focus-active">Checked In</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Your attendance is being logged and your professor can see you're active.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-destructive hover:text-destructive"
                      onClick={handleDisconnect}
                    >
                      <WifiOff className="w-3.5 h-3.5" /> Disconnect
                    </Button>
                  </div>
                </>
              )}

              {!connected && (
                <div className="glass-card rounded-xl p-5 text-center">
                  <Plug className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Connect to start focus tracking and log attendance
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlugZap className="w-3.5 h-3.5" />}
                    Connect
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* New Note Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Note</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Note title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createNote()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={createNote} disabled={!newTitle.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseWorkspace;
