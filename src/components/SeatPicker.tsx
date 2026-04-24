import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import type { SeatLayout } from "@/components/teacher/SeatLayoutEditor";

const PURPLE = "#8b6cff";
const PURPLE_DIM = "rgba(139,108,255,0.12)";
const PURPLE_BORDER = "rgba(139,108,255,0.28)";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";
const CARD_BORDER = "rgba(255,255,255,0.07)";

interface SeatPickerProps {
  layout: SeatLayout;
  takenLabels: string[];
  courseName: string;
  onSelect: (label: string) => Promise<void>;
}

const LegendItem = ({
  color,
  border,
  label,
  opacity = 1,
}: {
  color: string;
  border: string;
  label: string;
  opacity?: number;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: 3,
        background: color,
        border: `1px solid ${border}`,
        opacity,
      }}
    />
    <span style={{ fontSize: 11, color: MUTED }}>{label}</span>
  </div>
);

const SeatPicker = ({ layout, takenLabels, courseName, onSelect }: SeatPickerProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const takenSet = new Set(takenLabels);
  const { rows, cols, seats } = layout;

  const handleClick = async (label: string) => {
    if (takenSet.has(label) || selected !== null) return;
    setSelected(label);
    await onSelect(label);
  };

  const cells: JSX.Element[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`;
      const label = seats[key];
      if (label === undefined) {
        cells.push(<div key={key} style={{ height: 44 }} />);
        continue;
      }
      const taken = takenSet.has(label);
      const isSelected = selected === label;

      cells.push(
        <div
          key={key}
          onClick={() => !taken && !selected && handleClick(label)}
          style={{
            height: 44,
            borderRadius: 8,
            background: isSelected
              ? "rgba(139,108,255,0.20)"
              : taken
              ? "rgba(255,255,255,0.02)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${
              isSelected
                ? PURPLE_BORDER
                : taken
                ? "rgba(255,255,255,0.05)"
                : "rgba(255,255,255,0.09)"
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: taken || selected !== null ? "not-allowed" : "pointer",
            opacity: taken ? 0.3 : 1,
            userSelect: "none",
            transition: "background 0.12s, border-color 0.12s",
          }}
          onMouseEnter={(e) => {
            if (!taken && !selected) {
              e.currentTarget.style.background = PURPLE_DIM;
              e.currentTarget.style.borderColor = PURPLE_BORDER;
            }
          }}
          onMouseLeave={(e) => {
            if (!taken && !isSelected) {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
            }
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isSelected ? PURPLE : taken ? MUTED : LIGHT,
            }}
          >
            {label}
          </span>
        </div>
      );
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(9,9,15,0.94)",
        backdropFilter: "blur(8px)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          background: "#0d0d16",
          border: `1px solid ${CARD_BORDER}`,
          borderRadius: 20,
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: 820,
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: PURPLE_DIM,
              border: `1px solid ${PURPLE_BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MapPin style={{ width: 16, height: 16, color: PURPLE }} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: LIGHT, margin: 0 }}>
              Choose your seat
            </h2>
            <p style={{ color: MUTED, fontSize: 12, margin: "2px 0 0" }}>{courseName}</p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16 }}>
          <LegendItem
            color="rgba(255,255,255,0.04)"
            border="rgba(255,255,255,0.09)"
            label="Available"
          />
          <LegendItem
            color="rgba(255,255,255,0.02)"
            border="rgba(255,255,255,0.05)"
            label="Taken"
            opacity={0.3}
          />
        </div>

        {/* Front of room */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: CARD_BORDER }} />
          <span style={{ color: MUTED, fontSize: 11, letterSpacing: "0.06em" }}>
            FRONT OF ROOM
          </span>
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
          {selected
            ? "Claiming your seat…"
            : "Tap a seat to claim it. Grayed seats are already taken."}
        </p>
      </motion.div>
    </div>
  );
};

export default SeatPicker;
