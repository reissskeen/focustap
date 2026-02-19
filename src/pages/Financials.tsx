import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Presentation, TrendingUp, DollarSign, Building2, BarChart3, HardDrive, Layers, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import {
  defaultAssumptions, generateForecast, formatCurrency, formatPercent,
  TIERS, computeNINVTotal, computeAnnualOpexTotal, computeBreakEven,
  type Assumptions, type HalfYearAdoption, type AnnualOpex, type NINV,
} from "@/lib/financialData";

const KPICard = ({ title, value, subtitle, icon: Icon, accent }: { title: string; value: string; subtitle: string; icon: any; accent?: boolean }) => (
  <Card className={`border-border/60 ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const TIER_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(210 60% 50%)"];

export default function Financials() {
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const forecast = useMemo(() => generateForecast(assumptions), [assumptions]);

  const ninvTotal = useMemo(() => computeNINVTotal(assumptions.ninv), [assumptions.ninv]);
  const annualOpexTotal = useMemo(() => computeAnnualOpexTotal(assumptions.annualOpex), [assumptions.annualOpex]);
  const breakEven = useMemo(() => computeBreakEven(forecast, ninvTotal), [forecast, ninvTotal]);

  const chartData = forecast.map((d) => ({
    label: `${d.year.replace("FY ", "'")} ${d.quarter}`,
    totalRevenue: d.totalRevenue,
    subscriptionRevenue: d.subscriptionRevenue,
    hardwareRevenue: d.hardwareRevenue,
    implementationRevenue: d.implementationRevenue,
    expansionRevenue: d.expansionRevenue,
    grossProfit: d.grossProfit,
    ebitda: d.ebitda,
    opex: d.opex,
    studentsDeployed: d.studentsDeployed,
    institutions: d.institutions,
    tier1Inst: d.tier1Inst,
    tier2Inst: d.tier2Inst,
    tier3Inst: d.tier3Inst,
    mrr: d.mrr,
    grossMargin: Math.round(d.grossMargin * 100),
    ebitdaMargin: Math.round(d.ebitdaMargin * 100),
    cumulativeProfit: d.cumulativeProfit,
  }));

  const lastQ = forecast[forecast.length - 1];
  const totalRevY3 = forecast.filter(d => d.year === "FY 2028").reduce((s, d) => s + d.totalRevenue, 0);
  const totalImplRev = forecast.reduce((s, d) => s + d.implementationRevenue, 0);
  const totalExpansionRev = forecast.reduce((s, d) => s + d.expansionRevenue, 0);

  const tierPieData = [
    { name: "Tier 1", value: lastQ.tier1Inst },
    { name: "Tier 2", value: lastQ.tier2Inst },
    { name: "Tier 3", value: lastQ.tier3Inst },
  ].filter(d => d.value > 0);

  const updateScalar = (key: "nfcTagCost" | "nfcTagPrice" | "studentsPerInstitution" | "initialRolloutPercent" | "opexGrowthRate" | "annualChurnRate" | "tier1UpgradeRate" | "saasCogsPct" | "pilotFreeInstitutions", value: string) => {
    setAssumptions(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const updateOpex = (key: keyof AnnualOpex, value: string) => {
    setAssumptions(prev => ({ ...prev, annualOpex: { ...prev.annualOpex, [key]: parseFloat(value) || 0 } }));
  };

  const updateNINV = (key: keyof NINV, value: string) => {
    setAssumptions(prev => ({ ...prev, ninv: { ...prev.ninv, [key]: parseFloat(value) || 0 } }));
  };

  const halfKeys = ["h1_2026", "h2_2026", "h1_2027", "h2_2027", "h1_2028", "h2_2028"] as const;
  const halfLabels = ["H1 2026", "H2 2026", "H1 2027", "H2 2027", "H1 2028", "H2 2028"];

  const updateHalfYear = (halfKey: typeof halfKeys[number], tierKey: keyof HalfYearAdoption, value: string) => {
    setAssumptions(prev => ({
      ...prev,
      [halfKey]: { ...prev[halfKey], [tierKey]: parseInt(value) || 0 },
    }));
  };

  // Annual summary
  const annualSummary = ["FY 2026", "FY 2027", "FY 2028"].map(yr => {
    const qs = forecast.filter(d => d.year === yr);
    return {
      year: yr,
      revenue: qs.reduce((s, d) => s + d.totalRevenue, 0),
      saas: qs.reduce((s, d) => s + d.subscriptionRevenue, 0),
      hw: qs.reduce((s, d) => s + d.hardwareRevenue, 0),
      impl: qs.reduce((s, d) => s + d.implementationRevenue, 0),
      opex: qs.reduce((s, d) => s + d.opex, 0),
      grossProfit: qs.reduce((s, d) => s + d.grossProfit, 0),
      ebitda: qs.reduce((s, d) => s + d.ebitda, 0),
      institutions: qs[qs.length - 1].institutions,
      students: qs[qs.length - 1].studentsDeployed,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">FocusTap Financial Model</h1>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Enterprise B2B SaaS · March 2026
            </span>
          </div>
          <Link to="/pitch-deck">
            <Button size="sm" className="gap-1.5">
              <Presentation className="w-4 h-4" /> Present
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4"
        >
          <KPICard title="NINV" value={formatCurrency(ninvTotal)} subtitle="One-time investment" icon={Wallet} />
          <KPICard title="Annual OPEX" value={formatCurrency(annualOpexTotal)} subtitle="Year 1 operating costs" icon={HardDrive} />
          <KPICard title="ARR (Year 3)" value={formatCurrency(lastQ.arr)} subtitle={`${lastQ.institutions} institutions`} icon={DollarSign} />
          <KPICard title="MRR (Latest)" value={formatCurrency(lastQ.mrr)} subtitle={`${lastQ.studentsDeployed.toLocaleString()} students`} icon={TrendingUp} />
          <KPICard title="Institutions" value={lastQ.institutions.toString()} subtitle={`T1:${lastQ.tier1Inst} T2:${lastQ.tier2Inst} T3:${lastQ.tier3Inst}`} icon={Building2} />
          <KPICard
            title="Op. Break-Even"
            value={breakEven.operatingBreakEvenQ || "N/A"}
            subtitle={breakEven.monthsToOperating ? `${breakEven.monthsToOperating} months` : "Not reached"}
            icon={Target}
            accent
          />
          <KPICard
            title="Full Break-Even"
            value={breakEven.fullBreakEvenQ || "N/A"}
            subtitle={breakEven.monthsToFull ? `${breakEven.monthsToFull} months` : "Not reached"}
            icon={Target}
            accent
          />
          <KPICard title="Gross Margin" value={formatPercent(lastQ.grossMargin)} subtitle={`EBITDA: ${formatPercent(lastQ.ebitdaMargin)}`} icon={BarChart3} />
        </motion.div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="tiers">Tier Mix</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="breakeven">Break-Even</TabsTrigger>
            <TabsTrigger value="proforma">Pro-Forma P&L</TabsTrigger>
            <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Quarterly Revenue by Stream</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="subscriptionRevenue" name="SaaS Subscription" stackId="rev" fill="hsl(var(--primary))" />
                      <Bar dataKey="implementationRevenue" name="Impl. Fees" stackId="rev" fill="hsl(210 60% 50%)" />
                      <Bar dataKey="hardwareRevenue" name="NFC Hardware" stackId="rev" fill="hsl(var(--accent))" />
                      <Bar dataKey="expansionRevenue" name="Expansion" stackId="rev" fill="hsl(150 60% 45%)" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">MRR Growth</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="mrr" name="MRR" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Annual Summary */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Annual Revenue Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {annualSummary.map(y => (
                    <div key={y.year} className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{y.year}</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(y.revenue)}</p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>SaaS: {formatCurrency(y.saas)} · HW: {formatCurrency(y.hw)} · Impl: {formatCurrency(y.impl)}</p>
                        <p>{y.institutions} institutions · {y.students.toLocaleString()} students</p>
                        <p>OPEX: {formatCurrency(y.opex)} · EBITDA: <span className={y.ebitda >= 0 ? "text-primary" : "text-destructive"}>{formatCurrency(y.ebitda)}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tier Mix Tab */}
          <TabsContent value="tiers" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Tier Distribution (Latest Quarter)</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={tierPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                        {tierPieData.map((_, idx) => (
                          <Cell key={idx} fill={TIER_COLORS[idx]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Institutions by Tier Over Time</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tier1Inst" name="Tier 1" stackId="t" fill={TIER_COLORS[0]} />
                      <Bar dataKey="tier2Inst" name="Tier 2" stackId="t" fill={TIER_COLORS[1]} />
                      <Bar dataKey="tier3Inst" name="Tier 3" stackId="t" fill={TIER_COLORS[2]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tier pricing summary */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pricing Tiers</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {([1, 2, 3] as const).map(t => (
                    <div key={t} className={`p-4 rounded-lg border ${t === 2 ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{TIERS[t].tag}</span>
                        {t === 2 && <span className="text-xs text-primary font-medium">Default Plan</span>}
                      </div>
                      <h3 className="font-semibold text-foreground">{TIERS[t].name}</h3>
                      <p className="text-2xl font-bold text-foreground mt-1">${TIERS[t].pricePerStudentPerYear}<span className="text-sm font-normal text-muted-foreground">/student/yr</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Implementation: {formatCurrency(TIERS[t].implementationFee)}</p>
                      <p className="text-xs text-muted-foreground">ARR/Institution: {formatCurrency(assumptions.studentsPerInstitution * TIERS[t].pricePerStudentPerYear)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployment Tab */}
          <TabsContent value="deployment" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Students Deployed</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip />
                      <Area type="monotone" dataKey="studentsDeployed" name="Students Deployed" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Total Institutions</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="institutions" name="Institutions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Unit Economics Card */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Unit Economics (Per Institution — Tier 2 Default)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { label: "Students Deployed", value: assumptions.studentsPerInstitution.toLocaleString() },
                    { label: "Annual SaaS ARR", value: formatCurrency(assumptions.studentsPerInstitution * TIERS[2].pricePerStudentPerYear) },
                    { label: "Implementation Fee", value: formatCurrency(TIERS[2].implementationFee) },
                    { label: "HW Revenue", value: formatCurrency(assumptions.studentsPerInstitution * assumptions.nfcTagPrice) },
                  ].map(m => (
                    <div key={m.label} className="p-4 rounded-xl border border-border bg-card text-center">
                      <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                      <p className="text-2xl font-bold text-primary mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profitability Tab */}
          <TabsContent value="profitability" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue vs OPEX vs EBITDA</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <ReferenceLine y={0} stroke="hsl(var(--border))" />
                      <Bar dataKey="totalRevenue" name="Revenue" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="opex" name="OPEX" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Margin Trends</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis unit="%" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Legend />
                      <ReferenceLine y={0} stroke="hsl(var(--border))" />
                      <Line type="monotone" dataKey="grossMargin" name="Gross Margin %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ebitdaMargin" name="EBITDA Margin %" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Break-Even Tab */}
          <TabsContent value="breakeven" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="p-5 text-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">NINV (Initial Investment)</p>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(ninvTotal)}</p>
                  <p className="text-xs text-muted-foreground">One-time capital requirement</p>
                </CardContent>
              </Card>
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="p-5 text-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Operating Break-Even</p>
                  <p className="text-3xl font-bold text-foreground">{breakEven.operatingBreakEvenQ || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{breakEven.monthsToOperating ? `~${breakEven.monthsToOperating} months · EBITDA ≥ 0` : "Quarterly EBITDA ≥ 0"}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="p-5 text-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Full Investment Break-Even</p>
                  <p className="text-3xl font-bold text-foreground">{breakEven.fullBreakEvenQ || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{breakEven.monthsToFull ? `~${breakEven.monthsToFull} months · Cumulative profit ≥ NINV` : "Cumulative profit covers NINV"}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cumulative Profit vs NINV</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <ReferenceLine y={ninvTotal} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `NINV: ${formatCurrency(ninvTotal)}`, position: "right", fill: "hsl(var(--destructive))", fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Area type="monotone" dataKey="cumulativeProfit" name="Cumulative Profit" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Break-Even Logic</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Annual operating costs (Year 1): <span className="font-semibold text-foreground">{formatCurrency(annualOpexTotal)}</span></p>
                <p>• ARR per institution (Tier 2): <span className="font-semibold text-foreground">{formatCurrency(assumptions.studentsPerInstitution * TIERS[2].pricePerStudentPerYear)}</span></p>
                <p>• Operating break-even occurs at approximately <span className="font-semibold text-foreground">1 institutional client</span></p>
                <p>• Full investment break-even (including {formatCurrency(ninvTotal)} NINV) at approximately <span className="font-semibold text-foreground">2 institutional clients</span></p>
                <p>• Profitability expected within <span className="font-semibold text-foreground">18–24 months</span> under realistic B2B growth</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pro-Forma P&L Tab */}
          <TabsContent value="proforma">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pro-Forma Income Statement (Quarterly)</CardTitle></CardHeader>
              <CardContent className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card z-10">Period</TableHead>
                      <TableHead className="text-right">Inst.</TableHead>
                      <TableHead className="text-right">T1/T2/T3</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">HW Rev</TableHead>
                      <TableHead className="text-right">Impl.</TableHead>
                      <TableHead className="text-right">SaaS Rev</TableHead>
                      <TableHead className="text-right">Expand</TableHead>
                      <TableHead className="text-right">Total Rev</TableHead>
                      <TableHead className="text-right">GP</TableHead>
                      <TableHead className="text-right">OPEX</TableHead>
                      <TableHead className="text-right">EBITDA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((row, i) => (
                      <TableRow key={i} className={row.quarter === "Q1" ? "border-t-2 border-border" : ""}>
                        <TableCell className="font-medium sticky left-0 bg-card z-10 whitespace-nowrap">
                          {row.year} {row.quarter}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{row.institutions}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{row.tier1Inst}/{row.tier2Inst}/{row.tier3Inst}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{row.studentsDeployed.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.hardwareRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.implementationRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.subscriptionRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-primary">{row.expansionRevenue > 0 ? formatCurrency(row.expansionRevenue) : "—"}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(row.totalRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-destructive">{formatCurrency(row.opex)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-semibold ${row.ebitda >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(row.ebitda)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Annual summary rows */}
                    {annualSummary.map(y => (
                      <TableRow key={y.year} className="bg-muted/50 font-semibold border-t-2 border-primary/20">
                        <TableCell className="sticky left-0 bg-muted/50 z-10 font-bold">{y.year} Total</TableCell>
                        <TableCell className="text-right font-mono text-sm">{y.institutions}</TableCell>
                        <TableCell className="text-right" />
                        <TableCell className="text-right font-mono text-sm">{y.students.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.hw)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.impl)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.saas)}</TableCell>
                        <TableCell className="text-right" />
                        <TableCell className="text-right font-mono text-sm font-bold">{formatCurrency(y.revenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-destructive">{formatCurrency(y.opex)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-bold ${y.ebitda >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(y.ebitda)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assumptions Tab */}
          <TabsContent value="assumptions">
            <div className="space-y-4">
              {/* NINV */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Net Initial Investment (NINV) — Total: {formatCurrency(ninvTotal)}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {([
                      { key: "softwareDev" as const, label: "Software Dev (MVP)" },
                      { key: "nfcInventory" as const, label: "NFC Inventory" },
                      { key: "pilotDeployment" as const, label: "Pilot Deployment" },
                      { key: "legalSetup" as const, label: "Legal & Setup" },
                      { key: "brandingWebsite" as const, label: "Branding & Website" },
                    ]).map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <Input
                          type="number"
                          step={500}
                          value={assumptions.ninv[key]}
                          onChange={(e) => updateNINV(key, e.target.value)}
                          className="h-9 font-mono text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Annual OPEX */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Annual Operating Costs (Year 1) — Total: {formatCurrency(annualOpexTotal)}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {([
                      { key: "cloudInfra" as const, label: "Cloud Infrastructure" },
                      { key: "softwareMaintenance" as const, label: "Software Maintenance" },
                      { key: "salesOutreach" as const, label: "Sales & Outreach" },
                      { key: "customerSupport" as const, label: "Customer Support" },
                      { key: "generalAdmin" as const, label: "General & Admin" },
                    ]).map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <Input
                          type="number"
                          step={500}
                          value={assumptions.annualOpex[key]}
                          onChange={(e) => updateOpex(key, e.target.value)}
                          className="h-9 font-mono text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* General */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">General Assumptions</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {([
                      { key: "nfcTagCost" as const, label: "NFC Tag Cost ($)", step: 0.1 },
                      { key: "nfcTagPrice" as const, label: "NFC Tag Price ($)", step: 0.5 },
                      { key: "studentsPerInstitution" as const, label: "Students per Institution", step: 100 },
                      { key: "initialRolloutPercent" as const, label: "Initial Rollout %", step: 0.05 },
                      { key: "opexGrowthRate" as const, label: "OPEX Growth/Yr", step: 0.05 },
                      { key: "annualChurnRate" as const, label: "Annual Churn %", step: 0.01 },
                      { key: "tier1UpgradeRate" as const, label: "T1→T2 Upgrade Rate", step: 0.05 },
                      { key: "saasCogsPct" as const, label: "SaaS COGS %", step: 0.01 },
                      { key: "pilotFreeInstitutions" as const, label: "Free Pilot Schools", step: 1 },
                    ]).map(({ key, label, step }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <Input
                          type="number"
                          step={step}
                          value={assumptions[key]}
                          onChange={(e) => updateScalar(key, e.target.value)}
                          className="h-9 font-mono text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Adoption table */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Institution Adoption by Tier (Cumulative)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Tier 1</TableHead>
                          <TableHead className="text-right">Tier 2</TableHead>
                          <TableHead className="text-right">Tier 3</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {halfKeys.map((hk, idx) => {
                          const h = assumptions[hk];
                          return (
                            <TableRow key={hk}>
                              <TableCell className="font-medium">{halfLabels[idx]}</TableCell>
                              <TableCell className="text-right">
                                <Input type="number" className="h-8 w-20 font-mono text-sm ml-auto" value={h.tier1} onChange={(e) => updateHalfYear(hk, "tier1", e.target.value)} />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input type="number" className="h-8 w-20 font-mono text-sm ml-auto" value={h.tier2} onChange={(e) => updateHalfYear(hk, "tier2", e.target.value)} />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input type="number" className="h-8 w-20 font-mono text-sm ml-auto" value={h.tier3} onChange={(e) => updateHalfYear(hk, "tier3", e.target.value)} />
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold">{h.tier1 + h.tier2 + h.tier3}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
