-- focus_events and demo_seats had session_id FKs without ON DELETE CASCADE.
-- Deleting a course cascades to sessions, which then fails because these
-- tables still reference the session rows. Add cascade to unblock course deletion.

ALTER TABLE public.focus_events
  DROP CONSTRAINT IF EXISTS focus_events_session_id_fkey,
  ADD CONSTRAINT focus_events_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE public.demo_seats
  DROP CONSTRAINT IF EXISTS demo_seats_session_id_fkey,
  ADD CONSTRAINT demo_seats_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;
