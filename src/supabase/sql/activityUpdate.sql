CREATE OR REPLACE FUNCTION update_activity_session(p_session_id UUID)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  UPDATE activity_sessions
  SET last_seen_at = NOW()
  WHERE activity_session_id = p_session_id
    AND ended_at IS NULL;
END;
$$ LANGUAGE plpgsql;