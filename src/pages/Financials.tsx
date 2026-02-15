import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Presentation, TrendingUp, DollarSign, Building2, BarChart3, HardDrive, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, PieChart, Pie, Cell,
} from "recharts";
import { defaultAssumptions, generateForecast, formatCurrency, formatPercent, TIERS, type Assumptions, type HalfYearAdoption } from "@/lib/financialData";

const KPICard = ({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: any }) => (
  <Card className="border-border/60">
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

  const chartData = forecast.map((d) => ({
    label: `${d.year.replace("FY ", "'")} ${d.quarter}`,
    totalRevenue: d.totalRevenue,
    subscriptionRevenue: d.subscriptionRevenue,
    hardwareRevenue: d.hardwareRevenue,
    implementationRevenue: d.implementationRevenue,
    expansionRevenue: d.expansionRevenue,
    grossProfit: d.grossProfit,
    ebitda: d.ebitda,
    desksDeployed: d.desksDeployed,
    institutions: d.institutions,
    tier1Inst: d.tier1Inst,
    tier2Inst: d.tier2Inst,
    tier3Inst: d.tier3Inst,
    mrr: d.mrr,
    grossMargin: Math.round(d.grossMargin * 100),
    ebitdaMargin: Math.round(d.ebitdaMargin * 100),
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

  const updateAssumption = (key: keyof Assumptions, value: string) => {
    setAssumptions(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const halfKeys = ["h1_2026", "h2_2026", "h1_2027", "h2_2027", "h1_2028", "h2_2028"] as const;
  const halfLabels = ["H1 2026", "H2 2026", "H1 2027", "H2 2027", "H1 2028", "H2 2028"];

  const updateHalfYear = (halfKey: typeof halfKeys[number], tierKey: keyof HalfYearAdoption, value: string) => {
    setAssumptions(prev => ({
      ...prev,
      [halfKey]: { ...prev[halfKey], [tierKey]: parseInt(value) || 0 },
    }));
  };

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
              Tiered SaaS + Hardware · March 2026
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
          className="grid grid-cols-2 md:grid-cols-6 gap-4"
        >
          <KPICard title="ARR (Year 3)" value={formatCurrency(lastQ.arr)} subtitle={`${lastQ.institutions} institutions`} icon={DollarSign} />
          <KPICard title="MRR (Latest)" value={formatCurrency(lastQ.mrr)} subtitle={`${lastQ.desksDeployed.toLocaleString()} desks`} icon={TrendingUp} />
          <KPICard title="Institutions" value={lastQ.institutions.toString()} subtitle={`T1:${lastQ.tier1Inst} T2:${lastQ.tier2Inst} T3:${lastQ.tier3Inst}`} icon={Building2} />
          <KPICard title="Impl. Fees (Total)" value={formatCurrency(totalImplRev)} subtitle="One-time setup" icon={HardDrive} />
          <KPICard title="Expansion Rev" value={formatCurrency(totalExpansionRev)} subtitle="Tier upgrades" icon={Layers} />
          <KPICard title="Gross Margin" value={formatPercent(lastQ.grossMargin)} subtitle={`EBITDA: ${formatPercent(lastQ.ebitdaMargin)}`} icon={BarChart3} />
        </motion.div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="tiers">Tier Mix</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
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
                        {t === 2 && <span className="text-xs text-primary font-medium">Recommended</span>}
                      </div>
                      <h3 className="font-semibold text-foreground">{TIERS[t].name}</h3>
                      <p className="text-2xl font-bold text-foreground mt-1">${TIERS[t].pricePerDeskPerYear}<span className="text-sm font-normal text-muted-foreground">/desk/yr</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Implementation: {formatCurrency(TIERS[t].implementationFee)}</p>
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
                <CardHeader className="pb-2"><CardTitle className="text-sm">Desks Deployed</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip />
                      <Area type="monotone" dataKey="desksDeployed" name="Desks Deployed" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
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
          </TabsContent>

          {/* Profitability Tab */}
          <TabsContent value="profitability" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Gross Profit & EBITDA</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="grossProfit" name="Gross Profit" fill="hsl(var(--primary) / 0.6)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ebitda" name="EBITDA" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
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
                      <Line type="monotone" dataKey="grossMargin" name="Gross Margin %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ebitdaMargin" name="EBITDA Margin %" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
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
                      <TableHead className="text-right">Desks</TableHead>
                      <TableHead className="text-right">HW Rev</TableHead>
                      <TableHead className="text-right">Impl.</TableHead>
                      <TableHead className="text-right">SaaS Rev</TableHead>
                      <TableHead className="text-right">Expand</TableHead>
                      <TableHead className="text-right">Total Rev</TableHead>
                      <TableHead className="text-right">GP</TableHead>
                      <TableHead className="text-right">GM %</TableHead>
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
                        <TableCell className="text-right font-mono text-sm">{row.desksDeployed.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.hardwareRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.implementationRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.subscriptionRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-primary">{row.expansionRevenue > 0 ? formatCurrency(row.expansionRevenue) : "—"}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(row.totalRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatPercent(row.grossMargin)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-semibold ${row.ebitda >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(row.ebitda)}
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
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">General Assumptions</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {([
                      { key: "nfcTagCost" as const, label: "NFC Tag Cost ($)", step: 0.1 },
                      { key: "nfcTagPrice" as const, label: "NFC Tag Price ($)", step: 0.5 },
                      { key: "desksPerInstitution" as const, label: "Desks per Institution", step: 100 },
                      { key: "initialRolloutPercent" as const, label: "Initial Rollout %", step: 0.05 },
                      { key: "salesMarketingPercent" as const, label: "S&M %", step: 0.01 },
                      { key: "rdPercent" as const, label: "R&D %", step: 0.01 },
                      { key: "gaPercent" as const, label: "G&A %", step: 0.01 },
                      { key: "annualChurnRate" as const, label: "Annual Churn %", step: 0.01 },
                      { key: "tier1UpgradeRate" as const, label: "T1→T2 Upgrade Rate", step: 0.05 },
                    ]).map(({ key, label, step }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <Input
                          type="number"
                          step={step}
                          value={assumptions[key]}
                          onChange={(e) => updateAssumption(key, e.target.value)}
                          className="h-9 font-mono text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
