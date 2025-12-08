CREATE OR REPLACE FUNCTION increment_hint_usage(
  p_session_id UUID,
  p_penalty INT
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE quiz_sessions
  SET
    used_hints_count = COALESCE(used_hints_count, 0) + 1,
    hint_penalty = COALESCE(hint_penalty, 0) + p_penalty
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;