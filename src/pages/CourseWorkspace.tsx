import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, ArrowLeft, Save, Plus, Trash2, FileText, FileSpreadsheet,
  Presentation, Download, Loader2, FolderOpen, Check,
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

      // Auto-select first or create default
      if (mapped.length > 0) {
        setActiveNoteId(mapped[0].id);
        setInitialContent(mapped[0].content_json as object | null);
      }
      setLoading(false);
    };
    load();
  }, [courseId, user]);

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
      // Update local state
      setNotes((prev) =>
        prev.map((n) => (n.id === activeNoteId ? { ...n, content_json: json, updated_at: new Date().toISOString() } : n))
      );
    },
    [activeNoteId, user]
  );

  // Save to Files (upload JSON to storage)
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
              <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold">{courseName}</h1>
              <div className="ml-auto flex items-center gap-2">
                {saveLabel && <span className="text-xs text-muted-foreground">{saveLabel}</span>}
              </div>
            </div>
          </motion.div>

          {/* Main Layout */}
          <div className="grid lg:grid-cols-[250px_1fr] gap-6">
            {/* Sidebar - Notes List + Files */}
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
