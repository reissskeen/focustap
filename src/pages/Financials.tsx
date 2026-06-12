import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Presentation, TrendingUp, DollarSign, Building2, BarChart3, HardDrive,
  Layers, Target, Wallet, Lock, Unlock, Save, Download, ChevronLeft,
  CheckCircle2, Users, Zap,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import {
  defaultAssumptions, generateForecast, formatCurrency, formatPercent,
  TIERS, computeNINVTotal, computeAnnualOpexTotal, computeBreakEven,
  type Assumptions, type HalfYearAdoption, type AnnualOpex, type NINV,
  type YearlyFinancials,
} from "@/lib/financialData";
import { useFinancialAssumptions } from "@/hooks/useFinancialAssumptions";
import TAMAnalysis from "@/components/TAMAnalysis";

/* ------------------------------------------------------------------ */
/*  Shared UI                                                          */
/* ------------------------------------------------------------------ */

const KPICard = ({
  title, value, subtitle, icon: Icon, accent,
}: {
  title: string; value: string; subtitle: string; icon: React.ElementType; accent?: boolean;
}) => (
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
  saas: "#3b82f6",
  implementation: "#a855f7",
  hardware: "#f59e0b",
  expansion: "#8b5cf6",
  mrr: "#06b6d4",
  institutions: "#6366f1",
  profit: "#10b981",
  destructive: "#ef4444",
};

