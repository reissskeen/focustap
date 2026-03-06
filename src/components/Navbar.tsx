import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, LogOut, ChevronDown, GraduationCap, BookOpen, Sun, Moon } from "lucide-react";
import focustapLogo from "@/assets/focustap-logo.png";
import { useState, useEffect } from "react";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const isLanding = location.pathname === "/";

  const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Financials", href: "/financials" },
  { label: "Pitch Deck", href: "/pitch-deck" }];


  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b">

      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <img src={focustapLogo} alt="FocusTap" className="h-10 row-auto rounded-sm" />
        </Link>

        {isLanding &&
        <>
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
            link.href.startsWith("/#") ?
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">

                    {link.label}
                  </a> :

            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">

                    {link.label}
                  </Link>

            )}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <ButtonColorful
                variant="ghost"
                size="icon"
                onClick={() => setDark(!dark)}
                className="h-9 w-9"
                aria-label="Toggle dark mode"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </ButtonColorful>
              {user ?
            <ButtonColorful variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </ButtonColorful> :

            <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ButtonColorful size="sm" gradient="blue" className="gap-1.5">
                      Get Started <ChevronDown className="w-3.5 h-3.5" />
                    </ButtonColorful>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/login?mode=signup" className="w-full cursor-pointer flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Student Sign Up
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/teacher-login?mode=signup" className="w-full cursor-pointer flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Professor Sign Up
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            }
            </div>

            <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}>

              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </>
        }

        {!isLanding &&
        <div className="flex items-center gap-3">
            <Link to="/teacher">
              <ButtonColorful variant="ghost" size="sm">Dashboard</ButtonColorful>
            </Link>
            {user ?
          <ButtonColorful variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </ButtonColorful> :

          <Link to="/login">
                <ButtonColorful variant="ghost" size="sm">Log in</ButtonColorful>
              </Link>
          }
          </div>
        }
      </div>

      {mobileOpen && isLanding &&
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="md:hidden border-t bg-card px-4 pb-4">

          {navLinks.map((link) =>
        link.href.startsWith("/#") ?
        <a
          key={link.label}
          href={link.href}
          className="block py-2 text-sm font-medium text-muted-foreground"
          onClick={() => setMobileOpen(false)}>

                {link.label}
              </a> :

        <Link
          key={link.label}
          to={link.href}
          className="block py-2 text-sm font-medium text-muted-foreground"
          onClick={() => setMobileOpen(false)}>

                {link.label}
              </Link>

        )}
          <div className="flex flex-col gap-2 mt-3">
            {user ?
          <ButtonColorful variant="ghost" size="sm" className="w-full gap-1.5" onClick={() => {signOut();setMobileOpen(false);}}>
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </ButtonColorful> :

          <>
                <Link to="/login?mode=signup" onClick={() => setMobileOpen(false)}>
                  <ButtonColorful variant="ghost" size="sm" className="w-full justify-start gap-2"><GraduationCap className="w-3.5 h-3.5" /> Student Sign Up</ButtonColorful>
                </Link>
                <Link to="/teacher-login?mode=signup" onClick={() => setMobileOpen(false)}>
                  <ButtonColorful variant="ghost" size="sm" className="w-full justify-start gap-2"><BookOpen className="w-3.5 h-3.5" /> Professor Sign Up</ButtonColorful>
                </Link>
              </>
          }
          </div>
        </motion.div>
      }
    </motion.nav>);

};

export default Navbar;