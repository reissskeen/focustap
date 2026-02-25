-- Allow anonymous users to read active sessions (needed for public demo join page)
CREATE POLICY "Anon can view active sessions"
  ON public.sessions FOR SELECT
  TO anon
  USING (status = 'active');

-- Allow anonymous users to read course names (needed for demo join page to show course name)
CREATE POLICY "Anon can view courses"
  ON public.courses FOR SELECT
  TO anon
  USING (true);