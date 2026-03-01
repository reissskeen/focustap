

## Overhaul Teacher Dashboard + Fix Focus Tracking

### Problem Summary
1. **ActiveSessionView is broken** -- previous interrupted edit left duplicate stats rows, duplicate alert sections, and a disorganized layout
2. **Seat grid** in DemoSeatGrid already has the `gap-px` fix from the prior edit, but the outer wrapper needs tightening
3. **Focus tracking on swipe-away** -- DemoJoin.tsx already has the `sendFinalPing` fix, but the status thresholds in DemoSeatGrid need adjustment to be more forgiving (avoid false disconnects)

### Plan

#### 1. Rewrite `ActiveSessionView.tsx` -- Clean Premium Layout

Remove all duplicate/broken sections and rebuild with a tight, professional design:

- **Header**: Compact row with course name, live indicator, Share Link + End buttons
- **Stats bar**: Single row of 4 compact stat cards (Joined, Active, Warnings, Disconnected) -- remove the duplicate at lines 374-391
- **Alerts**: Merge the two duplicate alert blocks (lines 299-371) into a single compact section with disconnected and paused warnings
- **Two-column layout** (desktop):
  - Left (2/3): Seat Grid / Roster toggle with row/col controls -- flush, no extra padding
  - Right (1/3): Joined Students sidebar with live status dots, focus time, and hover-to-remove
- Remove all `glass-card` styling in favor of clean `border border-border bg-card rounded-lg`

#### 2. Tighten `DemoSeatGrid.tsx` -- Status Thresholds

The grid already has `gap-px` from the prior edit. Verify thresholds are set to:
- Active: < 3s (already correct)
- Paused: < 8s (already correct)  
- Disconnected: >= 8s (already correct)

No changes needed here -- the prior edit landed successfully.

#### 3. Verify `DemoJoin.tsx` -- Focus Tracking Fix

The prior edit successfully replaced the `sendDisconnect` (which nulled `last_ping`) with `sendFinalPing` (which sends a timestamped ping with focus_seconds). This means:
- When a student swipes away, the last_ping timestamp ages naturally
- Dashboard shows them transitioning from Active -> Paused -> Disconnected based on elapsed time
- Focus timer pauses correctly on visibility hidden
- `keepalive: true` ensures the final ping survives page unload

No changes needed -- already fixed.

#### 4. Improve `useHeartbeat.ts` -- Same Pattern for Authenticated Students

Apply the same "don't null, just stop pinging" pattern to the authenticated student heartbeat so the teacher dashboard handles both demo and authenticated students consistently.

### Technical Details

**ActiveSessionView.tsx changes:**
- Delete lines 299-441 (duplicate stats, duplicate alerts, verbose joined-students list)
- Replace with a clean single-pass layout:
  - Compact alert banners (disconnected first, then paused)
  - `grid grid-cols-1 lg:grid-cols-3 gap-4` two-column layout
  - Left panel (`lg:col-span-2`): Grid/Roster toggle with controls in header bar
  - Right panel: Scrollable student list with status dots, focus times, hover-remove buttons
- Keep the header (lines 216-250) and NFC section (252-279) as-is -- those are clean from the prior edit

**Files modified:**
- `src/components/teacher/ActiveSessionView.tsx` -- major rewrite of the body (lines 299-571)
- `src/hooks/useHeartbeat.ts` -- minor update to stop interval on visibility hidden instead of continuing to send

