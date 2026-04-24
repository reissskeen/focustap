ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS seat_layout jsonb;
