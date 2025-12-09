CREATE OR REPLACE FUNCTION start_activity_session(p_user_id UUID)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
  new_session_id UUID;
  last_sess activity_sessions;
BEGIN
  SELECT *
  INTO last_sess
  FROM activity_sessions
  WHERE user_id = p_user_id
  ORDER BY started_at DESC
  FETCH FIRST ROW ONLY;

  IF last_sess IS NOT NULL
    AND last_sess.ended_at IS NOT NULL
    AND EXTRACT(EPOCH FROM (now() - last_sess.ended_at)) < 30 THEN

    UPDATE activity_sessions
    SET
      ended_at = NULL,
      last_seen_at = NOW()
    WHERE activity_session_id = last_sess.activity_session_id;

    RETURN last_sess.activity_session_id;
  END IF;

  INSERT INTO activity_sessions (user_id, started_at, last_seen_at)
  VALUES (p_user_id, NOW(), NOW())
  RETURNING activity_session_id INTO new_session_id;
  
  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql;
