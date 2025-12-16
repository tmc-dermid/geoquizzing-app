CREATE OR REPLACE FUNCTION grant_achievements(p_user_id UUID)
RETURNS TABLE (
  achievement_id INT,
  title TEXT,
  description TEXT,
  icon TEXT,
  points INT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  new_ach RECORD;
  ach_points INT;
  total_points INT := 0;
BEGIN
  FOR new_ach IN
    WITH eligible_achievements AS (
      SELECT a.*
      FROM achievements a
      LEFT JOIN user_achievement ua
        ON ua.user_id = p_user_id
       AND ua.achievement_id = a.achievement_id
      WHERE ua.achievement_id IS NULL
    ),
    quizzes_played_check AS (
      SELECT ea.achievement_id AS ach_id
      FROM eligible_achievements ea
      JOIN user_stats us ON us.user_id = p_user_id
      WHERE ea.condition_type = 'quizzes_played'
        AND us.total_quizzes_completed >= ea.condition_value
    ),
    correct_answers_check AS (
      SELECT ea.achievement_id AS ach_id
      FROM eligible_achievements ea
      JOIN user_stats us ON us.user_id = p_user_id
      WHERE ea.condition_type = 'correct_answers'
        AND us.total_correct_answers >= ea.condition_value
    ),
    quiz_modes_check AS (
      SELECT ea.achievement_id AS ach_id
      FROM eligible_achievements ea
      JOIN (
        SELECT COUNT(DISTINCT qs.difficulty) AS modes_count
        FROM quiz_sessions qs
        WHERE qs.user_id = p_user_id
      ) modes ON modes.modes_count >= ea.condition_value
      WHERE ea.condition_type = 'quiz_modes'
    ),
    perfect_score_check AS (
      SELECT ea.achievement_id AS ach_id
      FROM eligible_achievements ea
      JOIN quiz_sessions qs
        ON qs.user_id = p_user_id
       AND qs.status = 'completed'
       AND qs.total_correct = qs.num_questions
       AND (ea.num_questions_required IS NULL OR qs.num_questions = ea.num_questions_required)
       AND (ea.target_difficulty IS NULL OR qs.difficulty = ea.target_difficulty)
      JOIN subcategories s
        ON s.subcategory_id = qs.subcategory_id
       AND (ea.target_region IS NULL OR s.region = ea.target_region)
      WHERE ea.condition_type = 'perfect_score'
    )
    SELECT ach_id FROM quizzes_played_check
    UNION
    SELECT ach_id FROM correct_answers_check
    UNION
    SELECT ach_id FROM quiz_modes_check
    UNION
    SELECT ach_id FROM perfect_score_check
  LOOP

    INSERT INTO user_achievement (user_id, achievement_id)
    VALUES (p_user_id, new_ach.ach_id)
    ON CONFLICT DO NOTHING;

    SELECT a.points
    INTO ach_points
    FROM achievements a
    WHERE a.achievement_id = new_ach.ach_id;

    total_points := total_points + COALESCE(ach_points, 0);

    RETURN QUERY
    SELECT a.achievement_id, a.title, a.description, a.icon, a.points
    FROM achievements a
    WHERE a.achievement_id = new_ach.ach_id;

  END LOOP;

  IF total_points > 0 THEN
    UPDATE user_profile AS u
    SET points = u.points + total_points
    WHERE u.id = p_user_id;
  END IF;

END;
$$;
