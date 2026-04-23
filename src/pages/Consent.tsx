import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import focustapLogo from "@/assets/focustap-logo.png";

const BG = "#09090f";
const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#8585a0";
const LIGHT = "#e8e8f0";
const PURPLE = "#8b6cff";
const PURPLE_DIM = "rgba(139,108,255,0.12)";
const PURPLE_BORDER = "rgba(139,108,255,0.25)";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 24 }}>
    <p style={{ fontWeight: 600, color: LIGHT, fontSize: "0.9rem", marginBottom: 8 }}>{title}</p>
    <div style={{ color: MUTED, fontSize: "0.85rem", lineHeight: 1.7 }}>{children}</div>
  </div>
);

export default function Consent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (!user) return;
    setAccepting(true);
    await supabase
      .from("profiles")
      .update({ consent_accepted_at: new Date().toISOString() })
      .eq("user_id", user.id);
    // Redirect based on role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleList = (roles || []).map((r) => r.role);
    if (roleList.includes("teacher") || roleList.includes("admin")) {
      navigate("/teacher");
    } else {
      navigate("/student");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 600 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <img src={focustapLogo} alt="FocusTap" style={{ height: 36, opacity: 0.9 }} />
        </div>

        {/* Card */}
        <div
          style={{
            background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`,
            borderRadius: 20,
            padding: "40px 36px",
            backdropFilter: "blur(12px)",
          }}
        >
          <h1
            style={{
              fontWeight: 700,
              fontSize: "1.4rem",
              color: LIGHT,
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Before you continue
          </h1>
          <p style={{ color: MUTED, fontSize: "0.875rem", marginBottom: 32, lineHeight: 1.6 }}>
            FocusTap is committed to your privacy. Please read what data we collect and how it
            is used before using the platform.
          </p>

          <Section title="What we collect">
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              <li>Your FocusTap Engagement Index (FEI) score per session — a measure of time-on-task, not your device activity</li>
              <li>Session attendance timestamps (when you joined and last activity)</li>
              <li>Number of note saves during a session (not the content of your notes)</li>
              <li>Your name and email address for account identification</li>
            </ul>
          </Section>

          <Section title="What we do not collect">
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              <li>The content of your notes</li>
              <li>Your browsing history, apps, or any other device activity</li>
              <li>Your location, camera, or microphone</li>
              <li>Any data outside of FocusTap sessions</li>
            </ul>
          </Section>

          <Section title="Who sees your data">
            <p style={{ margin: 0 }}>
              Your engagement scores and attendance are visible to the professor(s) of the
              courses you attend. Data is stored securely on FocusTap's servers and is not
              sold or shared with third parties.
            </p>
          </Section>

          <Section title="Your rights (GDPR &amp; FERPA)">
            <p style={{ margin: "0 0 6px" }}>
              Under GDPR and FERPA you have the right to access, correct, or request deletion
              of your data at any time. To exercise these rights, contact{" "}
              <a
                href="mailto:privacy@focustap.org"
                style={{ color: PURPLE, textDecoration: "none" }}
              >
                privacy@focustap.org
              </a>
              .
            </p>
            <p style={{ margin: 0 }}>
              FocusTap is intended for users aged 13 and older. By continuing, you confirm you
              meet this requirement (COPPA).
            </p>
          </Section>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: CARD_BORDER,
              margin: "28px 0",
            }}
          />

          <p style={{ color: MUTED, fontSize: "0.8rem", lineHeight: 1.6, marginBottom: 24 }}>
            By clicking <strong style={{ color: LIGHT }}>I Accept</strong>, you agree to
            FocusTap collecting and storing the data described above for the purpose of
            tracking classroom engagement and providing session reports to your professor.
          </p>

          <button
            onClick={handleAccept}
            disabled={accepting}
            style={{
              width: "100%",
              background: accepting ? PURPLE_DIM : PURPLE,
              border: accepting ? `1px solid ${PURPLE_BORDER}` : "none",
              color: "white",
              fontWeight: 600,
              padding: "14px 24px",
              borderRadius: 10,
              fontSize: "0.95rem",
              cursor: accepting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "opacity 0.2s",
              opacity: accepting ? 0.7 : 1,
            }}
          >
            {accepting ? "Saving…" : "I Accept — Continue to FocusTap"}
          </button>
        </div>

        <p style={{ textAlign: "center", color: "#3a3a50", fontSize: "0.75rem", marginTop: 20 }}>
          FocusTap · focustap.org · privacy@focustap.org
        </p>
      </div>
    </div>
  );
}
