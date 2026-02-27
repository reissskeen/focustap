import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, Maximize2, Minimize2 } from "lucide-react";
import focustapLogo from "@/assets/focustap-logo.png";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from
"recharts";
import { defaultAssumptions, generateForecast, formatCurrency, formatPercent, computeNINVTotal, computeAnnualOpexTotal } from "@/lib/financialData";

const TOTAL_SLIDES = 7;

function SlideWrapper({ children }: {children: React.ReactNode;}) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-12 md:p-20">
      {children}
    </div>);

}

export default function PitchDeck() {
  const [slide, setSlide] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const forecast = useMemo(() => generateForecast(defaultAssumptions), []);
  const chartData = forecast.map((d) => ({
    label: `${d.year.replace("FY ", "'")} ${d.quarter}`,
    totalRevenue: d.totalRevenue,
    subscriptionRevenue: d.subscriptionRevenue,
    hardwareRevenue: d.hardwareRevenue,
    grossProfit: d.grossProfit,
    netIncome: d.netIncome,
    studentsDeployed: d.studentsDeployed,
    institutions: d.institutions
  }));

  const lastQ = forecast[forecast.length - 1];
  const totalRevY3 = forecast.filter((d) => d.year === "FY 2028").reduce((s, d) => s + d.totalRevenue, 0);
  const annualData = ["FY 2026", "FY 2027", "FY 2028"].map((y) => {
    const qs = forecast.filter((d) => d.year === y);
    return {
      year: y,
      revenue: qs.reduce((s, d) => s + d.totalRevenue, 0),
      grossProfit: qs.reduce((s, d) => s + d.grossProfit, 0),
      netIncome: qs.reduce((s, d) => s + d.netIncome, 0),
      institutions: qs[qs.length - 1].institutions,
      students: qs[qs.length - 1].studentsDeployed
    };
  });

  const next = useCallback(() => setSlide((s) => Math.min(s + 1, TOTAL_SLIDES - 1)), []);
  const prev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape" && fullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, fullscreen]);

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const slides = [
  // Slide 0 — Title
  <SlideWrapper key={0}>
      <div className="text-center space-y-6 max-w-3xl">
        <img src={focustapLogo} alt="FocusTap" className="h-40 w-auto mx-auto rounded-lg " />
        <p className="text-xl md:text-2xl text-muted-foreground font-medium">
          NFC-Powered Classroom Engagement & Attendance
        </p>
        <div className="pt-4 text-sm text-muted-foreground">
          Board of Directors Presentation · March 2026
        </div>
      </div>
    </SlideWrapper>,

  // Slide 1 — The Problem
  <SlideWrapper key={1}>
      <div className="max-w-4xl w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">The Problem</h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">
            📋 Faculty Survey · Flagler College · Feb 2026
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
            <p className="text-5xl font-black text-destructive">78.5%</p>
            <p className="text-sm font-semibold text-destructive/90">Engagement Is a Crisis</p>
            <p className="text-xs text-muted-foreground">of faculty say student engagement is a significant or minor issue in their classrooms</p>
          </div>
          <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
            <p className="text-5xl font-black text-destructive">85.7%</p>
            <p className="text-sm font-semibold text-destructive/90">Phones Dominate</p>
            <p className="text-xs text-muted-foreground">say phones are the #1 or a major distraction — above all other factors</p>
          </div>
          <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
            <p className="text-5xl font-black text-destructive">100%</p>
            <p className="text-sm font-semibold text-destructive/90">Participation = Outcomes</p>
            <p className="text-xs text-muted-foreground">of faculty agree students benefit from more active participation — 78.6% strongly agree</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-muted/50 border border-border space-y-3">
          <p className="text-sm font-semibold text-foreground">Why existing solutions fail</p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { issue: "Manual attendance", detail: "Paper sign-ins are slow, inaccurate, and easy to fake — faculty waste 5–10 min per class" },
              { issue: "No focus visibility", detail: "Faculty have zero data on whether students are actually engaged or just present" },
              { issue: "App fatigue", detail: "Existing classroom tools are clunky, hard to use, and don't integrate with the LMS — students abandon them fast" },
              { issue: "No LMS connection", detail: "Participation data lives in silos — never reaches the gradebook where it matters" },
            ].map((f) => (
              <div key={f.issue} className="flex gap-2 items-start">
                <span className="text-destructive font-bold shrink-0 mt-0.5">✗</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{f.issue}</p>
                  <p className="text-xs text-muted-foreground">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideWrapper>,

  // Slide 2 — The Solution (What Is FocusTap?)
  <SlideWrapper key="solution">
      <div className="max-w-4xl w-full space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">The Solution: FocusTap</h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          A <span className="font-semibold text-foreground">dedicated mobile app</span> that turns phones from a distraction into an engagement tool. Students download FocusTap, tap an NFC tag to check in, track focus, and take notes — all in one place. Faculty get real-time data synced straight to Canvas.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">For Students</p>
            {[
              { icon: "📱", title: "NFC Tap-In", desc: "Download the app, tap phone on desk tag — instant check-in and session launch" },
              { icon: "📊", title: "Live Focus Score", desc: "Browser visibility API tracks on-task time in real time — students see their own score" },
              { icon: "📝", title: "Built-In Notes", desc: "Rich text editor saved to their account per course — accessible anytime" },
              { icon: "📈", title: "Personal Insights", desc: "Session history, focus trends, and course performance — all in one dashboard" },
            ].map((f) => (
              <div key={f.title} className="flex gap-3 items-start p-3 rounded-lg bg-muted/50">
                <span className="text-xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">For Faculty</p>
            {[
              { icon: "✅", title: "Auto Attendance", desc: "NFC tap = verified check-in. No paper, no manual entry, no buddy-signing" },
              { icon: "🎯", title: "Participation Grades", desc: "Focus scores translate directly into gradeable participation metrics" },
              { icon: "🔗", title: "Canvas LMS Sync", desc: "Attendance & focus data auto-push to Canvas gradebook via LTI integration" },
              { icon: "📋", title: "Class Analytics", desc: "Real-time dashboard showing who's present, focused, and falling behind" },
            ].map((f) => (
              <div key={f.title} className="flex gap-3 items-start p-3 rounded-lg bg-muted/50">
                <span className="text-xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { val: "1", label: "App to download" },
            { val: "<3s", label: "Check-in time" },
            { val: "NFC", label: "Tap to join" },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-2xl font-bold text-primary">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </SlideWrapper>,

  // Slide 2 — Revenue Forecast Graph
  <SlideWrapper key={2}>
      <div className="max-w-4xl w-full space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">3-Year Revenue Forecast</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-2">
          {annualData.map((y) =>
        <div key={y.year} className="p-4 rounded-xl border border-border bg-card text-center">
              <p className="text-sm font-medium text-muted-foreground">{y.year}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(y.revenue)}</p>
              <p className="text-xs text-muted-foreground">{y.institutions} institutions · {y.students.toLocaleString()} students</p>
            </div>
        )}
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="subscriptionRevenue" name="SaaS Subscription" stackId="rev" fill="hsl(217, 91%, 60%)" />
              <Bar dataKey="hardwareRevenue" name="NFC Hardware" stackId="rev" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              <Area type="monotone" dataKey="grossProfit" name="Gross Profit" fill="hsl(160, 84%, 39%, 0.15)" stroke="hsl(160, 84%, 39%)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SlideWrapper>,

  // Slide 3 — Go-to-Market Revenue Strategy
  <SlideWrapper key={3}>
      <div className="max-w-4xl w-full space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">How We Scale: Data-Driven Sales</h2>

        {/* GTM timeline */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Year 1 · 2026</p>
            <p className="text-lg font-bold text-foreground">Free Pilot at Flagler</p>
            <p className="text-xs text-muted-foreground">Deploy NFC tags campus-wide. Collect engagement, attendance, and focus data across 1,000+ students. Institution pays implementation fee only — zero subscription cost.</p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Year 2 · 2027</p>
            <p className="text-lg font-bold text-foreground">Sell with Proof</p>
            <p className="text-xs text-muted-foreground">Use Flagler case study — verified engagement lift, attendance accuracy, and faculty satisfaction — to close 2–4 paid institutions via direct B2B outreach to deans & provosts.</p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Year 3 · 2028</p>
            <p className="text-lg font-bold text-foreground">Expand & Compound</p>
            <p className="text-xs text-muted-foreground">Leverage multi-campus success stories. Target 15 institutions via conference demos, referral incentives, and published outcome data. Each school becomes a reference customer.</p>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="subscriptionRevenue" name="SaaS Subscription" stackId="rev" fill="hsl(var(--primary))" />
              <Bar dataKey="hardwareRevenue" name="NFC Hardware" stackId="rev" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SlideWrapper>,

  // Slide 4 — Unit Economics
  <SlideWrapper key={4}>
      <div className="max-w-4xl w-full space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Unit Economics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
        { label: "Price/Student/Yr", value: "$50" },
        { label: "ARR/Institution", value: formatCurrency(defaultAssumptions.studentsPerInstitution * 50) },
        { label: "HW Margin/Tag", value: formatCurrency(defaultAssumptions.nfcTagPrice - defaultAssumptions.nfcTagCost) },
        { label: "Gross Margin", value: formatPercent(lastQ.grossMargin) }].
        map((m) =>
        <div key={m.label} className="p-5 rounded-xl border border-border bg-card text-center">
              <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
              <p className="text-3xl font-bold text-primary mt-2">{m.value}</p>
            </div>
        )}
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <Tooltip />
              <Area type="monotone" dataKey="studentsDeployed" name="Students Deployed" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SlideWrapper>,

  // Slide 5 — The Ask
  <SlideWrapper key={5}>
      <div className="max-w-3xl w-full text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">The Ask</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border-2 border-primary/30 bg-primary/5">
            <p className="text-4xl font-bold text-primary">{formatCurrency(computeNINVTotal(defaultAssumptions.ninv))}</p>
            <p className="text-lg text-muted-foreground mt-2">Net Initial Investment</p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card">
            <p className="text-4xl font-bold text-foreground">{formatCurrency(computeAnnualOpexTotal(defaultAssumptions.annualOpex))}/yr</p>
            <p className="text-lg text-muted-foreground mt-2">Year 1 Operating Costs</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-left">
          {[
        { pct: "67%", label: "Product & Engineering", desc: "MVP analytics platform, NFC integration, LMS connectors" },
        { pct: "23%", label: "Sales & Marketing", desc: "University partnerships, pilot programs, B2B outreach" },
        { pct: "10%", label: "Operations", desc: "NFC hardware supply chain, legal, infrastructure" }].
        map((u) =>
        <div key={u.label} className="p-4 rounded-xl border border-border bg-card">
              <p className="text-2xl font-bold text-primary">{u.pct}</p>
              <p className="font-semibold text-sm mt-1">{u.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{u.desc}</p>
            </div>
        )}
        </div>
        <p className="text-lg font-semibold text-foreground pt-4">
          Target: {formatCurrency(totalRevY3)} rev by FY 2028 · {lastQ.institutions} institutions · Break-even within 18–24 months
        </p>
      </div>
    </SlideWrapper>];


  return (
    <div className={`min-h-screen bg-background flex flex-col ${fullscreen ? "fixed inset-0 z-[100]" : ""}`}>
      {!fullscreen &&
      <div className="border-b bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between h-12 px-4">
            <Link to="/financials" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" /> Back to Model
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {slide + 1} / {TOTAL_SLIDES}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      }

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full max-w-6xl mx-auto">

            {slides[slide]}
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
          <Button variant="outline" size="icon" onClick={prev} disabled={slide === 0} className="h-10 w-10 rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={next} disabled={slide === TOTAL_SLIDES - 1} className="h-10 w-10 rounded-full">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {fullscreen &&
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8" onClick={toggleFullscreen}>
            <Minimize2 className="w-4 h-4" />
          </Button>
        }
      </div>

      <div className="flex justify-center gap-1.5 pb-4">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) =>
        <button
          key={i}
          onClick={() => setSlide(i)}
          className={`w-2 h-2 rounded-full transition-colors ${i === slide ? "bg-primary" : "bg-border"}`} />

        )}
      </div>
    </div>);

}