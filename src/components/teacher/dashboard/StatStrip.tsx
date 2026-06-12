import { motion } from "framer-motion";

const MUTED = "#98a3b8";
const AMBER = "#fbbf24";
const GREEN = "#34d399";
const PURPLE = "#8b6cff";
const CYAN = "#22d3ee";
const RED = "#ef4444";

const TILE_BG = "#20232e";
const TILE_BORDER = "1px solid rgba(255,255,255,0.08)";

interface TileProps {
  label: string;
  value: string;
  context: string | null;
  contextColor?: string;
  accentColor: string;
  index: number;
}

function Tile({ label, value, context, contextColor, accentColor, index }: TileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 + index * 0.04, duration: 0.25 }}
      style={{
        background: TILE_BG,
        border: TILE_BORDER,
        borderTop: `2.5px solid ${accentColor}`,
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: MUTED,
          margin: "0 0 8px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: accentColor,
          margin: "0 0 4px",
          letterSpacing: "-0.03em",
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

  const focusAccent =
    avgFocusThisWeek === null
      ? PURPLE
      : avgFocusThisWeek >= 80
      ? GREEN
      : avgFocusThisWeek >= 60
      ? AMBER
      : RED;

  const tiles: TileProps[] = [
    {
      label: "Avg focus this week",
      value: avgFocusThisWeek !== null ? `${avgFocusThisWeek}%` : "—",
      context: focusContext,
      contextColor: focusDelta !== null ? (focusDelta >= 0 ? GREEN : AMBER) : undefined,
      accentColor: focusAccent,
      index: 0,
    },
    {
      label: "Sessions run",
      value: String(sessionsRun),
      context: sessionsRun > 0 ? `across ${courseCount} course${courseCount !== 1 ? "s" : ""}` : null,
      accentColor: CYAN,
      index: 1,
    },
    {
      label: "Active students",
      value: activeStudents > 0 ? String(activeStudents) : "—",
      context: activeStudents > 0 ? "enrolled total" : null,
      accentColor: GREEN,
      index: 2,
    },
    {
      label: "Attention alerts",
      value: String(attentionAlerts),
      context: attentionAlerts > 0 ? "need follow-up" : "all clear",
      contextColor: attentionAlerts > 0 ? AMBER : MUTED,
      accentColor: attentionAlerts > 0 ? AMBER : MUTED,
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
