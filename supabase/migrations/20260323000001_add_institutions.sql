-- Institutions table
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  student_code text NOT NULL UNIQUE,
  teacher_code text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can look up an institution by code (needed during signup)
CREATE POLICY "Authenticated users can read active institutions"
  ON public.institutions FOR SELECT
  USING (active = true);

-- Only FocusTap admins can manage institutions
CREATE POLICY "Admins can manage institutions"
  ON public.institutions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add institution fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN institution_id uuid REFERENCES public.institutions(id),
  ADD COLUMN institution_role text CHECK (
    institution_role IN ('student', 'teacher', 'dept_admin', 'institution_admin')
  );

-- Index for fast institution lookups
CREATE INDEX idx_profiles_institution ON public.profiles (institution_id);
