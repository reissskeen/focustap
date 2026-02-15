import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Presentation, TrendingUp, DollarSign, Building2, BarChart3, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from "recharts";
import { defaultAssumptions, generateForecast, formatCurrency, formatPercent, type Assumptions } from "@/lib/financialData";

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

export default function Financials() {
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);

  const forecast = useMemo(() => generateForecast(assumptions), [assumptions]);

  const chartData = forecast.map((d) => ({
    label: `${d.year.replace("FY ", "'")} ${d.quarter}`,
    totalRevenue: d.totalRevenue,
    subscriptionRevenue: d.subscriptionRevenue,
    hardwareRevenue: d.hardwareRevenue,
    grossProfit: d.grossProfit,
    ebitda: d.ebitda,
    desksDeployed: d.desksDeployed,
    institutions: d.institutions,
    mrr: d.mrr,
    grossMargin: Math.round(d.grossMargin * 100),
    ebitdaMargin: Math.round(d.ebitdaMargin * 100),
  }));

  const lastQ = forecast[forecast.length - 1];
  const totalRevY3 = forecast.filter(d => d.year === "FY 2028").reduce((s, d) => s + d.totalRevenue, 0);
  const totalHwRevY3 = forecast.filter(d => d.year === "FY 2028").reduce((s, d) => s + d.hardwareRevenue, 0);
  const totalSubRevY3 = forecast.filter(d => d.year === "FY 2028").reduce((s, d) => s + d.subscriptionRevenue, 0);

  const updateAssumption = (key: keyof Assumptions, value: string) => {
    setAssumptions(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
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
              B2B SaaS + Hardware · March 2026
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
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <KPICard title="ARR (Year 3)" value={formatCurrency(lastQ.arr)} subtitle={`${lastQ.institutions} institutions`} icon={DollarSign} />
          <KPICard title="MRR (Latest)" value={formatCurrency(lastQ.mrr)} subtitle={`${lastQ.desksDeployed.toLocaleString()} desks`} icon={TrendingUp} />
          <KPICard title="Institutions" value={lastQ.institutions.toString()} subtitle={`${lastQ.desksDeployed.toLocaleString()} desks deployed`} icon={Building2} />
          <KPICard title="Hardware Rev (Y3)" value={formatCurrency(totalHwRevY3)} subtitle="One-time NFC sales" icon={HardDrive} />
          <KPICard title="Gross Margin" value={formatPercent(lastQ.grossMargin)} subtitle={`EBITDA: ${formatPercent(lastQ.ebitdaMargin)}`} icon={BarChart3} />
        </motion.div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
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
                      <Bar dataKey="subscriptionRevenue" name="SaaS Subscription" stackId="rev" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="hardwareRevenue" name="NFC Hardware" stackId="rev" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
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
                <CardHeader className="pb-2"><CardTitle className="text-sm">Institutions</CardTitle></CardHeader>
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
                      <TableHead className="text-right">Desks</TableHead>
                      <TableHead className="text-right">HW Rev</TableHead>
                      <TableHead className="text-right">SaaS Rev</TableHead>
                      <TableHead className="text-right">Total Rev</TableHead>
                      <TableHead className="text-right">COGS</TableHead>
                      <TableHead className="text-right">GP</TableHead>
                      <TableHead className="text-right">GM %</TableHead>
                      <TableHead className="text-right">EBITDA</TableHead>
                      <TableHead className="text-right">EBITDA %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((row, i) => (
                      <TableRow key={i} className={row.quarter === "Q1" ? "border-t-2 border-border" : ""}>
                        <TableCell className="font-medium sticky left-0 bg-card z-10 whitespace-nowrap">
                          {row.year} {row.quarter}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{row.institutions}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{row.desksDeployed.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.hardwareRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.subscriptionRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(row.totalRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">({formatCurrency(row.totalCogs)})</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatPercent(row.grossMargin)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-semibold ${row.ebitda >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(row.ebitda)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${row.ebitdaMargin >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatPercent(row.ebitdaMargin)}
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
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Model Assumptions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {([
                    { key: "nfcTagCost", label: "NFC Tag Cost ($)", step: 0.1 },
                    { key: "nfcTagPrice", label: "NFC Tag Price ($)", step: 0.5 },
                    { key: "desksPerInstitution", label: "Desks per Institution", step: 100 },
                    { key: "pricePerDeskPerMonth", label: "Subscription $/Desk/Mo", step: 0.5 },
                    { key: "year1Institutions", label: "Year 1 Institutions", step: 1 },
                    { key: "year2Institutions", label: "Year 2 Institutions", step: 1 },
                    { key: "year3Institutions", label: "Year 3 Institutions", step: 1 },
                    { key: "initialRolloutPercent", label: "Initial Rollout %", step: 0.05 },
                    { key: "salesMarketingPercent", label: "S&M %", step: 0.01 },
                    { key: "rdPercent", label: "R&D %", step: 0.01 },
                    { key: "gaPercent", label: "G&A %", step: 0.01 },
                    { key: "annualChurnRate", label: "Annual Churn %", step: 0.01 },
                  ] as const).map(({ key, label, step }) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
