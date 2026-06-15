import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SECTIONS, REQU, HECVAT_META, type HecvatRow, type Risk } from "@/data/hecvatAssessment";

const BG = "#0b0d14";
const PANEL = "#12141d";
const LINE = "rgba(255,255,255,0.08)";
const INK = "#eef1f7";
const MUTED = "#98a3b8";

const riskColor: Record<Risk, string> = { High: "#fb7185", Med: "#fbbf24", Low: "#9aa4ba", "-": "#3a3f4d" };
function answerColor(a: string) {
  if (a === "Yes") return "#34d399";
  if (a === "No / unverified") return "#fb7185";
  if (a === "Partial" || a === "Confirm") return "#fbbf24";
  if (a === "No") return "#9aa4ba";
  return "#6b7280"; // N/A
}

export default function HecvatAssessment() {
  const navigate = useNavigate();
  const [gapsOnly, setGapsOnly] = useState(false);
  const [critOnly, setCritOnly] = useState(false);

  const stats = useMemo(() => {
    const all = SECTIONS.flatMap((s) => s.rows);
    const gaps = all.filter((r) => r.gap);
    return {
      total: all.length,
      gaps: gaps.length,
      criticalGaps: gaps.filter((r) => r.critical).length,
      high: gaps.filter((r) => r.risk === "High").length,
      med: gaps.filter((r) => r.risk === "Med").length,
      low: gaps.filter((r) => r.risk === "Low").length,
    };
  }, []);

  const visible = (rows: HecvatRow[]) =>
    rows.filter((r) => (!gapsOnly || r.gap) && (!critOnly || r.critical));

  const th: React.CSSProperties = { textAlign: "left", padding: "9px 10px", color: MUTED, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${LINE}`, fontWeight: 600 };
  const td: React.CSSProperties = { padding: "10px", borderBottom: `1px solid ${LINE}`, fontSize: 13, verticalAlign: "top", color: "#cdd3df", lineHeight: 1.45 };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px clamp(16px,3vw,40px) 80px" }}>
        <button onClick={() => navigate("/admin")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 18 }}>
          <ArrowLeft size={15} /> Back to Admin
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <ShieldCheck size={24} color="#8b6cff" />
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>HECVAT 4.1.5 Self-Assessment</h1>
        </div>
        <p style={{ color: MUTED, fontSize: 13, margin: "0 0 4px" }}>
          {HECVAT_META.vendor} · {HECVAT_META.solution}
        </p>
        <p style={{ color: MUTED, fontSize: 12, margin: "0 0 20px" }}>
          Reviewed {HECVAT_META.reviewedAt} · {HECVAT_META.source}. Internal working draft — not the signed workbook.
        </p>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 8 }}>
          {[
            { k: "Applicable Qs", v: stats.total, c: INK },
            { k: "Gaps", v: stats.gaps, c: "#fbbf24" },
            { k: "Critical gaps", v: stats.criticalGaps, c: "#fb7185" },
            { k: "High risk", v: stats.high, c: "#fb7185" },
            { k: "Med risk", v: stats.med, c: "#fbbf24" },
            { k: "Low risk", v: stats.low, c: "#9aa4ba" },
          ].map((s) => (
            <div key={s.k} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.k}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(139,108,255,0.08)", border: "1px solid rgba(139,108,255,0.25)", borderRadius: 12, padding: "12px 14px", margin: "14px 0 24px", fontSize: 12.5, color: "#c9cfdc", lineHeight: 1.55 }}>
          <strong style={{ color: INK }}>Read me:</strong> Strong technical controls (RLS/RBAC, TLS, encryption at rest, no plaintext/hard-coded secrets, input validation).
          Main gaps are <strong>organizational/policy</strong> (SOC 2, BCP/DRP, IR plan, training, cyber insurance), <strong>SSO/MFA/InCommon</strong>,
          <strong> vuln management</strong> (SAST/DAST/pentest), and <strong>accessibility</strong> (VPAT/WCAG). Critical (*) items with no code evidence are marked
          “No / unverified” — never assume compliance. “Confirm” = a human must produce/verify the artifact.
        </div>

        {/* Scoping */}
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>Scope (Required Questions)</h2>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", marginBottom: 26 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Code</th><th style={th}>Question</th><th style={th}>Answer</th><th style={th}>Note</th></tr></thead>
            <tbody>
              {REQU.map((r) => (
                <tr key={r.code}>
                  <td style={{ ...td, fontFamily: '"IBM Plex Mono", monospace', whiteSpace: "nowrap", color: MUTED }}>{r.code}</td>
                  <td style={td}>{r.q}</td>
                  <td style={{ ...td, fontWeight: 700, color: answerColor(r.answer), whiteSpace: "nowrap" }}>{r.answer}</td>
                  <td style={{ ...td, color: MUTED }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: "Gaps only", on: gapsOnly, set: () => setGapsOnly((v) => !v) },
            { label: "Critical only", on: critOnly, set: () => setCritOnly((v) => !v) },
          ].map((f) => (
            <button key={f.label} onClick={f.set} style={{ background: f.on ? "#8b6cff" : PANEL, color: f.on ? "#fff" : MUTED, border: `1px solid ${f.on ? "transparent" : LINE}`, borderRadius: 999, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const rows = visible(section.rows);
          if (rows.length === 0) return null;
          const secGaps = section.rows.filter((r) => r.gap).length;
          return (
            <div key={section.id} style={{ marginBottom: 30 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>
                {section.name} <span style={{ color: MUTED, fontWeight: 500, fontSize: 13 }}>· {section.rows.length} Qs · {secGaps} gaps</span>
              </h2>
              <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, width: 80 }}>Code</th>
                      <th style={th}>Question</th>
                      <th style={{ ...th, width: 96 }}>Answer</th>
                      <th style={th}>Evidence</th>
                      <th style={{ ...th, width: 52 }}>Gap</th>
                      <th style={{ ...th, width: 56 }}>Risk</th>
                      <th style={th}>Remediation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.code} style={r.critical && r.gap ? { background: "rgba(251,113,133,0.06)" } : undefined}>
                        <td style={{ ...td, fontFamily: '"IBM Plex Mono", monospace', whiteSpace: "nowrap", color: MUTED }}>
                          {r.code}{r.critical ? <span style={{ color: "#fb7185" }} title="Critical question"> *</span> : ""}
                        </td>
                        <td style={td}>{r.q}</td>
                        <td style={{ ...td, fontWeight: 700, color: answerColor(r.answer), whiteSpace: "nowrap" }}>{r.answer}</td>
                        <td style={{ ...td, color: MUTED, fontSize: 12 }}>{r.evidence}</td>
                        <td style={{ ...td, fontWeight: 700, color: r.gap ? "#fb7185" : "#34d399" }}>{r.gap ? "Yes" : "No"}</td>
                        <td style={{ ...td, fontWeight: 700, color: riskColor[r.risk] }}>{r.risk}</td>
                        <td style={{ ...td, color: MUTED, fontSize: 12 }}>{r.remediation || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <p style={{ color: MUTED, fontSize: 11.5, marginTop: 30, lineHeight: 1.6 }}>
          Subprocessors: {HECVAT_META.subprocessors.join(" · ")}. &nbsp;See SECURITY.md for architecture & data flow.
          Organizational/policy items and legal commitments require human confirmation and counsel review before submission.
        </p>
      </div>
    </div>
  );
}
