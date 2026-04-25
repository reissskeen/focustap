-- Allow teachers to delete their own courses.
-- Previously only SELECT, INSERT, UPDATE policies existed — DELETE was blocked by RLS.
CREATE POLICY "Teachers can delete own courses"
  ON public.courses FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'teacher'::app_role) AND teacher_user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );
