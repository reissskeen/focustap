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
import { useEffect, useRef } from "react";

interface NotesEditorProps {
  onContentChange?: (json: object) => void;
  readOnly?: boolean;
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

const NotesEditor = ({ onContentChange, readOnly = false }: NotesEditorProps) => {
  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start taking notes..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
      autosaveRef.current = setTimeout(() => {
        const json = editor.getJSON();
        onContentChange?.(json);
      }, 2000);
    },
  });

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
