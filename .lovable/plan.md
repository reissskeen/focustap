
## Integrate Faculty Survey Data into the Problem Slide

### What the Survey Data Shows

Three key statistics from the "Faculty Perspectives on Classroom Engagement" Google Form survey (14 faculty respondents):

1. **78.5% of faculty say engagement is an issue** — 57.1% call it a "significant issue," 21.4% a "minor issue"
2. **85.7% say phones are a major distraction** — 28.6% say phones are the #1 distraction, 57.1% say one of several major ones
3. **100% agree students benefit from more participation** — 78.6% strongly agree, 21.4% agree

This is primary research from real professors, which is far more compelling for a pitch than generic statistics.

### Plan

Only `src/pages/PitchDeck.tsx` changes — specifically Slide 1 (lines 103–129).

The slide will be completely rebuilt into three sections:

**Top — Survey source badge**
A small "Faculty Survey · n=14 · Flagler College · Feb 2026" label to establish credibility of the data.

**Middle — Three stat cards (the survey data)**
A 3-column grid of large-number "stat" cards styled with destructive/warning coloring to emphasize the problem:

| Stat | Label | Source |
|---|---|---|
| **78.5%** of faculty say engagement is an issue in classrooms | "Engagement Is a Crisis" | IMG_0463 |
| **85.7%** say phones are a major or the #1 distraction | "Phones Dominate" | IMG_0460 |
| **100%** agree students benefit from more active participation | "Participation = Outcomes" | IMG_0461 |

**Bottom — Solution row**
A compact 2-column or 4-bullet solution section (same checkmarks as before) to close the loop: "Here's what FocusTap does about it."

### Technical Details

- No new files, no new dependencies, no backend changes
- Uses Recharts `PieChart` already installed to optionally render one of the survey charts inline — however, for slide density and clarity, large bold percentage numbers with sourced sub-labels are more impactful than recreating the pie charts
- The `SlideWrapper` padding and `max-w-4xl` container are preserved
- The existing `bg-destructive/10 border-destructive/20` card style is reused for the stat cards to maintain visual consistency with the rest of the deck
- The solution bullets (NFC tap, focus tracking, free pilot at Flagler, proven data → school-to-school) are kept at the bottom in a tighter layout
