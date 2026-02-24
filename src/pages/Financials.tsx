import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Presentation, DollarSign, Wallet, Target, TrendingUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  defaultAssumptions, generateForecast, formatCurrency, formatPercent,
  computeNINVTotal, computeAnnualOpexTotal, computeBreakEven,
  type Assumptions,
} from "@/lib/financialData";
import {
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Legend,
} from "recharts";
import Navbar from "@/components/Navbar";

const STORAGE_KEY = "focustap-assumptions";

function loadAssumptions(): Assumptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultAssumptions, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultAssumptions };
}

function saveAssumptions(a: Assumptions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
}

export default function Financials() {
  const [assumptions, setAssumptions] = useState<Assumptions>(loadAssumptions);

  useEffect(() => { saveAssumptions(assumptions); }, [assumptions]);

  const forecast = useMemo(() => generateForecast(assumptions), [assumptions]);
  const ninvTotal = useMemo(() => computeNINVTotal(assumptions.ninv), [assumptions.ninv]);
  const annualOpexTotal = useMemo(() => computeAnnualOpexTotal(assumptions.annualOpex), [assumptions.annualOpex]);
  const breakEven = useMemo(() => computeBreakEven(forecast, ninvTotal), [forecast, ninvTotal]);
  const lastQ = forecast[forecast.length - 1];

  // Chart data — first 12 quarters (3 years)
  const chartData = useMemo(() =>
    forecast.slice(0, 12).map((q) => ({
      name: `${q.year.replace("FY ", "")}\n${q.quarter}`,
      Revenue: q.totalRevenue,
      EBITDA: q.ebitda,
      "Gross Profit": q.grossProfit,
    })),
    [forecast],
  );

  const update = useCallback((path: string, value: number) => {
    setAssumptions((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj: any = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const reset = () => {
    setAssumptions({ ...defaultAssumptions });
    localStorage.removeItem(STORAGE_KEY);
  };

  const metrics = [
    { label: "NINV", sublabel: "Net Initial Investment", value: formatCurrency(ninvTotal), detail: "One-time capital to launch", icon: Wallet },
    { label: "OPEX", sublabel: "Annual Operating Costs", value: formatCurrency(annualOpexTotal), detail: `Year 1 · grows ${(assumptions.opexGrowthRate * 100).toFixed(0)}%/yr`, icon: DollarSign },
    { label: "Break-Even", sublabel: "Full Investment Recovery", value: breakEven.fullBreakEvenQ || "N/A", detail: breakEven.monthsToFull ? `~${breakEven.monthsToFull} months` : "Cumulative profit ≥ NINV", icon: Target },
    { label: "Gross Margin", sublabel: "At Scale", value: formatPercent(lastQ.grossMargin), detail: `EBITDA margin: ${formatPercent(lastQ.ebitdaMargin)}`, icon: TrendingUp },
  ];

  const assumptionFields: { label: string; path: string; value: number; prefix?: string; suffix?: string; step?: number }[] = [
    { label: "Price / Student / Year", path: "nfcTagPrice", value: assumptions.nfcTagPrice, prefix: "$", step: 0.5 },
    { label: "Students / Institution", path: "studentsPerInstitution", value: assumptions.studentsPerInstitution, step: 100 },
    { label: "Initial Rollout %", path: "initialRolloutPercent", value: assumptions.initialRolloutPercent * 100, suffix: "%", step: 5 },
    { label: "Annual Churn Rate", path: "annualChurnRate", value: assumptions.annualChurnRate * 100, suffix: "%", step: 1 },
    { label: "OPEX Growth Rate", path: "opexGrowthRate", value: assumptions.opexGrowthRate * 100, suffix: "%", step: 5 },
    { label: "SaaS COGS %", path: "saasCogsPct", value: assumptions.saasCogsPct * 100, suffix: "%", step: 1 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-5xl px-4 pt-28 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">Financial Model</h1>
          <p className="text-muted-foreground text-lg">Four metrics. One chart. Editable assumptions.</p>
        </motion.div>

        {/* Metric Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <m.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-3xl font-bold text-foreground mb-1">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.sublabel}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{m.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="p-6 mb-14">
            <h2 className="font-display text-lg font-semibold mb-4">Quarterly Forecast (3 Years)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gross Profit" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="EBITDA" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Editable Assumptions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="p-6 mb-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold">Assumptions</h2>
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {assumptionFields.map((f) => (
                <div key={f.path} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{f.label}</Label>
                  <div className="relative">
                    {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{f.prefix}</span>}
                    <Input
                      type="number"
                      step={f.step || 1}
                      value={f.value}
                      onChange={(e) => {
                        let v = parseFloat(e.target.value) || 0;
                        // Convert percentage fields back to decimals
                        if (f.suffix === "%") v = v / 100;
                        update(f.path, v);
                      }}
                      className={`${f.prefix ? "pl-7" : ""} ${f.suffix ? "pr-8" : ""}`}
                    />
                    {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{f.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Nav */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="flex items-center justify-center gap-4">
          <Link to="/pitch-deck">
            <Button size="lg" className="gap-2"><Presentation className="w-4 h-4" /> Pitch Deck</Button>
          </Link>
          <Link to="/">
            <Button size="lg" variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Home</Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
