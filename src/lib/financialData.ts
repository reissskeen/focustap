// 3-Year Revenue Forecast & Pro-Forma Financial Model
// FocusTap — Enterprise B2B Campus Infrastructure SaaS + NFC Hardware
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

export interface HalfYearAdoption {
  tier1: number;
  tier2: number;
  tier3: number;
}

export interface NINV {
  softwareDev: number;
  nfcInventory: number;
  pilotDeployment: number;
  legalSetup: number;
  brandingWebsite: number;
}

export interface AnnualOpex {
  cloudInfra: number;
  softwareMaintenance: number;
  salesOutreach: number;
  customerSupport: number;
  generalAdmin: number;
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
  // Fixed operating costs (annual)
  annualOpex: AnnualOpex;
  // NINV (one-time initial investment)
  ninv: NINV;
  // OPEX growth rate per year (infrastructure scaling)
  opexGrowthRate: number;
  // Retention
  annualChurnRate: number;
  // Land-and-expand: fraction of Tier 1 institutions that upgrade to Tier 2 within 12 months
  tier1UpgradeRate: number;
  // SaaS COGS as % of subscription revenue
  saasCogsPct: number;
}

export function computeNINVTotal(ninv: NINV): number {
  return ninv.softwareDev + ninv.nfcInventory + ninv.pilotDeployment + ninv.legalSetup + ninv.brandingWebsite;
}

export function computeAnnualOpexTotal(opex: AnnualOpex): number {
  return opex.cloudInfra + opex.softwareMaintenance + opex.salesOutreach + opex.customerSupport + opex.generalAdmin;
}

export const defaultAssumptions: Assumptions = {
  nfcTagCost: 0.50,
  nfcTagPrice: 2.00,
  desksPerInstitution: 1000,
  // Realistic B2B adoption: Y1=1 pilot, Y2=5 total, Y3=15 total
  h1_2026: { tier1: 1, tier2: 0, tier3: 0 },
  h2_2026: { tier1: 1, tier2: 0, tier3: 0 },
  h1_2027: { tier1: 1, tier2: 2, tier3: 0 },
  h2_2027: { tier1: 1, tier2: 3, tier3: 1 },
  h1_2028: { tier1: 2, tier2: 5, tier3: 2 },
  h2_2028: { tier1: 2, tier2: 8, tier3: 5 },
  initialRolloutPercent: 0.25,
  annualOpex: {
    cloudInfra: 2_400,
    softwareMaintenance: 8_000,
    salesOutreach: 5_000,
    customerSupport: 3_000,
    generalAdmin: 3_600,
  },
  ninv: {
    softwareDev: 20_000,
    nfcInventory: 1_000,
    pilotDeployment: 3_000,
    legalSetup: 3_500,
    brandingWebsite: 2_500,
  },
  opexGrowthRate: 0.30, // 30% OPEX growth per year as we scale
  annualChurnRate: 0.03,
  tier1UpgradeRate: 0.50,
  saasCogsPct: 0.15,
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
  // Fixed Opex
  opex: number;
  // Bottom line
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
  // Cumulative
  cumulativeRevenue: number;
  cumulativeProfit: number;
}

/* ------------------------------------------------------------------ */
/*  Forecast Engine                                                    */
/* ------------------------------------------------------------------ */

