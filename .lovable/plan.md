

# Student Session Page — Full Integration

## Current State
The UI components (Notes Editor, Focus Timer, Session Info, Submit button) all exist visually, but none are connected to the database. No student_session record is created, notes aren't saved, and focus time isn't tracked server-side.

## What Will Be Built

### 1. Student Session Join (on page load)
When a student navigates to `/session/:id`:
- Upsert a `student_sessions` record (user_id + session_id) with `joined_at = now()`
- Upsert a `note_docs` record for the student and session
- Load existing `note_docs.content_json` into the editor (for page refreshes)
- Check if already submitted -- if so, lock the editor to read-only

### 2. Notes Auto-Save
- The NotesEditor already debounces content changes (2s delay)
- Wire `onContentChange` to update `note_docs.content_json` in the database
- Show a subtle "Saving..." / "Saved" indicator

### 3. Focus Heartbeat
- Every 15 seconds while the tab is focused, update `student_sessions`:
  - `focus_seconds` = local counter value
  - `last_heartbeat` = now()
- This uses the existing FocusTimer's `onFocusUpdate` callback

### 4. Submit Notes
- On submit: update `note_docs.submitted_at` and `student_sessions.submitted_at` to `now()`
- Lock the editor to read-only
- Stop focus tracking

### 5. Copy to Clipboard
- Extract plain text from the TipTap editor and copy to clipboard using the Clipboard API

### 6. Responsive Layout
- Desktop/Chromebook (1024px+): side-by-side split view using CSS grid (already works with `lg:grid-cols`)
- Mobile/tablet: stacked layout with notes on top, timer and actions below (already works as grid fallback)
- No changes needed -- the current grid approach handles this correctly

## Technical Details

### Database Operations (all from the frontend using the Supabase client)

**Join session (on mount):**
```
supabase.from('student_sessions').upsert({ user_id, session_id, joined_at: now() }, { onConflict: 'user_id,session_id' })
supabase.from('note_docs').upsert({ user_id, session_id }, { onConflict: 'user_id,session_id' })
```

Note: The `student_sessions` table already has a unique constraint on (user_id, session_id). A similar unique constraint will need to be added to `note_docs` for the upsert to work.

**Auto-save notes:**
```
supabase.from('note_docs').update({ content_json, updated_at: now() }).eq('user_id', uid).eq('session_id', sid)
```

**Heartbeat (every 15s):**
```
supabase.from('student_sessions').update({ focus_seconds, last_heartbeat: now() }).eq('user_id', uid).eq('session_id', sid)
```

**Submit:**
```
supabase.from('note_docs').update({ submitted_at: now() }).eq(...)
supabase.from('student_sessions').update({ submitted_at: now() }).eq(...)
```

### Migration Required
- Add a unique constraint on `note_docs(user_id, session_id)` to support upsert

### File Changes

1. **New migration** -- add unique constraint to `note_docs`
2. **`src/pages/StudentSession.tsx`** -- main rewiring:
   - Add join logic on mount
   - Load existing notes into editor
   - Wire auto-save, heartbeat, and submit to the database
   - Add save status indicator
   - Implement clipboard copy
3. **`src/components/NotesEditor.tsx`** -- add prop to accept initial content (`initialContent`) and load it into the editor
4. **`src/components/FocusTimer.tsx`** -- no changes needed, already exposes `onFocusUpdate`

### Component Flow

```text
StudentSession mounts
  |
  +-- Fetch session info (course, teacher) [already done]
  +-- Upsert student_session record
  +-- Upsert + fetch note_doc (load existing content)
  |
  +-- NotesEditor renders with initialContent
  |     |-- onContentChange -> debounced save to note_docs
  |
  +-- FocusTimer starts
  |     |-- onFocusUpdate -> throttled heartbeat to student_sessions
  |
  +-- Submit button
        |-- Writes submitted_at to both tables
        |-- Locks editor, stops timer
```

