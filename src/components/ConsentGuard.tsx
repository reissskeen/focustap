import { useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_PATHS = ["/", "/login", "/teacher-login", "/consent", "/demo", "/poster", "/pitch-deck", "/financials", "/admin"];

export default function ConsentGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    // Not logged in — nothing to check
    if (!user) {
      setChecking(false);
      return;
    }

    // Public pages don't need consent
    if (PUBLIC_PATHS.some((p) => location.pathname === p)) {
      setChecking(false);
      return;
    }

    supabase
      .from("profiles")
      .select("consent_accepted_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.consent_accepted_at) {
          navigate("/consent", { replace: true });
        }
        setChecking(false);
      });
  }, [user, loading, location.pathname]);

  if (checking && user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#09090f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid rgba(139,108,255,0.25)",
            borderTopColor: "#8b6cff",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
