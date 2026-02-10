
-- Create focus_events table for analytics
CREATE TABLE public.focus_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.sessions(id),
  event_type text NOT NULL CHECK (event_type IN ('start', 'pause', 'resume')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.focus_events ENABLE ROW LEVEL SECURITY;

-- Students can insert their own focus events
CREATE POLICY "Students can insert own focus_events"
  ON public.focus_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Students can view their own focus events
CREATE POLICY "Students can view own focus_events"
  ON public.focus_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Teachers can view focus events for their sessions
CREATE POLICY "Teachers can view focus_events for own sessions"
  ON public.focus_events
  FOR SELECT
  USING (
    has_role(auth.uid(), 'teacher'::app_role)
    AND EXISTS (
      SELECT 1 FROM sessions s
      JOIN courses c ON s.course_id = c.id
      WHERE s.id = focus_events.session_id
        AND c.teacher_user_id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX idx_focus_events_user_session ON public.focus_events (user_id, session_id);
CREATE INDEX idx_focus_events_session ON public.focus_events (session_id);
