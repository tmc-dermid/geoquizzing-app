CREATE OR REPLACE FUNCTION public.update_user_stats(p_session_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sess RECORD;
  today DATE := CURRENT_DATE;
BEGIN
  SELECT *
  INTO sess
  FROM quiz_sessions
  WHERE session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session % not found!', p_session_id;
  END IF;

  IF sess.stats_processed IS TRUE THEN
    RETURN;
  END IF;

  UPDATE user_profile
  SET points = points + sess.total_points
  WHERE id = sess.user_id;

-- Update user_stats
  WITH session_agg AS (
    SELECT
      s.user_id,
      SUM(s.time_taken_seconds) AS total_time_taken,
      SUM(s.used_hints_count) AS total_hints_used,
      SUM(s.total_correct) AS total_correct,
      SUM(s.total_incorrect) AS total_incorrect,
      COUNT(DISTINCT s.session_id) FILTER (WHERE s.status = 'completed') AS total_quizzes_completed
    FROM quiz_sessions s
    WHERE s.user_id = sess.user_id
    GROUP BY s.user_id
  ),
  question_agg AS (
    SELECT
      s.user_id,
      COUNT(q.quiz_question_id) FILTER (WHERE q.user_answer IS NOT NULL) AS total_questions_answered,
      COUNT(q.quiz_question_id) FILTER (WHERE q.is_correct IS TRUE) AS total_correct_answers,
      COUNT(q.quiz_question_id) FILTER (WHERE q.is_correct IS FALSE) AS total_incorrect_answers,
      SUM(q.answer_time_seconds) AS total_answer_time,
      COUNT(q.quiz_question_id) FILTER (WHERE q.is_hint_used IS TRUE) AS total_hints_used_questions
    FROM quiz_sessions s
    LEFT JOIN quiz_questions q ON s.session_id = q.session_id
    WHERE s.user_id = sess.user_id
    GROUP BY s.user_id
  )
  INSERT INTO user_stats (
    user_id, total_questions_answered, total_hints_used,
    total_time_spent_seconds, total_quizzes_completed, total_correct_answers,
    total_incorrect_answers, avg_time_per_question, avg_questions_per_quiz,
    avg_hints_per_quiz, hints_usage_ratio, correct_ratio, incorrect_ratio,
    updated_at
  )
  SELECT
    u.id,
    COALESCE(qa.total_questions_answered,0)::INT,
    COALESCE(sa.total_hints_used,0)::INT,
    COALESCE(sa.total_time_taken,0)::INT,
    COALESCE(sa.total_quizzes_completed,0)::INT,
    COALESCE(qa.total_correct_answers,0)::INT,
    COALESCE(qa.total_incorrect_answers,0)::INT,
    CASE WHEN qa.total_questions_answered > 0
      THEN qa.total_answer_time::FLOAT / qa.total_questions_answered
      ELSE 0
    END,
    CASE WHEN sa.total_quizzes_completed > 0
      THEN qa.total_questions_answered::FLOAT / sa.total_quizzes_completed
      ELSE 0
    END,
    CASE WHEN sa.total_quizzes_completed > 0
      THEN sa.total_hints_used::FLOAT / sa.total_quizzes_completed
      ELSE 0
    END,
    CASE WHEN qa.total_questions_answered > 0
      THEN (sa.total_hints_used::FLOAT / qa.total_questions_answered)
      ELSE 0
    END,
    CASE WHEN qa.total_questions_answered > 0
      THEN (qa.total_correct_answers::FLOAT / qa.total_questions_answered)
      ELSE 0
    END,
    CASE WHEN qa.total_questions_answered > 0
      THEN (qa.total_incorrect_answers::FLOAT / qa.total_questions_answered)
      ELSE 0
    END,
    NOW()
  FROM user_profile u
  LEFT JOIN session_agg sa ON u.id = sa.user_id
  LEFT JOIN question_agg qa ON u.id = qa.user_id
  WHERE u.id = sess.user_id
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_questions_answered = EXCLUDED.total_questions_answered,
    total_hints_used = EXCLUDED.total_hints_used,
    total_time_spent_seconds = EXCLUDED.total_time_spent_seconds,
    total_quizzes_completed = EXCLUDED.total_quizzes_completed,
    total_correct_answers = EXCLUDED.total_correct_answers,
    total_incorrect_answers = EXCLUDED.total_incorrect_answers,
    avg_time_per_question = EXCLUDED.avg_time_per_question,
    avg_questions_per_quiz = EXCLUDED.avg_questions_per_quiz,
    avg_hints_per_quiz = EXCLUDED.avg_hints_per_quiz,
    hints_usage_ratio = EXCLUDED.hints_usage_ratio,
    correct_ratio = EXCLUDED.correct_ratio,
    incorrect_ratio = EXCLUDED.incorrect_ratio,
    updated_at = NOW();

-- Update user_stats_daily
  WITH session_daily AS (
    SELECT
      s.user_id,
      s.time_taken_seconds AS time_spent_seconds,
      s.used_hints_count AS hints_used,
      CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END AS quizzes_completed,
      s.total_correct AS correct_answers,
      s.total_incorrect AS incorrect_answers
    FROM quiz_sessions s
    WHERE s.session_id = p_session_id
  ),
  questions_daily AS (
    SELECT
      s.user_id,
      COUNT(q.quiz_question_id) FILTER (WHERE q.user_answer IS NOT NULL) AS questions_answered
    FROM quiz_sessions s
    LEFT JOIN quiz_questions q ON s.session_id = q.session_id
    WHERE s.session_id = p_session_id
    GROUP BY s.user_id
  )
  INSERT INTO user_stats_daily (
    user_id, date, questions_answered, hints_used, time_spent_seconds,
    quizzes_completed, correct_answers, incorrect_answers
  )
  SELECT
    sd.user_id,
    today,
    COALESCE(qd.questions_answered,0)::INT,
    COALESCE(sd.hints_used,0)::INT,
    COALESCE(sd.time_spent_seconds,0)::INT,
    COALESCE(sd.quizzes_completed,0)::INT,
    COALESCE(sd.correct_answers,0)::INT,
    COALESCE(sd.incorrect_answers,0)::INT
  FROM session_daily sd
  LEFT JOIN questions_daily qd ON sd.user_id = qd.user_id
  ON CONFLICT (user_id, date) DO UPDATE
  SET
    questions_answered = user_stats_daily.questions_answered + EXCLUDED.questions_answered,
    hints_used = user_stats_daily.hints_used + EXCLUDED.hints_used,
    time_spent_seconds = user_stats_daily.time_spent_seconds + EXCLUDED.time_spent_seconds,
    quizzes_completed = user_stats_daily.quizzes_completed + EXCLUDED.quizzes_completed,
    correct_answers = user_stats_daily.correct_answers + EXCLUDED.correct_answers,
    incorrect_answers = user_stats_daily.incorrect_answers + EXCLUDED.incorrect_answers;

  UPDATE quiz_sessions
  SET stats_processed = TRUE
  WHERE session_id = p_session_id;

END;
$$ LANGUAGE plpgsql;
