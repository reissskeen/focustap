-- Seed Flagler College as the first institution
INSERT INTO public.institutions (name, student_code, teacher_code, active)
VALUES (
  'Flagler College',
  'FLC-STU-2026',
  'FLC-PROF-2026',
  true
)
ON CONFLICT (teacher_code) DO NOTHING;
