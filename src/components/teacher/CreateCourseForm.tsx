import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, CalendarDays, Clock, Info } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const CYAN = "#22d3ee";
const CYAN_DIM = "rgba(34,211,238,0.1)";
const CYAN_BORDER = "rgba(34,211,238,0.22)";
const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";
const RED = "#ef4444";
const SECTION_MUTED = "rgba(133,133,160,0.55)";

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: LIGHT,
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
  colorScheme: "dark",
};

const labelStyle: React.CSSProperties = {
  color: MUTED,
  fontSize: "0.82rem",
  fontWeight: 500,
  display: "block",
  marginBottom: 6,
};

const sectionHeadStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SECTION_MUTED,
  margin: "4px 0 14px",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const DAYS = [
  { label: "M", value: "Mon" },
  { label: "T", value: "Tue" },
  { label: "W", value: "Wed" },
  { label: "Th", value: "Thu" },
  { label: "F", value: "Fri" },
  { label: "Sa", value: "Sat" },
  { label: "Su", value: "Sun" },
] as const;

interface CreateCourseFormProps {
  userId: string;
  onCourseCreated: (course: Tables<"courses">) => void;
}

const CreateCourseForm = ({ userId, onCourseCreated }: CreateCourseFormProps) => {
  // Course identity
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [section, setSection] = useState("");
  const [room, setRoom] = useState("");
  const [instructorName, setInstructorName] = useState("");

  // Schedule
  const [meetingDays, setMeetingDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [semesterStart, setSemesterStart] = useState("");
  const [semesterEnd, setSemesterEnd] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill instructor name from professor's profile
  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setInstructorName(data.display_name);
      });
  }, [userId]);

  const toggleDay = (day: string) => {
    setMeetingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    if (errors.meetingDays) setErrors((e) => ({ ...e, meetingDays: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2)
      next.name = "Course name must be at least 2 characters.";
    if (meetingDays.length === 0)
      next.meetingDays = "Select at least one meeting day.";
    if (!startTime) next.startTime = "Class start time is required.";
    if (!endTime) next.endTime = "Class end time is required.";
    if (startTime && endTime && endTime <= startTime)
      next.endTime = "End time must be after start time.";
    if (!semesterStart) next.semesterStart = "Semester start date is required.";
    if (!semesterEnd) next.semesterEnd = "Semester end date is required.";
    if (semesterStart && semesterEnd && semesterEnd < semesterStart)
      next.semesterEnd = "Semester end must be after start.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Fetch institution_id from professor's profile so students can discover this course
    const { data: profile } = await supabase
      .from("profiles")
      .select("institution_id")
      .eq("user_id", userId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("courses")
      .insert({
        name: name.trim(),
        course_code: courseCode.trim() || null,
        section: section.trim() || null,
        room: room.trim() || null,
        instructor_name: instructorName.trim() || null,
        meeting_days: meetingDays.length > 0 ? meetingDays : null,
        start_time: startTime || null,
        end_time: endTime || null,
        semester_start: semesterStart || null,
        semester_end: semesterEnd || null,
        institution_id: profile?.institution_id ?? null,
        teacher_user_id: userId,
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      toast.error("Failed to create course: " + error.message);
      return;
    }
    toast.success("Course created — sessions will start automatically at the scheduled time.");
    onCourseCreated(data);
  };

  const fieldFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = CYAN_BORDER);
  const fieldBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = errors[e.currentTarget.id] ? RED : "rgba(255,255,255,0.09)");

  const errorText = (key: string) =>
    errors[key] ? (
      <p style={{ color: RED, fontSize: 11, margin: "4px 0 0" }}>{errors[key]}</p>
    ) : null;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 16,
        padding: "32px 28px",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 560,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: CYAN_DIM,
            border: `1px solid ${CYAN_BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BookOpen style={{ width: 18, height: 18, color: CYAN }} />
        </div>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: LIGHT, margin: 0 }}>
            Create a Course
          </h2>
          <p style={{ color: MUTED, fontSize: 13, margin: "3px 0 0" }}>
            Sessions start automatically at the scheduled time
          </p>
        </div>
      </div>

      {/* ── Section 1: Course Identity ── */}
      <div>
        <p style={sectionHeadStyle}>
          <BookOpen style={{ width: 11, height: 11 }} /> Course details
        </p>

        {/* Name + Code */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label htmlFor="course-name" style={labelStyle}>Course Name</label>
            <input
              id="course-name"
              type="text"
              placeholder="e.g. Introduction to Biology"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((err) => ({ ...err, name: "" })); }}
              style={{ ...inputStyle, borderColor: errors.name ? RED : undefined }}
              onFocus={fieldFocus}
              onBlur={fieldBlur}
            />
            {errorText("name")}
          </div>
          <div>
            <label htmlFor="course-code" style={labelStyle}>
              Course Code <span style={{ color: "rgba(133,133,160,0.6)" }}>(optional)</span>
            </label>
            <input
              id="course-code"
              type="text"
              placeholder="e.g. BIO101"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              style={inputStyle}
              onFocus={fieldFocus}
              onBlur={fieldBlur}
            />
          </div>
        </div>

        {/* Section + Room */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label htmlFor="course-section" style={labelStyle}>
              Section <span style={{ color: "rgba(133,133,160,0.6)" }}>(optional)</span>
            </label>
            <input
              id="course-section"
              type="text"
              placeholder="e.g. Section A"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={inputStyle}
              onFocus={fieldFocus}
              onBlur={fieldBlur}
            />
          </div>
          <div>
            <label htmlFor="course-room" style={labelStyle}>
              Room <span style={{ color: "rgba(133,133,160,0.6)" }}>(optional)</span>
            </label>
            <input
              id="course-room"
              type="text"
              placeholder="e.g. Room 204"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={inputStyle}
              onFocus={fieldFocus}
              onBlur={fieldBlur}
            />
          </div>
        </div>

        {/* Instructor */}
        <div>
          <label htmlFor="instructor-name" style={labelStyle}>Instructor Name</label>
          <input
            id="instructor-name"
            type="text"
            placeholder="e.g. Dr. Smith"
            value={instructorName}
            onChange={(e) => setInstructorName(e.target.value)}
            style={inputStyle}
            onFocus={fieldFocus}
            onBlur={fieldBlur}
          />
        </div>
      </div>

      {/* ── Section 2: Schedule ── */}
      <div>
        <p style={sectionHeadStyle}>
          <Clock style={{ width: 11, height: 11 }} /> Class schedule
        </p>

        {/* Meeting days */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Meeting Days</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DAYS.map((day) => {
              const selected = meetingDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: selected ? CYAN_DIM : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selected ? CYAN_BORDER : "rgba(255,255,255,0.09)"}`,
                    color: selected ? CYAN : MUTED,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.13s, border-color 0.13s, color 0.13s",
                  }}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {errorText("meetingDays")}
        </div>

        {/* Class time */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Class Time</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: "0.75rem", marginBottom: 4 }}>Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setErrors((err) => ({ ...err, startTime: "", endTime: "" })); }}
                style={{ ...inputStyle, borderColor: errors.startTime ? RED : undefined }}
              />
              {errorText("startTime")}
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: "0.75rem", marginBottom: 4 }}>End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setErrors((err) => ({ ...err, endTime: "" })); }}
                style={{ ...inputStyle, borderColor: errors.endTime ? RED : undefined }}
              />
              {errorText("endTime")}
            </div>
          </div>
        </div>

        {/* Semester date range */}
        <div>
          <label style={labelStyle}>Semester</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: "0.75rem", marginBottom: 4 }}>Start date</label>
              <input
                type="date"
                value={semesterStart}
                onChange={(e) => { setSemesterStart(e.target.value); setErrors((err) => ({ ...err, semesterStart: "", semesterEnd: "" })); }}
                style={{ ...inputStyle, borderColor: errors.semesterStart ? RED : undefined }}
              />
              {errorText("semesterStart")}
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: "0.75rem", marginBottom: 4 }}>End date</label>
              <input
                type="date"
                value={semesterEnd}
                onChange={(e) => { setSemesterEnd(e.target.value); setErrors((err) => ({ ...err, semesterEnd: "" })); }}
                style={{ ...inputStyle, borderColor: errors.semesterEnd ? RED : undefined }}
              />
              {errorText("semesterEnd")}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-start notice */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          background: "rgba(34,211,238,0.05)",
          border: "1px solid rgba(34,211,238,0.15)",
          borderRadius: 8,
          padding: "10px 12px",
        }}
      >
        <Info style={{ width: 14, height: 14, color: CYAN, flexShrink: 0, marginTop: 1 }} />
        <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
          Sessions will start automatically at the scheduled time on each meeting day throughout
          the semester — no manual launch needed. Students can join from their dashboard.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 22px",
          borderRadius: 9,
          background: loading ? "rgba(34,211,238,0.06)" : CYAN_DIM,
          border: `1px solid ${loading ? "rgba(34,211,238,0.12)" : CYAN_BORDER}`,
          color: loading ? "rgba(34,211,238,0.4)" : CYAN,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "rgba(34,211,238,0.18)"; }}
        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = CYAN_DIM; }}
      >
        <CalendarDays style={{ width: 15, height: 15 }} />
        {loading ? "Creating…" : "Create Course"}
      </button>
    </motion.form>
  );
};

export default CreateCourseForm;
