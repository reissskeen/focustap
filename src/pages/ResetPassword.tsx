import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import focustapLogo from "@/assets/focustap-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const inputStyle = { background: "rgba(17,24,39,0.04)", border: "1px solid rgba(17,24,39,0.09)", color: "#111827", borderRadius: 8 };
const labelStyle = { color: "#667085", fontSize: "0.82rem", fontWeight: 500 };
const PURPLE = "#8b6cff";

/**
 * Two purposes in one page:
 *  - "request": enter email -> Supabase emails a recovery link.
 *  - "reset":  arrived via that link (PASSWORD_RECOVERY) -> set a new password.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { passwordRecovery, clearPasswordRecovery } = useAuth();
  const recoveryInUrl =
    typeof window !== "undefined" &&
    (window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery") ||
      window.location.search.includes("code="));
  const [step, setStep] = useState<"request" | "reset">(recoveryInUrl ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // PASSWORD_RECOVERY is captured at the app root (AuthProvider) so it can't be
  // missed while this page is still mounting; switch to "reset" when it lands.
  useEffect(() => {
    if (passwordRecovery) setStep("reset");
  }, [passwordRecovery]);

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    // Do not reveal whether the email exists — always show the same confirmation.
    setSent(true);
    if (error && !/rate/i.test(error.message)) toast.error(error.message);
  };

  const setNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Use at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. Please log in.");
    clearPasswordRecovery();
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: "100%", maxWidth: 380 }}>
        <Link to="/" style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <img src={focustapLogo} alt="FocusTap" style={{ height: 48, width: "auto" }} />
        </Link>
        <div style={{ background: "rgba(17,24,39,0.03)", border: "1px solid rgba(17,24,39,0.08)", borderRadius: 16, padding: "28px 24px", boxShadow: "0 4px 24px rgba(17,24,39,0.06)" }}>
          {step === "request" ? (
            sent ? (
              <div style={{ textAlign: "center" }}>
                <h1 style={{ fontWeight: 500, fontSize: "1.2rem", color: "#111827", marginBottom: 8 }}>Check your email</h1>
                <p style={{ color: "#667085", fontSize: "0.86rem", lineHeight: 1.6 }}>
                  If an account exists for <strong style={{ color: "#344054" }}>{email}</strong>, we've sent a link to reset your password.
                </p>
                <Link to="/login" style={{ display: "inline-block", marginTop: 18, color: PURPLE, fontSize: "0.82rem", fontWeight: 500, textDecoration: "none" }}>← Back to login</Link>
              </div>
            ) : (
              <>
                <h1 style={{ fontWeight: 500, fontSize: "1.2rem", color: "#111827", textAlign: "center", marginBottom: 4 }}>Reset your password</h1>
                <p style={{ color: "#667085", fontSize: "0.82rem", textAlign: "center", marginBottom: 24 }}>Enter your email and we'll send a reset link.</p>
                <form onSubmit={sendReset} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Label htmlFor="email" style={labelStyle}>Email</Label>
                    <div style={{ position: "relative" }}>
                      <Mail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#55556a" }} />
                      <Input id="email" type="email" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required style={inputStyle} />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} style={{ background: loading ? `${PURPLE}80` : PURPLE, color: "white", fontWeight: 600, fontSize: "0.9rem", padding: "11px 0", borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
                    {loading ? "Sending…" : <>Send reset link <ArrowRight style={{ width: 15, height: 15 }} /></>}
                  </button>
                  <Link to="/login" style={{ color: "#667085", fontSize: "0.78rem", textAlign: "center", textDecoration: "none" }}>Back to login</Link>
                </form>
              </>
            )
          ) : (
            <>
              <h1 style={{ fontWeight: 500, fontSize: "1.2rem", color: "#111827", textAlign: "center", marginBottom: 4 }}>Set a new password</h1>
              <p style={{ color: "#667085", fontSize: "0.82rem", textAlign: "center", marginBottom: 24 }}>Choose a strong password you don't use elsewhere.</p>
              <form onSubmit={setNewPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Label htmlFor="password" style={labelStyle}>New password</Label>
                  <div style={{ position: "relative" }}>
                    <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#55556a" }} />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={8} style={inputStyle} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#55556a", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Label htmlFor="confirm" style={labelStyle}>Confirm new password</Label>
                  <div style={{ position: "relative" }}>
                    <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#55556a" }} />
                    <Input id="confirm" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10" required minLength={8} style={inputStyle} />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ background: loading ? `${PURPLE}80` : PURPLE, color: "white", fontWeight: 600, fontSize: "0.9rem", padding: "11px 0", borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer", width: "100%", fontFamily: "inherit" }}>
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
