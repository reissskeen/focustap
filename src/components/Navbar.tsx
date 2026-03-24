import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, ChevronDown, GraduationCap, BookOpen, LogOut } from "lucide-react";
import { useState } from "react";
import focustapLogo from "@/assets/focustap-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isLanding = location.pathname === "/";

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        background: "rgba(9, 9, 15, 0.8)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
      className="fixed top-0 left-0 right-0 z-50 h-16"
    >
      <div className="container mx-auto flex items-center justify-between h-full px-4 max-w-6xl">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img src={focustapLogo} alt="FocusTap" style={{ height: 36, width: "auto" }} />
        </Link>

        {/* Center links - landing only desktop */}
        {isLanding && (
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href.startsWith("/#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  style={{ color: "#8585a0", fontWeight: 500, fontSize: "0.84rem", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e8e8f0")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8585a0")}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  style={{ color: "#8585a0", fontWeight: 500, fontSize: "0.84rem" }}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        )}

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isLanding ? (
            user ? (
              <button
                onClick={signOut}
                style={{ color: "#8585a0", fontWeight: 500, fontSize: "0.84rem", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}
              >
                <LogOut style={{ width: 14, height: 14 }} /> Sign out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{ color: "#8585a0", fontWeight: 500, fontSize: "0.84rem", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e8e8f0")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8585a0")}
                >
                  Log in
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      style={{
                        background: "#8b6cff",
                        boxShadow: "0 0 20px rgba(139,108,255,0.25)",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "0.84rem",
                        padding: "8px 18px",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "none",
                        cursor: "pointer",
                        transition: "box-shadow 0.2s",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 28px rgba(139,108,255,0.45)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 20px rgba(139,108,255,0.25)")}
                    >
                      Sign Up <ChevronDown style={{ width: 14, height: 14 }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    style={{
                      background: "rgba(14,14,26,0.98)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: 10,
                      minWidth: 180,
                    }}
                  >
                    <DropdownMenuItem asChild>
                      <Link to="/login?mode=signup" className="flex items-center gap-2 cursor-pointer" style={{ color: "#e8e8f0", fontWeight: 500 }}>
                        <GraduationCap style={{ width: 15, height: 15, color: "#8b6cff" }} /> Student Sign Up
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/teacher-login?mode=signup" className="flex items-center gap-2 cursor-pointer" style={{ color: "#e8e8f0", fontWeight: 500 }}>
                        <BookOpen style={{ width: 15, height: 15, color: "#22d3ee" }} /> Professor Sign Up
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )
          ) : (
            <>
              <Link to="/teacher">
                <button style={{ color: "#8585a0", fontWeight: 500, fontSize: "0.84rem", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Dashboard
                </button>
              </Link>
              {user ? (
                <button
                  onClick={signOut}
                  style={{ color: "#8585a0", fontWeight: 500, fontSize: "0.84rem", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <LogOut style={{ width: 14, height: 14 }} /> Sign out
                </button>
              ) : (
                <Link to="/login" style={{ color: "#8585a0", fontWeight: 500, fontSize: "0.84rem" }}>
                  Log in
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile toggle */}
        {isLanding && (
          <button
            className="md:hidden"
            style={{ color: "#e8e8f0", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && isLanding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(9,9,15,0.97)",
            padding: "16px",
          }}
        >
          {navLinks.map((link) =>
            link.href.startsWith("/#") ? (
              <a
                key={link.label}
                href={link.href}
                style={{ display: "block", color: "#8585a0", fontWeight: 500, padding: "10px 0", fontSize: "0.9rem" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                style={{ display: "block", color: "#8585a0", fontWeight: 500, padding: "10px 0", fontSize: "0.9rem" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {user ? (
              <button onClick={() => { signOut(); setMobileOpen(false); }} style={{ color: "#8585a0", fontWeight: 500, fontSize: "0.9rem", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "6px 0", fontFamily: "inherit" }}>
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login?mode=signup" onClick={() => setMobileOpen(false)} style={{ color: "#e8e8f0", fontWeight: 500, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                  <GraduationCap style={{ width: 16, height: 16, color: "#8b6cff" }} /> Student Sign Up
                </Link>
                <Link to="/teacher-login?mode=signup" onClick={() => setMobileOpen(false)} style={{ color: "#e8e8f0", fontWeight: 500, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                  <BookOpen style={{ width: 16, height: 16, color: "#22d3ee" }} /> Professor Sign Up
                </Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} style={{ color: "#8585a0", fontWeight: 500, fontSize: "0.9rem", padding: "8px 0" }}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
