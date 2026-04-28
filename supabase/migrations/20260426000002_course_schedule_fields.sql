-- Add scheduling metadata to courses so the dashboard can show the weekly
-- timetable and live-session hero without relying on manual session creation.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS room        text,
  ADD COLUMN IF NOT EXISTS meeting_days text[],
  ADD COLUMN IF NOT EXISTS start_time  time,
  ADD COLUMN IF NOT EXISTS end_time    time;
