import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import focustapLogo from "@/assets/focustap-logo.png";
import {
  Eye,
  FileText,
  QrCode,
  BarChart3,
  Shield,
  ArrowRight,
  TrendingUp,
  Presentation, Nfc } from
"lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

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


const Index = () => {
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
              <Link to="/login?mode=login">
                <Button size="lg" className="text-base px-8 gap-2">
                  Student Login <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/teacher-login?mode=login">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Professor Login
                </Button>
              </Link>
            </div>

            {/* Pitch & Financials Tags */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link to="/pitch-deck">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
                  <Presentation className="w-3.5 h-3.5" />
                  Pitch Deck
                </span>
              </Link>
              <Link to="/financials">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Financial Model
                </span>
              </Link>
            </div>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) =>
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card rounded-xl p-6 hover:shadow-xl transition-shadow">

                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            )}
          </div>
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
            <Link to="/login">
              <Button size="lg" className="text-base px-10 gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display font-bold">
            <img src={focustapLogo} alt="FocusTap" className="h-10 w-aut0" />
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 FocusTap. Privacy-first classroom engagement.
          </p>
        </div>
      </footer>
    </div>);

};

export default Index;