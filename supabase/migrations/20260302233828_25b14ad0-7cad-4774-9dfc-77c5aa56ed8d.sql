
CREATE TABLE public.financial_assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.financial_assumptions ENABLE ROW LEVEL SECURITY;

-- Anyone with teacher/admin role can read
CREATE POLICY "Teachers and admins can read assumptions"
ON public.financial_assumptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can insert
CREATE POLICY "Teachers and admins can insert assumptions"
ON public.financial_assumptions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can update
CREATE POLICY "Teachers and admins can update assumptions"
ON public.financial_assumptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Also allow anon read so the pitch deck / financials pages work without login
CREATE POLICY "Public can read assumptions"
ON public.financial_assumptions FOR SELECT
TO anon
USING (true);

-- Seed with default assumptions
INSERT INTO public.financial_assumptions (data) VALUES ('{}');
