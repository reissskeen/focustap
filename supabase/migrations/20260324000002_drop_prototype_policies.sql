-- Drop prototype policies that incorrectly allow students to create courses and sessions.
-- The real teacher-only INSERT policies already exist from earlier migrations.
DROP POLICY IF EXISTS "Students can create courses (prototype)" ON public.courses;
DROP POLICY IF EXISTS "Students can create sessions (prototype)" ON public.sessions;
