import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, UserPlus, LogIn, KeyRound } from "lucide-react";
import focustapLogo from "@/assets/focustap-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

const TeacherLogin = () => {
  const [mode, setMode] = useState<AuthMode>("login");
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
        emailRedirectTo: window.location.origin,
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
      setLoading(false);
      toast.error("Account created but session not available. Please log in.");
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="flex items-center justify-center mb-10">
          <img src={focustapLogo} alt="FocusTap" className="h-40 w-auto" />
        </Link>

        {/* Signup tabs hidden */}

        <div className="glass-card rounded-xl p-6">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="font-display text-xl font-bold mb-1 text-center">
              {mode === "login" ? "Professor Login" : "Professor Registration"}
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {mode === "login"
                ? "Sign in to your professor account"
                : "Create a professor account with your access code"}
            </p>

            <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Prof. Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessCode">Access Code</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="accessCode"
                        type="password"
                        placeholder="Enter professor access code"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  "Please wait…"
                ) : mode === "login" ? (
                  <>Log In <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Create Professor Account <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>
          </motion.div>
        </div>

        

        <p className="text-xs text-muted-foreground text-center mt-3">
          Student?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Go to student login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default TeacherLogin;
