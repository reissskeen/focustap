import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Presentation, TrendingUp, DollarSign, Building2, BarChart3, HardDrive, Layers, Target, Wallet, Lock, Unlock, Save } from "lucide-react";
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
import { useFinancialAssumptions } from "@/hooks/useFinancialAssumptions";

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

const CHART_COLORS = {
  saas: "#3b82f6",        // blue
  implementation: "#10b981", // emerald
  hardware: "#f59e0b",     // amber
  expansion: "#8b5cf6",    // violet
  mrr: "#06b6d4",          // cyan
  institutions: "#6366f1", // indigo
  profit: "#10b981",       // emerald
  destructive: "#ef4444",  // red
};

const AXIS_STYLE = { stroke: "#6b7280", fontSize: 11 };
const GRID_STYLE = { stroke: "#d1d5db", strokeDasharray: "3 3" };
const TOOLTIP_STYLE = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" };

const TIER_COLORS = [CHART_COLORS.institutions, CHART_COLORS.expansion, CHART_COLORS.saas];

export default function Financials() {
  const {
    assumptions, setAssumptions,
    hasUnsavedChanges, save: saveAssumptions, saving,
    savedIndicator, loading: assumptionsLoading,
  } = useFinancialAssumptions();
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  const handleUnlock = () => {
    if (accessCode === "1195") {
      setShowAssumptions(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  // Stage assumption edits without persisting
  const updateAssumptions = (updater: (prev: Assumptions) => Assumptions) => {
    setAssumptions(prev => updater(prev));
  };

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
    netIncome: d.netIncome,
    opex: d.opex,
    studentsDeployed: d.studentsDeployed,
    institutions: d.institutions,
    tier3Inst: d.tier3Inst,
    mrr: d.mrr,
    grossMargin: Math.round(d.grossMargin * 100),
    
    cumulativeProfit: d.cumulativeProfit,
  }));

  const lastQ = forecast[forecast.length - 1];
  const allYears = [...new Set(forecast.map(d => d.year))];
  const totalImplRev = forecast.reduce((s, d) => s + d.implementationRevenue, 0);
  const totalExpansionRev = forecast.reduce((s, d) => s + d.expansionRevenue, 0);

  const tierPieData = [
    { name: "Tier 3", value: lastQ.tier3Inst },
  ].filter(d => d.value > 0);

  const updateScalar = (key: "nfcTagCost" | "nfcTagPrice" | "studentsPerInstitution" | "deskToStudentRatio" | "saasCogsPct" | "pilotFreeInstitutions" | "postForecastHalfYearGrowth", value: string) => {
    updateAssumptions(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const updateOpex = (key: keyof AnnualOpex, value: string) => {
    updateAssumptions(prev => ({ ...prev, annualOpex: { ...prev.annualOpex, [key]: parseFloat(value) || 0 } }));
  };

  const updateNINV = (key: keyof NINV, value: string) => {
    updateAssumptions(prev => ({ ...prev, ninv: { ...prev.ninv, [key]: parseFloat(value) || 0 } }));
  };

  const halfKeys = ["h1_2026", "h2_2026", "h1_2027", "h2_2027", "h1_2028", "h2_2028"] as const;
  const halfLabels = ["H1 2026", "H2 2026", "H1 2027", "H2 2027", "H1 2028", "H2 2028"];

  const updateHalfYear = (halfKey: typeof halfKeys[number], tierKey: keyof HalfYearAdoption, value: string) => {
    updateAssumptions(prev => ({
      ...prev,
      [halfKey]: { ...prev[halfKey], [tierKey]: parseInt(value) || 0 },
    }));
  };

  // Annual summary — dynamic across all forecast years
  const annualSummary = allYears.map(yr => {
    const qs = forecast.filter(d => d.year === yr);
    return {
      year: yr,
      revenue: qs.reduce((s, d) => s + d.totalRevenue, 0),
      saas: qs.reduce((s, d) => s + d.subscriptionRevenue, 0),
      hw: qs.reduce((s, d) => s + d.hardwareRevenue, 0),
      impl: qs.reduce((s, d) => s + d.implementationRevenue, 0),
      opex: qs.reduce((s, d) => s + d.opex, 0),
      grossProfit: qs.reduce((s, d) => s + d.grossProfit, 0),
      netIncome: qs.reduce((s, d) => s + d.netIncome, 0),
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
          <div className="flex items-center gap-2">
            
            <Link to="/pitch-deck">
              <Button size="sm" className="gap-1.5">
                <Presentation className="w-4 h-4" /> Present
              </Button>
            </Link>
          </div>
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
          <KPICard title="Institutions" value={lastQ.institutions.toString()} subtitle={`Tier 3: ${lastQ.tier3Inst}`} icon={Building2} />
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
          <KPICard title="Gross Margin" value={formatPercent(lastQ.grossMargin)} subtitle="End of forecast period" icon={BarChart3} />
        </motion.div>

        {/* Unit Economics */}
        {lastQ.studentsDeployed > 0 && (() => {
          const totalStudents = lastQ.studentsDeployed;
          const totalCogs = forecast.reduce((s, d) => s + d.totalCogs, 0);
          const revPerStudent = lastQ.arr / totalStudents;
          const vcPerStudent = (totalCogs / forecast.length) * 4 / totalStudents; // annualized
          const cmPerStudent = revPerStudent - vcPerStudent;
          // Full break-even: recover NINV + all cumulative operating losses
          const cumulativeLosses = Math.abs(Math.min(0, lastQ.cumulativeProfit));
          const totalToRecover = ninvTotal + cumulativeLosses;
          const beStudents = cmPerStudent > 0 ? Math.ceil(totalToRecover / cmPerStudent) : Infinity;
          const beInstitutions = cmPerStudent > 0 ? Math.ceil(beStudents / assumptions.studentsPerInstitution) : Infinity;
          const cac = lastQ.institutions > 0 ? assumptions.annualOpex.salesOutreach / lastQ.institutions : 0;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Unit Economics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard title="Var. Cost / Student" value={`$${vcPerStudent.toFixed(2)}`} subtitle="Annualized COGS" icon={DollarSign} />
                <KPICard title="CM / Student" value={`$${cmPerStudent.toFixed(2)}`} subtitle="Contribution margin" icon={TrendingUp} />
                <KPICard title="Breakeven Students" value={beStudents === Infinity ? "N/A" : beStudents.toLocaleString()} subtitle="To fully break even" icon={Target} accent />
                <KPICard title="Breakeven Institutions" value={beInstitutions === Infinity ? "N/A" : beInstitutions.toString()} subtitle={`@ ${assumptions.studentsPerInstitution.toLocaleString()} students ea.`} icon={Building2} accent />
                <KPICard title="Marginal Profit" value={`$${cmPerStudent.toFixed(2)}`} subtitle="Per student added" icon={Layers} />
                <KPICard title="CAC" value={formatCurrency(cac)} subtitle="Per institution" icon={Wallet} />
              </div>
            </motion.div>
          );
        })()}

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="tiers">Tier Mix</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="breakeven">Break-Even</TabsTrigger>
            <TabsTrigger value="proforma">Pro-Forma P&L</TabsTrigger>
            {showAssumptions && <TabsTrigger value="assumptions">Assumptions</TabsTrigger>}
          </TabsList>

          {/* Unlock Assumptions */}
          {!showAssumptions && (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => { setAccessCode(e.target.value); setCodeError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                className={`h-8 w-40 font-mono text-sm ${codeError ? "border-destructive" : ""}`}
              />
              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleUnlock}>
                <Unlock className="w-3 h-3" /> Unlock
              </Button>
              {codeError && <span className="text-xs text-destructive">Invalid code</span>}
            </div>
          )}

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Quarterly Revenue by Stream</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="label" tick={AXIS_STYLE} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_STYLE} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <Bar dataKey="subscriptionRevenue" name="SaaS Subscription" stackId="rev" fill={CHART_COLORS.saas} />
                      <Bar dataKey="implementationRevenue" name="Impl. Fees" stackId="rev" fill={CHART_COLORS.implementation} />
                      <Bar dataKey="hardwareRevenue" name="NFC Hardware" stackId="rev" fill={CHART_COLORS.hardware} />
                      <Bar dataKey="expansionRevenue" name="Expansion" stackId="rev" fill={CHART_COLORS.expansion} radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">MRR Growth</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="label" tick={AXIS_STYLE} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_STYLE} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="mrr" name="MRR" fill={`${CHART_COLORS.mrr}33`} stroke={CHART_COLORS.mrr} strokeWidth={2} />
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
                        <p>OPEX: {formatCurrency(y.opex)} · Net Income: <span className={y.netIncome >= 0 ? "text-primary" : "text-destructive"}>{formatCurrency(y.netIncome)}</span></p>
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
                <CardHeader className="pb-2"><CardTitle className="text-sm">Institutions Over Time (Tier 3)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="label" tick={AXIS_STYLE} />
                      <YAxis tick={AXIS_STYLE} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <Bar dataKey="tier3Inst" name="Tier 3 — Full Campus Intelligence" fill={CHART_COLORS.institutions} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pricing summary — single tier */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Pricing — Tier 3</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <div className="p-6 rounded-lg border border-primary bg-primary/5 w-full max-w-sm text-center space-y-3">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">Full Campus Intelligence</span>
                    <p className="text-4xl font-bold text-foreground">${TIERS[3].pricePerStudentPerYear}<span className="text-sm font-normal text-muted-foreground">/student/yr</span></p>
                    <p className="text-sm text-muted-foreground">Implementation: ${TIERS[3].implementationFeePerTag}/tag · {formatCurrency(Math.ceil(assumptions.studentsPerInstitution / assumptions.deskToStudentRatio) * TIERS[3].implementationFeePerTag)} for {Math.ceil(assumptions.studentsPerInstitution / assumptions.deskToStudentRatio).toLocaleString()} desks</p>
                    <p className="text-sm text-muted-foreground">ARR/Institution: {formatCurrency(assumptions.studentsPerInstitution * TIERS[3].pricePerStudentPerYear)}</p>
                  </div>
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
                  <p className="text-xs text-muted-foreground">{breakEven.monthsToOperating ? `~${breakEven.monthsToOperating} months · Net Income ≥ 0` : "Quarterly Net Income ≥ 0"}</p>
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
                    <CartesianGrid {...GRID_STYLE} />
                    <XAxis dataKey="label" tick={AXIS_STYLE} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_STYLE} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    <ReferenceLine y={ninvTotal} stroke={CHART_COLORS.destructive} strokeDasharray="5 5" label={{ value: `NINV: ${formatCurrency(ninvTotal)}`, position: "right", fill: CHART_COLORS.destructive, fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="#9ca3af" />
                    <Area type="monotone" dataKey="cumulativeProfit" name="Cumulative Profit" fill={`${CHART_COLORS.profit}25`} stroke={CHART_COLORS.profit} strokeWidth={2} />
                   </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Break-Even Logic</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Annual operating costs (Year 1): <span className="font-semibold text-foreground">{formatCurrency(annualOpexTotal)}</span></p>
                <p>• ARR per institution (Tier 3): <span className="font-semibold text-foreground">{formatCurrency(assumptions.studentsPerInstitution * TIERS[3].pricePerStudentPerYear)}</span></p>
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
                      <TableHead className="text-right">T3</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">HW Rev</TableHead>
                      <TableHead className="text-right">Impl.</TableHead>
                      <TableHead className="text-right">SaaS Rev</TableHead>
                      <TableHead className="text-right">Expand</TableHead>
                      <TableHead className="text-right">Total Rev</TableHead>
                      <TableHead className="text-right">GP</TableHead>
                      <TableHead className="text-right">OPEX</TableHead>
                      <TableHead className="text-right">Net Income</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((row, i) => (
                      <TableRow key={i} className={row.quarter === "Q1" ? "border-t-2 border-border" : ""}>
                        <TableCell className="font-medium sticky left-0 bg-card z-10 whitespace-nowrap">
                          {row.year} {row.quarter}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{row.institutions}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{row.tier3Inst}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{row.studentsDeployed.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.hardwareRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.implementationRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.subscriptionRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-primary">{row.expansionRevenue > 0 ? formatCurrency(row.expansionRevenue) : "—"}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(row.totalRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-primary">{formatCurrency(row.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-destructive">{formatCurrency(row.opex)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-semibold ${row.netIncome >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(row.netIncome)}
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
                        <TableCell className="text-right font-mono text-sm text-primary">{formatCurrency(y.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-destructive">{formatCurrency(y.opex)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-bold ${y.netIncome >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(y.netIncome)}
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
              <div className="flex items-center justify-between">
                <div>
                  {hasUnsavedChanges && (
                    <span className="text-xs text-destructive/80 font-medium">● Unsaved changes</span>
                  )}
                  {savedIndicator && (
                    <span className="text-xs text-primary font-medium animate-in fade-in duration-300">✓ Saved</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5" disabled={!hasUnsavedChanges} onClick={saveAssumptions}>
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateAssumptions(() => defaultAssumptions)}>
                    Reset to Defaults
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setShowAssumptions(false); setAccessCode(""); }}>
                    <Lock className="w-3 h-3" /> Lock
                  </Button>
                </div>
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Net Initial Investment (NINV) — Total: {formatCurrency(ninvTotal)}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {([
                      { key: "softwareDev" as const, label: "Software Dev (MVP)" },
                      { key: "nfcInventory" as const, label: "NFC Inventory" },
                      { key: "pilotDeployment" as const, label: "Pilot Deployment" },
                      { key: "legalSetup" as const, label: "Legal & Compliance" },
                      { key: "brandingWebsite" as const, label: "Contingency Buffer" },
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
                      { key: "generalAdmin" as const, label: "Contingency Buffer" },
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
                      { key: "deskToStudentRatio" as const, label: "Desk:Student Ratio (1:X)", step: 0.1 },
                      { key: "saasCogsPct" as const, label: "SaaS COGS %", step: 0.01 },
                      { key: "pilotFreeInstitutions" as const, label: "Free Pilot Schools", step: 1 },
                      { key: "postForecastHalfYearGrowth" as const, label: "Post-2028 Growth (inst/half-yr)", step: 1 },
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
                <CardHeader className="pb-2"><CardTitle className="text-sm">Institution Adoption — Tier 3 (Cumulative)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Tier 3 Institutions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {halfKeys.map((hk, idx) => {
                          const h = assumptions[hk];
                          return (
                            <TableRow key={hk}>
                              <TableCell className="font-medium">{halfLabels[idx]}</TableCell>
                              <TableCell className="text-right">
                                <Input type="number" className="h-8 w-20 font-mono text-sm ml-auto" value={h.tier3} onChange={(e) => updateHalfYear(hk, "tier3", e.target.value)} />
                              </TableCell>
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
