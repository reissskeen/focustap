import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, Maximize2, Minimize2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from
"recharts";
import { defaultAssumptions, generateForecast, formatCurrency, formatPercent, computeNINVTotal, computeAnnualOpexTotal } from "@/lib/financialData";

const TOTAL_SLIDES = 6;

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
    ebitda: d.ebitda,
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
      ebitda: qs.reduce((s, d) => s + d.ebitda, 0),
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
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <Zap className="w-9 h-9 text-primary-foreground" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">FocusTap</h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-medium">
          NFC-Powered Classroom Engagement & Attendance
        </p>
        <div className="pt-4 text-sm text-muted-foreground">
          Board of Directors Presentation · March 2026
        </div>
      </div>
    </SlideWrapper>,

  // Slide 1 — Problem & Solution
  <SlideWrapper key={1}>
      <div className="max-w-4xl w-full space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">The Problem</h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">
            📋 Faculty Survey · n=14 · Flagler College · Feb 2026
          </span>
        </div>

        {/* Three stat cards from primary research */}
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

        {/* Solution row */}
        <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm font-semibold text-primary mb-3">FocusTap addresses all three — without asking students to install anything</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "Desk-level NFC tap — instant, verified attendance",
              "Real-time focus tracking via browser visibility API",
              "Free pilot at Flagler — implementation fee covers costs",
              "Proven data → sell school-to-school"
            ].map((item) =>
              <div key={item} className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-primary font-bold shrink-0">✓</span>
                <span>{item}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </SlideWrapper>,

  // Slide 2 — Market Opportunity
  <SlideWrapper key={2}>
      <div className="max-w-4xl w-full space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Market Opportunity</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
        { label: "TAM", value: "$12B", desc: "Global EdTech market for higher education" },
        { label: "SAM", value: "$2.4B", desc: "US & Canada classroom engagement tools" },
        { label: "SOM", value: "$120M", desc: "Achievable in 5 years with current strategy" }].
        map((m) =>
        <div key={m.label} className="p-6 rounded-xl border border-border bg-card text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{m.label}</p>
              <p className="text-4xl font-bold text-primary mt-2">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-2">{m.desc}</p>
            </div>
        )}
        </div>
      </div>
    </SlideWrapper>,

  // Slide 3 — Revenue Forecast
  <SlideWrapper key={3}>
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
        <div className="h-64">
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
        { label: "Tier 2/Student/Yr", value: "$30" },
        { label: "ARR/Institution", value: formatCurrency(defaultAssumptions.studentsPerInstitution * 30) },
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