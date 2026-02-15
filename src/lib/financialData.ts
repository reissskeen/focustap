// 3-Year Revenue Forecast & Pro-Forma Financial Model
// FocusTap — B2B Institutional SaaS + NFC Hardware Model
// March 2026 Board of Directors Presentation

export interface YearlyFinancials {
  year: string;
  quarter: string;
  // Institutions & desks
  institutions: number;
  newInstitutions: number;
  desksDeployed: number;
  newDesks: number;
  // Hardware revenue (one-time)
  hardwareRevenue: number;
  hardwareCogs: number;
  hardwareGrossProfit: number;
  // Subscription revenue (recurring)
  subscriptionRevenue: number;
  mrr: number;
  arr: number;
  // Combined
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMargin: number;
  // Opex
  salesMarketing: number;
  rdExpense: number;
  gaExpense: number;
  totalOpex: number;
  // Bottom line
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
}

export interface Assumptions {
  // Hardware
  nfcTagCost: number;
  nfcTagPrice: number;
  desksPerInstitution: number;
  // Subscription
  pricePerDeskPerMonth: number;
  // Adoption timeline — cumulative institutions by end of each half-year
  h1_2026: number; // end of H1 2026 (Q1-Q2)
  h2_2026: number; // end of H2 2026 (Q3-Q4)
  h1_2027: number;
  h2_2027: number;
  h1_2028: number;
  h2_2028: number;
  // Rollout: fraction of desks deployed in first quarter at new institution
  initialRolloutPercent: number;
  // Opex as % of total revenue
  salesMarketingPercent: number;
  rdPercent: number;
  gaPercent: number;
  // Retention
  annualChurnRate: number;
}

export const defaultAssumptions: Assumptions = {
  nfcTagCost: 0.50,
  nfcTagPrice: 2.00,
  desksPerInstitution: 1000,
  pricePerDeskPerMonth: 3,
  h1_2026: 1,
  h2_2026: 1,
  h1_2027: 3,
  h2_2027: 5,
  h1_2028: 8,
  h2_2028: 15,
  initialRolloutPercent: 0.25,
  salesMarketingPercent: 0.30,
  rdPercent: 0.25,
  gaPercent: 0.10,
  annualChurnRate: 0.05,
};

export function generateForecast(a: Assumptions): YearlyFinancials[] {
  const data: YearlyFinancials[] = [];
  const years = ["FY 2026", "FY 2027", "FY 2028"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  // Semi-annual targets mapped to each quarter (Q1-Q2 use H1, Q3-Q4 use H2)
  const halfTargets: number[] = [
    a.h1_2026, a.h1_2026, a.h2_2026, a.h2_2026,
    a.h1_2027, a.h1_2027, a.h2_2027, a.h2_2027,
    a.h1_2028, a.h1_2028, a.h2_2028, a.h2_2028,
  ];

  let cumulativeInstitutions = 0;
  let cumulativeDesks = 0;

  for (let i = 0; i < 12; i++) {
    const y = Math.floor(i / 4);
    const q = i % 4;

    // Interpolate: each quarter within a half gets proportional share
    const isFirstOfHalf = q === 0 || q === 2;
    const halfTarget = halfTargets[i];
    const newInHalf = Math.max(0, halfTarget - cumulativeInstitutions);
    // Split half's new institutions: first quarter gets ceil, second gets remainder
    const newInst = isFirstOfHalf ? Math.ceil(newInHalf * 0.5) : Math.max(0, newInHalf - Math.ceil(newInHalf * 0.5));
    cumulativeInstitutions += newInst;

    const newDesksFromNewInst = Math.round(newInst * a.desksPerInstitution * a.initialRolloutPercent);
    const maxDesks = cumulativeInstitutions * a.desksPerInstitution;
    const rampDesks = Math.round((maxDesks - cumulativeDesks - newDesksFromNewInst) * 0.3);
    const totalNewDesks = newDesksFromNewInst + Math.max(0, rampDesks);
    cumulativeDesks = Math.min(maxDesks, cumulativeDesks + totalNewDesks);

    // Apply churn (quarterly)
    const churnedDesks = Math.round(cumulativeDesks * (a.annualChurnRate / 4));
    cumulativeDesks = Math.max(0, cumulativeDesks - churnedDesks);

    const hardwareRevenue = totalNewDesks * a.nfcTagPrice;
    const hardwareCogs = totalNewDesks * a.nfcTagCost;
    const hardwareGrossProfit = hardwareRevenue - hardwareCogs;

    const mrr = cumulativeDesks * a.pricePerDeskPerMonth;
    const subscriptionRevenue = mrr * 3;
    const arr = mrr * 12;

    const totalRevenue = hardwareRevenue + subscriptionRevenue;
    const subscriptionCogs = subscriptionRevenue * 0.15;
    const totalCogs = hardwareCogs + subscriptionCogs;
    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

    const salesMarketing = totalRevenue * a.salesMarketingPercent;
    const rdExpense = totalRevenue * a.rdPercent;
    const gaExpense = totalRevenue * a.gaPercent;
    const totalOpex = salesMarketing + rdExpense + gaExpense;

    const ebitda = grossProfit - totalOpex;
    const ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;
    const netIncome = ebitda * 0.85;

    data.push({
      year: years[y],
      quarter: quarters[q],
      institutions: cumulativeInstitutions,
      newInstitutions: newInst,
      desksDeployed: cumulativeDesks,
      newDesks: totalNewDesks,
      hardwareRevenue: Math.round(hardwareRevenue),
      hardwareCogs: Math.round(hardwareCogs),
      hardwareGrossProfit: Math.round(hardwareGrossProfit),
      subscriptionRevenue: Math.round(subscriptionRevenue),
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      totalRevenue: Math.round(totalRevenue),
      totalCogs: Math.round(totalCogs),
      grossProfit: Math.round(grossProfit),
      grossMargin,
      salesMarketing: Math.round(salesMarketing),
      rdExpense: Math.round(rdExpense),
      gaExpense: Math.round(gaExpense),
      totalOpex: Math.round(totalOpex),
      ebitda: Math.round(ebitda),
      ebitdaMargin,
      netIncome: Math.round(netIncome),
    });
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
