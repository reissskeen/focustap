import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import focustapLogo from "@/assets/focustap-logo.png";
import {
  Eye,
  FileText,
  QrCode,
  BarChart3,
  Shield,
  ArrowRight,
  Presentation } from
"lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import Navbar from "@/components/Navbar";
import { ADMIN_PIN, PIN_KEY } from "@/components/PinProtectedRoute";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

const features = [
{
  icon: Eye,
  title: "Smart Focus Tracking",
  description: "Automatically tracks time-on-task using page visibility — no monitoring, no spying."
},
{
  icon: FileText,
  title: "Built-in Notes Editor",
  description: "Rich text note-taking with autosave, checklists, and structured formatting."
},
{
  icon: QrCode,
  title: "QR & NFC Entry",
  description: "Students join in seconds via QR code scan, NFC tap, or Canvas deep link."
},
{
  icon: BarChart3,
  title: "Live Dashboard",
  description: "Real-time view of student engagement with focus scores and participation rates."
},
{
  icon: Shield,
  title: "Privacy-First",
  description: "No screen monitoring, no app blocking. FERPA-aligned and student-friendly."
},
{
  icon: Eye,
  title: "LMS Integration",
  description: "Seamless Canvas LTI 1.3 integration with automatic roster and role sync."
}];


const steps = [
{ number: "01", title: "Teacher starts a session", description: "Generate a URL code or share a link in your LMS." },
{ number: "02", title: "Students tap in", description: "Scan, tap, or click to join the session instantly." },
{ number: "03", title: "Take notes, stay focused", description: "The built-in editor tracks focus while students write." },
{ number: "04", title: "Review engagement", description: "See real-time and post-class focus analytics." }];


interface FeatureGridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const FeatureGridItem = ({ area, icon, title, description, index }: FeatureGridItemProps) => {
  return (
    <motion.li
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`min-h-[14rem] list-none ${area}`}
    >
      <div className="group/container relative h-full rounded-2xl border border-border bg-card p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={2}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-border bg-background p-6 shadow-sm md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-border bg-muted p-2">
              {icon}
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [adminOpen, setAdminOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(PIN_KEY, "true");
      setAdminOpen(false);
      setPin("");
      navigate("/admin");
    } else {
      setPinError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.04]" />
        <div className="container mx-auto max-w-5xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              
              Focus tracking for modern classrooms
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Measure focus,
              <br />
              <span className="gradient-text">not compliance.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              FocusTap tracks time-on-task while students take notes — no blocking,
              no monitoring, no hardware. Just engagement data that matters.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login?mode=signup">
                <Button size="lg" className="text-base px-8 gap-2">
                  Student Sign Up <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/teacher-login?mode=signup">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Professor Sign Up
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Already have an account?{" "}
              <Link to="/login?mode=login" className="text-primary hover:underline font-medium">Log in</Link>
            </p>

          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Everything you need for engaged classrooms
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A non-invasive toolkit that respects student autonomy while giving teachers real engagement data.
            </p>
          </motion.div>

          <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
            {features.map((feature, i) => {
              const areas = [
                "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]",
                "md:[grid-area:1/7/2/13] xl:[grid-area:1/5/2/9]",
                "md:[grid-area:2/1/3/7] xl:[grid-area:1/9/2/13]",
                "md:[grid-area:2/7/3/13] xl:[grid-area:2/1/3/5]",
                "md:[grid-area:3/1/4/7] xl:[grid-area:2/5/3/9]",
                "md:[grid-area:3/7/4/13] xl:[grid-area:2/9/3/13]",
              ];
              return (
                <FeatureGridItem
                  key={feature.title}
                  area={areas[i]}
                  icon={<feature.icon className="h-4 w-4 text-foreground" />}
                  title={feature.title}
                  description={feature.description}
                  index={i}
                />
              );
            })}
          </ul>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">Four simple steps to focused classrooms.</p>
          </motion.div>

          <div className="space-y-8">
            {steps.map((step, i) =>
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex items-start gap-6">

                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                  <span className="font-display text-lg font-bold text-primary-foreground">{step.number}</span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to bring focus back to your classroom?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Start a free pilot with your class. No hardware, no installs, no setup friction.
            </p>
            <Link to="/login?mode=signup">
              <Button size="lg" className="text-base px-10 gap-2">
                Sign Up Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display font-bold">
            <img src={focustapLogo} alt="FocusTap" className="h-10 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 FocusTap. Privacy-first classroom engagement.
          </p>
          <button
            onClick={() => { setAdminOpen(true); setPinError(false); }}
            className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors select-none"
          >
            Admin
          </button>
        </div>
      </footer>

      {/* Admin PIN dialog */}
      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">Admin Access</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminSubmit} className="space-y-3 mt-1">
            <Input
              type="password"
              placeholder="Enter access code"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-destructive">Incorrect code.</p>
            )}
            <Button type="submit" className="w-full" size="sm">
              Continue
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>);
};

export default Index;