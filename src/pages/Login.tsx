import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import focustapLogo from "@/assets/focustap-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

const Login = () => {
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
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
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
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Link student to institution via access code
    const session = signUpData.session;
    if (session) {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "link-student-institution",
        { body: { student_code: accessCode } }
      );
      if (fnError || fnData?.error) {
        await supabase.auth.signOut();
        setLoading(false);
        toast.error(fnData?.error || "Invalid school access code.");
        return;
      }
    }

    setLoading(false);
    toast.success("Account created! Check your email to verify, then log in.");
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    setAccessCode("");
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
          background: "radial-gradient(ellipse at center, rgba(139,108,255,0.1) 0%, transparent 70%)",
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
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: "7px 0",
              borderRadius: 7,
              background: "rgba(139,108,255,0.15)",
              border: "1px solid rgba(139,108,255,0.2)",
              color: "#a78bfa",
              fontWeight: 600,
              fontSize: "0.84rem",
            }}
          >
            Student
          </div>
          <Link
            to="/teacher-login"
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
            Professor
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: "28px 24px",
            boxShadow: "0 0 0 1px rgba(139,108,255,0.06), 0 24px 60px rgba(0,0,0,0.4)",
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
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p style={{ color: "#55556a", fontSize: "0.82rem", textAlign: "center", marginBottom: 24 }}>
              {mode === "login"
                ? "Enter your credentials to continue"
                : "Sign up with your school email"}
            </p>

            <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mode === "signup" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Label htmlFor="displayName" style={labelStyle}>Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
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
                    placeholder="you@school.edu"
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
                    <Label htmlFor="accessCode" style={labelStyle}>School Access Code</Label>
                    <div style={{ position: "relative" }}>
                      <KeyRound style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#55556a" }} />
                      <Input
                        id="accessCode"
                        type="text"
                        placeholder="Enter your school's code"
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
                  background: loading ? "rgba(139,108,255,0.5)" : "#8b6cff",
                  boxShadow: loading ? "none" : "0 0 20px rgba(139,108,255,0.25)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  padding: "11px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  transition: "box-shadow 0.2s",
                  fontFamily: "inherit",
                  marginTop: 4,
                }}
              >
                {loading ? (
                  "Please wait…"
                ) : mode === "login" ? (
                  <>Log In <ArrowRight style={{ width: 15, height: 15 }} /></>
                ) : (
                  <>Create Account <ArrowRight style={{ width: 15, height: 15 }} /></>
                )}
              </button>

              <p style={{ color: "#55556a", fontSize: "0.78rem", textAlign: "center" }}>
                {mode === "login" ? (
                  <>No account?{" "}
                    <button type="button" onClick={switchMode} style={{ color: "#8b6cff", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "0.78rem", fontFamily: "inherit" }}>
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have an account?{" "}
                    <button type="button" onClick={switchMode} style={{ color: "#8b6cff", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "0.78rem", fontFamily: "inherit" }}>
                      Log in
                    </button>
                  </>
                )}
              </p>
            </form>
          </motion.div>
        </div>

        <p style={{ color: "#55556a", fontSize: "0.78rem", textAlign: "center", marginTop: 16 }}>
          Professor?{" "}
          <Link to="/teacher-login" style={{ color: "#8b6cff", textDecoration: "none", fontWeight: 500 }}>
            Go to professor login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
