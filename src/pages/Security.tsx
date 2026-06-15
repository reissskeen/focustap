import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Smartphone, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const PURPLE = "#8b6cff";
const INK = "#111827";
const MUTED = "#667085";

interface Factor { id: string; friendly_name?: string; status: string; }
interface Enrolling { id: string; qr: string; secret: string; }

/** Account security — enroll / manage TOTP multi-factor authentication. */
export default function Security() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const startEnroll = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 16)}`,
    });
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message || "Could not start enrollment. Ensure MFA is enabled for this project.");
      return;
    }
    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setCode("");
  };

  const verifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrolling || code.replace(/\s/g, "").length < 6) return;
    setBusy(true);
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enrolling.id });
    if (chErr || !challenge) { setBusy(false); toast.error(chErr?.message || "Challenge failed."); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId: enrolling.id, challengeId: challenge.id, code: code.replace(/\s/g, "") });
    setBusy(false);
    if (error) { toast.error(error.message || "Invalid code."); return; }
    toast.success("Authenticator app added. MFA is now on for your account.");
    setEnrolling(null);
    setCode("");
    refresh();
  };

  const removeFactor = async (factorId: string) => {
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Authenticator removed.");
    refresh();
  };

  const card: React.CSSProperties = { background: "#fff", border: "1px solid rgba(17,24,39,0.08)", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 3px rgba(17,24,39,0.05)" };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fa", color: INK, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 18px 80px" }}>
        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 18 }}>
          <ArrowLeft size={15} /> Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <ShieldCheck size={24} color={PURPLE} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Account Security</h1>
        </div>
        <p style={{ color: MUTED, fontSize: 13, margin: "0 0 22px" }}>{user?.email}</p>

        <div style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Two-factor authentication (TOTP)</h2>
          <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.5, margin: "0 0 16px" }}>
            Add an authenticator app (Google Authenticator, 1Password, Authy, etc.). After this is on, you'll enter a 6-digit code at login.
          </p>

          {loading ? (
            <p style={{ color: MUTED, fontSize: 13 }}>Loading…</p>
          ) : (
            <>
              {factors.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {factors.map((f) => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", background: "rgba(17,24,39,0.03)", border: "1px solid rgba(17,24,39,0.07)", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Smartphone size={16} color={MUTED} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{f.friendly_name || "Authenticator app"}</div>
                          <div style={{ fontSize: 11.5, color: f.status === "verified" ? "#16a34a" : "#b45309" }}>{f.status}</div>
                        </div>
                      </div>
                      <button onClick={() => removeFactor(f.id)} disabled={busy} title="Remove" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#b91c1c", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!enrolling ? (
                <button onClick={startEnroll} disabled={busy} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: PURPLE, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  <Plus size={15} /> Add authenticator app
                </button>
              ) : (
                <div style={{ borderTop: "1px solid rgba(17,24,39,0.08)", paddingTop: 16 }}>
                  <p style={{ fontSize: 13, color: MUTED, margin: "0 0 12px" }}>1. Scan this QR code with your authenticator app:</p>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                    <div style={{ width: 176, height: 176, background: "#fff", border: "1px solid rgba(17,24,39,0.1)", borderRadius: 12, padding: 8 }} dangerouslySetInnerHTML={{ __html: enrolling.qr }} />
                  </div>
                  <p style={{ fontSize: 12, color: MUTED, textAlign: "center", margin: "0 0 16px" }}>
                    Or enter this key manually:<br />
                    <code style={{ fontSize: 12.5, color: INK, wordBreak: "break-all" }}>{enrolling.secret}</code>
                  </p>
                  <form onSubmit={verifyEnroll} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>2. Enter the 6-digit code it shows:</p>
                    <Input
                      inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} autoFocus
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      style={{ background: "rgba(17,24,39,0.04)", border: "1px solid rgba(17,24,39,0.09)", color: INK, borderRadius: 8, textAlign: "center", letterSpacing: "0.4em", fontSize: "1.1rem" }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="submit" disabled={busy || code.length < 6} style={{ flex: 1, background: busy || code.length < 6 ? `${PURPLE}80` : PURPLE, color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: busy || code.length < 6 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                        {busy ? "Verifying…" : "Verify & enable"}
                      </button>
                      <button type="button" onClick={() => { setEnrolling(null); setCode(""); }} style={{ background: "rgba(17,24,39,0.04)", border: "1px solid rgba(17,24,39,0.1)", color: MUTED, borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
