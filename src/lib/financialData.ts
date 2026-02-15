// 3-Year Revenue Forecast & Pro-Forma Financial Model
// FocusTap — B2B Institutional SaaS + NFC Hardware · Tiered Pricing
// March 2026 Board of Directors Presentation

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Tier = 1 | 2 | 3;

export interface TierConfig {
  name: string;
  tag: string;
  pricePerDeskPerYear: number;
  implementationFee: number;
}

export const TIERS: Record<Tier, TierConfig> = {
  1: { name: "Core Analytics", tag: "Tier 1", pricePerDeskPerYear: 18, implementationFee: 3_000 },
  2: { name: "Advanced Engagement", tag: "Tier 2", pricePerDeskPerYear: 30, implementationFee: 7_500 },
  3: { name: "Full Campus Intelligence", tag: "Tier 3", pricePerDeskPerYear: 50, implementationFee: 15_000 },
};

export interface InstitutionPlan {
  tier: Tier;
  count: number; // how many institutions at this tier
}

export interface HalfYearAdoption {
  tier1: number;
  tier2: number;
  tier3: number;
}

export interface Assumptions {
  // Hardware
  nfcTagCost: number;
  nfcTagPrice: number;
  desksPerInstitution: number;
  // Adoption timeline — cumulative institutions by end of each half-year, broken by tier
  h1_2026: HalfYearAdoption;
  h2_2026: HalfYearAdoption;
  h1_2027: HalfYearAdoption;
  h2_2027: HalfYearAdoption;
  h1_2028: HalfYearAdoption;
  h2_2028: HalfYearAdoption;
  // Rollout: fraction of desks deployed in first quarter at new institution
  initialRolloutPercent: number;
  // Opex as % of total revenue
  salesMarketingPercent: number;
  rdPercent: number;
  gaPercent: number;
  // Retention
  annualChurnRate: number;
  // Land-and-expand: fraction of Tier 1 institutions that upgrade to Tier 2 within 12 months
  tier1UpgradeRate: number;
}

export const defaultAssumptions: Assumptions = {
  nfcTagCost: 0.50,
  nfcTagPrice: 2.00,
  desksPerInstitution: 1000,
  // Cumulative institutions per tier at end of each half
  h1_2026: { tier1: 1, tier2: 0, tier3: 0 },
  h2_2026: { tier1: 1, tier2: 0, tier3: 0 },
  h1_2027: { tier1: 2, tier2: 1, tier3: 0 },
  h2_2027: { tier1: 2, tier2: 2, tier3: 1 },
  h1_2028: { tier1: 3, tier2: 3, tier3: 2 },
  h2_2028: { tier1: 4, tier2: 6, tier3: 5 },
  initialRolloutPercent: 0.25,
  salesMarketingPercent: 0.30,
  rdPercent: 0.25,
  gaPercent: 0.10,
  annualChurnRate: 0.03,
  tier1UpgradeRate: 0.50,
};

