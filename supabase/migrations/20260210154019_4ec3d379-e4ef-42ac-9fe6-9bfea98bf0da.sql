
-- Allow teachers to view profiles of students who are in their sessions
CREATE POLICY "Teachers can view student profiles for own sessions"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND (
    EXISTS (
      SELECT 1
      FROM student_sessions ss
      JOIN sessions s ON ss.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE ss.user_id = profiles.user_id
        AND c.teacher_user_id = auth.uid()
    )
  )
);
