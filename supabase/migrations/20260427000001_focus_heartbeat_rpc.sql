-- Atomic heartbeat update that never decreases focus_seconds.
-- Prevents a second device from overwriting a higher value already
-- written by the first device during a duplicate-join scenario.
CREATE OR REPLACE FUNCTION public.update_focus_heartbeat(
  p_user_id       uuid,
  p_session_id    uuid,
  p_focus_seconds integer,
  p_last_heartbeat timestamptz
) RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.student_sessions
  SET
    last_heartbeat = p_last_heartbeat,
    focus_seconds  = GREATEST(focus_seconds, p_focus_seconds)
  WHERE user_id = p_user_id AND session_id = p_session_id;
$$;
