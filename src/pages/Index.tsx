import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye, FileText, QrCode, BarChart3, Shield, ArrowRight,
  Zap, Lock, Activity, BookOpen,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { ADMIN_PIN, PIN_KEY } from "@/components/PinProtectedRoute";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65 },
};

const features = [
  {
    icon: Eye,
    title: "Smart Focus Tracking",
    description: "Automatically tracks time-on-task using page visibility — no monitoring, no spying.",
    color: "#8b6cff",
  },
  {
    icon: FileText,
    title: "Built-in Notes Editor",
    description: "Rich text note-taking with autosave, checklists, and structured formatting.",
    color: "#22d3ee",
  },
  {
    icon: QrCode,
    title: "QR & NFC Entry",
    description: "Students join in seconds via QR code scan, NFC tap, or Canvas deep link.",
    color: "#34d399",
  },
  {
    icon: BarChart3,
    title: "Live Dashboard",
    description: "Real-time view of student engagement with focus scores and participation rates.",
    color: "#fb7185",
  },
  {
    icon: Shield,
    title: "Privacy-First",
    description: "No screen monitoring, no app blocking. FERPA-aligned and student-friendly.",
    color: "#fbbf24",
  },
  {
    icon: Activity,
    title: "LMS Integration",
    description: "Seamless Canvas LTI 1.3 integration with automatic roster and role sync.",
    color: "#8b6cff",
  },
];

const steps = [
  { number: "01", title: "Teacher starts a session", description: "Generate a URL code or share a link in your LMS." },
  { number: "02", title: "Students tap in", description: "Scan, tap, or click to join the session instantly." },
  { number: "03", title: "Take notes, stay focused", description: "The built-in editor tracks focus while students write." },
  { number: "04", title: "Review engagement", description: "See real-time and post-class focus analytics." },
];

const universities = ["Stanford", "MIT", "Georgia Tech", "UCLA", "Duke", "UF"];

