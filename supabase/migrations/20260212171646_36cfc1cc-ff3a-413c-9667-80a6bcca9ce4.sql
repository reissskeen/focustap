
-- Allow students to create sessions for prototype mode
CREATE POLICY "Students can create sessions (prototype)"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = created_by);
