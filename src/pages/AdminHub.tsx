import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap, BarChart3, Presentation, LogOut, Play,
  BookOpen, Users, ClipboardList, TrendingUp, DollarSign, Shield,
} from "lucide-react";
import { PIN_KEY } from "@/components/PinProtectedRoute";

const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";
const CYAN = "#22d3ee";
const CYAN_DIM = "rgba(34,211,238,0.1)";
const CYAN_BORDER = "rgba(34,211,238,0.22)";
const PURPLE = "#8b6cff";
const PURPLE_DIM = "rgba(139,108,255,0.1)";
const PURPLE_BORDER = "rgba(139,108,255,0.22)";

interface NavCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  accent: "cyan" | "purple" | "muted";
  onClick: () => void;
}

const NavCard = ({ icon: Icon, label, description, accent, onClick }: NavCardProps) => {
  const color = accent === "cyan" ? CYAN : accent === "purple" ? PURPLE : MUTED;
  const bg = accent === "cyan" ? CYAN_DIM : accent === "purple" ? PURPLE_DIM : "rgba(255,255,255,0.04)";
  const border = accent === "cyan" ? CYAN_BORDER : accent === "purple" ? PURPLE_BORDER : "rgba(255,255,255,0.1)";

  return (
    <button
      onClick={onClick}
      style={{
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
        transition: "border-color 0.15s, background 0.15s",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = border;
        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = CARD_BORDER;
        e.currentTarget.style.background = CARD_BG;
      }}
    >
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: bg,
        border: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon style={{ width: 15, height: 15, color }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: LIGHT, fontSize: 13, fontWeight: 600, margin: 0 }}>{label}</p>
        <p style={{ color: MUTED, fontSize: 11, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{description}</p>
      </div>
    </button>
  );
};

export default function AdminHub() {
  const navigate = useNavigate();

  const exit = () => {
    sessionStorage.removeItem(PIN_KEY);
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", padding: "16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", flexDirection: "column", gap: 28, paddingTop: 48 }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: CYAN, margin: 0 }}>
                Admin View
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: LIGHT, margin: "4px 0 0" }}>
                FocusTap Hub
              </h1>
              <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0" }}>
                Navigate to any page as admin
              </p>
            </div>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: CYAN_DIM,
              border: `1px solid ${CYAN_BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Shield style={{ width: 18, height: 18, color: CYAN }} />
            </div>
          </div>

          {/* Professor pages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: CYAN, margin: 0 }}>
              Professor View
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <NavCard icon={BookOpen} label="Professor Dashboard" description="Courses, active session, past sessions" accent="cyan" onClick={() => navigate("/teacher")} />
              <NavCard icon={Play} label="Launch Session" description="Start a live class session" accent="cyan" onClick={() => navigate("/launch")} />
              <NavCard icon={TrendingUp} label="Analytics" description="Course-level engagement analytics" accent="cyan" onClick={() => navigate("/analytics")} />
            </div>
          </div>

          {/* Student pages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: PURPLE, margin: 0 }}>
              Student View
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <NavCard icon={GraduationCap} label="Student Dashboard" description="Courses and recent sessions" accent="purple" onClick={() => navigate("/student")} />
              <NavCard icon={Users} label="Join Class" description="Join a session via code or link" accent="purple" onClick={() => navigate("/join")} />
              <NavCard icon={ClipboardList} label="Demo Session" description="Walk through a demo student session" accent="purple" onClick={() => navigate("/demo")} />
            </div>
          </div>

          {/* Internal pages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, margin: 0 }}>
              Internal
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <NavCard icon={DollarSign} label="Financials" description="Financial model and projections" accent="muted" onClick={() => navigate("/financials")} />
              <NavCard icon={Presentation} label="Pitch Deck" description="Investor presentation" accent="muted" onClick={() => navigate("/pitch-deck")} />
              <NavCard icon={BarChart3} label="Poster Board" description="Academic poster with financial data" accent="muted" onClick={() => navigate("/poster")} />
            </div>
          </div>

          {/* Exit */}
          <button
            onClick={exit}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 0",
              background: "none",
              border: "none",
              color: MUTED,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = LIGHT)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            <LogOut style={{ width: 14, height: 14 }} />
            Exit admin
          </button>
        </motion.div>
      </div>
    </div>
  );
}
