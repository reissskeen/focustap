import { Link } from "react-router-dom";
import focustapLogo from "@/assets/focustap-logo.png";

const INK = "#15182c";
const MUTED = "#5b6478";
const PURPLE = "#8b6cff";

const h2: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 700, color: INK, margin: "34px 0 10px", letterSpacing: "-0.01em" };
const p: React.CSSProperties = { color: "#344054", fontSize: "0.95rem", lineHeight: 1.7, margin: "0 0 12px" };
const li: React.CSSProperties = { color: "#344054", fontSize: "0.95rem", lineHeight: 1.7, margin: "0 0 8px" };

/**
 * Privacy Policy — starter legal text for FocusTap LLC.
 * Mirrors the in-app consent gate. Have it reviewed by counsel before relying on it.
 */
export default function Privacy() {
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
          Privacy <span style={{ background: "linear-gradient(90deg,#8b6cff,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Policy</span>
        </h1>
        <p style={{ color: MUTED, fontSize: "0.85rem", margin: "0 0 28px", fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>Last updated June 14, 2026</p>

        <p style={p}>
          <strong>FocusTap LLC</strong> (&ldquo;FocusTap,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to your privacy. This
          Privacy Policy explains what data we collect through the FocusTap service (the &ldquo;Service&rdquo;), how we use it,
          and the choices you have. FocusTap LLC is the data controller for information processed through the Service.
        </p>

        <h2 style={h2}>1. What We Collect</h2>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={li}>Account information — your name, email, role, and the institution and courses associated with your account.</li>
          <li style={li}>Attendance — when and where you check in to a class session (e.g. NFC tap or session link).</li>
          <li style={li}>Engagement signals — time-on-task derived from page visibility, focus start/pause/resume events, and note-save activity during a session.</li>
          <li style={li}>Your FocusTap Engagement Index (FEI) — a per-session score measuring time-on-task, not device activity.</li>
          <li style={li}>Notes you create in the built-in notes editor during a session.</li>
        </ul>

        <h2 style={h2}>2. What We Do Not Collect</h2>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={li}>We do not monitor your screen, capture keystrokes, or record what other applications or tabs you use.</li>
          <li style={li}>We do not block or restrict software on your device.</li>
          <li style={li}>We do not collect any data outside of active FocusTap sessions.</li>
        </ul>

        <h2 style={h2}>3. How We Use Your Data</h2>
        <p style={p}>
          We use the data above to measure classroom engagement, generate session reports for your instructor, and
          provide and improve the Service. We do not sell your personal information, and we do not use it for
          advertising.
        </p>

        <h2 style={h2}>4. How Your Data Is Shared</h2>
        <p style={p}>
          Engagement and attendance data is shared with the instructors and administrators of the courses and
          institution associated with your account. We use trusted infrastructure providers (for example, our database
          and hosting providers) to operate the Service; they process data on our behalf under appropriate safeguards.
          We may disclose information if required by law.
        </p>

        <h2 style={h2}>5. Data Storage &amp; Security</h2>
        <p style={p}>
          Data is stored securely on FocusTap LLC&rsquo;s infrastructure with access controls and row-level security so
          that users can only access data they are authorized to see. While no system is perfectly secure, we take
          reasonable measures to protect your information.
        </p>

        <h2 style={h2}>6. Children</h2>
        <p style={p}>
          The Service is intended for users aged 13 and older and is designed to align with FERPA in educational
          settings. We do not knowingly collect information from children under 13.
        </p>

        <h2 style={h2}>7. Your Rights</h2>
        <p style={p}>
          You may request access to, correction of, or deletion of your personal information by contacting us. Some
          data may be retained where required for legitimate educational or legal purposes.
        </p>

        <h2 style={h2}>8. Changes to This Policy</h2>
        <p style={p}>
          We may update this Privacy Policy from time to time. Material changes will be reflected by updating the
          &ldquo;Last updated&rdquo; date above.
        </p>

        <h2 style={h2}>9. Contact</h2>
        <p style={p}>
          For privacy questions or requests, contact FocusTap LLC at{" "}
          <a href="mailto:privacy@focustap.org" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>privacy@focustap.org</a>.
        </p>

        <p style={{ ...p, color: MUTED, fontSize: "0.85rem", marginTop: 36 }}>FocusTap LLC · focustap.org · privacy@focustap.org</p>
      </main>
    </div>
  );
}
