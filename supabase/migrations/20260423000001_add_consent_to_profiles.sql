ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_accepted_at timestamptz;
