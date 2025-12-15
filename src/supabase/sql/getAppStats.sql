CREATE OR REPLACE FUNCTION get_app_stats()
RETURNS TABLE (
  total_users BIGINT,
  quizzes_completed BIGINT,
  questions_answered BIGINT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM user_profile) AS total_users,
    (SELECT COUNT(*) FROM quiz_sessions WHERE status = 'completed') AS quizzes_completed,
    (SELECT COUNT(*) 
       FROM quiz_questions q
       JOIN quiz_sessions s ON s.session_id = q.session_id
       WHERE s.status = 'completed'
         AND q.user_answer != '{}') AS questions_answered;
END;
$$ LANGUAGE plpgsql;