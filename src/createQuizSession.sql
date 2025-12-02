CREATE OR REPLACE FUNCTION create_quiz_session(
  p_user_id UUID,
  p_subcategory_id INT,
  p_difficulty TEXT,
  p_num_questions INT,
  p_with_dependencies BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  new_session_id UUID;
BEGIN

  -- Create new session
  INSERT INTO quiz_sessions (user_id, subcategory_id, difficulty, num_questions, with_dependencies)
  VALUES (p_user_id, p_subcategory_id, p_difficulty, p_num_questions, p_with_dependencies)
  RETURNING session_id INTO new_session_id;

  -- Choose randomly n questions concerning a given subcategory
  INSERT INTO quiz_questions (session_id, question_id, correct_answer, question_order)
  SELECT
    new_session_id,
    q.question_id,
    q.correct_answer,
    ROW_NUMBER() OVER(ORDER BY RANDOM()) AS question_order
  FROM questions q
  JOIN question_subcategory qs ON q.question_id = qs.question_id
  WHERE qs.subcategory_id = p_subcategory_id
  LIMIT p_num_questions;

  RETURN new_session_id;
END;

$$ LANGUAGE plpgsql SECURITY DEFINER;