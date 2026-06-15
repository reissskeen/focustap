import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * Login step-up: prompts for the 6-digit TOTP code, then challenges + verifies
 * the factor. On success the session is upgraded to aal2 and onVerified() runs.
 */
export function MfaChallenge({
  factorId,
  onVerified,
  onCancel,
  accent = "#8b6cff",
}: {
  factorId: string;
  onVerified: () => void;
  onCancel: () => void;
  accent?: string;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.replace(/\s/g, "");
    if (clean.length < 6) return;
    setLoading(true);
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !challenge) {
      setLoading(false);
      toast.error(chErr?.message || "Could not start the verification challenge.");
      return;
    }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: clean });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Invalid code. Try again.");
      setCode("");
      return;
    }
    onVerified();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}1a`, border: `1px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={22} color={accent} />
        </div>
      </div>
      <h1 style={{ fontWeight: 500, fontSize: "1.2rem", letterSpacing: "-0.02em", color: "#111827", textAlign: "center", marginBottom: 4 }}>
        Two-factor authentication
      </h1>
      <p style={{ color: "#667085", fontSize: "0.82rem", textAlign: "center", marginBottom: 24 }}>
        Enter the 6-digit code from your authenticator app.
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
          required
          style={{ background: "rgba(17,24,39,0.04)", border: "1px solid rgba(17,24,39,0.09)", color: "#111827", borderRadius: 8, textAlign: "center", letterSpacing: "0.4em", fontSize: "1.1rem" }}
        />
        <button
          type="submit"
          disabled={loading || code.length < 6}
          style={{
            background: loading || code.length < 6 ? `${accent}80` : accent,
            color: "white", fontWeight: 600, fontSize: "0.9rem", padding: "11px 0", borderRadius: 8,
            border: "none", cursor: loading || code.length < 6 ? "not-allowed" : "pointer", width: "100%", fontFamily: "inherit",
          }}
        >
          {loading ? "Verifying…" : "Verify & continue"}
        </button>
        <button type="button" onClick={onCancel} style={{ color: "#667085", background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", fontFamily: "inherit" }}>
          Cancel
        </button>
      </form>
    </div>
  );
}
