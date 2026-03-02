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
  implementationFeePerTag: number; // $3/tag × desks deployed
}

export const TIERS: Record<Tier, TierConfig> = {
  3: { name: "Full Campus Intelligence", tag: "Tier 3", pricePerStudentPerYear: 45, implementationFeePerTag: 3 },
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
  deskToStudentRatio: number; // e.g. 2.5 means 1 desk per 2.5 students
  // Adoption timeline — cumulative institutions by end of each half-year
  h1_2026: HalfYearAdoption;
  h2_2026: HalfYearAdoption;
  h1_2027: HalfYearAdoption;
  h2_2027: HalfYearAdoption;
  h1_2028: HalfYearAdoption;
  h2_2028: HalfYearAdoption;
  // Post-2028: steady-state new institutions per half-year (Tier 3)
  postForecastHalfYearGrowth: number;
  // Fixed operating costs (annual, at base scale of 1 institution)
  annualOpex: AnnualOpex;
  // NINV (one-time initial investment)
  ninv: NINV;
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
  studentsPerInstitution: 2500,
  deskToStudentRatio: 2.5,
  // Adoption timeline: Flagler free pilot Q3 2026 → hold at 1 by H1 2027 → 2 by H2 2027 → 4 by H1 2028 → 7 by H2 2028
  h1_2026: { tier3: 0 },
  h2_2026: { tier3: 1 },
  h1_2027: { tier3: 1 },
  h2_2027: { tier3: 2 },
  h1_2028: { tier3: 4 },
  h2_2028: { tier3: 7 },
  // initialRolloutPercent, annualChurnRate, opexGrowthRate removed — hardcoded in engine
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
  postForecastHalfYearGrowth: 4,
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
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  // Build an explicit list of half-year targets for the modeled period (2026–2028)
  const modeledHalfTargets: { year: number; half: 1 | 2; target: HalfYearAdoption }[] = [
    { year: 2026, half: 1, target: a.h1_2026 },
    { year: 2026, half: 2, target: a.h2_2026 },
    { year: 2027, half: 1, target: a.h1_2027 },
    { year: 2027, half: 2, target: a.h2_2027 },
    { year: 2028, half: 1, target: a.h1_2028 },
    { year: 2028, half: 2, target: a.h2_2028 },
  ];

  const ninvTotal = computeNINVTotal(a.ninv);
  const baseAnnualOpex = computeAnnualOpexTotal(a.annualOpex);
  // Base desks at 1 institution — used to scale OPEX proportionally
  const baseDesks = Math.ceil(a.studentsPerInstitution / a.deskToStudentRatio);
  // Hardcoded constants (removed from editable assumptions)
  const INITIAL_ROLLOUT_PCT = 0.25;
  const ANNUAL_CHURN_RATE = 0.03;
  let cumT3 = 0;
  let cumulativeStudents = 0;
  let cumulativeRevenue = 0;
  let cumulativeProfit = 0;

  // Helper to process one quarter
  const processQuarter = (
    yearLabel: string,
    quarterLabel: string,
    yearIndex: number,   // 0-based from 2026
    newT3: number,
  ) => {
    cumT3 += newT3;
    const cumulativeInstitutions = cumT3;

    const newStudentsFromNewInst = Math.round(newT3 * a.studentsPerInstitution * INITIAL_ROLLOUT_PCT);
    const maxStudents = cumulativeInstitutions * a.studentsPerInstitution;
    const rampStudents = Math.round((maxStudents - cumulativeStudents - newStudentsFromNewInst) * 0.3);
    const totalNewStudents = newStudentsFromNewInst + Math.max(0, rampStudents);
    cumulativeStudents = Math.min(maxStudents, cumulativeStudents + totalNewStudents);

    const churnedStudents = Math.round(cumulativeStudents * (ANNUAL_CHURN_RATE / 4));
    cumulativeStudents = Math.max(0, cumulativeStudents - churnedStudents);

    // Desk calculations: 1 desk (tag) per deskToStudentRatio students
    const desksForStudents = (students: number) => Math.ceil(students / a.deskToStudentRatio);
    const totalDesks = desksForStudents(cumulativeStudents);
    const newDesks = Math.max(0, desksForStudents(totalNewStudents));

    const hardwareRevenue = newDesks * a.nfcTagPrice;
    const hardwareCogs = newDesks * a.nfcTagCost;
    const hardwareGrossProfit = hardwareRevenue - hardwareCogs;

    const implementationRevenue = newT3 * desksForStudents(a.studentsPerInstitution) * TIERS[3].implementationFeePerTag;

    const paidInstitutions = Math.max(0, cumulativeInstitutions - a.pilotFreeInstitutions);
    const paidStudents = paidInstitutions > 0 && cumulativeInstitutions > 0
      ? Math.round(cumulativeStudents * (paidInstitutions / cumulativeInstitutions))
      : 0;
    const subscriptionRevenue = (paidStudents * TIERS[3].pricePerStudentPerYear) / 4;
    const mrr = (paidStudents * TIERS[3].pricePerStudentPerYear) / 12;
    const arr = paidStudents * TIERS[3].pricePerStudentPerYear;

    const totalRevenue = hardwareRevenue + implementationRevenue + subscriptionRevenue;
    const subscriptionCogs = subscriptionRevenue * a.saasCogsPct;
    const totalCogs = hardwareCogs + subscriptionCogs;
    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

    // OPEX scales sub-linearly (√) to reflect SaaS economies of scale
    const opexScale = Math.max(1, Math.sqrt(totalDesks / baseDesks));
    const yearlyOpex = baseAnnualOpex * opexScale;
    const quarterlyOpex = yearlyOpex / 4;

    const ebitda = grossProfit - quarterlyOpex;
    const ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;
    const netIncome = ebitda;

    cumulativeRevenue += totalRevenue;
    cumulativeProfit += netIncome;

    data.push({
      year: yearLabel,
      quarter: quarterLabel,
      tier3Inst: cumT3,
      institutions: cumulativeInstitutions,
      newInstitutions: newT3,
      studentsDeployed: cumulativeStudents,
      newStudents: totalNewStudents,
      desksDeployed: totalDesks,
      newDesks,
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
  };

  // --- Phase 1: modeled 2026-2028 quarters ---
  let halfIdx = 0;
  for (let i = 0; i < 12; i++) {
    const y = Math.floor(i / 4);             // 0 = 2026, 1 = 2027, 2 = 2028
    const q = i % 4;
    const yearLabel = `FY ${2026 + y}`;
    const isFirstOfHalf = q === 0 || q === 2;
    halfIdx = Math.floor(i / 2);
    const target = modeledHalfTargets[halfIdx].target;

    const allocate = (cumVal: number, targetVal: number): number => {
      const newInHalf = Math.max(0, targetVal - cumVal);
      return isFirstOfHalf
        ? Math.ceil(newInHalf * 0.5)
        : Math.max(0, newInHalf - Math.ceil(newInHalf * 0.5));
    };

    const prevCumT3 = cumT3;
    const newT3 = allocate(prevCumT3, target.tier3);
    processQuarter(yearLabel, quarters[q], y, newT3);
  }

  // --- Phase 2: extend beyond 2028 until full break-even ---
  const MAX_EXTENSION_QUARTERS = 40; // safety cap (~10 extra years)
  let extraQuarter = 0;
  let calYear = 2029;
  let calQ = 0; // 0-based quarter index within year

  while (cumulativeProfit < ninvTotal && extraQuarter < MAX_EXTENSION_QUARTERS) {
    const yearLabel = `FY ${calYear}`;
    const yearIndex = calYear - 2026;
    const isFirstOfHalf = calQ === 0 || calQ === 2;

    // Steady-state growth: postForecastHalfYearGrowth new institutions every half-year
    const newT3 = isFirstOfHalf
      ? Math.ceil(a.postForecastHalfYearGrowth * 0.5)
      : Math.floor(a.postForecastHalfYearGrowth * 0.5);

    processQuarter(yearLabel, quarters[calQ], yearIndex, newT3);

    extraQuarter++;
    calQ++;
    if (calQ === 4) {
      calQ = 0;
      calYear++;
    }
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

export const ASSUMPTIONS_STORAGE_KEY = "focustap_financial_assumptions_v3";
export const ASSUMPTIONS_BASELINE_VERSION = 3;

type StoredAssumptions = Partial<Assumptions> & {
  __baselineVersion?: number;
};

export function loadAssumptions(): Assumptions {
  try {
    const raw = localStorage.getItem(ASSUMPTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAssumptions;
      if (parsed.__baselineVersion === ASSUMPTIONS_BASELINE_VERSION) {
        return { ...defaultAssumptions, ...parsed };
      }
    }
  } catch {}
  return defaultAssumptions;
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
