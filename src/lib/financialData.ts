// 3-Year Revenue Forecast & Pro-Forma Financial Model
// FocusTap — Enterprise B2B Campus Infrastructure SaaS + NFC Hardware
// March 2026 Board of Directors Presentation

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Tier = 3;

export interface TierConfig {
  name: string;
  tag: string;
  pricePerStudentPerYear: number;
  implementationFee: number;
}

export const TIERS: Record<Tier, TierConfig> = {
  3: { name: "Full Campus Intelligence", tag: "Tier 3", pricePerStudentPerYear: 50, implementationFee: 15_000 },
};

export interface HalfYearAdoption {
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
  studentsPerInstitution: number;
  // Adoption timeline — cumulative institutions by end of each half-year
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
  // SaaS COGS as % of subscription revenue
  saasCogsPct: number;
  // Free-pilot GTM: number of institutions offered free subscription (implementation fee only)
  pilotFreeInstitutions: number;
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
  studentsPerInstitution: 1000,
  // Adoption timeline: Flagler free pilot Q3 2026 → 3 schools by H1 2027 → 5 by H2 2027 → 8 by H1 2028 → 15 by H2 2028
  h1_2026: { tier3: 0 },
  h2_2026: { tier3: 1 },
  h1_2027: { tier3: 3 },
  h2_2027: { tier3: 5 },
  h1_2028: { tier3: 8 },
  h2_2028: { tier3: 15 },
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
  opexGrowthRate: 0.30,
  annualChurnRate: 0.03,
  saasCogsPct: 0.15,
  pilotFreeInstitutions: 1,
};

export interface YearlyFinancials {
  year: string;
  quarter: string;
  // Institutions (all Tier 3)
  tier3Inst: number;
  institutions: number;
  newInstitutions: number;
  studentsDeployed: number;
  newStudents: number;
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

  let cumT3 = 0;
  let cumulativeStudents = 0;
  let cumulativeRevenue = 0;
  let cumulativeProfit = 0;

  for (let i = 0; i < 12; i++) {
    const y = Math.floor(i / 4);
    const q = i % 4;
    const isFirstOfHalf = q === 0 || q === 2;
    const target = halfTargets[i];

    // Compute new Tier 3 institutions this quarter
    const allocate = (cumVal: number, targetVal: number): number => {
      const newInHalf = Math.max(0, targetVal - cumVal);
      return isFirstOfHalf ? Math.ceil(newInHalf * 0.5) : Math.max(0, newInHalf - Math.ceil(newInHalf * 0.5));
    };

    const newT3 = allocate(cumT3, target.tier3);
    cumT3 += newT3;

    const cumulativeInstitutions = cumT3;
    const totalNewInst = newT3;

    // Student deployment
    const newStudentsFromNewInst = Math.round(totalNewInst * a.studentsPerInstitution * a.initialRolloutPercent);
    const maxStudents = cumulativeInstitutions * a.studentsPerInstitution;
    const rampStudents = Math.round((maxStudents - cumulativeStudents - newStudentsFromNewInst) * 0.3);
    const totalNewStudents = newStudentsFromNewInst + Math.max(0, rampStudents);
    cumulativeStudents = Math.min(maxStudents, cumulativeStudents + totalNewStudents);

    // Churn
    const churnedStudents = Math.round(cumulativeStudents * (a.annualChurnRate / 4));
    cumulativeStudents = Math.max(0, cumulativeStudents - churnedStudents);

    // Hardware revenue (one-time per new student/desk)
    const hardwareRevenue = totalNewStudents * a.nfcTagPrice;
    const hardwareCogs = totalNewStudents * a.nfcTagCost;
    const hardwareGrossProfit = hardwareRevenue - hardwareCogs;

    // Implementation fees (one-time, on new institutions)
    const implementationRevenue = newT3 * TIERS[3].implementationFee;

    // Subscription revenue (quarterly) — all institutions are Tier 3
    const paidInstitutions = Math.max(0, cumulativeInstitutions - a.pilotFreeInstitutions);
    const paidStudents = paidInstitutions > 0 && cumulativeInstitutions > 0
      ? Math.round(cumulativeStudents * (paidInstitutions / cumulativeInstitutions))
      : 0;
    const quarterlySubRevenue = (paidStudents * TIERS[3].pricePerStudentPerYear) / 4;
    const subscriptionRevenue = quarterlySubRevenue;
    const expansionRevenue = 0; // no tier upgrades with single tier
    const mrr = (paidStudents * TIERS[3].pricePerStudentPerYear) / 12;
    const arr = paidStudents * TIERS[3].pricePerStudentPerYear;

    const totalRevenue = hardwareRevenue + implementationRevenue + subscriptionRevenue;
    const subscriptionCogs = subscriptionRevenue * a.saasCogsPct;
    const totalCogs = hardwareCogs + subscriptionCogs;
    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

    // Fixed OPEX — scales by year with growth rate
    const yearlyOpex = baseAnnualOpex * Math.pow(1 + a.opexGrowthRate, y);
    const quarterlyOpex = yearlyOpex / 4;

    const ebitda = grossProfit - quarterlyOpex;
    const ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;
    const netIncome = ebitda;

    cumulativeRevenue += totalRevenue;
    cumulativeProfit += netIncome;

    data.push({
      year: years[y],
      quarter: quarters[q],
      tier3Inst: cumT3,
      institutions: cumulativeInstitutions,
      newInstitutions: totalNewInst,
      studentsDeployed: cumulativeStudents,
      newStudents: totalNewStudents,
      hardwareRevenue: Math.round(hardwareRevenue),
      hardwareCogs: Math.round(hardwareCogs),
      hardwareGrossProfit: Math.round(hardwareGrossProfit),
      implementationRevenue: Math.round(implementationRevenue),
      subscriptionRevenue: Math.round(subscriptionRevenue),
      expansionRevenue: 0,
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