export function generateForecast(a: Assumptions): YearlyFinancials[] {
  const data: YearlyFinancials[] = [];
  const years = ["FY 2026", "FY 2027", "FY 2028"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  const halfTargets: HalfYearAdoption[] = [
    a.h1_2026, a.h1_2026, a.h2_2026, a.h2_2026,
    a.h1_2027, a.h1_2027, a.h2_2027, a.h2_2027,
    a.h1_2028, a.h1_2028, a.h2_2028, a.h2_2028,
  ];

  const ninvTotal = computeNINVTotal(a.ninv);
  const baseAnnualOpex = computeAnnualOpexTotal(a.annualOpex);

  let cumT1 = 0, cumT2 = 0, cumT3 = 0;
  let cumulativeDesks = 0;
  let cumulativeRevenue = 0;
  let cumulativeProfit = 0;

  // Track when T1 institutions were added for upgrade modelling
  const tier1AddedQuarter: number[] = [];

  for (let i = 0; i < 12; i++) {
    const y = Math.floor(i / 4);
    const q = i % 4;
    const isFirstOfHalf = q === 0 || q === 2;
    const target = halfTargets[i];

    // Compute new institutions per tier this quarter
    const allocate = (cumVal: number, targetVal: number): number => {
      const newInHalf = Math.max(0, targetVal - cumVal);
      return isFirstOfHalf ? Math.ceil(newInHalf * 0.5) : Math.max(0, newInHalf - Math.ceil(newInHalf * 0.5));
    };

    const newT1 = allocate(cumT1, target.tier1);
    const newT2 = allocate(cumT2, target.tier2);
    const newT3 = allocate(cumT3, target.tier3);

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

    // Hardware revenue (one-time per new desk)
    const hardwareRevenue = totalNewDesks * a.nfcTagPrice;
    const hardwareCogs = totalNewDesks * a.nfcTagCost;
    const hardwareGrossProfit = hardwareRevenue - hardwareCogs;

    // Implementation fees (one-time, on new institutions)
    const implementationRevenue =
      newT1 * TIERS[1].implementationFee +
      newT2 * TIERS[2].implementationFee +
      newT3 * TIERS[3].implementationFee;

    // Subscription revenue (quarterly) — weighted by tier mix
    const totalInst = cumulativeInstitutions || 1;
    const t1Frac = cumT1 / totalInst;
    const t2Frac = cumT2 / totalInst;
    const t3Frac = cumT3 / totalInst;

    const weightedPricePerDeskPerYear =
      t1Frac * TIERS[1].pricePerDeskPerYear +
      t2Frac * TIERS[2].pricePerDeskPerYear +
      t3Frac * TIERS[3].pricePerDeskPerYear;

    const quarterlySubRevenue = (cumulativeDesks * weightedPricePerDeskPerYear) / 4;

    // Expansion revenue from tier upgrades
    const expansionRevenue = upgrades > 0
      ? (upgrades * a.desksPerInstitution * (TIERS[2].pricePerDeskPerYear - TIERS[1].pricePerDeskPerYear)) / 4
      : 0;

    const subscriptionRevenue = quarterlySubRevenue;
    const mrr = (cumulativeDesks * weightedPricePerDeskPerYear) / 12;
    const arr = cumulativeDesks * weightedPricePerDeskPerYear;

    const totalRevenue = hardwareRevenue + implementationRevenue + subscriptionRevenue + expansionRevenue;
    const subscriptionCogs = subscriptionRevenue * a.saasCogsPct;
    const totalCogs = hardwareCogs + subscriptionCogs;
    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

    // Fixed OPEX — scales by year with growth rate
    const yearlyOpex = baseAnnualOpex * Math.pow(1 + a.opexGrowthRate, y);
    const quarterlyOpex = yearlyOpex / 4;

    const ebitda = grossProfit - quarterlyOpex;
    const ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;
    const netIncome = ebitda; // pre-tax for simplicity at seed stage

    cumulativeRevenue += totalRevenue;
    cumulativeProfit += netIncome;

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
      opex: Math.round(quarterlyOpex),
      ebitda: Math.round(ebitda),
      ebitdaMargin,
      netIncome: Math.round(netIncome),
      cumulativeRevenue: Math.round(cumulativeRevenue),
      cumulativeProfit: Math.round(cumulativeProfit),
    });
  }

  return data;
}

/* ------------------------------------------------------------------ */
/*  Break-Even Analysis                                                */
/* ------------------------------------------------------------------ */

export interface BreakEvenResult {
  operatingBreakEvenQ: string | null; // quarter label where quarterly EBITDA >= 0
  fullBreakEvenQ: string | null;      // quarter label where cumulative profit covers NINV
  monthsToOperating: number | null;
  monthsToFull: number | null;
}

export function computeBreakEven(forecast: YearlyFinancials[], ninvTotal: number): BreakEvenResult {
  let operatingBreakEvenQ: string | null = null;
  let fullBreakEvenQ: string | null = null;
  let monthsToOperating: number | null = null;
  let monthsToFull: number | null = null;

  for (let i = 0; i < forecast.length; i++) {
    const d = forecast[i];
    if (!operatingBreakEvenQ && d.ebitda >= 0) {
      operatingBreakEvenQ = `${d.year} ${d.quarter}`;
      monthsToOperating = (i + 1) * 3;
    }
    if (!fullBreakEvenQ && d.cumulativeProfit >= ninvTotal) {
      fullBreakEvenQ = `${d.year} ${d.quarter}`;
      monthsToFull = (i + 1) * 3;
    }
  }

  return { operatingBreakEvenQ, fullBreakEvenQ, monthsToOperating, monthsToFull };
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
