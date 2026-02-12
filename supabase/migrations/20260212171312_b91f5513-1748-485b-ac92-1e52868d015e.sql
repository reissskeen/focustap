
-- Allow students to create courses for prototype mode
CREATE POLICY "Students can create courses (prototype)"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = teacher_user_id);
