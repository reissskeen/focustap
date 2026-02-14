// 3-Year Revenue Forecast & Pro-Forma Financial Model
// FocusTap — March 2026 Board of Directors Presentation

export interface YearlyFinancials {
  year: string;
  quarter: string;
  revenue: number;
  subscriptionRevenue: number;
  enterpriseRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  salesMarketing: number;
  rdExpense: number;
  gaExpense: number;
  totalOpex: number;
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
  users: number;
  institutions: number;
  arpu: number;
  churnRate: number;
  cac: number;
  ltv: number;
  mrrGrowth: number;
}

export interface Assumptions {
  startingUsers: number;
  monthlyUserGrowthRate: number;
  subscriptionPrice: number;
  enterpriseDealSize: number;
  enterpriseDealsPerQuarter: number;
  cogsPercent: number;
  salesMarketingPercent: number;
  rdPercent: number;
  gaPercent: number;
  churnRate: number;
  cacPerUser: number;
}

export const defaultAssumptions: Assumptions = {
  startingUsers: 500,
  monthlyUserGrowthRate: 0.15,
  subscriptionPrice: 8,
  enterpriseDealSize: 25000,
  enterpriseDealsPerQuarter: 1,
  cogsPercent: 0.20,
  salesMarketingPercent: 0.30,
  rdPercent: 0.25,
  gaPercent: 0.10,
  churnRate: 0.05,
  cacPerUser: 12,
};

export function generateForecast(assumptions: Assumptions): YearlyFinancials[] {
  const data: YearlyFinancials[] = [];
  let users = assumptions.startingUsers;
  let enterpriseDeals = assumptions.enterpriseDealsPerQuarter;

  const years = ["FY 2026", "FY 2027", "FY 2028"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  for (let y = 0; y < 3; y++) {
    for (let q = 0; q < 4; q++) {
      // Grow users monthly (3 months per quarter)
      for (let m = 0; m < 3; m++) {
        users = Math.round(users * (1 + assumptions.monthlyUserGrowthRate) * (1 - assumptions.churnRate / 12));
      }

      const subscriptionRevenue = users * assumptions.subscriptionPrice * 3;
      const enterpriseRevenue = enterpriseDeals * assumptions.enterpriseDealSize;
      const revenue = subscriptionRevenue + enterpriseRevenue;

      const cogs = revenue * assumptions.cogsPercent;
      const grossProfit = revenue - cogs;
      const grossMargin = revenue > 0 ? grossProfit / revenue : 0;

      const salesMarketing = revenue * assumptions.salesMarketingPercent;
      const rdExpense = revenue * assumptions.rdPercent;
      const gaExpense = revenue * assumptions.gaPercent;
      const totalOpex = salesMarketing + rdExpense + gaExpense;

      const ebitda = grossProfit - totalOpex;
      const ebitdaMargin = revenue > 0 ? ebitda / revenue : 0;
      const netIncome = ebitda * 0.85; // simplified tax

      const institutions = Math.max(1, Math.floor(users / 200));
      const arpu = users > 0 ? revenue / users / 3 : 0;
      const ltv = arpu * 12 / Math.max(assumptions.churnRate, 0.01);

      data.push({
        year: years[y],
        quarter: quarters[q],
        revenue: Math.round(revenue),
        subscriptionRevenue: Math.round(subscriptionRevenue),
        enterpriseRevenue: Math.round(enterpriseRevenue),
        cogs: Math.round(cogs),
        grossProfit: Math.round(grossProfit),
        grossMargin,
        salesMarketing: Math.round(salesMarketing),
        rdExpense: Math.round(rdExpense),
        gaExpense: Math.round(gaExpense),
        totalOpex: Math.round(totalOpex),
        ebitda: Math.round(ebitda),
        ebitdaMargin,
        netIncome: Math.round(netIncome),
        users,
        institutions,
        arpu: Math.round(arpu * 100) / 100,
        churnRate: assumptions.churnRate,
        cac: assumptions.cacPerUser,
        ltv: Math.round(ltv),
        mrrGrowth: assumptions.monthlyUserGrowthRate,
      });

      // Scale enterprise deals
      enterpriseDeals = Math.round(enterpriseDeals * 1.15);
    }
  }

  return data;
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
