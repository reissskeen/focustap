CREATE POLICY "Teachers can delete demo seats"
  ON public.demo_seats
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN courses c ON s.course_id = c.id
      WHERE s.id = demo_seats.session_id
      AND c.teacher_user_id = auth.uid()
    )
  );