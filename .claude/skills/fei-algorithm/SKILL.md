---
name: fei-algorithm
description: Use when editing src/lib/engagementScore.ts or any code that reads, writes, or computes the FocusTap Engagement Index (FEI). Loads for changes to scoring weights, score derivation, report rendering that depends on FEI, or any function in lib/ that takes student session data and returns a score. Covers the four FEI components and weights, the pure-function rule, and the determinism guarantees consumers depend on.
---

# FEI — FocusTap Engagement Index

The FEI is the project's proprietary student engagement score. **It is load-bearing**: session reports, professor analytics, and post-session emails all depend on its output being stable and deterministic.

## The formula

```
FEI = (Presence × 0.35)
    + (Distraction Resistance × 0.30)
    + (Active Participation × 0.25)
    + (Session Integrity × 0.10)
```

Each component is a 0–100 sub-score. The weights sum to 1.00. **Never change a weight without an explicit user instruction** — downstream reports compare scores across sessions and historical data assumes these weights.

## Component definitions

| Component | Source data | What it measures |
|---|---|---|
| Presence | `focus_seconds` / session duration | Time on the session page with the tab focused |
| Distraction Resistance | `focus_events` (pause count, total pause duration) | Resistance to tab-switching and visibility loss |
| Active Participation | `note_save_count`, interaction events | Note-taking, answering checks, deliberate engagement |
| Session Integrity | tab-switch count, focus-lock breaks | Whether the student stayed in the session frame |

## Purity rules — non-negotiable

`engagementScore.ts` and its exported functions must be **pure**:

- No `supabase` calls
- No `Date.now()` or `new Date()` inside the calculation (pass timestamps in as args)
- No `Math.random()`
- No mutation of input objects
- No console.log in production paths
- Same inputs → same outputs, every time

If you need data from the DB, fetch it in the hook and pass it as a typed argument. The algorithm does not fetch.

## Public surface

The module exports — keep these signatures stable:

- `computeStudentReport(studentSession, focusEvents, sessionDuration): StudentReport`
- `getScoreColor(score: number): string`
- `getScoreLabel(score: number): string`

Adding new functions is fine. Changing the shape of `StudentReport` is a breaking change — search consumers first.

## Testing a change

Before committing any change to scoring:

1. Pick 3 known historical sessions
2. Run the old and new calculation on them
3. Confirm scores match (or differ in the way you intended)
4. If scores shift, decide whether historical reports need a recompute note

## Don't

- Don't tweak weights to "fix" an outlier student — fix the upstream data or component sub-score
- Don't add a 5th component without weight rebalancing across all four existing ones
- Don't import the algorithm into edge functions — keep it client-side; the source data already lives in Postgres
