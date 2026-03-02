import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, Maximize2, Minimize2 } from "lucide-react";
import focustapLogo from "@/assets/focustap-logo.png";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from
"recharts";
import { defaultAssumptions, generateForecast, formatCurrency, formatPercent, computeNINVTotal, computeAnnualOpexTotal, type Assumptions } from "@/lib/financialData";
import { loadAssumptionsFromDB } from "@/hooks/useFinancialAssumptions";

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
  const [loadedAssumptions, setLoadedAssumptions] = useState<Assumptions>(defaultAssumptions);

  // Load assumptions from DB on mount and on focus
  useEffect(() => {
    const load = () => loadAssumptionsFromDB().then(setLoadedAssumptions);
    load();
    const focusHandler = () => load();
    window.addEventListener("focus", focusHandler);
    return () => window.removeEventListener("focus", focusHandler);
  }, []);

  const forecast = useMemo(() => generateForecast(loadedAssumptions), [loadedAssumptions]);
  const chartData = forecast.map((d) => ({
    label: `${d.year.replace("FY ", "'")} ${d.quarter}`,
    totalRevenue: d.totalRevenue,
    subscriptionRevenue: d.subscriptionRevenue,
    hardwareRevenue: d.hardwareRevenue,
    implementationRevenue: d.implementationRevenue,
    expansionRevenue: d.expansionRevenue,
    grossProfit: d.grossProfit,
    netIncome: d.netIncome,
    studentsDeployed: d.studentsDeployed,
    institutions: d.institutions
  }));

  const lastQ = forecast[forecast.length - 1];
  const allYears = [...new Set(forecast.filter((d) => ["FY 2026", "FY 2027", "FY 2028"].includes(d.year)).map((d) => d.year))];
  const annualData = allYears.map((y) => {
    const qs = forecast.filter((d) => d.year === y);
    return {
      year: y,
      revenue: qs.reduce((s, d) => s + d.totalRevenue, 0),
      saas: qs.reduce((s, d) => s + d.subscriptionRevenue, 0),
      hw: qs.reduce((s, d) => s + d.hardwareRevenue, 0),
      impl: qs.reduce((s, d) => s + d.implementationRevenue, 0),
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
          Browser-Based Classroom Engagement & Attendance
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
          { issue: "App fatigue", detail: "Tools that require downloads create friction — students won't install yet another app, and adoption drops fast" },
          { issue: "No LMS connection", detail: "Participation data lives in silos — never reaches the gradebook where it matters" }].
          map((f) =>
          <div key={f.issue} className="flex gap-2 items-start">
                <span className="text-destructive font-bold shrink-0 mt-0.5">✗</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{f.issue}</p>
                  <p className="text-xs text-muted-foreground">{f.detail}</p>
                </div>
              </div>
          )}
          </div>
        </div>
      </div>
    </SlideWrapper>,

  // Slide 2 — The Research
  <SlideWrapper key="research">
      <div className="max-w-4xl w-full space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">The Research Is Clear</h2>
        <p className="text-sm text-muted-foreground">Peer-reviewed studies paint a consistent picture: phones destroy focus and tank grades.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { stat: "23 min", label: "to refocus after a single distraction", source: "University of California Irvine" },
            { stat: "95%", label: "of teens own a smartphone", source: "Pew Research Center" },
            { stat: "90%+", label: "of students use phones in lectures for non-academic purposes", source: "Junco, 2012; McCoy, 2016" },
            { stat: "5–8 min", label: "average interval between phone checks during lectures", source: "Classroom observation studies" },
          ].map((d) => (
            <div key={d.stat} className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-1.5">
              <p className="text-3xl md:text-4xl font-black text-destructive">{d.stat}</p>
              <p className="text-xs font-medium text-foreground leading-tight">{d.label}</p>
              <p className="text-[10px] text-muted-foreground italic">{d.source}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-muted/50 border border-border space-y-3">
            <p className="text-sm font-semibold text-foreground">Impact on Grades</p>
            <div className="space-y-2.5">
              {[
                { fact: "0.36 GPA points lower", detail: "for heavy in-class phone multitaskers", ref: "Junco, 2012" },
                { fact: "30–35% lower test scores", detail: "on material covered while texting or browsing", ref: "Sana et al., 2013" },
                { fact: "3.52× phone checks/hour", detail: "negatively correlated with academic performance", ref: "Joshi et al., 2022" },
              ].map((f) => (
                <div key={f.fact} className="flex gap-2 items-start">
                  <span className="text-destructive font-bold shrink-0 mt-0.5">↓</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{f.fact}</p>
                    <p className="text-[11px] text-muted-foreground">{f.detail} <span className="italic">({f.ref})</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
            <p className="text-sm font-semibold text-foreground">What Happens When Phones Are Managed</p>
            <div className="space-y-2.5">
              {[
                { fact: "6.3% test score increase", detail: "overall when schools banned phones", ref: "Beland & Murphy, 2016 — LSE" },
                { fact: "14% increase", detail: "for low-performing students specifically", ref: "Beland & Murphy, 2016 — LSE" },
                { fact: "72% of HS teachers", detail: "say cellphone distraction is a major classroom problem", ref: "Pew Research, 2024" },
                { fact: "53% of school leaders", detail: "report negative impacts on academic performance & mental health", ref: "National survey data" },
              ].map((f) => (
                <div key={f.fact} className="flex gap-2 items-start">
                  <span className="text-primary font-bold shrink-0 mt-0.5">↑</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{f.fact}</p>
                    <p className="text-[11px] text-muted-foreground">{f.detail} <span className="italic">({f.ref})</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>,

  // Slide 3 — The Solution (What Is FocusTap?)
  <SlideWrapper key="solution">
      <div className="max-w-4xl w-full space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">The Solution: FocusTap</h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          A <span className="font-semibold text-foreground">browser-based web app</span> that turns devices from a distraction into an engagement tool. Students open FocusTap on any phone, laptop, or iPad — tap an NFC tag to check in, track focus, and take notes — all in one place. Faculty get real-time data synced straight to Canvas.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">For Students</p>
            {[
          { icon: "📱", title: "NFC Tap-In", desc: "Open the web app on any device, tap phone on desk tag — instant check-in and session launch" },
          { icon: "📊", title: "Live Focus Score", desc: "Browser visibility API tracks on-task time in real time — students see their own score" },
          { icon: "📝", title: "Built-In Notes", desc: "Rich text editor saved to their account per course — accessible anytime" },
          { icon: "📈", title: "Personal Insights", desc: "Session history, focus trends, and course performance — all in one dashboard" }].
          map((f) =>
          <div key={f.title} className="flex gap-3 items-start p-3 rounded-lg bg-muted/50">
                <span className="text-xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
          )}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">For Faculty</p>
            {[
          { icon: "✅", title: "Auto Attendance", desc: "NFC tap = verified check-in. No paper, no manual entry, no buddy-signing" },
          { icon: "🎯", title: "Participation Grades", desc: "Focus scores translate directly into gradeable participation metrics" },
          { icon: "🔗", title: "Canvas LMS Sync", desc: "Attendance & focus data auto-push to Canvas gradebook via LTI integration" },
          { icon: "📋", title: "Class Analytics", desc: "Real-time dashboard showing who's present, focused, and falling behind" }].
          map((f) =>
          <div key={f.title} className="flex gap-3 items-start p-3 rounded-lg bg-muted/50">
                <span className="text-xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
          )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
        { val: "0", label: "Downloads needed" },
        { val: "<3s", label: "Check-in time" },
        { val: "Any", label: "Device works" }].
        map((s) =>
        <div key={s.label} className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-2xl font-bold text-primary">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
        )}
        </div>
      </div>
    </SlideWrapper>,

  // Slide 2 — Revenue Forecast Graph
  <SlideWrapper key={2}>
      <div className="max-w-4xl w-full space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">3-Year Revenue Forecast</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-2">
          {annualData.map((y) =>
        <div key={y.year} className="p-4 rounded-xl border border-border bg-card space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{y.year}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(y.revenue)}</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>SaaS: {formatCurrency(y.saas)} · HW: {formatCurrency(y.hw)} · Impl: {formatCurrency(y.impl)}</p>
                <p>{y.institutions} institutions · {y.students.toLocaleString()} students</p>
                <p>Net Income: <span className={y.netIncome >= 0 ? "text-primary" : "text-destructive"}>{formatCurrency(y.netIncome)}</span></p>
              </div>
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
              <Bar dataKey="subscriptionRevenue" name="SaaS Subscription" stackId="rev" fill="#3b82f6" />
              <Bar dataKey="implementationRevenue" name="Impl. Fees" stackId="rev" fill="#10b981" />
              <Bar dataKey="hardwareRevenue" name="NFC Hardware" stackId="rev" fill="#f59e0b" />
              <Bar dataKey="expansionRevenue" name="Expansion" stackId="rev" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SlideWrapper>,

  // Slide 4 — Funding Strategy
  <SlideWrapper key={3}>
      <div className="max-w-4xl w-full space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Funding Strategy</h2>
        <p className="text-base text-muted-foreground max-w-2xl">
          A capital-efficient path from bootstrapped launch to grant-funded growth — minimizing dilution while maximizing proof.
        </p>

        {/* Funding timeline */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Phase 1 · Now</p>
            <p className="text-lg font-bold text-foreground">                  Small Grants + Angel Investments   </p>
            <p className="text-xs text-muted-foreground">Self-funded development using founder capital and sweat equity. Minimal burn — browser-based architecture means no hardware R&D costs upfront. Goal: ship MVP and launch the Flagler pilot.</p>
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-foreground">Target: $0 raised</p>
              <p className="text-[11px] text-muted-foreground">0% dilution · Founder-funded</p>
            </div>
          </div>
          <div className="p-5 rounded-xl border-2 border-green-500/30 bg-green-500/5 space-y-2">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Phase 2 · Post-Pilot</p>
            <p className="text-lg font-bold text-foreground">Grant Funding</p>
            <p className="text-xs text-muted-foreground">Apply for the <span className="font-semibold">Call for Effective Technology (CET) Grant</span> — $150K–$250K for AI-driven edtech tested with real students. Flagler pilot data is the proof. Also pursue NSF SBIR/STTR and state education innovation grants.</p>
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-foreground">Target: $150K–$250K</p>
              <p className="text-[11px] text-muted-foreground">0% dilution · Non-dilutive capital</p>
            </div>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Phase 3 · Profitable Growth</p>
             <p className="text-lg font-bold text-foreground">Strategic Equity + Growth Capital</p>
             <p className="text-xs text-muted-foreground">Post-pilot, FocusTap is profitable with recurring SaaS revenue. To accelerate national expansion, we pursue a combination of strategic equity placement (5–10% to an edtech-aligned partner) and venture debt — preserving founder control while funding sales infrastructure and enterprise onboarding.</p>
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-foreground">Target: $300K–$500K total</p>
              <p className="text-[11px] text-muted-foreground">≤10% dilution · Grant-heavy mix</p>
            </div>
          </div>
        </div>

        {/* Grant pipeline */}
        <div className="p-5 rounded-xl bg-muted/50 border border-border space-y-3">
          <p className="text-sm font-semibold text-foreground">Grant Pipeline</p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
          { name: "CET Grant", amount: "$150K–$250K", fit: "Primary target — FocusTap is classroom-tested edtech, a perfect fit" },
          { name: "NSF SBIR Phase I", amount: "$275K", fit: "NSF backing adds credibility; supports software/edtech innovation" },
          { name: "University Innovation Funds", amount: "$10K–$50K", fit: "Many universities offer internal grants for technology improving student outcomes" },
          { name: "State Education Grants", amount: "$25K–$100K", fit: "State-level programs funding technology adoption in higher education" }].
          map((g) =>
          <div key={g.name} className="flex gap-2 items-start">
                <span className="text-green-600 dark:text-green-400 font-bold shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{g.name} <span className="text-muted-foreground font-normal">· {g.amount}</span></p>
                  <p className="text-xs text-muted-foreground">{g.fit}</p>
                </div>
              </div>
          )}
          </div>
        </div>

        {/* Key principle */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-sm font-semibold text-foreground">Capital Philosophy</p>
            <p className="text-xs text-muted-foreground">Maximize non-dilutive funding first. Give away minimal equity only to strategic partners who accelerate distribution. Grants are the primary engine — real classroom data is our competitive advantage in every application.</p>
          </div>
        </div>
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