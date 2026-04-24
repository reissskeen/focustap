import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, X, RotateCcw, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CYAN = "#22d3ee";
const CYAN_DIM = "rgba(34,211,238,0.10)";
const CYAN_BORDER = "rgba(34,211,238,0.22)";
const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";

export interface SeatLayout {
  rows: number;
  cols: number;
  seats: Record<string, string>; // "row-col" -> label
}

const ROW_LETTERS = "ABCDEFGHIJKL";
const autoLabel = (r: number, c: number) => `${ROW_LETTERS[r] ?? "?"}${c + 1}`;

const PRESETS = [
  {
    name: "Rows",
    title: "Standard classroom rows — all cells filled",
    build: (rows: number, cols: number): Record<string, string> => {
      const s: Record<string, string> = {};
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          s[`${r}-${c}`] = autoLabel(r, c);
      return s;
    },
  },
  {
    name: "U-Shape",
    title: "Three sides open at the front",
    build: (rows: number, cols: number): Record<string, string> => {
      const s: Record<string, string> = {};
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (r === 0 || c === 0 || c === cols - 1)
            s[`${r}-${c}`] = autoLabel(r, c);
      return s;
    },
  },
  {
    name: "Pods",
    title: "2×2 cluster groups with aisles",
    build: (rows: number, cols: number): Record<string, string> => {
      const s: Record<string, string> = {};
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (r % 3 < 2 && c % 3 < 2)
            s[`${r}-${c}`] = autoLabel(r, c);
      return s;
    },
  },
];

interface SeatLayoutEditorProps {
  courseId: string;
  courseName: string;
  initialLayout: SeatLayout | null;
  onClose: () => void;
  onSaved: (layout: SeatLayout) => void;
}

