import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/animations";
import { Mail, Lock, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import focustapLogo from "@/assets/focustap-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

const TeacherLogin = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (data || []).map((r) => r.role);
      if (roles.includes("teacher") || roles.includes("admin")) {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    };
    checkRole();
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // After login, verify the user has teacher role
    const { data: { user: loggedInUser } } = await supabase.auth.getUser();
    if (!loggedInUser) {
      setLoading(false);
      toast.error("Login failed");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", loggedInUser.id);

    const userRoles = (roles || []).map((r) => r.role);
    if (!userRoles.includes("teacher") && !userRoles.includes("admin")) {
      // Check if there's a pending access code from signup (email-confirmation flow)
      const pending = localStorage.getItem("ft_pending_teacher_code");
      if (pending) {
        try {
          const { email: pendingEmail, accessCode: pendingCode } = JSON.parse(pending);
          if (pendingEmail === email) {
            const { data: fnData, error: fnError } = await supabase.functions.invoke(
              "assign-teacher-role",
              { body: { access_code: pendingCode } }
            );
            if (!fnError && !fnData?.error) {
              localStorage.removeItem("ft_pending_teacher_code");
              setLoading(false);
              toast.success("Professor account activated! Welcome.");
              return; // useEffect will redirect to /teacher
            }
          }
        } catch {
          localStorage.removeItem("ft_pending_teacher_code");
        }
      }
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("This account does not have professor access. Use the student login instead.");
      return;
    }

    setLoading(false);
    toast.success("Welcome back, Professor!");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !accessCode) return;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    // Sign up the user first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/teacher-login`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });

    if (signUpError) {
      setLoading(false);
      toast.error(signUpError.message);
      return;
    }

    // Now assign teacher role via edge function
    const session = signUpData.session;
    if (!session) {
      // Email confirmation required — store the access code so we can
      // call assign-teacher-role automatically on first login
      localStorage.setItem("ft_pending_teacher_code", JSON.stringify({ email, accessCode }));
      setLoading(false);
      toast.success("Check your email to confirm your account, then log in here.");
      setMode("login");
      return;
    }

    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      "assign-teacher-role",
      {
        body: { access_code: accessCode },
      }
    );

    if (fnError || fnData?.error) {
      // Rollback: sign out and inform
      await supabase.auth.signOut();
      setLoading(false);
      toast.error(fnData?.error || "Invalid access code. Account was not granted professor access.");
      return;
    }

    setLoading(false);
    toast.success("Professor account created!");
    navigate("/teacher", { replace: true });
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setPassword("");
    setConfirmPassword("");
    setAccessCode("");
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#e8e8f0",
    borderRadius: 8,
  };

  const labelStyle = {
    color: "#8585a0",
    fontSize: "0.82rem",
    fontWeight: 500,
  };

  return (
    <PageTransition variant="fade">
    <div
      style={{
        minHeight: "100vh",
        background: "#09090f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background orb */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 400,
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
            "linear-gradient(rgba(139,108,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(139,108,255,0.02) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 10 }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: "flex", justifyContent: "center", marginBottom: 32, textDecoration: "none" }}>
          <img src={focustapLogo} alt="FocusTap" style={{ height: 48, width: "auto" }} />
        </Link>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
          }}
        >
          <Link
            to="/login"
            style={{
              flex: 1,
              textAlign: "center",
              padding: "7px 0",
              borderRadius: 7,
              color: "#55556a",
              fontWeight: 500,
              fontSize: "0.84rem",
              textDecoration: "none",
              display: "block",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8585a0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#55556a")}
          >
            Student
          </Link>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: "7px 0",
              borderRadius: 7,
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.18)",
              color: "#22d3ee",
              fontWeight: 600,
              fontSize: "0.84rem",
            }}
          >
            Professor
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: "28px 24px",
            boxShadow: "0 0 0 1px rgba(34,211,238,0.05), 0 24px 60px rgba(0,0,0,0.4)",
          }}
        >
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h1
              style={{
                fontWeight: 500,
                fontSize: "1.2rem",
                letterSpacing: "-0.02em",
                color: "#e8e8f0",
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              {mode === "login" ? "Professor Login" : "Professor Registration"}
            </h1>
            <p style={{ color: "#55556a", fontSize: "0.82rem", textAlign: "center", marginBottom: 24 }}>
              {mode === "login"
                ? "Sign in to your professor account"
                : "Create a professor account with your access code"}
            </p>

            <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mode === "signup" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Label htmlFor="displayName" style={labelStyle}>Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Prof. Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Label htmlFor="email" style={labelStyle}>Email</Label>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#55556a" }} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Label htmlFor="password" style={labelStyle}>Password</Label>
                <div style={{ position: "relative" }}>
                  <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#55556a" }} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#55556a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</Label>
                    <div style={{ position: "relative" }}>
                      <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#55556a" }} />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Label htmlFor="accessCode" style={labelStyle}>Access Code</Label>
                    <div style={{ position: "relative" }}>
                      <KeyRound style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#55556a" }} />
                      <Input
                        id="accessCode"
                        type="password"
                        placeholder="Enter professor access code"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        className="pl-10"
                        required
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? "rgba(34,211,238,0.3)" : "rgba(34,211,238,0.15)",
                  border: `1px solid ${loading ? "rgba(34,211,238,0.2)" : "rgba(34,211,238,0.3)"}`,
                  boxShadow: loading ? "none" : "0 0 16px rgba(34,211,238,0.1)",
                  color: loading ? "rgba(34,211,238,0.5)" : "#22d3ee",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  padding: "11px 0",
                  borderRadius: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  transition: "box-shadow 0.2s, background 0.2s",
                  fontFamily: "inherit",
                  marginTop: 4,
                }}
              >
                {loading ? (
                  "Please wait…"
                ) : mode === "login" ? (
                  <>Log In <ArrowRight style={{ width: 15, height: 15 }} /></>
                ) : (
                  <>Create Professor Account <ArrowRight style={{ width: 15, height: 15 }} /></>
                )}
              </button>

              <p style={{ color: "#55556a", fontSize: "0.78rem", textAlign: "center" }}>
                {mode === "login" ? (
                  <>No account?{" "}
                    <button type="button" onClick={switchMode} style={{ color: "#22d3ee", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "0.78rem", fontFamily: "inherit" }}>
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have an account?{" "}
                    <button type="button" onClick={switchMode} style={{ color: "#22d3ee", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "0.78rem", fontFamily: "inherit" }}>
                      Log in
                    </button>
                  </>
                )}
              </p>
            </form>
          </motion.div>
        </div>

        <p style={{ color: "#55556a", fontSize: "0.78rem", textAlign: "center", marginTop: 16 }}>
          Student?{" "}
          <Link to="/login" style={{ color: "#8b6cff", textDecoration: "none", fontWeight: 500 }}>
            Go to student login
          </Link>
        </p>
      </motion.div>
    </div>
    </PageTransition>
  );
};

export default TeacherLogin;
