

# Add Key Unit Economics Metrics to Financials Page

## New Metrics (computed from existing forecast data -- no number changes)

These 7 metrics will be added as a new row of KPI cards below the existing KPIs, grouped under a "Unit Economics" heading:

1. **Variable Cost per Student** -- (total COGS) / students deployed
2. **Contribution Margin per Student** -- (revenue per student) - (variable cost per student)
3. **Breakeven Students** -- Total Fixed Costs (NINV + annual OPEX) / CM per student
4. **Breakeven Institutions** -- Breakeven students / average students per institution
5. **Marginal Profit per Student** -- Revenue per student - Variable cost per student (same as CM, shown explicitly)
6. **CAC (Customer Acquisition Cost)** -- Sales & outreach costs / total institutions gained
7. **Payback Period** -- Months to recover CAC from per-institution revenue

## Where They Appear

A new "Unit Economics" card grid rendered directly below the existing 8 KPI cards on the Financials page. Uses the same `KPICard` component for visual consistency.

## Technical Details

All computations happen inside the `Financials` component using existing `forecast`, `assumptions`, `ninvTotal`, and `annualOpexTotal` values:

```text
totalStudents       = lastQ.studentsDeployed
totalRevenue        = sum of all forecast totalRevenue
totalCogs           = sum of all forecast totalCogs
revPerStudent       = (lastQ.arr) / totalStudents
vcPerStudent        = totalCogs / totalStudents  (annualized from forecast)
cmPerStudent        = revPerStudent - vcPerStudent
beStudents          = (ninvTotal + annualOpexTotal) / cmPerStudent
beInstitutions      = beStudents / assumptions.studentsPerInstitution
cac                 = assumptions.annualOpex.salesOutreach / lastQ.institutions
paybackMonths       = cac / (per-institution monthly revenue)
```

### Files Modified

- **`src/pages/Financials.tsx`** -- Add ~20 lines of derived metric calculations after existing `useMemo` blocks, plus a new KPI grid section (~30 lines of JSX) between the existing KPI grid and the Tabs.

No changes to `financialData.ts`, chart data, or any other file.
