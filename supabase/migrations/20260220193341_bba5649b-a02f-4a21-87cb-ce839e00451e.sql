
CREATE TABLE public.demo_seats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.sessions(id),
  seat_label  text NOT NULL,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  last_ping   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert demo seats"
  ON public.demo_seats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update demo seat via id"
  ON public.demo_seats FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can view demo seats"
  ON public.demo_seats FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE public.demo_seats;
