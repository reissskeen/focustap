import { motion } from "framer-motion";
import { format, isToday, differenceInMinutes, differenceInDays } from "date-fns";

const CYAN = "#22d3ee";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";

export interface WeekSessionItem {
  id: string;
  courseId: string;
  courseName: string;
  section: string | null;
  startTime: string;
  endTime: string | null;
  status: string;
  studentCount: number;
}

interface Props {
  sessions: WeekSessionItem[];
  onNavigateToCourse: (courseId: string) => void;
}

function countdown(startTime: string, status: string): string {
  const start = new Date(startTime);
  const now = new Date();
  if (status === "active") return "Live now";
  const diff = differenceInMinutes(start, now);
  if (diff > 0 && diff <= 60) return `in ${diff}m`;
  const days = differenceInDays(start, now);
  if (days === 0) return isToday(start) ? "today" : "earlier";
  if (days === 1) return "tomorrow";
  if (days < 0) return format(start, "MMM d");
  return `in ${days}d`;
}

export default function WeekSchedule({ sessions, onNavigateToCourse }: Props) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.46, duration: 0.25 }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: MUTED,
            margin: 0,
          }}
        >
          This week
        </p>
      </div>

      {/* Container */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "0.5px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {sorted.length === 0 ? (
          <div
            style={{
              padding: "28px 16px",
              textAlign: "center",
              color: MUTED,
              fontSize: 13,
            }}
          >
            No classes this week.
          </div>
        ) : (
          sorted.map((s, i) => {
            const start = new Date(s.startTime);
            const isLive = s.status === "active";
            const today = isToday(start);
            const accent = today || isLive;
            const count = countdown(s.startTime, s.status);

            return (
              <div
                key={s.id}
                onClick={() => onNavigateToCourse(s.courseId)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr auto",
                  gap: 12,
                  padding: "12px 14px",
                  background: accent
                    ? "rgba(34,211,238,0.04)"
                    : "transparent",
                  borderBottom:
                    i < sorted.length - 1
                      ? "0.5px solid rgba(255,255,255,0.05)"
                      : "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = accent
                    ? "rgba(34,211,238,0.07)"
                    : "rgba(255,255,255,0.02)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = accent
                    ? "rgba(34,211,238,0.04)"
                    : "transparent")
                }
              >
                {/* Col 1: date */}
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: accent ? CYAN : MUTED,
                      margin: "0 0 2px",
                    }}
                  >
                    {today ? "TODAY" : format(start, "EEE")}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: accent ? LIGHT : "rgba(232,232,240,0.85)",
                      margin: 0,
                    }}
                  >
                    {format(start, "h:mm a")}
                  </p>
                </div>

                {/* Col 2: course */}
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: accent ? LIGHT : "rgba(232,232,240,0.85)",
                      margin: "0 0 2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.courseName}
                    {s.section ? ` · ${s.section}` : ""}
                  </p>
                  <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
                    {s.studentCount > 0
                      ? `${s.studentCount} student${s.studentCount !== 1 ? "s" : ""} joined`
                      : s.status === "active"
                      ? "Session in progress"
                      : "No students recorded"}
                  </p>
                </div>

                {/* Col 3: countdown */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: accent ? CYAN : MUTED,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {count}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