// Static dashboard mockup component
const DashboardMockup = () => {
  const stats = [
    { label: "Focus Score", value: "87%", color: "#8b6cff" },
    { label: "Active Students", value: "142", color: "#22d3ee" },
    { label: "Avg Time-on-Task", value: "34m", color: "#34d399" },
    { label: "Sessions Today", value: "5", color: "#fbbf24" },
  ];

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 80px rgba(139,108,255,0.07)",
        background: "rgba(12,12,22,0.97)",
        maxWidth: 760,
        margin: "0 auto",
        userSelect: "none",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          background: "rgba(255,255,255,0.025)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#fb7185" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#fbbf24" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#34d399" }} />
        </div>
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6,
            padding: "3px 0",
            color: "#55556a",
            fontSize: "0.72rem",
            textAlign: "center",
            letterSpacing: "0.01em",
          }}
        >
          focustap.org/dashboard
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Dashboard body */}
      <div style={{ padding: "20px 22px 22px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <p style={{ color: "#55556a", fontSize: "0.65rem", fontWeight: 600, marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {s.label}
              </p>
              <p style={{ color: s.color, fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <p style={{ color: "#8585a0", fontSize: "0.7rem", fontWeight: 600, marginBottom: 12, letterSpacing: "0.03em" }}>
            Weekly Engagement Trend
          </p>
          <svg viewBox="0 0 600 80" width="100%" style={{ overflow: "visible", display: "block" }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b6cff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8b6cff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path
              d="M0,60 C60,50 100,68 160,42 C210,24 260,55 310,34 C360,16 410,48 460,26 C500,10 550,32 600,18"
              fill="none"
              stroke="#8b6cff"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d="M0,60 C60,50 100,68 160,42 C210,24 260,55 310,34 C360,16 410,48 460,26 C500,10 550,32 600,18 L600,80 L0,80 Z"
              fill="url(#chartGrad)"
            />
            <motion.circle
              cx={600}
              cy={18}
              r={4}
              fill="#8b6cff"
              animate={{ r: [4, 7, 4], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [adminOpen, setAdminOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(PIN_KEY, "true");
      setAdminOpen(false);
      setPin("");
      navigate("/admin");
    } else {
      setPinError(true);
      setPin("");
    }
  };

  return (
    <div style={{ background: "#09090f", minHeight: "100vh", color: "#e8e8f0" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative flex flex-col items-center justify-center px-4 overflow-hidden"
        style={{ minHeight: "100vh", paddingTop: 80 }}
      >
        {/* Purple orb */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            height: 600,
            background: "radial-gradient(ellipse at center, rgba(139,108,255,0.13) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        {/* Cyan orb */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "5%",
            width: 400,
            height: 300,
            background: "radial-gradient(ellipse at center, rgba(34,211,238,0.07) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(139,108,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(139,108,255,0.025) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        <div className="relative z-10 text-center w-full max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 100,
                background: "rgba(139,108,255,0.08)",
                border: "1px solid rgba(139,108,255,0.18)",
                color: "#a78bfa",
                fontSize: "0.8rem",
                fontWeight: 500,
                marginBottom: 28,
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", flexShrink: 0 }}
              />
              Focus tracking for modern classrooms
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.07 }}
            style={{
              fontWeight: 500,
              fontSize: "clamp(2.6rem, 5.5vw, 4rem)",
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              color: "#e8e8f0",
              marginBottom: 24,
            }}
          >
            Measure{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              focus
            </span>
            ,<br />
            not compliance.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14 }}
            style={{
              color: "#8585a0",
              fontWeight: 400,
              fontSize: "1.05rem",
              maxWidth: 500,
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            FocusTap tracks time-on-task while students take notes — no blocking, no monitoring, no hardware. Just engagement data that matters.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.21 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
          >
            <Link to="/login?mode=signup">
              <button
                style={{
                  background: "#8b6cff",
                  boxShadow: "0 0 24px rgba(139,108,255,0.3)",
                  color: "white",
                  fontWeight: 600,
                  padding: "13px 28px",
                  borderRadius: 10,
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  cursor: "pointer",
                  transition: "box-shadow 0.25s ease, transform 0.2s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 36px rgba(139,108,255,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(139,108,255,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Student Sign Up <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </Link>
            <Link to="/teacher-login?mode=signup">
              <button
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#e8e8f0",
                  fontWeight: 500,
                  padding: "13px 28px",
                  borderRadius: 10,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  transition: "border-color 0.25s ease, transform 0.2s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Professor Sign Up
              </button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            style={{ color: "#55556a", fontSize: "0.85rem" }}
          >
            Already have an account?{" "}
            <Link to="/login?mode=login" style={{ color: "#8b6cff", textDecoration: "none", fontWeight: 500 }}>
              Log in
            </Link>
          </motion.p>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            style={{ marginTop: 56 }}
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ padding: "40px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="container mx-auto max-w-5xl text-center">
          <p style={{ color: "#55556a", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
            Trusted by professors at 12+ universities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {universities.map((u) => (
              <span key={u} style={{ color: "#e8e8f0", opacity: 0.25, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {u}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "96px 16px" }}>
        <div className="container mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="text-center" style={{ marginBottom: 64 }}>
            <p style={{ color: "#8b6cff", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
              Features
            </p>
            <h2
              style={{
                fontWeight: 500,
                fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
                letterSpacing: "-0.03em",
                color: "#e8e8f0",
                marginBottom: 14,
              }}
            >
              Everything you need for engaged classrooms
            </h2>
            <p style={{ color: "#8585a0", fontSize: "1rem", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
              A non-invasive toolkit that respects student autonomy while giving teachers real engagement data.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 18,
                  padding: "28px 26px",
                  cursor: "default",
                  transition: "background 0.3s ease, border-color 0.3s ease, transform 0.25s ease, box-shadow 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.05)";
                  el.style.borderColor = "rgba(255,255,255,0.12)";
                  el.style.transform = "translateY(-3px)";
                  el.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.03)";
                  el.style.borderColor = "rgba(255,255,255,0.07)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: `${f.color}18`,
                    border: `1px solid ${f.color}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <f.icon style={{ width: 18, height: 18, color: f.color }} />
                </div>
                <h3 style={{ color: "#e8e8f0", fontWeight: 600, fontSize: "0.98rem", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {f.title}
                </h3>
                <p style={{ color: "#8585a0", fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.6 }}>
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        style={{
          padding: "96px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 400,
            background: "radial-gradient(ellipse at center, rgba(139,108,255,0.05) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div {...fadeUp} className="text-center" style={{ marginBottom: 64 }}>
            <p style={{ color: "#8b6cff", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
              Process
            </p>
            <h2
              style={{
                fontWeight: 500,
                fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
                letterSpacing: "-0.03em",
                color: "#e8e8f0",
                marginBottom: 14,
              }}
            >
              How it works
            </h2>
            <p style={{ color: "#8585a0", fontSize: "1rem" }}>Four simple steps to focused classrooms.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 18,
                  padding: "28px 26px",
                  transition: "background 0.3s ease, border-color 0.3s ease, transform 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.05)";
                  el.style.borderColor = "rgba(255,255,255,0.12)";
                  el.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.03)";
                  el.style.borderColor = "rgba(255,255,255,0.07)";
                  el.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #8b6cff, #22d3ee)",
                    boxShadow: "0 0 20px rgba(139,108,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <span style={{ color: "white", fontWeight: 700, fontSize: "0.85rem" }}>{step.number}</span>
                </div>
                <h3 style={{ color: "#e8e8f0", fontWeight: 600, fontSize: "1rem", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {step.title}
                </h3>
                <p style={{ color: "#8585a0", fontSize: "0.875rem", lineHeight: 1.6 }}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "96px 16px" }}>
        <div className="container mx-auto max-w-3xl">
          <motion.div
            {...fadeUp}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 24,
              padding: "64px 40px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Inner glow */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 500,
                height: 300,
                background: "radial-gradient(ellipse at center, rgba(139,108,255,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div className="relative z-10">
              <h2
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                  letterSpacing: "-0.03em",
                  color: "#e8e8f0",
                  marginBottom: 16,
                }}
              >
                Ready to bring focus back to your classroom?
              </h2>
              <p style={{ color: "#8585a0", fontSize: "1rem", marginBottom: 36, lineHeight: 1.6, maxWidth: 460, margin: "0 auto 36px" }}>
                Start a free pilot with your class. No hardware, no installs, no setup friction.
              </p>
              <Link to="/login?mode=signup">
                <button
                  style={{
                    background: "#8b6cff",
                    boxShadow: "0 0 24px rgba(139,108,255,0.3)",
                    color: "white",
                    fontWeight: 600,
                    padding: "14px 32px",
                    borderRadius: 10,
                    fontSize: "1rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "none",
                    cursor: "pointer",
                    transition: "box-shadow 0.25s ease, transform 0.2s ease",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 36px rgba(139,108,255,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(139,108,255,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  Sign Up Free <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 16px" }}>
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "linear-gradient(135deg, #8b6cff, #22d3ee)",
              }}
            />
            <span style={{ color: "#e8e8f0", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.02em" }}>FocusTap</span>
          </div>
          <p style={{ color: "#55556a", fontSize: "0.8rem" }}>© 2026 FocusTap. Privacy-first classroom engagement.</p>
          <button
            onClick={() => { setAdminOpen(true); setPinError(false); }}
            style={{
              background: "none",
              border: "none",
              color: "rgba(85,85,106,0.3)",
              fontSize: "0.72rem",
              cursor: "pointer",
              transition: "color 0.2s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(85,85,106,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(85,85,106,0.3)")}
          >
            Admin
          </button>
        </div>
      </footer>

      {/* Admin PIN dialog */}
      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="max-w-xs" style={{ background: "rgba(14,14,26,0.98)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16 }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#e8e8f0", fontSize: "1rem" }}>Admin Access</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminSubmit} className="space-y-3 mt-1">
            <Input
              type="password"
              placeholder="Enter access code"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              autoFocus
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#e8e8f0" }}
            />
            {pinError && <p style={{ color: "#fb7185", fontSize: "0.75rem" }}>Incorrect code.</p>}
            <Button type="submit" className="w-full" size="sm" style={{ background: "#8b6cff", color: "white", fontWeight: 600 }}>
              Continue
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
