import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Presentation, DollarSign, Wallet, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  defaultAssumptions, generateForecast, formatCurrency, formatPercent,
  computeNINVTotal, computeAnnualOpexTotal, computeBreakEven,
} from "@/lib/financialData";
import Navbar from "@/components/Navbar";

export default function Financials() {
  const assumptions = defaultAssumptions;
  const forecast = useMemo(() => generateForecast(assumptions), [assumptions]);
  const ninvTotal = useMemo(() => computeNINVTotal(assumptions.ninv), [assumptions.ninv]);
  const annualOpexTotal = useMemo(() => computeAnnualOpexTotal(assumptions.annualOpex), [assumptions.annualOpex]);
  const breakEven = useMemo(() => computeBreakEven(forecast, ninvTotal), [forecast, ninvTotal]);
  const lastQ = forecast[forecast.length - 1];

  const metrics = [
    {
      label: "NINV",
      sublabel: "Net Initial Investment",
      value: formatCurrency(ninvTotal),
      detail: "One-time capital to launch",
      icon: Wallet,
    },
    {
      label: "OPEX",
      sublabel: "Annual Operating Costs",
      value: formatCurrency(annualOpexTotal),
      detail: "Year 1 · grows 30%/yr",
      icon: DollarSign,
    },
    {
      label: "Break-Even",
      sublabel: "Full Investment Recovery",
      value: breakEven.fullBreakEvenQ || "N/A",
      detail: breakEven.monthsToFull ? `~${breakEven.monthsToFull} months` : "Cumulative profit ≥ NINV",
      icon: Target,
    },
    {
      label: "Gross Margin",
      sublabel: "At Scale",
      value: formatPercent(lastQ.grossMargin),
      detail: `EBITDA margin: ${formatPercent(lastQ.ebitdaMargin)}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-4xl px-4 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Financial Model
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Four numbers. That's it.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative glass-card rounded-2xl p-8 text-center group hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <m.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                {m.label}
              </p>
              <p className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                {m.value}
              </p>
              <p className="text-sm text-muted-foreground">{m.sublabel}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{m.detail}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-4 mt-14"
        >
          <Link to="/pitch-deck">
            <Button size="lg" className="gap-2">
              <Presentation className="w-4 h-4" /> View Pitch Deck
            </Button>
          </Link>
          <Link to="/">
            <Button size="lg" variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
