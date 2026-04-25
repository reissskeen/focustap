-- Focus-guard audit system
-- Adds violation event types, duration tracking, and per-student focus score

-- 1. Add duration_ms to focus_events so we can record how long a blur lasted
ALTER TABLE public.focus_events
  ADD COLUMN IF NOT EXISTS duration_ms integer;

-- 2. Widen the event_type CHECK constraint to cover focus-guard events.
--    The original only allowed: 'start', 'pause', 'resume'
ALTER TABLE public.focus_events
  DROP CONSTRAINT IF EXISTS focus_events_event_type_check;

ALTER TABLE public.focus_events
  ADD CONSTRAINT focus_events_event_type_check CHECK (
    event_type IN (
      'start', 'pause', 'resume',
      'tab_hidden', 'window_blur', 'window_focus',
      'fullscreen_exit', 'split_screen_warning',
      'page_unload', 'violation_dismissed', 'session_suspended'
    )
  );

-- 3. Add focus_score (0–100) and suspended_at to student_sessions
ALTER TABLE public.student_sessions
  ADD COLUMN IF NOT EXISTS focus_score integer;

ALTER TABLE public.student_sessions
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
