

# Session Launch & Entry Points

## What exists today
- A hardcoded QR code in the Teacher Dashboard pointing to `https://focustap.app/launch?session_id=demo-123` (non-functional)
- LTI endpoint URLs displayed as text stubs on the login page (non-functional)
- A `/session/:sessionId` frontend route that renders the student note-taking page with hardcoded demo data
- No database tables for courses, sessions, or rooms
- No backend edge function for launch resolution

## What needs to be built

### 1. Database Tables (migration)

Create the following tables with RLS policies:

- **courses** -- id, name, section, lms_course_id, teacher_user_id, created_at
- **rooms** -- id, name, room_tag (the NFC/QR identifier), created_at
- **sessions** -- id, course_id (FK to courses), room_id (FK to rooms, nullable), start_time, end_time, late_join_cutoff (nullable), status (enum: active/ended), created_by (user_id), created_at
- **student_sessions** -- id, user_id, session_id (FK), focus_seconds (default 0), joined_at, last_heartbeat, submitted_at (nullable)
- **note_docs** -- id, user_id, session_id (FK), content_json (jsonb), created_at, updated_at, submitted_at (nullable)

RLS policies:
- Teachers can read/create/update sessions for their own courses
- Students can read sessions they've joined; can insert/update their own student_sessions and note_docs
- Courses visible to enrolled users (simplified for MVP: visible to all authenticated users)

### 2. Backend Edge Function: `launch`

Create `supabase/functions/launch/index.ts` that:

1. Accepts GET requests with query params: `session_id`, `course_id` + `section_id`, or `room_id`
2. Resolves to an active session using priority order:
   - **session_id** -- direct lookup in sessions table where status = 'active'
   - **course_id + section_id** -- find course by lms_course_id + section, then find active session for that course
   - **room_id** -- find room by room_tag, then find active session assigned to that room where current time is within start/end window
3. Returns JSON with the resolved session ID and metadata, or an error message ("No active class session")
4. Requires authentication (checks auth token)

### 3. Frontend `/launch` Route

Create `src/pages/Launch.tsx`:

1. A protected route that reads query params from the URL
2. Calls the `launch` edge function with those params
3. On success: redirects to `/session/{resolved_session_id}`
4. On failure: shows a clean "No active class session" message with a retry option and link back to home

### 4. Update Existing Components

- **App.tsx** -- add `/launch` route
- **TeacherDashboard.tsx** -- update QR code to use real launch URL with the project's preview domain
- **StudentSession.tsx** -- fetch session metadata from the database instead of using hardcoded values

## Technical Details

### Edge Function Structure

```text
supabase/functions/launch/index.ts
```

- CORS headers included
- JWT verification disabled in config.toml (validated in code)
- Uses Supabase service role client to query sessions
- Returns: `{ session_id, course_name, teacher_name }` or `{ error: "No active class session" }`

### Launch Flow

```text
User taps QR/NFC/Canvas link
        |
        v
  /launch?param=value
        |
        v
  Launch page calls edge function
        |
        v
  Edge function resolves session
        |
    +---+---+
    |       |
  Found   Not found
    |       |
    v       v
  Redirect  "No active
  to        class session"
  /session/id
```

### Migration SQL highlights

- Session status uses a text check (`active` / `ended`) rather than enum for flexibility
- `student_sessions` has a unique constraint on (user_id, session_id) to prevent duplicate joins
- Enable realtime on `student_sessions` for the teacher live view (future)

