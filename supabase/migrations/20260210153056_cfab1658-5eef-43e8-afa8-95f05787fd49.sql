
-- Courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text,
  lms_course_id text,
  teacher_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view courses (simplified for MVP)
CREATE POLICY "Authenticated users can view courses"
  ON public.courses FOR SELECT TO authenticated
  USING (true);

-- Teachers can create courses
CREATE POLICY "Teachers can create courses"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_user_id AND public.has_role(auth.uid(), 'teacher'));

-- Teachers can update their own courses
CREATE POLICY "Teachers can update own courses"
  ON public.courses FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_user_id AND public.has_role(auth.uid(), 'teacher'));

-- Rooms table
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  room_tag text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rooms"
  ON public.rooms FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Teachers can create rooms"
  ON public.rooms FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- Sessions table
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  late_join_cutoff timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- All authenticated can view active sessions (needed for launch resolution)
CREATE POLICY "Authenticated users can view sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (true);

-- Teachers can create sessions for their own courses
CREATE POLICY "Teachers can create sessions"
  ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.has_role(auth.uid(), 'teacher')
    AND EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_user_id = auth.uid())
  );

-- Teachers can update sessions they created
CREATE POLICY "Teachers can update own sessions"
  ON public.sessions FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by
    AND public.has_role(auth.uid(), 'teacher')
  );

-- Student sessions table
CREATE TABLE public.student_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  focus_seconds integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat timestamptz,
  submitted_at timestamptz,
  UNIQUE (user_id, session_id)
);

ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;

-- Students can view their own student_sessions
CREATE POLICY "Students can view own student_sessions"
  ON public.student_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Teachers can view student_sessions for their sessions
CREATE POLICY "Teachers can view student_sessions for own sessions"
  ON public.student_sessions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.courses c ON s.course_id = c.id
      WHERE s.id = session_id AND c.teacher_user_id = auth.uid()
    )
  );

-- Students can join sessions
CREATE POLICY "Students can insert own student_sessions"
  ON public.student_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Students can update their own records (focus_seconds, heartbeat, submitted_at)
CREATE POLICY "Students can update own student_sessions"
  ON public.student_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Note docs table
CREATE TABLE public.note_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  content_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

ALTER TABLE public.note_docs ENABLE ROW LEVEL SECURITY;

-- Students can view their own notes
CREATE POLICY "Students can view own note_docs"
  ON public.note_docs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Teachers can view notes for their sessions
CREATE POLICY "Teachers can view note_docs for own sessions"
  ON public.note_docs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.courses c ON s.course_id = c.id
      WHERE s.id = session_id AND c.teacher_user_id = auth.uid()
    )
  );

-- Students can create notes
CREATE POLICY "Students can insert own note_docs"
  ON public.note_docs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Students can update their own notes
CREATE POLICY "Students can update own note_docs"
  ON public.note_docs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at on note_docs
CREATE TRIGGER update_note_docs_updated_at
  BEFORE UPDATE ON public.note_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime on student_sessions for future teacher live view
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_sessions;
