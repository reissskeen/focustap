import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, BookOpen } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const CYAN = "#22d3ee";
const CYAN_DIM = "rgba(34,211,238,0.1)";
const CYAN_BORDER = "rgba(34,211,238,0.22)";
const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";

const inputStyle = {
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
};

const labelStyle = {
  color: MUTED,
  fontSize: "0.82rem",
  fontWeight: 500,
  display: "block",
  marginBottom: 6,
};

interface CreateCourseFormProps {
  userId: string;
  onCourseCreated: (course: Tables<"courses">) => void;
}

const CreateCourseForm = ({ userId, onCourseCreated }: CreateCourseFormProps) => {
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .insert({ name: name.trim(), section: section.trim() || null, teacher_user_id: userId })
      .select()
      .single();

    setLoading(false);
    if (error) {
      toast.error("Failed to create course: " + error.message);
      return;
    }
    toast.success("Course created!");
    setName("");
    setSection("");
    onCourseCreated(data);
  };

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
        maxWidth: 520,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: CYAN_DIM,
          border: `1px solid ${CYAN_BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <BookOpen style={{ width: 18, height: 18, color: CYAN }} />
        </div>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: LIGHT, margin: 0 }}>
            Create a Course
          </h2>
          <p style={{ color: MUTED, fontSize: 13, margin: "3px 0 0" }}>
            Add a course to start running sessions
          </p>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="grid-cols-1 sm:grid-cols-2">
        <div>
          <label htmlFor="course-name" style={labelStyle}>Course Name</label>
          <input
            id="course-name"
            type="text"
            placeholder="e.g. AP Computer Science"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = CYAN_BORDER)}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
          />
        </div>
        <div>
          <label htmlFor="course-section" style={labelStyle}>Section <span style={{ color: "rgba(133,133,160,0.6)" }}>(optional)</span></label>
          <input
            id="course-section"
            type="text"
            placeholder="e.g. Section A"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = CYAN_BORDER)}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
          />
        </div>
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
        <Plus style={{ width: 15, height: 15 }} />
        {loading ? "Creating…" : "Create Course"}
      </button>
    </motion.form>
  );
};

export default CreateCourseForm;
