import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Table as TableIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Palette,
  Undo,
  Redo,
  Strikethrough,
  Code,
  Quote,
  Minus,
} from "lucide-react";
import { useEffect, useRef, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotesEditorProps {
  initialContent?: object | null;
  onContentChange?: (json: object) => void;
  readOnly?: boolean;
  cacheKey?: string;
}

const COLORS = [
  "#000000", "#434343", "#666666", "#999999",
  "#E03131", "#E8590C", "#F08C00", "#2B8A3E",
  "#1971C2", "#6741D9", "#C2255C", "#0C8599",
];

const HIGHLIGHT_COLORS = [
  "#FFF3BF", "#D3F9D8", "#D0EBFF", "#E8D0FF",
  "#FFE0E0", "#FFE8CC", "#E0F7FA", "#F3E5F5",
];

const ToolbarButton = ({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md transition-colors ${
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-border mx-1" />;

const NotesEditor = ({ initialContent, onContentChange, readOnly = false, cacheKey }: NotesEditorProps) => {
  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();
  const initialContentLoaded = useRef(false);
  const pendingSyncRef = useRef(false);

  const cacheContent = useCallback(
    (json: object) => {
      if (!cacheKey) return;
      try { localStorage.setItem(cacheKey, JSON.stringify(json)); } catch { /* storage unavailable */ }
    },
    [cacheKey]
  );

  const getCachedContent = useCallback((): object | null => {
    if (!cacheKey) return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
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
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: true, allowBase64: true }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
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

  useEffect(() => {
    if (!editor || initialContentLoaded.current) return;
    const serverContent = initialContent && Object.keys(initialContent).length > 0 ? initialContent : null;
    const cached = getCachedContent();
    const content = serverContent ?? cached;
    if (content) {
      initialContentLoaded.current = true;
      editor.commands.setContent(content as Record<string, unknown>);
      if (!serverContent && cached) pendingSyncRef.current = true;
    } else {
      initialContentLoaded.current = true;
    }
  }, [editor, initialContent, getCachedContent]);

  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, []);

  const addImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full">
      {!readOnly && (
        <div className="flex items-center gap-0.5 p-2 border-b bg-muted/30 flex-wrap">
          {/* Undo/Redo */}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <Redo className="w-4 h-4" />
          </ToolbarButton>
          <Divider />

          {/* Text formatting */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <Divider />

          {/* Headings */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <Divider />

          {/* Lists */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task List">
            <CheckSquare className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
            <Minus className="w-4 h-4" />
          </ToolbarButton>
          <Divider />

          {/* Alignment */}
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          <Divider />

          {/* Table */}
          <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
            <TableIcon className="w-4 h-4" />
          </ToolbarButton>

          {/* Image */}
          <ToolbarButton onClick={addImage} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <Divider />

          {/* Text Color */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Text Color">
                <Palette className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="grid grid-cols-4 gap-1 p-2 w-auto min-w-0">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-md border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                />
              ))}
              <button
                className="w-6 h-6 rounded-md border border-border text-[10px] font-bold hover:scale-110 transition-transform"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                ✕
              </button>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Highlight */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Highlight">
                <Highlighter className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="grid grid-cols-4 gap-1 p-2 w-auto min-w-0">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-md border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                />
              ))}
              <button
                className="w-6 h-6 rounded-md border border-border text-[10px] font-bold hover:scale-110 transition-transform"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                ✕
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default NotesEditor;
