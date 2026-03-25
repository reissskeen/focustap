import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PIN_KEY } from "@/components/PinProtectedRoute";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleProtectedRoute = ({ children, allowedRoles, redirectTo = "/login" }: RoleProtectedRouteProps) => {
  const isAdminPin = sessionStorage.getItem(PIN_KEY) === "true";
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isAdminPin) { setChecking(false); return; }
    setChecking(true);
    if (!user) {
      setChecking(false);
      return;
    }
    const fetchRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      setRoles((data || []).map((r) => r.role));
      setChecking(false);
    };
    fetchRoles();
  }, [user, isAdminPin]);

  // Admin PIN bypass — all hooks have already run above
  if (isAdminPin) return <>{children}</>;

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin role can access any protected route
  if (roles && !roles.includes("admin") && !roles.some((r) => allowedRoles.includes(r))) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
