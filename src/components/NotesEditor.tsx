import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  CheckSquare,
} from "lucide-react";
import { useEffect, useRef, useCallback } from "react";

interface NotesEditorProps {
  initialContent?: object | null;
  onContentChange?: (json: object) => void;
  readOnly?: boolean;
  cacheKey?: string; // e.g. "notes-{userId}-{sessionId}" for offline cache
}

const ToolbarButton = ({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-1.5 rounded-md transition-colors ${
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`}
  >
    {children}
  </button>
);

const NotesEditor = ({ initialContent, onContentChange, readOnly = false, cacheKey }: NotesEditorProps) => {
  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();
  const initialContentLoaded = useRef(false);
  const pendingSyncRef = useRef(false);

  // Offline cache helpers
  const cacheContent = useCallback(
    (json: object) => {
      if (!cacheKey) return;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(json));
      } catch {}
    },
    [cacheKey]
  );

  const getCachedContent = useCallback((): object | null => {
    if (!cacheKey) return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [cacheKey]);

  const clearCache = useCallback(() => {
    if (cacheKey) localStorage.removeItem(cacheKey);
  }, [cacheKey]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start taking notes..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();

      // Always cache locally for offline resilience
      cacheContent(json);

      if (autosaveRef.current) clearTimeout(autosaveRef.current);
      autosaveRef.current = setTimeout(() => {
        if (navigator.onLine) {
          onContentChange?.(json);
          clearCache();
        } else {
          pendingSyncRef.current = true;
        }
      }, 2000);
    },
  });

  // Sync pending changes when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (!pendingSyncRef.current || !editor) return;
      const json = editor.getJSON();
      onContentChange?.(json);
      clearCache();
      pendingSyncRef.current = false;
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [editor, onContentChange, clearCache]);

  // Load initial content (prefer server content, fall back to cache)
  useEffect(() => {
    if (!editor || initialContentLoaded.current) return;
    const serverContent = initialContent && Object.keys(initialContent).length > 0 ? initialContent : null;
    const cached = getCachedContent();
    const content = serverContent ?? cached;
    if (content) {
      initialContentLoaded.current = true;
      editor.commands.setContent(content as any);
      // If we loaded from cache and server had nothing, mark pending sync
      if (!serverContent && cached) pendingSyncRef.current = true;
    } else {
      initialContentLoaded.current = true;
    }
  }, [editor, initialContent, getCachedContent]);

  // Sync readOnly prop
  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full">
      {!readOnly && (
        <div className="flex items-center gap-0.5 p-2 border-b bg-muted/30 flex-wrap">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <div className="w-px h-5 bg-border mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <div className="w-px h-5 bg-border mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")}>
            <CheckSquare className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default NotesEditor;