export interface YearlyFinancials {
  year: string;
  quarter: string;
  // Institutions by tier
  tier1Inst: number;
  tier2Inst: number;
  tier3Inst: number;
  institutions: number;
  newInstitutions: number;
  desksDeployed: number;
  newDesks: number;
  // Revenue streams
  hardwareRevenue: number;
  hardwareCogs: number;
  hardwareGrossProfit: number;
  implementationRevenue: number;
  subscriptionRevenue: number;
  expansionRevenue: number;
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

/* ------------------------------------------------------------------ */
/*  Forecast Engine                                                    */
/* ------------------------------------------------------------------ */

function totalAdoption(h: HalfYearAdoption): number {
  return h.tier1 + h.tier2 + h.tier3;
}

export function generateForecast(a: Assumptions): YearlyFinancials[] {
  const data: YearlyFinancials[] = [];
  const years = ["FY 2026", "FY 2027", "FY 2028"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  const halfTargets: HalfYearAdoption[] = [
    a.h1_2026, a.h1_2026, a.h2_2026, a.h2_2026,
    a.h1_2027, a.h1_2027, a.h2_2027, a.h2_2027,
    a.h1_2028, a.h1_2028, a.h2_2028, a.h2_2028,
  ];

  let cumT1 = 0, cumT2 = 0, cumT3 = 0;
  let cumulativeDesks = 0;

  // Track when T1 institutions were added for upgrade modelling
  const tier1AddedQuarter: number[] = [];

  for (let i = 0; i < 12; i++) {
    const y = Math.floor(i / 4);
    const q = i % 4;
    const isFirstOfHalf = q === 0 || q === 2;
    const target = halfTargets[i];

    // Compute new institutions per tier this quarter
    const allocate = (cumVal: number, targetVal: number, otherNewInHalf: number, isFirst: boolean, totalNewInHalf: number): number => {
      const newInHalf = Math.max(0, targetVal - cumVal);
      return isFirst ? Math.ceil(newInHalf * 0.5) : Math.max(0, newInHalf - Math.ceil(newInHalf * 0.5));
    };

    const newT1 = allocate(cumT1, target.tier1, 0, isFirstOfHalf, 0);
    const newT2 = allocate(cumT2, target.tier2, 0, isFirstOfHalf, 0);
    const newT3 = allocate(cumT3, target.tier3, 0, isFirstOfHalf, 0);

    // Land-and-expand: T1 institutions that have been on for 4 quarters upgrade to T2
    let upgrades = 0;
    if (a.tier1UpgradeRate > 0) {
      for (let j = tier1AddedQuarter.length - 1; j >= 0; j--) {
        if (i - tier1AddedQuarter[j] >= 4) {
          upgrades++;
          tier1AddedQuarter.splice(j, 1);
        }
      }
      upgrades = Math.round(upgrades * a.tier1UpgradeRate);
    }

    // Track new T1 adds
    for (let n = 0; n < newT1; n++) tier1AddedQuarter.push(i);

    cumT1 += newT1 - upgrades;
    cumT2 += newT2 + upgrades;
    cumT3 += newT3;

    const cumulativeInstitutions = cumT1 + cumT2 + cumT3;
    const totalNewInst = newT1 + newT2 + newT3;

    // Desk deployment
    const newDesksFromNewInst = Math.round(totalNewInst * a.desksPerInstitution * a.initialRolloutPercent);
    const maxDesks = cumulativeInstitutions * a.desksPerInstitution;
    const rampDesks = Math.round((maxDesks - cumulativeDesks - newDesksFromNewInst) * 0.3);
    const totalNewDesks = newDesksFromNewInst + Math.max(0, rampDesks);
    cumulativeDesks = Math.min(maxDesks, cumulativeDesks + totalNewDesks);

    // Churn
    const churnedDesks = Math.round(cumulativeDesks * (a.annualChurnRate / 4));
    cumulativeDesks = Math.max(0, cumulativeDesks - churnedDesks);

    // Hardware revenue
    const hardwareRevenue = totalNewDesks * a.nfcTagPrice;
    const hardwareCogs = totalNewDesks * a.nfcTagCost;
    const hardwareGrossProfit = hardwareRevenue - hardwareCogs;

    // Implementation fees (one-time, on new institutions)
    const implementationRevenue =
      newT1 * TIERS[1].implementationFee +
      newT2 * TIERS[2].implementationFee +
      newT3 * TIERS[3].implementationFee;

    // Subscription revenue (quarterly) — weighted by tier mix
    // Distribute desks proportionally across tiers
    const totalInst = cumulativeInstitutions || 1;
    const t1Frac = cumT1 / totalInst;
    const t2Frac = cumT2 / totalInst;
    const t3Frac = cumT3 / totalInst;

    const weightedPricePerDeskPerYear =
      t1Frac * TIERS[1].pricePerDeskPerYear +
      t2Frac * TIERS[2].pricePerDeskPerYear +
      t3Frac * TIERS[3].pricePerDeskPerYear;

    const annualSubPerDesk = weightedPricePerDeskPerYear;
    const quarterlySubRevenue = (cumulativeDesks * annualSubPerDesk) / 4;

    // Expansion revenue from tier upgrades
    const expansionRevenue = upgrades > 0
      ? (upgrades * a.desksPerInstitution * (TIERS[2].pricePerDeskPerYear - TIERS[1].pricePerDeskPerYear)) / 4
      : 0;

    const subscriptionRevenue = quarterlySubRevenue;
    const mrr = (cumulativeDesks * annualSubPerDesk) / 12;
    const arr = cumulativeDesks * annualSubPerDesk;

    const totalRevenue = hardwareRevenue + implementationRevenue + subscriptionRevenue + expansionRevenue;
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
      tier1Inst: cumT1,
      tier2Inst: cumT2,
      tier3Inst: cumT3,
      institutions: cumulativeInstitutions,
      newInstitutions: totalNewInst,
      desksDeployed: cumulativeDesks,
      newDesks: totalNewDesks,
      hardwareRevenue: Math.round(hardwareRevenue),
      hardwareCogs: Math.round(hardwareCogs),
      hardwareGrossProfit: Math.round(hardwareGrossProfit),
      implementationRevenue: Math.round(implementationRevenue),
      subscriptionRevenue: Math.round(subscriptionRevenue),
      expansionRevenue: Math.round(expansionRevenue),
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
