import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Menu, X, LogOut, ChevronDown, GraduationCap, BookOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>FocusTap</span>
        </Link>

        {isLanding && (
          <>
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      Get Started <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Student
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link to="/login?mode=login" className="w-full cursor-pointer">Log in</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/login?mode=signup" className="w-full cursor-pointer">Sign up</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Professor
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link to="/teacher-login?mode=login" className="w-full cursor-pointer">Log in</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/teacher-login?mode=signup" className="w-full cursor-pointer">Sign up</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <button
              className="md:hidden text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </>
        )}

        {!isLanding && (
          <div className="flex items-center gap-3">
            <Link to="/teacher">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {mobileOpen && isLanding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t bg-card px-4 pb-4"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 mt-3">
            {user ? (
              <Button variant="ghost" size="sm" className="w-full gap-1.5" onClick={() => { signOut(); setMobileOpen(false); }}>
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </Button>
            ) : (
              <>
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1"><GraduationCap className="w-3.5 h-3.5" /> Student</p>
                <Link to="/login?mode=login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Log in</Button>
                </Link>
                <Link to="/login?mode=signup" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Sign up</Button>
                </Link>
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-2"><BookOpen className="w-3.5 h-3.5" /> Professor</p>
                <Link to="/teacher-login?mode=login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Log in</Button>
                </Link>
                <Link to="/teacher-login?mode=signup" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Sign up</Button>
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
