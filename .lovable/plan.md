

# Teacher: Start Session Flow

## Overview
Replace the hardcoded teacher dashboard with a real session management flow. Teachers will select a course, configure optional settings, and start a session that writes to the database. The QR code and live roster will use real data.

## What will be built

### 1. Course Management (lightweight)
- On first visit, if no courses exist, show a "Create Course" form (name + section)
- Course selector dropdown for teachers with multiple courses
- Courses are stored in the existing `courses` table

### 2. Start Session Dialog
A modal/dialog triggered by the "Start Session" button with:
- **Course selector** (pre-filled if only one course)
- **Room assignment** (optional dropdown of existing rooms)
- **Session duration** (optional, in minutes -- e.g. 45, 60, 90, or custom)
- **Late-join cutoff** (optional, in minutes after start -- e.g. 10, 15, or none)
- "Start" button that inserts a row into `sessions` with `status = 'active'`

### 3. Active Session View
Once a session is started:
- Header shows real course name, section, and date
- QR code uses the real session ID: `/launch?session_id={real_uuid}`
- "End Session" button updates the session's `status` to `ended`
- Live roster queries `student_sessions` joined with `profiles` for display names
- Stats (student count, active count, avg focus) computed from real `student_sessions` data

### 4. Pre-Session State
When no session is active:
- Show a landing state with the "Start Session" button prominently
- Display past sessions summary (optional, simple list)

## Technical Details

### Database
No new tables needed -- uses existing `courses`, `sessions`, `student_sessions`, and `profiles` tables.

The teacher must have the `teacher` role in `user_roles` to create courses and sessions (enforced by RLS).

### Component Structure

```text
TeacherDashboard.tsx
  |-- CourseSelector (dropdown of teacher's courses + "Add Course" option)
  |-- StartSessionDialog (dialog with duration/cutoff settings)
  |-- ActiveSessionView (QR, stats, live roster)
  |-- EmptyState (no active session prompt)
```

All components will live in the `TeacherDashboard.tsx` file to keep things simple, extracted into local sub-components.

### Key Queries
- Fetch teacher's courses: `supabase.from('courses').select('*').eq('teacher_user_id', user.id)`
- Create session: `supabase.from('sessions').insert({ course_id, room_id, start_time, end_time, late_join_cutoff, status: 'active', created_by: user.id })`
- End session: `supabase.from('sessions').update({ status: 'ended', end_time: now() }).eq('id', sessionId)`
- Live roster: `supabase.from('student_sessions').select('*, profiles!inner(display_name)').eq('session_id', activeSessionId)` -- note: this requires the service role or adjusted RLS; teachers already have a SELECT policy on `student_sessions` for their own sessions
- Fetch rooms: `supabase.from('rooms').select('*')` (for optional room assignment)

### QR Code
Once a session is created, the QR code will render:
```text
{window.location.origin}/launch?session_id={session.id}
```

### Realtime (live roster)
Subscribe to `student_sessions` changes for the active session to update the roster without polling:
```typescript
supabase.channel('roster')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'student_sessions', filter: `session_id=eq.${sessionId}` }, handler)
  .subscribe()
```

### Flow
1. Teacher lands on `/teacher` -- sees course selector + "Start Session" button
2. Clicks "Start Session" -- dialog opens with settings
3. Confirms -- session row inserted, dashboard switches to active view
4. QR code is live, students scan and join
5. Roster updates in real time
6. Teacher clicks "End Session" -- session status set to `ended`, view resets

