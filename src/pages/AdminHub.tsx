import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Presentation, LogOut } from "lucide-react";
import { PIN_KEY } from "@/components/PinProtectedRoute";

export default function AdminHub() {
  const navigate = useNavigate();

  const exit = () => {
    sessionStorage.removeItem(PIN_KEY);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Internal pages</p>
        </div>
        <div className="space-y-3">
          <Button
            className="w-full gap-2"
            variant="outline"
            onClick={() => navigate("/financials")}
          >
            <BarChart3 className="h-4 w-4" /> Financials
          </Button>
          <Button
            className="w-full gap-2"
            variant="outline"
            onClick={() => navigate("/pitch-deck")}
          >
            <Presentation className="h-4 w-4" /> Pitch Deck
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="w-full gap-1.5 text-muted-foreground" onClick={exit}>
          <LogOut className="h-3.5 w-3.5" /> Exit admin
        </Button>
      </div>
    </div>
  );
}
