import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Presentation, TrendingUp, DollarSign, Users, BarChart3 } from "lucide-react";
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
    revenue: d.revenue,
    subscriptionRevenue: d.subscriptionRevenue,
    enterpriseRevenue: d.enterpriseRevenue,
    grossProfit: d.grossProfit,
    ebitda: d.ebitda,
    users: d.users,
    grossMargin: Math.round(d.grossMargin * 100),
    ebitdaMargin: Math.round(d.ebitdaMargin * 100),
  }));

  const lastQ = forecast[forecast.length - 1];
  const firstQ = forecast[0];
  const totalRevY3 = forecast.filter(d => d.year === "FY 2028").reduce((s, d) => s + d.revenue, 0);
  const totalRevY1 = forecast.filter(d => d.year === "FY 2026").reduce((s, d) => s + d.revenue, 0);

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
              Board Deck — March 2026
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
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <KPICard title="ARR (Year 3)" value={formatCurrency(totalRevY3)} subtitle={`${lastQ.users.toLocaleString()} users`} icon={DollarSign} />
          <KPICard title="Revenue Growth" value={`${((totalRevY3 / totalRevY1 - 1) * 100).toFixed(0)}%`} subtitle="Y1 → Y3 total" icon={TrendingUp} />
          <KPICard title="Users (Year 3)" value={lastQ.users.toLocaleString()} subtitle={`${lastQ.institutions} institutions`} icon={Users} />
          <KPICard title="Gross Margin" value={formatPercent(lastQ.grossMargin)} subtitle={`EBITDA: ${formatPercent(lastQ.ebitdaMargin)}`} icon={BarChart3} />
        </motion.div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="proforma">Pro-Forma P&L</TabsTrigger>
            <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Quarterly Revenue</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="subscriptionRevenue" name="Subscription" stackId="rev" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="enterpriseRevenue" name="Enterprise" stackId="rev" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">User Growth</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" name="Active Users" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </AreaChart>
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
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">COGS</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead className="text-right">GM %</TableHead>
                      <TableHead className="text-right">S&M</TableHead>
                      <TableHead className="text-right">R&D</TableHead>
                      <TableHead className="text-right">G&A</TableHead>
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
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">({formatCurrency(row.cogs)})</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.grossProfit)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatPercent(row.grossMargin)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">({formatCurrency(row.salesMarketing)})</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">({formatCurrency(row.rdExpense)})</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">({formatCurrency(row.gaExpense)})</TableCell>
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
                    { key: "startingUsers", label: "Starting Users", step: 50 },
                    { key: "monthlyUserGrowthRate", label: "Monthly User Growth %", step: 0.01 },
                    { key: "subscriptionPrice", label: "Subscription Price ($/mo)", step: 1 },
                    { key: "enterpriseDealSize", label: "Enterprise Deal Size ($)", step: 5000 },
                    { key: "enterpriseDealsPerQuarter", label: "Enterprise Deals/Quarter", step: 1 },
                    { key: "cogsPercent", label: "COGS %", step: 0.01 },
                    { key: "salesMarketingPercent", label: "S&M %", step: 0.01 },
                    { key: "rdPercent", label: "R&D %", step: 0.01 },
                    { key: "gaPercent", label: "G&A %", step: 0.01 },
                    { key: "churnRate", label: "Monthly Churn %", step: 0.01 },
                    { key: "cacPerUser", label: "CAC per User ($)", step: 1 },
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
