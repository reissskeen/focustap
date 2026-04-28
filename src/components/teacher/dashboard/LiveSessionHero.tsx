import { motion } from "framer-motion";
import { Play, LayoutGrid } from "lucide-react";
import { format, differenceInMinutes, isToday, isTomorrow } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

const CYAN = "#22d3ee";
const CYAN_DIM = "rgba(34,211,238,0.12)";
const CYAN_BORDER = "rgba(34,211,238,0.25)";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";

export interface NextClassInfo {
  courseName: string;
  section: string | null;
  startTime: Date;
  room: string | null;
}

interface Props {
  activeSession: Tables<"sessions"> | null;
  activeCourse: Tables<"courses"> | null;
  courses: Tables<"courses">[];
  onStartSession: () => void;
  onEditLayout: (course: Tables<"courses">) => void;
  onAddCourse: () => void;
  studentCount?: number;
  lastFocusPct?: number | null;
  nextClass?: NextClassInfo | null;
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        animation: "dashboardPulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

function StaticDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function MinutesRemaining(session: Tables<"sessions">) {
  if (!session.end_time) return null;
  const diff = differenceInMinutes(new Date(session.end_time), new Date());
  return Math.max(0, diff);
}

function nextClassLabel(nc: NextClassInfo): string {
  const now = new Date();
  const diff = differenceInMinutes(nc.startTime, now);
  if (isToday(nc.startTime)) {
    if (diff > 0 && diff <= 120) return `Next class · in ${diff}m`;
    return `Next class today · ${format(nc.startTime, "h:mm a")}`;
  }
  if (isTomorrow(nc.startTime)) return `Next class tomorrow · ${format(nc.startTime, "h:mm a")}`;
  return `Next class ${format(nc.startTime, "EEE")} · ${format(nc.startTime, "h:mm a")}`;
}

export default function LiveSessionHero({
  activeSession,
  activeCourse,
  courses,
  onStartSession,
  onEditLayout,
  onAddCourse,
  studentCount = 0,
  lastFocusPct,
  nextClass,
}: Props) {
  const hasActive = !!activeSession && !!activeCourse;
  const hasCourses = courses.length > 0;

  const minsRemaining = hasActive ? MinutesRemaining(activeSession) : null;

  return (
    <>
      <style>{`
        @keyframes dashboardPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06 }}
        style={{
          background: hasActive
            ? "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 100%)"
            : "rgba(255,255,255,0.02)",
          border: `0.5px solid ${hasActive ? CYAN_BORDER : "rgba(255,255,255,0.07)"}`,
          borderRadius: 14,
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 20,
          alignItems: "center",
        }}
      >
        {/* Left: content */}
        <div>
          {/* Status pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 10,
            }}
          >
            {hasActive ? (
              <PulsingDot color={CYAN} />
            ) : nextClass ? (
              <StaticDot color={CYAN} />
            ) : (
              <StaticDot color={MUTED} />
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: hasActive || nextClass ? CYAN : MUTED,
              }}
            >
              {hasActive
                ? minsRemaining !== null
                  ? `Live now · ${minsRemaining}m remaining`
                  : "Live now"
                : nextClass
                ? nextClassLabel(nextClass)
                : hasCourses
                ? "No classes scheduled this week"
                : "No courses yet"}
            </span>
          </div>

          {/* Headline */}
          <h2
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: LIGHT,
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            {hasActive
              ? `${activeCourse.name}${activeCourse.section ? ` — Section ${activeCourse.section}` : ""}`
              : nextClass
              ? `${nextClass.courseName}${nextClass.section ? ` — Section ${nextClass.section}` : ""}`
              : hasCourses
              ? "You're all caught up"
              : "Get started with FocusTap"}
          </h2>

          {/* Subline */}
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 12px", lineHeight: 1.5 }}>
            {hasActive ? (
              <>
                {format(new Date(activeSession.start_time), "h:mm a")}
                {activeSession.end_time
                  ? ` – ${format(new Date(activeSession.end_time), "h:mm a")}`
                  : ""}
                {studentCount > 0 ? ` · ${studentCount} students joined` : ""}
              </>
            ) : nextClass ? (
              <>
                {format(nextClass.startTime, "h:mm a")}
                {nextClass.room ? ` · Room ${nextClass.room}` : ""}
              </>
            ) : hasCourses ? (
              "Start a session when you're ready to begin class."
            ) : (
              "Create your first course to start running live sessions."
            )}
          </p>

          {/* Meta row */}
          {hasActive && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {activeCourse.seat_layout && (
                <span style={{ fontSize: 12, color: MUTED }}>
                  Layout configured
                </span>
              )}
              {lastFocusPct !== undefined && lastFocusPct !== null && (
                <>
                  {activeCourse.seat_layout && (
                    <span style={{ fontSize: 12, color: MUTED }}>·</span>
                  )}
                  <span style={{ fontSize: 12, color: MUTED }}>
                    Last session focus: {lastFocusPct}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
          {hasActive ? (
            <>
              <button
                onClick={onStartSession}
                style={{
                  padding: "10px 18px",
                  borderRadius: 9,
                  background: CYAN,
                  border: "none",
                  color: "#09090f",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  transition: "opacity 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Play style={{ width: 13, height: 13 }} />
                View live session
              </button>
              <button
                onClick={() => onEditLayout(activeCourse)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 9,
                  background: "transparent",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                  color: MUTED,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  transition: "border-color 0.15s, color 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                  e.currentTarget.style.color = LIGHT;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.color = MUTED;
                }}
              >
                <LayoutGrid style={{ width: 13, height: 13 }} />
                Edit layout
              </button>
            </>
          ) : hasCourses ? (
            <button
              onClick={onStartSession}
              style={{
                padding: "10px 18px",
                borderRadius: 9,
                background: CYAN_DIM,
                border: `0.5px solid ${CYAN_BORDER}`,
                color: CYAN,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                transition: "background 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(34,211,238,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = CYAN_DIM)
              }
            >
              <Play style={{ width: 13, height: 13 }} />
              Start session
            </button>
          ) : (
            <button
              onClick={onAddCourse}
              style={{
                padding: "10px 18px",
                borderRadius: 9,
                background: CYAN_DIM,
                border: `0.5px solid ${CYAN_BORDER}`,
                color: CYAN,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                transition: "background 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(34,211,238,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = CYAN_DIM)
              }
            >
              + Add course
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