const AXIS_STYLE = { stroke: "#6b7280", fontSize: 11 };
const GRID_STYLE = { stroke: "#d1d5db", strokeDasharray: "3 3" };
const TOOLTIP_STYLE = {
  backgroundColor: "#20232e",
  border: "1px solid #222634",
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

/* ------------------------------------------------------------------ */
/*  Excel Export                                                       */
/* ------------------------------------------------------------------ */

function exportToExcel(
  forecast: YearlyFinancials[],
  assumptions: Assumptions,
  ninvTotal: number,
  annualOpexTotal: number,
  annualSummary: { year: string; revenue: number; saas: number; hw: number; impl: number; opex: number; grossProfit: number; netIncome: number; institutions: number; students: number }[],
) {
  const wb = XLSX.utils.book_new();

  const qHeaders = [
    "Year", "Quarter", "Institutions", "New Inst.", "Students Deployed", "New Students",
    "Desks Deployed", "New Desks", "SaaS Revenue", "Hardware Revenue", "Implementation Revenue",
    "Total Revenue", "Hardware COGS", "Total COGS", "Gross Profit", "Gross Margin",
    "OPEX", "EBITDA", "EBITDA Margin", "Net Income", "MRR", "ARR",
    "Cumulative Revenue", "Cumulative Profit",
  ];
  const qRows = forecast.map(d => [
    d.year, d.quarter, d.institutions, d.newInstitutions, d.studentsDeployed, d.newStudents,
    d.desksDeployed, d.newDesks, d.subscriptionRevenue, d.hardwareRevenue, d.implementationRevenue,
    d.totalRevenue, d.hardwareCogs, d.totalCogs, d.grossProfit, d.grossMargin,
    d.opex, d.ebitda, d.ebitdaMargin, d.netIncome, d.mrr, d.arr,
    d.cumulativeRevenue, d.cumulativeProfit,
  ]);
  const ws1 = XLSX.utils.aoa_to_sheet([qHeaders, ...qRows]);
  ws1["!cols"] = qHeaders.map((h) => ({ wch: Math.max(h.length, 14) }));
  XLSX.utils.book_append_sheet(wb, ws1, "Quarterly Forecast");

  const aHeaders = ["Year", "Revenue", "SaaS", "Hardware", "Implementation", "OPEX", "Gross Profit", "Net Income", "Institutions", "Students"];
  const aRows = annualSummary.map(a => [a.year, a.revenue, a.saas, a.hw, a.impl, a.opex, a.grossProfit, a.netIncome, a.institutions, a.students]);
  const ws2 = XLSX.utils.aoa_to_sheet([aHeaders, ...aRows]);
  ws2["!cols"] = aHeaders.map((h) => ({ wch: Math.max(h.length, 14) }));
  XLSX.utils.book_append_sheet(wb, ws2, "Annual Summary");

  const assumptionRows: (string | number)[][] = [
    ["FocusTap Financial Model — Assumptions"],
    [],
    ["Parameter", "Value"],
    ["NFC Tag Cost", assumptions.nfcTagCost],
    ["NFC Tag Price", assumptions.nfcTagPrice],
    ["Students per Institution", assumptions.studentsPerInstitution],
    ["Desk-to-Student Ratio", assumptions.deskToStudentRatio],
    ["SaaS COGS %", assumptions.saasCogsPct],
    ["Pilot Free Institutions", assumptions.pilotFreeInstitutions],
    ["Tier 3 Price ($/student/yr)", TIERS[3].pricePerStudentPerYear],
    ["Implementation Fee ($/tag)", TIERS[3].implementationFeePerTag],
    [],
    ["NINV (One-Time Investment)", "Amount"],
    ["Software Development", assumptions.ninv.softwareDev],
    ["NFC Inventory", assumptions.ninv.nfcInventory],
    ["Pilot Deployment", assumptions.ninv.pilotDeployment],
    ["Legal Setup", assumptions.ninv.legalSetup],
    ["Contingency Buffer", assumptions.ninv.brandingWebsite],
    ["Total NINV", ninvTotal],
    [],
    ["Annual OPEX (Base)", "Amount"],
    ["Salaries", assumptions.annualOpex.salaries],
    ["Cloud Infrastructure", assumptions.annualOpex.cloudInfra],
    ["Software Maintenance", assumptions.annualOpex.softwareMaintenance],
    ["Sales & Outreach", assumptions.annualOpex.salesOutreach],
    ["Customer Support", assumptions.annualOpex.customerSupport],
    ["General & Admin", assumptions.annualOpex.generalAdmin],
    ["Total Annual OPEX", annualOpexTotal],
    [],
    ["Adoption Timeline", "Tier 3 Institutions"],
    ["H1 2026", assumptions.h1_2026.tier3],
    ["H2 2026", assumptions.h2_2026.tier3],
    ["H1 2027", assumptions.h1_2027.tier3],
    ["H2 2027", assumptions.h2_2027.tier3],
    ["H1 2028", assumptions.h1_2028.tier3],
    ["H2 2028", assumptions.h2_2028.tier3],
    ["H1 2029", assumptions.h1_2029.tier3],
    ["H2 2029", assumptions.h2_2029.tier3],
    ["H1 2030", assumptions.h1_2030.tier3],
    ["H2 2030", assumptions.h2_2030.tier3],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(assumptionRows);
  ws3["!cols"] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Assumptions");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "FocusTap_Financial_Model.xlsx");
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Financials() {
  const navigate = useNavigate();
  const {
    assumptions, setAssumptions,
    hasUnsavedChanges, save: saveAssumptions, saving,
    savedIndicator,
  } = useFinancialAssumptions();

  const [showAssumptions, setShowAssumptions] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  const handleUnlock = () => {
    if (accessCode === "1195") { setShowAssumptions(true); setCodeError(false); }
    else setCodeError(true);
  };

  const updateAssumptions = (updater: (prev: Assumptions) => Assumptions) => {
    setAssumptions(prev => updater(prev));
  };

  const updateScalar = (
    key: "nfcTagCost" | "nfcTagPrice" | "studentsPerInstitution" | "deskToStudentRatio"
      | "saasCogsPct" | "pilotFreeInstitutions" | "postForecastHalfYearGrowth",
    value: string,
  ) => { updateAssumptions(prev => ({ ...prev, [key]: parseFloat(value) || 0 })); };

  const updateOpex = (key: keyof AnnualOpex, value: string) => {
    updateAssumptions(prev => ({ ...prev, annualOpex: { ...prev.annualOpex, [key]: parseFloat(value) || 0 } }));
  };

  const updateNINV = (key: keyof NINV, value: string) => {
    updateAssumptions(prev => ({ ...prev, ninv: { ...prev.ninv, [key]: parseFloat(value) || 0 } }));
  };

  const halfKeys = [
    "h1_2026", "h2_2026", "h1_2027", "h2_2027", "h1_2028", "h2_2028",
    "h1_2029", "h2_2029", "h1_2030", "h2_2030",
  ] as const;
  const halfLabels = [
    "H1 2026", "H2 2026", "H1 2027", "H2 2027", "H1 2028", "H2 2028",
    "H1 2029", "H2 2029", "H1 2030", "H2 2030",
  ];

  const updateHalfYear = (halfKey: typeof halfKeys[number], tierKey: keyof HalfYearAdoption, value: string) => {
    updateAssumptions(prev => ({ ...prev, [halfKey]: { ...prev[halfKey], [tierKey]: parseInt(value) || 0 } }));
  };

  /* ---- Derived data ---- */

  const forecast = useMemo(() => generateForecast(assumptions), [assumptions]);
  const ninvTotal = useMemo(() => computeNINVTotal(assumptions.ninv), [assumptions.ninv]);
  const annualOpexTotal = useMemo(() => computeAnnualOpexTotal(assumptions.annualOpex), [assumptions.annualOpex]);
  const breakEven = useMemo(() => computeBreakEven(forecast, ninvTotal), [forecast, ninvTotal]);

  const chartData = forecast.slice(1).map((d, i) => ({
    label: `${d.year.replace("FY ", "'")} ${d.quarter}`,
    totalRevenue: d.totalRevenue,
    subscriptionRevenue: d.subscriptionRevenue,
    hardwareRevenue: d.hardwareRevenue,
    implementationRevenue: d.implementationRevenue,
    implNeg: -d.implementationRevenue,
    grossProfit: d.grossProfit,
    netIncome: d.netIncome,
    opex: d.opex,
    opexNeg: -d.opex,
    ninv: i === 0 ? -ninvTotal : 0,
    studentsDeployed: d.studentsDeployed,
    institutions: d.institutions,
    tier3Inst: d.tier3Inst,
    desksDeployed: d.desksDeployed,
    mrr: d.mrr,
    grossMargin: Math.round(d.grossMargin * 100),
    ebitdaMargin: Math.round(d.ebitdaMargin * 100),
    cumulativeProfit: d.cumulativeProfit,
  }));

  const lastQ = forecast[forecast.length - 1];
  const allYears = [...new Set(forecast.map(d => d.year))];

  const annualSummary = useMemo(() => allYears.map(yr => {
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
      mrr: qs[qs.length - 1].mrr,
      arr: qs[qs.length - 1].arr,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [forecast]);

  const annualChartData = annualSummary.map(y => ({
    year: y.year.replace("FY ", ""),
    saas: y.saas,
    hardware: y.hw,
    implementation: y.impl,
    netIncome: y.netIncome,
    revenue: y.revenue,
    institutions: y.institutions,
  }));

  const year5 = annualSummary[annualSummary.length - 1];

  const useOfFundsData = useMemo(() => {
    const ninvItems = [
      { name: "Software Dev", value: assumptions.ninv.softwareDev, color: "#8b6cff" },
      { name: "NFC Inventory", value: assumptions.ninv.nfcInventory, color: "#22d3ee" },
      { name: "Pilot Deployment", value: assumptions.ninv.pilotDeployment, color: "#3b82f6" },
      { name: "Legal & IP", value: assumptions.ninv.legalSetup, color: "#f59e0b" },
      { name: "Contingency", value: assumptions.ninv.brandingWebsite, color: "#6366f1" },
    ];
    const allocated = ninvItems.reduce((s, d) => s + d.value, 0);
    const growth = 250_000 - allocated;
    return growth > 0
      ? [...ninvItems, { name: "Growth Capital", value: growth, color: "#10b981" }]
      : ninvItems;
  }, [assumptions.ninv]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "none", border: "none", color: "#8585a0",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                fontFamily: "inherit", padding: 0, transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e8e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8585a0")}
            >
              <ChevronLeft style={{ width: 15, height: 15 }} />
              Back
            </button>
            <h1 className="font-bold text-lg">FocusTap Financial Model</h1>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Enterprise B2B SaaS · 5-Year Model
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => exportToExcel(forecast, assumptions, ninvTotal, annualOpexTotal, annualSummary)}>
              <Download className="w-4 h-4" /> Export Excel
            </Button>
            <Link to="/pitch-deck">
              <Button size="sm" className="gap-1.5">
                <Presentation className="w-4 h-4" /> Present
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Top KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4"
        >
          <KPICard title="NINV" value={formatCurrency(ninvTotal)} subtitle="One-time investment" icon={Wallet} />
          <KPICard title="Annual OPEX" value={formatCurrency(annualOpexTotal)} subtitle="Year 1 operating costs" icon={HardDrive} />
          <KPICard title="ARR (Year 5)" value={formatCurrency(lastQ.arr)} subtitle={`${lastQ.institutions} institutions`} icon={DollarSign} />
          <KPICard title="MRR (Year 5)" value={formatCurrency(lastQ.mrr)} subtitle={`${lastQ.studentsDeployed.toLocaleString()} students`} icon={TrendingUp} />
          <KPICard title="Institutions" value={lastQ.institutions.toString()} subtitle={`Tier 3: ${lastQ.tier3Inst}`} icon={Building2} />
          <KPICard
            title="Op. Break-Even"
            value={breakEven.operatingBreakEvenQ || "N/A"}
            subtitle={breakEven.monthsToOperating ? `${breakEven.monthsToOperating} months` : "Not reached"}
            icon={Target} accent
          />
          <KPICard
            title="Full Break-Even"
            value={breakEven.fullBreakEvenQ || "N/A"}
            subtitle={breakEven.monthsToFull ? `${breakEven.monthsToFull} months` : "Not reached"}
            icon={Target} accent
          />
          <KPICard title="Gross Margin" value={formatPercent(lastQ.grossMargin)} subtitle="Year 5 end of period" icon={BarChart3} />
        </motion.div>

        {/* Unit Economics */}
        {lastQ.studentsDeployed > 0 && (() => {
          const totalCogs = forecast.reduce((s, d) => s + d.totalCogs, 0);
          const revPerStudent = lastQ.arr / lastQ.studentsDeployed;
          const vcPerStudent = (totalCogs / forecast.length) * 4 / lastQ.studentsDeployed;
          const cmPerStudent = revPerStudent - vcPerStudent;
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
                <KPICard title="Breakeven Inst." value={beInstitutions === Infinity ? "N/A" : beInstitutions.toString()} subtitle={`@ ${assumptions.studentsPerInstitution.toLocaleString()} students ea.`} icon={Building2} accent />
                <KPICard title="Marginal Profit" value={`$${cmPerStudent.toFixed(2)}`} subtitle="Per student added" icon={Layers} />
                <KPICard title="CAC" value={formatCurrency(cac)} subtitle="Per institution" icon={Wallet} />
              </div>
            </motion.div>
          );
        })()}

        {/* Tabs */}
        <Tabs defaultValue="investor" className="space-y-4">
          <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="investor">Investor Overview</TabsTrigger>
            <TabsTrigger value="tam">TAM Analysis</TabsTrigger>
            <TabsTrigger value="projection">5-Year Projection</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="breakeven">Break-Even</TabsTrigger>
            <TabsTrigger value="proforma">Pro-Forma P&L</TabsTrigger>
            {showAssumptions && <TabsTrigger value="assumptions">Assumptions</TabsTrigger>}
          </TabsList>

          {/* Unlock */}
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

          {/* ======================== INVESTOR OVERVIEW ======================== */}
          <TabsContent value="investor" className="space-y-6">
            {/* Deal Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(139,108,255,0.12) 0%, rgba(34,211,238,0.06) 100%)",
                border: "1px solid rgba(139,108,255,0.3)",
                borderRadius: 16,
              }}
              className="p-6 md:p-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ background: "rgba(139,108,255,0.15)", color: "#8b6cff" }} className="text-xs font-semibold px-2.5 py-1 rounded-full">
                      Seed Round · 2026
                    </span>
                    <span style={{ background: "rgba(34,211,238,0.15)", color: "#22d3ee" }} className="text-xs font-semibold px-2.5 py-1 rounded-full">
                      EdTech · B2B SaaS
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium mb-1">FocusTap is raising</p>
                  <p style={{ color: "#8b6cff" }} className="text-5xl font-black tracking-tight">$250,000</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                    Enterprise classroom engagement platform — NFC-powered attendance tracking + real-time focus analytics. Currently piloting at Flagler College.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: "Equity Offered", value: "10%", color: "#8b6cff" },
                    { label: "Post-Money Val.", value: "$2.5M", color: "#e8e8f0" },
                    { label: "Year 5 ARR", value: formatCurrency(lastQ.arr), color: "#22d3ee" },
                    { label: "Year 5 Institutions", value: lastQ.institutions.toString(), color: "#e8e8f0" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}
                      className="rounded-xl p-4 text-center min-w-[110px]"
                    >
                      <p style={{ color }} className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5-Year Revenue Chart + Why Invest */}
            <div className="grid lg:grid-cols-5 gap-6">
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">5-Year Revenue Trajectory</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={annualChartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="year" tick={AXIS_STYLE} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_STYLE} />
                      <Tooltip formatter={(v: number, name: string) => [formatCurrency(Math.abs(v)), name]} contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
                      <Bar dataKey="saas" name="SaaS Revenue" stackId="rev" fill={CHART_COLORS.saas} />
                      <Bar dataKey="hardware" name="Hardware" stackId="rev" fill={CHART_COLORS.hardware} />
                      <Bar dataKey="implementation" name="Implementation" stackId="rev" fill={CHART_COLORS.implementation} radius={[4, 4, 0, 0]} />
                      <Line dataKey="netIncome" name="Net Income" type="monotone" stroke={CHART_COLORS.profit} strokeWidth={2.5} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Why Invest</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      icon: Target,
                      color: "#8b6cff",
                      title: "$500M+ Addressable Market",
                      desc: "4,000+ US institutions × 2,500 avg students × $50/yr subscription.",
                    },
                    {
                      icon: CheckCircle2,
                      color: "#10b981",
                      title: "Live Pilot — Flagler College",
                      desc: "Real attendance data, NFC hardware deployed, student adoption validated.",
                    },
                    {
                      icon: TrendingUp,
                      color: "#22d3ee",
                      title: "70–85% Gross Margins at Scale",
                      desc: "SaaS subscription is the engine. Hardware is a one-time anchor purchase.",
                    },
                    {
                      icon: Building2,
                      color: "#f59e0b",
                      title: "Institutional Lock-in",
                      desc: "Campus-wide NFC infrastructure creates sticky, multi-year renewal contracts.",
                    },
                    {
                      icon: Zap,
                      color: "#a855f7",
                      title: `Break-Even at ${Math.ceil(annualOpexTotal / (assumptions.studentsPerInstitution * TIERS[3].pricePerStudentPerYear))} Institutions`,
                      desc: `${formatCurrency(annualOpexTotal)}/yr burn. ${formatCurrency(assumptions.studentsPerInstitution * TIERS[3].pricePerStudentPerYear)} ARR per institution.`,
                    },
                  ].map(({ icon: Icon, color, title, desc }) => (
                    <div key={title} className="flex gap-3 items-start">
                      <div
                        style={{ background: `${color}18`, minWidth: 32, height: 32 }}
                        className="rounded-lg flex items-center justify-center"
                      >
                        <Icon style={{ color, width: 16, height: 16 }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Use of Funds + 5-Year Table */}
            <div className="grid lg:grid-cols-5 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Use of $250,000</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={useOfFundsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {useOfFundsData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full space-y-1.5">
                      {useOfFundsData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div style={{ background: d.color, width: 8, height: 8, borderRadius: 2 }} />
                            <span className="text-muted-foreground">{d.name}</span>
                          </div>
                          <span className="font-mono font-semibold text-foreground">{formatCurrency(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">5-Year Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Gross Profit</TableHead>
                        <TableHead className="text-right">GP%</TableHead>
                        <TableHead className="text-right">Net Income</TableHead>
                        <TableHead className="text-right">Inst.</TableHead>
                        <TableHead className="text-right">MRR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {annualSummary.map(y => (
                        <TableRow key={y.year}>
                          <TableCell className="font-semibold">{y.year}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(y.revenue)}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-primary">{formatCurrency(y.grossProfit)}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {y.revenue > 0 ? `${Math.round((y.grossProfit / y.revenue) * 100)}%` : "—"}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm font-semibold ${y.netIncome >= 0 ? "text-primary" : "text-destructive"}`}>
                            {formatCurrency(y.netIncome)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{y.institutions}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(y.mrr)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Cap Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cap Table — Post Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 text-center">
                  {[
                    { label: "Founding Team", pct: "90%", note: "Retained equity", color: "#8b6cff" },
                    { label: "Investor", pct: "10%", note: "$250K seed", color: "#22d3ee" },
                    { label: "Post-Money Val.", pct: "$2.5M", note: "Implied valuation", color: "#e8e8f0" },
                  ].map(({ label, pct, note, color }) => (
                    <div
                      key={label}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}
                      className="rounded-xl p-4"
                    >
                      <p style={{ color }} className="text-3xl font-bold">{pct}</p>
                      <p className="text-sm font-medium text-foreground mt-1">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================== TAM ANALYSIS ======================== */}
          <TabsContent value="tam">
            <TAMAnalysis />
          </TabsContent>

          {/* ======================== 5-YEAR PROJECTION ======================== */}
          <TabsContent value="projection" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Annual Revenue by Stream</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={annualChartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="year" tick={AXIS_STYLE} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_STYLE} />
                      <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name]} contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <Bar dataKey="saas" name="SaaS" stackId="a" fill={CHART_COLORS.saas} />
                      <Bar dataKey="hardware" name="Hardware" stackId="a" fill={CHART_COLORS.hardware} />
                      <Bar dataKey="implementation" name="Implementation" stackId="a" fill={CHART_COLORS.implementation} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Institution Growth (Annual)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={annualChartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="year" tick={AXIS_STYLE} />
                      <YAxis tick={AXIS_STYLE} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="institutions" name="Institutions" fill={`${CHART_COLORS.institutions}33`} stroke={CHART_COLORS.institutions} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Annual P&L Summary — 5 Years</CardTitle></CardHeader>
              <CardContent className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">SaaS</TableHead>
                      <TableHead className="text-right">Hardware</TableHead>
                      <TableHead className="text-right">Impl.</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead className="text-right">GP%</TableHead>
                      <TableHead className="text-right">OPEX</TableHead>
                      <TableHead className="text-right">Net Income</TableHead>
                      <TableHead className="text-right">Institutions</TableHead>
                      <TableHead className="text-right">ARR</TableHead>
                      <TableHead className="text-right">MRR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {annualSummary.map(y => (
                      <TableRow key={y.year}>
                        <TableCell className="font-semibold whitespace-nowrap">{y.year}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(y.revenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.saas)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.hw)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.impl)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-primary">{formatCurrency(y.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {y.revenue > 0 ? `${Math.round((y.grossProfit / y.revenue) * 100)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-destructive">{formatCurrency(y.opex)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-bold ${y.netIncome >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(y.netIncome)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{y.institutions}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.arr)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.mrr)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================== REVENUE ======================== */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Quarterly Revenue & Costs</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="label" tick={AXIS_STYLE} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_STYLE} />
                      <Tooltip formatter={(v: number, name: string) => [formatCurrency(Math.abs(v)), name]} contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
                      <Bar dataKey="subscriptionRevenue" name="SaaS Subscription" stackId="rev" fill={CHART_COLORS.saas} />
                      <Bar dataKey="hardwareRevenue" name="NFC Hardware" stackId="rev" fill={CHART_COLORS.hardware} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="implNeg" name="Impl. Fees" stackId="cost" fill={CHART_COLORS.implementation} />
                      <Bar dataKey="opexNeg" name="OPEX" stackId="cost" fill="#f97316" />
                      <Bar dataKey="ninv" name="NINV" stackId="cost" fill={CHART_COLORS.destructive} radius={[0, 0, 4, 4]} />
                      <Line dataKey="cumulativeProfit" name="Total P&L" type="monotone" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                      {(() => {
                        const beIdx = chartData.findIndex(d => d.cumulativeProfit >= 0);
                        return beIdx > 0 ? (
                          <ReferenceLine x={chartData[beIdx].label} stroke="#10b981" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Break-Even", position: "top", fill: "#10b981", fontSize: 11 }} />
                        ) : null;
                      })()}
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

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Annual Revenue Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {annualSummary.map(y => (
                    <div key={y.year} className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{y.year}</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(y.revenue)}</p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>SaaS: {formatCurrency(y.saas)}</p>
                        <p>HW: {formatCurrency(y.hw)} · Impl: {formatCurrency(y.impl)}</p>
                        <p>{y.institutions} inst. · {y.students.toLocaleString()} students</p>
                        <p>Net Income: <span className={y.netIncome >= 0 ? "text-primary" : "text-destructive"}>{formatCurrency(y.netIncome)}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================== DEPLOYMENT ======================== */}
          <TabsContent value="deployment" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Institution Growth (Quarterly)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="label" tick={AXIS_STYLE} />
                      <YAxis tick={AXIS_STYLE} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="institutions" name="Institutions" fill={`${CHART_COLORS.institutions}33`} stroke={CHART_COLORS.institutions} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Students Deployed (Quarterly)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="label" tick={AXIS_STYLE} />
                      <YAxis tickFormatter={(v) => v.toLocaleString()} tick={AXIS_STYLE} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="studentsDeployed" name="Students" fill={`${CHART_COLORS.saas}33`} stroke={CHART_COLORS.saas} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">NFC Desks Deployed (Quarterly)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <CartesianGrid {...GRID_STYLE} />
                    <XAxis dataKey="label" tick={AXIS_STYLE} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} tick={AXIS_STYLE} />
                    <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="desksDeployed" name="Desks" fill={`${CHART_COLORS.hardware}33`} stroke={CHART_COLORS.hardware} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================== PROFITABILITY ======================== */}
          <TabsContent value="profitability" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Gross Margin % (Quarterly)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="label" tick={AXIS_STYLE} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={AXIS_STYLE} />
                      <Tooltip formatter={(v: number) => `${v}%`} contentStyle={TOOLTIP_STYLE} />
                      <ReferenceLine y={0} stroke="#9ca3af" />
                      <Line type="monotone" dataKey="grossMargin" name="Gross Margin %" stroke={CHART_COLORS.profit} strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue vs OPEX (Quarterly)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="label" tick={AXIS_STYLE} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_STYLE} />
                      <Tooltip formatter={(v: number, name: string) => [formatCurrency(Math.abs(v)), name]} contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <Bar dataKey="totalRevenue" name="Total Revenue" fill={CHART_COLORS.saas} radius={[4, 4, 0, 0]} />
                      <Line dataKey="opex" name="OPEX" type="monotone" stroke={CHART_COLORS.destructive} strokeWidth={2} dot={{ r: 2 }} />
                      <Line dataKey="grossProfit" name="Gross Profit" type="monotone" stroke={CHART_COLORS.profit} strokeWidth={2} dot={{ r: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Net Income (Quarterly)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid {...GRID_STYLE} />
                    <XAxis dataKey="label" tick={AXIS_STYLE} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_STYLE} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1.5} />
                    {(() => {
                      const beIdx = chartData.findIndex(d => d.netIncome >= 0);
                      return beIdx > 0 ? (
                        <ReferenceLine x={chartData[beIdx].label} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Profitable", position: "top", fill: "#10b981", fontSize: 11 }} />
                      ) : null;
                    })()}
                    <Bar dataKey="netIncome" name="Net Income" fill={CHART_COLORS.profit} radius={[3, 3, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.netIncome >= 0 ? CHART_COLORS.profit : CHART_COLORS.destructive} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================== BREAK-EVEN ======================== */}
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
                  <p className="text-xs text-muted-foreground">{breakEven.monthsToOperating ? `~${breakEven.monthsToOperating} months · Quarterly Net Income ≥ 0` : "Not yet reached"}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="p-5 text-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Full Investment Break-Even</p>
                  <p className="text-3xl font-bold text-foreground">{breakEven.fullBreakEvenQ || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{breakEven.monthsToFull ? `~${breakEven.monthsToFull} months · Cumulative profit ≥ NINV` : "Not yet reached"}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cumulative Profit vs Break-Even</CardTitle></CardHeader>
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
                <p>• Operating break-even at approximately <span className="font-semibold text-foreground">{Math.ceil(annualOpexTotal / (assumptions.studentsPerInstitution * TIERS[3].pricePerStudentPerYear))} paying institution{Math.ceil(annualOpexTotal / (assumptions.studentsPerInstitution * TIERS[3].pricePerStudentPerYear)) !== 1 ? "s" : ""}</span></p>
                <p>• Full investment break-even (including {formatCurrency(ninvTotal)} NINV): approximately <span className="font-semibold text-foreground">2–3 institutional clients</span></p>
                <p>• Profitability expected within <span className="font-semibold text-foreground">18–24 months</span> under conservative B2B growth</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================== PRO-FORMA P&L ======================== */}
          <TabsContent value="proforma">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pro-Forma Income Statement (Quarterly, 5 Years)</CardTitle></CardHeader>
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
                      <TableHead className="text-right">Total Rev</TableHead>
                      <TableHead className="text-right">GP</TableHead>
                      <TableHead className="text-right">GP%</TableHead>
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
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(row.totalRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-primary">{formatCurrency(row.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {row.totalRevenue > 0 ? `${Math.round(row.grossMargin * 100)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-destructive">{formatCurrency(row.opex)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-semibold ${row.netIncome >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(row.netIncome)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {annualSummary.map(y => (
                      <TableRow key={y.year} className="bg-muted/50 font-semibold border-t-2 border-primary/20">
                        <TableCell className="sticky left-0 bg-muted/50 z-10 font-bold">{y.year} Total</TableCell>
                        <TableCell className="text-right font-mono text-sm">{y.institutions}</TableCell>
                        <TableCell className="text-right" />
                        <TableCell className="text-right font-mono text-sm">{y.students.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.hw)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.impl)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(y.saas)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold">{formatCurrency(y.revenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-primary">{formatCurrency(y.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {y.revenue > 0 ? `${Math.round((y.grossProfit / y.revenue) * 100)}%` : "—"}
                        </TableCell>
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

          {/* ======================== ASSUMPTIONS ======================== */}
          <TabsContent value="assumptions">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  {hasUnsavedChanges && <span className="text-xs text-destructive/80 font-medium">● Unsaved changes</span>}
                  {savedIndicator && <span className="text-xs text-primary font-medium animate-in fade-in duration-300">✓ Saved</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5" disabled={!hasUnsavedChanges || saving} onClick={saveAssumptions}>
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

              {/* NINV */}
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
                        <Input type="number" step={500} value={assumptions.ninv[key]} onChange={(e) => updateNINV(key, e.target.value)} className="h-9 font-mono text-sm" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Annual OPEX */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Annual Operating Costs (Year 1) — Total: {formatCurrency(annualOpexTotal)}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {([
                      { key: "salaries" as const, label: "Salaries" },
                      { key: "cloudInfra" as const, label: "Cloud Infrastructure" },
                      { key: "softwareMaintenance" as const, label: "Software Maintenance" },
                      { key: "salesOutreach" as const, label: "Sales & Outreach" },
                      { key: "customerSupport" as const, label: "Customer Support" },
                      { key: "generalAdmin" as const, label: "General & Admin" },
                    ]).map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <Input type="number" step={500} value={assumptions.annualOpex[key]} onChange={(e) => updateOpex(key, e.target.value)} className="h-9 font-mono text-sm" />
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
                      { key: "postForecastHalfYearGrowth" as const, label: "Post-2030 Growth (inst/half-yr)", step: 1 },
                    ]).map(({ key, label, step }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <Input type="number" step={step} value={assumptions[key]} onChange={(e) => updateScalar(key, e.target.value)} className="h-9 font-mono text-sm" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Adoption table */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Institution Adoption — Tier 3 (Cumulative, 2026–2030)</CardTitle></CardHeader>
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
                        {halfKeys.map((hk, idx) => (
                          <TableRow key={hk} className={hk.startsWith("h1_202") && hk !== "h1_2026" ? "border-t border-border/60" : ""}>
                            <TableCell className="font-medium">{halfLabels[idx]}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                className="h-8 w-20 font-mono text-sm ml-auto"
                                value={assumptions[hk].tier3}
                                onChange={(e) => updateHalfYear(hk, "tier3", e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
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
