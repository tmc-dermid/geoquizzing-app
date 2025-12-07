CREATE OR REPLACE FUNCTION start_activity_session(p_user_id UUID)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
  new_session_id UUID;
BEGIN
  INSERT INTO activity_sessions (user_id, started_at, last_seen_at)
  VALUES
    (p_user_id, NOW(), NOW())
  RETURNING activity_session_id INTO new_session_id;

  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql;
