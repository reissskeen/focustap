

## Problem

The switch from fixed annual OPEX growth (30%/yr) to linear desk-proportional OPEX scaling caused break-even to jump from 33 to 42 months. With 15 institutions, OPEX becomes 15x the base — unrealistically high for a SaaS business that benefits from economies of scale.

## Solution

Replace the linear OPEX scaling with a **sub-linear (square root) scaling** model. This reflects the reality that:
- Cloud infrastructure scales efficiently
- Support and admin costs grow slower than deployment
- Software maintenance is largely fixed

### Formula Change

**Current (linear):**
```text
opexScale = max(1, totalDesks / baseDesks)
```
15 schools -> 15x OPEX

**Proposed (square root):**
```text
opexScale = max(1, sqrt(totalDesks / baseDesks))
```
15 schools -> ~3.9x OPEX

This is a standard SaaS cost modeling approach — costs grow, but with diminishing marginal cost per additional unit.

## File Changes

### `src/lib/financialData.ts`
- Line 218: Change `opexScale = Math.max(1, totalDesks / baseDesks)` to `opexScale = Math.max(1, Math.sqrt(totalDesks / baseDesks))`
- Update the comment to reflect the sub-linear scaling rationale

This single-line change will bring break-even back closer to the original ~33 months while maintaining the more realistic desk-proportional relationship (just with economies of scale built in).
