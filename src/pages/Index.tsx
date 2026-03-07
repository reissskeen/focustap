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
  Presentation } from
"lucide-react";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import Navbar from "@/components/Navbar";
import { HeroSection } from "@/components/ui/hero-section-dark";

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

      {/* Hero with RetroGrid */}
      <HeroSection
        title="Focus tracking for modern classrooms"
        subtitle={{
          regular: "Measure focus, ",
          gradient: "not compliance.",
        }}
        description="FocusTap tracks time-on-task while students take notes — no blocking, no monitoring, no hardware. Just engagement data that matters."
        bottomImage={{
          light: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1400&q=80",
          dark: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1400&q=80",
        }}
        gridOptions={{
          angle: 65,
          opacity: 0.3,
          cellSize: 50,
          lightLineColor: "hsl(207 70% 45% / 0.3)",
          darkLineColor: "hsl(207 65% 50% / 0.3)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/login?mode=login">
            <LiquidButton size="xl" className="text-base px-8 gap-2">
              Student Login
            </LiquidButton>
          </Link>
          <Link to="/teacher-login?mode=login">
            <LiquidButton size="xl" variant="outline" className="text-base px-8">
              Professor Login
            </LiquidButton>
          </Link>
        </div>
        <div className="flex items-center justify-center gap-3 mt-4">
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
      </HeroSection>

      {/* Features */}
      <section id="features" className="py-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center mb-16"
          >
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
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-card rounded-xl p-6 hover:shadow-xl transition-shadow">

                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 + 0.2, type: "spring", stiffness: 200 }}
                  className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                >
                  <feature.icon className="w-5 h-5 text-primary" />
                </motion.div>
                <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30 overflow-hidden">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">Four simple steps to focused classrooms.</p>
          </motion.div>

          <div className="space-y-8">
            {steps.map((step, i) =>
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60, rotateY: i % 2 === 0 ? -5 : 5 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex items-start gap-6">

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 + 0.15, type: "spring", stiffness: 150 }}
                  className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary flex items-center justify-center"
                >
                  <span className="font-display text-lg font-bold text-primary-foreground">{step.number}</span>
                </motion.div>
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
              <ButtonColorful size="lg" gradient="green" className="text-base px-10 gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </ButtonColorful>
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