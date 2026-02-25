CREATE POLICY "Anon can view demo seats"
  ON public.demo_seats FOR SELECT
  USING (true);