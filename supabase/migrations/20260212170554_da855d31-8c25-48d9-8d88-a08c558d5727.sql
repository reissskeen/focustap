
-- Course notes table for per-course documents
CREATE TABLE public.course_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_course_notes_user_course_title ON public.course_notes(user_id, course_id, title);

ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own course notes"
  ON public.course_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own course notes"
  ON public.course_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own course notes"
  ON public.course_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Students can delete own course notes"
  ON public.course_notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_course_notes_updated_at
  BEFORE UPDATE ON public.course_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for course files
INSERT INTO storage.buckets (id, name, public) VALUES ('course-files', 'course-files', false);

-- Storage policies
CREATE POLICY "Students can view own course files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can upload own course files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can delete own course files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-files' AND auth.uid()::text = (storage.foldername(name))[1]);
