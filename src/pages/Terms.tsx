import { Link } from "react-router-dom";
import focustapLogo from "@/assets/focustap-logo.png";

const INK = "#15182c";
const MUTED = "#5b6478";
const PURPLE = "#8b6cff";

const h2: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 700, color: INK, margin: "34px 0 10px", letterSpacing: "-0.01em" };
const p: React.CSSProperties = { color: "#344054", fontSize: "0.95rem", lineHeight: 1.7, margin: "0 0 12px" };
const li: React.CSSProperties = { color: "#344054", fontSize: "0.95rem", lineHeight: 1.7, margin: "0 0 8px" };

/**
 * Terms of Service — starter legal text for FocusTap LLC.
 * Have it reviewed by counsel before relying on it.
 */
export default function Terms() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f4ec", color: INK, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px clamp(18px,4vw,40px)", borderBottom: "1px solid rgba(21,24,44,0.08)" }}>
        <Link to="/" className="flex items-center">
          <img src={focustapLogo} alt="FocusTap" style={{ height: 30, width: "auto" }} />
        </Link>
        <Link to="/" style={{ color: MUTED, fontSize: "0.85rem", textDecoration: "none", fontWeight: 500 }}>← Back to home</Link>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "44px clamp(18px,4vw,24px) 90px" }}>
        <h1 style={{ fontSize: "clamp(2rem,4.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          Terms of <span style={{ background: "linear-gradient(90deg,#8b6cff,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Service</span>
        </h1>
        <p style={{ color: MUTED, fontSize: "0.85rem", margin: "0 0 28px", fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>Last updated June 14, 2026</p>

        <p style={p}>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the FocusTap website,
          applications, and services (the &ldquo;Service&rdquo;), operated by <strong>FocusTap LLC</strong> (&ldquo;FocusTap,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using the Service, you agree to be bound by these Terms.
          If you do not agree, do not use the Service.
        </p>

        <h2 style={h2}>1. The Service</h2>
        <p style={p}>
          FocusTap is a browser-based classroom engagement and attendance platform. Students check in via NFC tap or
          a session link; instructors view real-time focus tracking, engagement scores, and post-session reports.
          The Service measures time-on-task using page visibility — it does not monitor screens, block applications,
          or install software on your device.
        </p>

        <h2 style={h2}>2. Eligibility</h2>
        <p style={p}>
          The Service is intended for users aged 13 and older and is provided primarily for use within participating
          educational institutions. By using the Service you confirm that you meet these requirements and that any
          institutional account you use was assigned to you in good faith.
        </p>

        <h2 style={h2}>3. Accounts &amp; Roles</h2>
        <p style={p}>
          Accounts are role-based (student, teacher, or admin) and may be gated by institution-specific signup codes.
          You are responsible for maintaining the confidentiality of your credentials and for all activity under your
          account. Notify us promptly of any unauthorized use.
        </p>

        <h2 style={h2}>4. Acceptable Use</h2>
        <p style={p}>You agree not to:</p>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={li}>Use the Service in violation of any law or institutional policy;</li>
          <li style={li}>Attempt to access data, sessions, or accounts that are not yours;</li>
          <li style={li}>Interfere with, disrupt, or attempt to reverse-engineer the Service;</li>
          <li style={li}>Falsify attendance, engagement, or identity information.</li>
        </ul>

        <h2 style={h2}>5. Privacy</h2>
        <p style={p}>
          Your use of the Service is also governed by our{" "}
          <Link to="/privacy" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link>,
          which describes what data we collect and how it is used. Please review it carefully.
        </p>

        <h2 style={h2}>6. Intellectual Property</h2>
        <p style={p}>
          The Service, including the FocusTap name, logo, software, and the FocusTap Engagement Index (FEI) and its
          methodology, is owned by FocusTap LLC and protected by intellectual-property laws. We grant you a limited,
          non-exclusive, non-transferable license to use the Service for its intended educational purpose.
        </p>

        <h2 style={h2}>7. Disclaimers</h2>
        <p style={p}>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, whether express or
          implied, including fitness for a particular purpose. We do not warrant that the Service will be uninterrupted,
          error-free, or that engagement metrics are suitable for any grading or disciplinary decision.
        </p>

        <h2 style={h2}>8. Limitation of Liability</h2>
        <p style={p}>
          To the maximum extent permitted by law, FocusTap LLC shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages arising from your use of the Service.
        </p>

        <h2 style={h2}>9. Changes to These Terms</h2>
        <p style={p}>
          We may update these Terms from time to time. Material changes will be reflected by updating the &ldquo;Last
          updated&rdquo; date above. Continued use of the Service after changes take effect constitutes acceptance.
        </p>

        <h2 style={h2}>10. Governing Law</h2>
        <p style={p}>
          These Terms are governed by the laws of the State of Florida, United States, without regard to its
          conflict-of-laws principles.
        </p>

        <h2 style={h2}>11. Contact</h2>
        <p style={p}>
          Questions about these Terms? Contact FocusTap LLC at{" "}
          <a href="mailto:reiss@focustap.org" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>reiss@focustap.org</a>.
        </p>

        <p style={{ ...p, color: MUTED, fontSize: "0.85rem", marginTop: 36 }}>FocusTap LLC · focustap.org</p>
      </main>
    </div>
  );
}
