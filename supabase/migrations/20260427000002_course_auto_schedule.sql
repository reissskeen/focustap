-- ── Course scheduling metadata ─────────────────────────────────────────────
-- Extends courses with full semester date range, course code, instructor
-- display name, and institution denorm so students can discover sessions.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS semester_start  date,
  ADD COLUMN IF NOT EXISTS semester_end    date,
  ADD COLUMN IF NOT EXISTS course_code     text,
  ADD COLUMN IF NOT EXISTS instructor_name text,
  ADD COLUMN IF NOT EXISTS institution_id  uuid REFERENCES public.institutions(id);

-- Denorm institution_id from the teacher's profile for new courses.
-- Existing rows that have a teacher can be backfilled similarly.
UPDATE public.courses c
SET institution_id = p.institution_id
FROM public.profiles p
WHERE p.user_id = c.teacher_user_id
  AND c.institution_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_courses_institution ON public.courses (institution_id);

-- ── Auto-session function ──────────────────────────────────────────────────
-- Runs every minute (via pg_cron).  Creates active sessions for any course
-- whose scheduled class window starts right now, and closes sessions whose
-- scheduled end time has passed.
--
-- Timezone: America/New_York  (Flagler College, FL).  Can be made
-- per-institution later by joining institutions.timezone.

CREATE OR REPLACE FUNCTION public.auto_start_scheduled_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz      text := 'America/New_York';
  now_tz  timestamptz := NOW() AT TIME ZONE tz;
  today   date         := now_tz::date;
  tod     time         := now_tz::time;
  dow     text         := to_char(now_tz, 'Dy');   -- 'Mon', 'Tue', …
  c       RECORD;
BEGIN
  -- 1. Start sessions that are due
  FOR c IN
    SELECT *
    FROM public.courses
    WHERE
      semester_start  IS NOT NULL
      AND semester_end    IS NOT NULL
      AND start_time      IS NOT NULL
      AND meeting_days    IS NOT NULL
      AND today BETWEEN semester_start AND semester_end
      AND meeting_days @> ARRAY[dow]
      -- Within ±2 min of scheduled start (cron fires every minute)
      AND tod BETWEEN start_time - INTERVAL '1 minute'
                  AND start_time + INTERVAL '2 minutes'
      -- No active session already exists for this course today
      AND NOT EXISTS (
        SELECT 1
        FROM   public.sessions s
        WHERE  s.course_id = c.id
          AND  s.status    = 'active'
          AND  (s.start_time AT TIME ZONE tz)::date = today
      )
  LOOP
    INSERT INTO public.sessions (
      course_id,
      start_time,
      end_time,
      late_join_cutoff,
      status,
      created_by
    ) VALUES (
      c.id,
      NOW(),
      CASE
        WHEN c.end_time IS NOT NULL
        THEN (today + c.end_time) AT TIME ZONE tz
        ELSE NULL
      END,
      NOW() + INTERVAL '15 minutes',   -- default 15-min late window
      'active',
      c.teacher_user_id
    );
  END LOOP;

  -- 2. Auto-end sessions whose scheduled end time has passed (+ 5-min buffer)
  UPDATE public.sessions s
  SET    status = 'ended'
  FROM   public.courses c
  WHERE  s.course_id  = c.id
    AND  s.status     = 'active'
    AND  c.end_time   IS NOT NULL
    AND  (s.start_time AT TIME ZONE tz)::date = today
    AND  tod > c.end_time + INTERVAL '5 minutes';
END;
$$;

-- ── pg_cron schedule ───────────────────────────────────────────────────────
-- Requires the pg_cron extension (available on Supabase Pro; enable it in
-- the Supabase dashboard → Database → Extensions → pg_cron).
-- The DO block is wrapped in exception handling so the migration never fails
-- on projects that don't yet have pg_cron enabled.

DO $$
BEGIN
  PERFORM cron.schedule(
    'auto-start-sessions',
    '* * * * *',
    'SELECT public.auto_start_scheduled_sessions()'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE
    'pg_cron not available — auto sessions will not fire automatically. '
    'Enable pg_cron in the Supabase dashboard and re-run this migration, '
    'or call public.auto_start_scheduled_sessions() from a Supabase Edge Function on a cron schedule.';
END;
$$;
