import { motion } from "framer-motion";
import { LayoutGrid, Trash2, X, Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const CYAN = "#22d3ee";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";
const AMBER = "#fbbf24";
const RED = "#ef4444";

export interface CourseStats {
  course: Tables<"courses">;
  focusPct: number | null;
  flaggedCount: number;
  studentCount: number;
}

interface Props {
  courseStats: CourseStats[];
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  onAddCourse: () => void;
  onCourseClick: (courseId: string) => void;
  onEditLayout: (course: Tables<"courses">) => void;
  onDeleteCourse: (courseId: string) => void;
}

function focusColor(pct: number): string {
  if (pct >= 80) return CYAN;
  if (pct >= 60) return AMBER;
  return RED;
}

export default function CourseHealthList({
  courseStats,
  deletingId,
  setDeletingId,
  onAddCourse,
  onCourseClick,
  onEditLayout,
  onDeleteCourse,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.48, duration: 0.25 }}
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
          Your courses
        </p>
        <button
          onClick={onAddCourse}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: MUTED,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = CYAN)}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          <Plus style={{ width: 11, height: 11 }} />
          Add
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {courseStats.map((cs, i) => {
          const { course, focusPct, flaggedCount, studentCount } = cs;
          const isDeleting = deletingId === course.id;
          const fillColor = focusPct !== null ? focusColor(focusPct) : MUTED;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.04, duration: 0.22 }}
              onClick={() => !isDeleting && onCourseClick(course.id)}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "12px 14px",
                cursor: isDeleting ? "default" : "pointer",
                transition: "border-color 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isDeleting)
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  gap: 10,
                }}
              >
                {/* Left: name + section */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: LIGHT,
                      margin: "0 0 2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {course.name}
                  </p>
                  <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
                    {course.section ? `Section ${course.section} · ` : ""}
                    {studentCount > 0
                      ? `${studentCount} student${studentCount !== 1 ? "s" : ""}`
                      : "No students yet"}
                  </p>
                </div>

                {/* Right: focus % + actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  {focusPct !== null && (
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: fillColor,
                          margin: "0 0 1px",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {focusPct}%
                      </p>
                      <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>
                        avg focus
                      </p>
                    </div>
                  )}

                  {/* Delete / action controls */}
                  {isDeleting ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onDeleteCourse(course.id)}
                        style={{
                          padding: "3px 9px",
                          borderRadius: 6,
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.35)",
                          color: RED,
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          background: "none",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: MUTED,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <X style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{ display: "flex", gap: 4 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        title="Edit seat layout"
                        onClick={() => onEditLayout(course)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "none",
                          border: "1px solid transparent",
                          color: MUTED,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                          transition: "border-color 0.13s, color 0.13s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(34,211,238,0.35)";
                          e.currentTarget.style.color = CYAN;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.color = MUTED;
                        }}
                      >
                        <LayoutGrid style={{ width: 11, height: 11 }} />
                      </button>
                      <button
                        title="Delete course"
                        onClick={() => setDeletingId(course.id)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "none",
                          border: "1px solid transparent",
                          color: MUTED,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                          transition: "border-color 0.13s, color 0.13s, background 0.13s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(239,68,68,0.35)";
                          e.currentTarget.style.color = RED;
                          e.currentTarget.style.background =
                            "rgba(239,68,68,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.color = MUTED;
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                  marginBottom: flaggedCount > 0 ? 8 : 0,
                }}
              >
                {focusPct !== null && (
                  <div
                    style={{
                      height: "100%",
                      width: `${focusPct}%`,
                      background: fillColor,
                      borderRadius: 2,
                      transition: "width 0.4s ease",
                    }}
                  />
                )}
              </div>

              {/* Alert line */}
              {flaggedCount > 0 && (
                <p style={{ fontSize: 10, color: AMBER, margin: 0 }}>
                  ⚠ {flaggedCount} student{flaggedCount !== 1 ? "s" : ""} flagged in last session
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
