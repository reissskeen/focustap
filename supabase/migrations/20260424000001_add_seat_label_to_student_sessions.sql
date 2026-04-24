ALTER TABLE public.student_sessions
  ADD COLUMN IF NOT EXISTS seat_label text;
