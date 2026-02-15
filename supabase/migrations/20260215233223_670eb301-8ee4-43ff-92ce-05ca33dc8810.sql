-- Allow any authenticated user to view display_name of teachers
-- This removes the need for service role in the launch edge function
CREATE POLICY "Authenticated users can view teacher profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.teacher_user_id = profiles.user_id
    )
  );