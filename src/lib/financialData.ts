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
  // Adoption timeline (institutions by year-end)
  year1Institutions: number;
  year2Institutions: number;
  year3Institutions: number;
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
  year1Institutions: 1,
  year2Institutions: 5,
  year3Institutions: 15,
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
  const targetByYear = [a.year1Institutions, a.year2Institutions, a.year3Institutions];

  let cumulativeInstitutions = 0;
  let cumulativeDesks = 0;

  for (let y = 0; y < 3; y++) {
    const yearTarget = targetByYear[y];
    const newInstitutionsThisYear = Math.max(0, yearTarget - cumulativeInstitutions);

    // Spread new institution onboarding across quarters (heavier in Q2-Q3 for B2B sales cycles)
    const quarterWeights = [0.1, 0.3, 0.35, 0.25];

    for (let q = 0; q < 4; q++) {
      const newInst = Math.round(newInstitutionsThisYear * quarterWeights[q]);
      cumulativeInstitutions += newInst;

      // New desks: new institutions deploy gradually
      // First quarter = initialRolloutPercent, then ramp to full over next quarters
      const newDesksFromNewInst = Math.round(newInst * a.desksPerInstitution * a.initialRolloutPercent);
      // Existing institutions ramp up remaining desks (10% of gap per quarter)
      const maxDesks = cumulativeInstitutions * a.desksPerInstitution;
      const rampDesks = Math.round((maxDesks - cumulativeDesks - newDesksFromNewInst) * 0.3);
      const totalNewDesks = newDesksFromNewInst + Math.max(0, rampDesks);
      cumulativeDesks = Math.min(maxDesks, cumulativeDesks + totalNewDesks);

      // Apply churn (quarterly)
      const churnedDesks = Math.round(cumulativeDesks * (a.annualChurnRate / 4));
      cumulativeDesks = Math.max(0, cumulativeDesks - churnedDesks);

      // Hardware revenue (one-time on new desks only)
      const hardwareRevenue = totalNewDesks * a.nfcTagPrice;
      const hardwareCogs = totalNewDesks * a.nfcTagCost;
      const hardwareGrossProfit = hardwareRevenue - hardwareCogs;

      // Subscription revenue (recurring, per desk per month, 3 months per quarter)
      const mrr = cumulativeDesks * a.pricePerDeskPerMonth;
      const subscriptionRevenue = mrr * 3;
      const arr = mrr * 12;

      const totalRevenue = hardwareRevenue + subscriptionRevenue;
      const subscriptionCogs = subscriptionRevenue * 0.15; // hosting/infra
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
