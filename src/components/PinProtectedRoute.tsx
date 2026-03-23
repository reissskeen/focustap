import { Navigate } from "react-router-dom";

export const ADMIN_PIN = "ft2026";
export const PIN_KEY = "ft_admin_verified";

const PinProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (sessionStorage.getItem(PIN_KEY) !== "true") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default PinProtectedRoute;