const SeatLayoutEditor = ({
  courseId,
  courseName,
  initialLayout,
  onClose,
  onSaved,
}: SeatLayoutEditorProps) => {
  const [rows, setRows] = useState(initialLayout?.rows ?? 5);
  const [cols, setCols] = useState(initialLayout?.cols ?? 8);
  const [seats, setSeats] = useState<Record<string, string>>(initialLayout?.seats ?? {});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const k = (r: number, c: number) => `${r}-${c}`;

  const pruneSeats = (newRows: number, newCols: number, prev: Record<string, string>) => {
    const next = { ...prev };
    for (const key of Object.keys(next)) {
      const [r, c] = key.split("-").map(Number);
      if (r >= newRows || c >= newCols) delete next[key];
    }
    return next;
  };

  const handleRowsChange = (v: number) => {
    const clamped = Math.min(12, Math.max(1, v));
    setRows(clamped);
    setSeats((prev) => pruneSeats(clamped, cols, prev));
  };

  const handleColsChange = (v: number) => {
    const clamped = Math.min(15, Math.max(1, v));
    setCols(clamped);
    setSeats((prev) => pruneSeats(rows, clamped, prev));
  };

  const toggleSeat = (r: number, c: number) => {
    const key = k(r, c);
    setSeats((prev) => {
      if (prev[key] !== undefined) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: autoLabel(r, c) };
    });
  };

  const startEdit = (key: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKey(key);
    setEditValue(label);
  };

  const commitEdit = () => {
    if (!editingKey) return;
    const label = editValue.trim();
    if (label) setSeats((prev) => ({ ...prev, [editingKey]: label }));
    setEditingKey(null);
  };

  const removeSeat = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSeats((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const moveSeat = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    setSeats((prev) => {
      const fromLabel = prev[fromKey];
      if (fromLabel === undefined) return prev;
      const next = { ...prev };
      const toLabel = prev[toKey];
      delete next[fromKey];
      next[toKey] = fromLabel;
      if (toLabel !== undefined) next[fromKey] = toLabel;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const layout: SeatLayout = { rows, cols, seats };
    const { error } = await supabase
      .from("courses")
      .update({ seat_layout: layout as unknown as Record<string, unknown> })
      .eq("id", courseId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save layout");
      return;
    }
    toast.success("Classroom layout saved");
    onSaved(layout);
    onClose();
  };

  const seatCount = Object.keys(seats).length;

  const cells: JSX.Element[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = k(r, c);
      const label = seats[key];
      const isOccupied = label !== undefined;
      const isEditing = editingKey === key;
      const isDragging = dragging === key;
      const isHovered = hoveredKey === key;

      if (isOccupied) {
        cells.push(
          <div
            key={key}
            draggable
            onDragStart={() => setDragging(key)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragging && dragging !== key) moveSeat(dragging, key); setDragging(null); }}
            onMouseEnter={() => setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              height: 48,
              borderRadius: 8,
              background: isDragging ? "rgba(34,211,238,0.04)" : CYAN_DIM,
              border: `1px solid ${isDragging ? "rgba(34,211,238,0.14)" : CYAN_BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              cursor: isDragging ? "grabbing" : "grab",
              opacity: isDragging ? 0.35 : 1,
              transition: "opacity 0.12s",
              userSelect: "none",
            }}
          >
            {isEditing ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditingKey(null);
                }}
                style={{
                  width: "78%",
                  background: "none",
                  border: "none",
                  color: CYAN,
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "center",
                  fontFamily: "inherit",
                  outline: "none",
                  cursor: "text",
                }}
              />
            ) : (
              <span
                onClick={(e) => startEdit(key, label, e)}
                title="Click to rename"
                style={{ color: CYAN, fontSize: 11, fontWeight: 700, cursor: "text" }}
              >
                {label}
              </span>
            )}
            {isHovered && !isEditing && (
              <button
                onClick={(e) => removeSeat(key, e)}
                title="Remove seat"
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#ef4444",
                  border: "none",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 11,
                  lineHeight: 1,
                  padding: 0,
                  zIndex: 10,
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      } else {
        cells.push(
          <div
            key={key}
            onClick={() => toggleSeat(r, c)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragging) moveSeat(dragging, key); setDragging(null); }}
            title="Click to add seat"
            style={{
              height: 48,
              borderRadius: 8,
              border: "1px dashed rgba(255,255,255,0.06)",
              cursor: "pointer",
              transition: "border-color 0.12s, background 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(34,211,238,0.18)";
              e.currentTarget.style.background = "rgba(34,211,238,0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.background = "transparent";
            }}
          />
        );
      }
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(9,9,15,0.88)",
        backdropFilter: "blur(6px)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d0d16",
          border: `1px solid ${CARD_BORDER}`,
          borderRadius: 20,
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: 880,
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: CYAN_DIM, border: `1px solid ${CYAN_BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LayoutGrid style={{ width: 16, height: 16, color: CYAN }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: LIGHT, margin: 0 }}>
                Classroom Layout
              </h2>
              <p style={{ color: MUTED, fontSize: 12, margin: "2px 0 0" }}>{courseName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: MUTED, cursor: "pointer",
              padding: 6, borderRadius: 6, display: "flex",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ color: MUTED, fontSize: 12, fontWeight: 500 }}>Rows</label>
            <input
              type="number"
              min={1} max={12}
              value={rows}
              onChange={(e) => handleRowsChange(+e.target.value)}
              style={{
                width: 52, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: LIGHT, borderRadius: 7, padding: "5px 8px",
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ color: MUTED, fontSize: 12, fontWeight: 500 }}>Cols</label>
            <input
              type="number"
              min={1} max={15}
              value={cols}
              onChange={(e) => handleColsChange(+e.target.value)}
              style={{
                width: 52, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: LIGHT, borderRadius: 7, padding: "5px 8px",
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
          </div>

          <div style={{ width: 1, height: 20, background: CARD_BORDER, margin: "0 2px" }} />

          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setSeats(preset.build(rows, cols))}
              title={preset.title}
              style={{
                padding: "5px 12px", borderRadius: 7,
                background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
                color: MUTED, fontSize: 12, fontWeight: 500,
                fontFamily: "inherit", cursor: "pointer",
                transition: "border-color 0.13s, color 0.13s",
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
              {preset.name}
            </button>
          ))}

          <button
            onClick={() => setSeats({})}
            title="Remove all seats"
            style={{
              padding: "5px 12px", borderRadius: 7,
              background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
              color: MUTED, fontSize: 12, fontWeight: 500,
              fontFamily: "inherit", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              transition: "border-color 0.13s, color 0.13s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = CARD_BORDER;
              e.currentTarget.style.color = MUTED;
            }}
          >
            <RotateCcw style={{ width: 11, height: 11 }} />
            Clear
          </button>

          <span style={{ color: MUTED, fontSize: 12, marginLeft: "auto" }}>
            {seatCount} seat{seatCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Front of room label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: CARD_BORDER }} />
          <span style={{ color: MUTED, fontSize: 11, letterSpacing: "0.06em" }}>FRONT OF ROOM</span>
          <div style={{ flex: 1, height: 1, background: CARD_BORDER }} />
        </div>

        {/* Grid */}
        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, minmax(44px, 1fr))`,
              gap: 5,
              minWidth: cols * 50,
            }}
          >
            {cells}
          </div>
        </div>

        <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>
          Click an empty cell to add a seat · Click a label to rename · Drag seats to rearrange
        </p>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px", borderRadius: 9,
              background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
              color: MUTED, fontSize: 13, fontWeight: 500,
              fontFamily: "inherit", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 22px", borderRadius: 9,
              background: saving ? "rgba(34,211,238,0.06)" : CYAN_DIM,
              border: `1px solid ${saving ? "rgba(34,211,238,0.12)" : CYAN_BORDER}`,
              color: saving ? "rgba(34,211,238,0.4)" : CYAN,
              fontSize: 13, fontWeight: 600,
              fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "rgba(34,211,238,0.18)"; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = saving ? "rgba(34,211,238,0.06)" : CYAN_DIM; }}
          >
            {saving ? (
              <>
                <Loader2 style={{ width: 13, height: 13, animation: "spin 0.8s linear infinite" }} />
                Saving…
              </>
            ) : (
              <>
                <Save style={{ width: 13, height: 13 }} />
                Save Layout
              </>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </div>
  );
};

export default SeatLayoutEditor;
