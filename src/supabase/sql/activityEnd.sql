CREATE OR REPLACE FUNCTION end_activity_session(p_session_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sess activity_sessions;
  dur BIGINT;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get session
  SELECT *
  INTO sess
  FROM activity_sessions
  WHERE activity_session_id = p_session_id;

  IF sess.ended_at IS NOT NULL THEN
    RETURN;
  END IF;

  dur := EXTRACT(EPOCH FROM (NOW() - sess.started_at));

  UPDATE activity_sessions
  SET
    ended_at = NOW(),
    duration_seconds = dur
  WHERE activity_session_id = p_session_id;

  INSERT INTO user_activity_daily (user_id, date, activity_seconds, session_count)
  VALUES (sess.user_id, today, dur, 1)
  ON CONFLICT (user_id, date) DO UPDATE
  SET
    activity_seconds = user_activity_daily.activity_seconds + EXCLUDED.activity_seconds,
    session_count = user_activity_daily.session_count + 1;
END;
$$ LANGUAGE plpgsql;