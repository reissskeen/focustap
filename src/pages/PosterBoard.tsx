import focustapLogo from "@/assets/focustap-logo.png";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { loadAssumptions, generateForecast, formatCurrency } from "@/lib/financialData";

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <h3 className="text-lg font-bold text-primary uppercase tracking-wider mb-3 border-b border-border pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function PosterBoard() {
  const forecast = useMemo(() => generateForecast(loadAssumptions()), []);
  const annualData = ["FY 2026", "FY 2027", "FY 2028"].map((y) => {
    const qs = forecast.filter((d) => d.year === y);
    return {
      year: y.replace("FY ", ""),
      revenue: qs.reduce((s, d) => s + d.totalRevenue, 0),
      institutions: qs[qs.length - 1].institutions,
    };
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <img src={focustapLogo} alt="FocusTap" className="h-24 w-auto mx-auto rounded-lg" />
          <p className="text-sm text-muted-foreground font-medium">
            Web & Mobile App · NFC-Powered Focus Tracking, Attendance & Canvas Gradebook Integration
          </p>
        </div>

        {/* 3-Column Tri-fold Layout */}
        <div className="grid md:grid-cols-3 gap-5">

          {/* LEFT COLUMN */}
          <div className="space-y-5">
            <Section title="The Problem">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { stat: "78.5%", text: "say engagement is a crisis", icon: "🚨" },
                  { stat: "85.7%", text: "cite phones as #1 distraction", icon: "📱" },
                  { stat: "100%", text: "agree participation matters", icon: "✅" },
                  { stat: "0", text: "tools work without app installs", icon: "❌" },
                ].map((p) => (
                  <div key={p.text} className="relative overflow-hidden rounded-xl bg-destructive/5 border border-destructive/15 p-3 text-center space-y-1">
                    <span className="text-xl">{p.icon}</span>
                    <p className="text-xl font-black text-destructive leading-none">{p.stat}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{p.text}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="How It Works">
              <div className="space-y-3">
                {[
                  { step: "1", label: "Tap In", desc: "Student taps phone on desk NFC tag — opens the app instantly, no download needed" },
                  { step: "2", label: "Login & Track", desc: "Students sign in to their personal account to track focus scores & session history" },
                  { step: "3", label: "Stay Focused", desc: "Browser visibility API tracks on-task time — focus score updates in real time" },
                  { step: "4", label: "Take Notes", desc: "Built-in rich text editor — notes saved to student's account per course" },
                  { step: "5", label: "Sync to Canvas", desc: "Attendance & participation auto-sync to Canvas gradebook for faculty grading" },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3 items-start">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                      {s.step}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="FAQ">
              <div className="space-y-2">
                {[
                  { q: "Do students need to download an app?", a: "No — it's a web app that works on any phone browser. Also installable as a PWA." },
                  { q: "How does Canvas integration work?", a: "Focus scores & attendance sync directly to Canvas gradebook via LTI." },
                  { q: "Is student data private?", a: "Yes — each student has their own secure account. FERPA-compliant." },
                ].map((f) => (
                  <div key={f.q} className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-xs font-semibold text-foreground">{f.q}</p>
                    <p className="text-xs text-muted-foreground">{f.a}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* CENTER COLUMN */}
          <div className="space-y-5">
            <Section title="What Is FocusTap?">
              <p className="text-sm text-muted-foreground leading-relaxed">
                FocusTap is a <span className="font-semibold text-foreground">web & mobile app</span> that lets students 
                check in via NFC, track their focus score, and take notes — all from their browser. Student data is stored 
                securely so they can <span className="font-semibold text-foreground">log in anytime</span> to view focus 
                insights, session history, and course performance.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                For faculty, FocusTap integrates with <span className="font-semibold text-foreground">Canvas LMS</span> to 
                automatically sync attendance, participation, and focus data — making it easy to grade engagement without 
                manual tracking.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { val: "0", label: "Apps to install" },
                  { val: "<3s", label: "Check-in time" },
                  { val: "100%", label: "Browser-based" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-lg font-bold text-primary">{s.val}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Student Experience">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "📱", label: "NFC Tap-In", desc: "Instant check-in at your desk" },
                  { icon: "📊", label: "Focus Score", desc: "Track your on-task time per class" },
                  { icon: "📝", label: "Notes", desc: "Rich editor saved to your account" },
                  { icon: "📈", label: "Insights", desc: "View trends & session history" },
                ].map((h) => (
                  <div key={h.label} className="p-3 rounded-lg bg-muted/50 text-center">
                    <span className="text-2xl">{h.icon}</span>
                    <p className="text-xs font-semibold text-foreground mt-1">{h.label}</p>
                    <p className="text-[10px] text-muted-foreground">{h.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Faculty Experience">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "✅", label: "Attendance", desc: "Auto-logged via NFC tap" },
                  { icon: "🎯", label: "Participation", desc: "Focus scores as grades" },
                  { icon: "🔗", label: "Canvas Sync", desc: "Grades push to gradebook" },
                  { icon: "📋", label: "Dashboards", desc: "Real-time class analytics" },
                ].map((h) => (
                  <div key={h.label} className="p-3 rounded-lg bg-muted/50 text-center">
                    <span className="text-2xl">{h.icon}</span>
                    <p className="text-xs font-semibold text-foreground mt-1">{h.label}</p>
                    <p className="text-[10px] text-muted-foreground">{h.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Faculty Survey · Flagler College">
              <p className="text-xs text-muted-foreground mb-2">Feb 2026 · 14 faculty respondents</p>
              <div className="space-y-2">
                {[
                  { pct: "78.5%", label: "say engagement is a crisis" },
                  { pct: "85.7%", label: "identify phones as top distraction" },
                  { pct: "100%", label: "agree participation improves outcomes" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-lg font-black text-destructive w-16 text-right">{s.pct}</span>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            <Section title="Financials">
              <div className="space-y-2 mb-3">
                {annualData.map((y) => (
                  <div key={y.year} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{y.year}</span>
                    <span className="font-bold text-foreground">{formatCurrency(y.revenue)}</span>
                    <span className="text-xs text-muted-foreground">{y.institutions} schools</span>
                  </div>
                ))}
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={annualData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 9 }} className="fill-muted-foreground" />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(207, 70%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section title="Future Growth">
              <div className="space-y-3">
                {[
                  { yr: "Y1", label: "Pilot at Flagler", desc: "1,000+ students, collect focus & attendance data as proof" },
                  { yr: "Y2", label: "Sell with Data", desc: "Use case study to close 2–4 paid institutions via B2B" },
                  { yr: "Y3", label: "Scale Nationally", desc: "15 institutions via conferences, referrals & published outcomes" },
                ].map((g) => (
                  <div key={g.yr} className="flex gap-3 items-start">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                      {g.yr}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{g.label}</p>
                      <p className="text-xs text-muted-foreground">{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="SWOT">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Strengths", color: "bg-green-500/10 text-green-700 dark:text-green-400", items: "Zero-install, stored student data, Canvas integration, real faculty data" },
                  { label: "Weaknesses", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", items: "Early stage, single pilot site, small team" },
                  { label: "Opportunities", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", items: "4,000+ US colleges, LMS partnerships, edtech consolidation" },
                  { label: "Threats", color: "bg-red-500/10 text-red-700 dark:text-red-400", items: "LMS incumbents, school budget cycles, adoption resistance" },
                ].map((s) => (
                  <div key={s.label} className={`p-3 rounded-lg ${s.color}`}>
                    <p className="text-xs font-bold">{s.label}</p>
                    <p className="text-[10px] mt-1 opacity-80">{s.items}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
          FocusTap · Saints Showcase · March 2026 · focustap.com
        </div>
      </div>
    </div>
  );
}
