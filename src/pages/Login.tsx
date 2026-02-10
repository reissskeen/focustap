import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Mail, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl justify-center mb-10">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          FocusTap
        </Link>

        <div className="glass-card rounded-xl p-6">
          {!sent ? (
            <>
              <h1 className="font-display text-xl font-bold mb-1 text-center">Welcome back</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Sign in with your school email
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2">
                  Send Magic Link <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2" asChild>
                <a href="#">Sign in with Canvas LMS</a>
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold mb-2">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By signing in, you agree to FocusTap's privacy policy.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
