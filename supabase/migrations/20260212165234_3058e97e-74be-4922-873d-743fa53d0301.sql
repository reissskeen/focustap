
-- Add unique constraint to prevent duplicate student_sessions
CREATE UNIQUE INDEX IF NOT EXISTS student_sessions_user_session_unique 
ON public.student_sessions(user_id, session_id);

-- Create waitlist table for students waiting for a session to start
CREATE TABLE public.course_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_waitlist ENABLE ROW LEVEL SECURITY;

-- Students can join waitlist
CREATE POLICY "Students can insert own waitlist entries"
ON public.course_waitlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Students can view own entries
CREATE POLICY "Students can view own waitlist entries"
ON public.course_waitlist FOR SELECT
USING (auth.uid() = user_id);

-- Students can remove themselves from waitlist
CREATE POLICY "Students can delete own waitlist entries"
ON public.course_waitlist FOR DELETE
USING (auth.uid() = user_id);

-- Teachers can view waitlist for their courses
CREATE POLICY "Teachers can view waitlist for own courses"
ON public.course_waitlist FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role) AND EXISTS (
  SELECT 1 FROM courses c WHERE c.id = course_waitlist.course_id AND c.teacher_user_id = auth.uid()
));

-- Auto-enroll trigger: when a session is created, enroll all waitlisted students
CREATE OR REPLACE FUNCTION public.auto_enroll_waitlisted_students()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.student_sessions (user_id, session_id)
  SELECT w.user_id, NEW.id
  FROM public.course_waitlist w
  WHERE w.course_id = NEW.course_id
  ON CONFLICT (user_id, session_id) DO NOTHING;

  -- Remove enrolled students from waitlist
  DELETE FROM public.course_waitlist
  WHERE course_id = NEW.course_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_session_created_enroll_waitlist
AFTER INSERT ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.auto_enroll_waitlisted_students();
