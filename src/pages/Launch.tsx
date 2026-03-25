import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, RefreshCw, Home, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const Launch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolve = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const queryString = new URLSearchParams(params).toString();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/launch?${queryString}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        setError(result.error || "Failed to resolve session");
        setLoading(false);
        return;
      }

      navigate(`/session/${result.session_id}`, { replace: true });
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    resolve();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Finding your session…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No active class session</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <button
          onClick={() => navigate("/teacher")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            color: "#8585a0",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            padding: "0 0 0 0",
            marginBottom: 20,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e8e8f0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8585a0")}
        >
          <ChevronLeft style={{ width: 15, height: 15 }} />
          Back
        </button>

        <div className="flex gap-3">
          <Button onClick={resolve} variant="outline" className="flex-1 gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
          <Button asChild className="flex-1 gap-2">
            <Link to="/"><Home className="w-4 h-4" /> Home</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Launch;
