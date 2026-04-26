import { motion } from "framer-motion";

const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";
const AMBER = "#fbbf24";
const GREEN = "#34d399";

const TILE_BG = "rgba(255,255,255,0.03)";
const TILE_BORDER = "0.5px solid rgba(255,255,255,0.06)";

interface TileProps {
  label: string;
  value: string;
  context: string | null;
  contextColor?: string;
  index: number;
}

function Tile({ label, value, context, contextColor, index }: TileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 + index * 0.04, duration: 0.25 }}
      style={{
        background: TILE_BG,
        border: TILE_BORDER,
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.05em",
          color: MUTED,
          margin: "0 0 6px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: LIGHT,
          margin: "0 0 4px",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
      {context && (
        <p style={{ fontSize: 11, color: contextColor || MUTED, margin: 0 }}>
          {context}
        </p>
      )}
    </motion.div>
  );
}

export interface StatStripProps {
  avgFocusThisWeek: number | null;
  avgFocusLastWeek: number | null;
  sessionsRun: number;
  courseCount: number;
  activeStudents: number;
  attentionAlerts: number;
}

export default function StatStrip({
  avgFocusThisWeek,
  avgFocusLastWeek,
  sessionsRun,
  courseCount,
  activeStudents,
  attentionAlerts,
}: StatStripProps) {
  const focusDelta =
    avgFocusThisWeek !== null && avgFocusLastWeek !== null
      ? avgFocusThisWeek - avgFocusLastWeek
      : null;

  const focusContext =
    focusDelta !== null
      ? `${focusDelta >= 0 ? "▲" : "▼"} ${Math.abs(focusDelta)} pts vs last week`
      : null;

  const tiles: TileProps[] = [
    {
      label: "Avg focus this week",
      value: avgFocusThisWeek !== null ? `${avgFocusThisWeek}%` : "—",
      context: focusContext,
      contextColor:
        focusDelta !== null
          ? focusDelta >= 0
            ? GREEN
            : AMBER
          : undefined,
      index: 0,
    },
    {
      label: "Sessions run",
      value: String(sessionsRun),
      context:
        sessionsRun > 0
          ? `across ${courseCount} course${courseCount !== 1 ? "s" : ""}`
          : null,
      index: 1,
    },
    {
      label: "Active students",
      value: activeStudents > 0 ? String(activeStudents) : "—",
      context: activeStudents > 0 ? "enrolled total" : null,
      index: 2,
    },
    {
      label: "Attention alerts",
      value: String(attentionAlerts),
      context: attentionAlerts > 0 ? "need follow-up" : "all clear",
      contextColor: attentionAlerts > 0 ? AMBER : MUTED,
      index: 3,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      {tiles.map((t) => (
        <Tile key={t.label} {...t} />
      ))}
    </div>
  );
}
