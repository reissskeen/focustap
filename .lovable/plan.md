
# Demo Mode: NFC Tap → Desk Number → Live Seating View

## What This Builds

A fully public, no-login demo flow designed for pitch presentations. An audience member taps an NFC tag (or scans a QR code), enters their desk number on their phone, and instantly appears on the presenter's laptop as a lit-up seat on a live grid — no app install, no account required.

---

## The Two Screens

### Screen A — Phone (audience member)
Route: `/demo?session_id=...`
- Public route, no authentication required
- Shows the course name and "Welcome to [Course]"
- Single input: **Desk Number** (e.g. "12")
- On submit → registers as an anonymous guest and shows a pulsing "Connected · Desk 12" confirmation with a live activity indicator
- Heartbeat keeps them "active" on the teacher's view for the duration of the demo

### Screen B — Laptop (presenter)
A new **"Demo View"** tab on the teacher's `ActiveSessionView`
- Toggles between the existing roster table and a **Seat Grid** view
- Displays a numbered grid (e.g. 1–30 desks)
- Empty seats: dim/grey
- Occupied seats: colored by activity status — green (active), yellow (paused), red (disconnected)
- Each occupied seat shows the desk number large and the heartbeat pulse
- Updates in real-time via the existing Supabase realtime subscription on `student_sessions`

---

## Data Model Changes

### Add `seat_label` column to `student_sessions`
This is a nullable text column so that demo participants can store their desk number. Real sessions leave it null.

```sql
ALTER TABLE public.student_sessions ADD COLUMN seat_label text;
```

No RLS changes needed — the column inherits the existing policies on `student_sessions`.

### Add a dedicated `demo_sessions` table for anonymous participants
Anonymous users cannot write to `student_sessions` because it requires `auth.uid() = user_id`. The cleanest solution is a separate lightweight table:

```sql
CREATE TABLE public.demo_seats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.sessions(id),
  seat_label  text NOT NULL,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  last_ping   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: public insert (demo is intentionally open), teacher can view
ALTER TABLE public.demo_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert demo seats"
  ON public.demo_seats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update own demo seat via id"
  ON public.demo_seats FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can view demo seats"
  ON public.demo_seats FOR SELECT
  USING (auth.role() = 'authenticated');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.demo_seats;
```

Using `true` for insert/update is safe here because:
- `demo_seats` contains no PII — only a seat label string and a timestamp
- Sessions are short-lived and teacher-controlled
- The session_id is a UUID that cannot be guessed

---

## New Files

### `src/pages/DemoJoin.tsx`
Public page at `/demo`:
1. Reads `?session_id=` from query params
2. Fetches session info (course name) from the public `sessions` table
3. Shows a desk number input form
4. On submit → inserts a row into `demo_seats`, stores the returned `id` in `localStorage`
5. Starts a 10-second ping interval updating `last_ping` on that row
6. Shows confirmation screen: pulsing green dot + "You're in · Desk [N]" + course name

### `src/components/teacher/DemoSeatGrid.tsx`
Teacher-facing live seat grid component:
- Props: `sessionId`, `totalSeats` (default 30)
- Subscribes to realtime changes on `demo_seats` where `session_id = sessionId`
- Renders a responsive CSS grid of numbered seat cards
- Active (last_ping < 20s ago): green glow
- Paused (last_ping 20–45s ago): yellow
- Disconnected (last_ping > 45s or null): grey
- Occupied seats show seat label prominently
- Empty seats show just the number, muted

---

## Modified Files

### `src/App.tsx`
Add a public route `/demo` pointing to `DemoJoin` (no `RoleProtectedRoute` wrapper).

### `src/components/teacher/ActiveSessionView.tsx`
- Add a toggle button in the header: **"Roster" / "Seat Grid"**
- When "Seat Grid" is active, render `DemoSeatGrid` below the stats cards
- The QR code displayed changes to point to `/demo?session_id=...` when in demo mode (or show both URLs side by side)

---

## User Flow End-to-End

```text
NFC tag / QR code
       |
       v
/demo?session_id=abc123
       |
       v
[Enter Desk Number: ____]  [Join]
       |
       v
INSERT into demo_seats { session_id, seat_label }
       |
       v
Confirmation: "You're in · Desk 12" (pulsing green dot)
Ping loop every 10s: UPDATE demo_seats SET last_ping = now()
       |
       v (simultaneously on teacher laptop)
DemoSeatGrid reads realtime stream from demo_seats
Seat #12 lights up green → yellow → grey based on last_ping age
```

---

## Technical Notes

- The `/demo` route is fully public — no `ProtectedRoute` or `RoleProtectedRoute` wrapper
- `demo_seats` is a separate table with intentionally open INSERT/UPDATE RLS because it stores no PII. The teacher's SELECT policy ensures only authenticated teachers can read it for their sessions (though for simplicity in demo mode, "authenticated users can view" is sufficient)
- The ping mechanism is a simple `setInterval` in React — no backend edge function needed
- The existing realtime infrastructure on the teacher side already handles the update subscription pattern used in `ActiveSessionView`
- The `DemoSeatGrid` component works alongside the existing roster — the teacher can toggle between them during the pitch
- Total desks shown on the grid is configurable (default 30, adjustable by the teacher view)
- No NFC tag reprogramming needed — the tag just encodes the URL `/demo?session_id=<id>` which is the same session_id the teacher already has active
