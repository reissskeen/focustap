import { useMemo } from "react";
import { motion } from "framer-motion";

const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "MORNING";
  if (h < 17) return "AFTERNOON";
  if (h < 21) return "EVENING";
  return "NIGHT";
}

function getTerm() {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  if (m < 5) return `Spring ${y}`;
  if (m < 8) return `Summer ${y}`;
  return `Fall ${y}`;
}

function getAcademicWeek() {
  const now = new Date();
  const semesterStart =
    now.getMonth() < 5
      ? new Date(now.getFullYear(), 0, 13) // ~mid-Jan
      : now.getMonth() < 8
      ? new Date(now.getFullYear(), 5, 2)  // ~early Jun
      : new Date(now.getFullYear(), 7, 25); // ~late Aug
  const diff = Math.max(0, now.getTime() - semesterStart.getTime());
  return Math.min(16, Math.floor(diff / (7 * 86400000)) + 1);
}

interface Props {
  name: string;
  onAnalytics: () => void;
}

export default function DashboardGreeting({ name, onAnalytics }: Props) {
  const timeOfDay = useMemo(getTimeOfDay, []);
  const dayOfWeek = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
    []
  );
  const term = useMemo(getTerm, []);
  const week = useMemo(getAcademicWeek, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: MUTED,
            margin: "0 0 4px",
            textTransform: "uppercase",
          }}
        >
          {dayOfWeek} {timeOfDay}
        </p>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: LIGHT,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Welcome back, {name}
        </h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
          {term} · Week {week}
        </p>
        <button
          onClick={onAnalytics}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: MUTED,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#22d3ee")}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          Analytics →
        </button>
      </div>
    </motion.div>
  );
}
