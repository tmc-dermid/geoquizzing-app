CREATE OR REPLACE FUNCTION public.process_question_streak(p_user_id UUID, p_question_id INT, p_is_correct BOOLEAN)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id INT;
BEGIN
  SELECT c.category_id
  INTO v_category_id
  FROM questions q 
  JOIN question_subcategory qs ON q.question_id = qs.question_id
  JOIN subcategories s ON qs.subcategory_id = s.subcategory_id
  JOIN categories c ON s.category_id = c.category_id
  WHERE q.question_id = p_question_id
  LIMIT 1;

-- User Global Streaks
  IF p_is_correct THEN
    UPDATE user_stats
    SET
      current_streak = COALESCE(current_streak, 0) + 1,

      longest_streak = CASE
        WHEN current_streak + 1 > COALESCE(longest_streak, 0)
        THEN current_streak + 1
        ELSE longest_streak
      END,

      longest_streak_date = CASE
        WHEN current_streak + 1 > COALESCE(longest_streak, 0)
        THEN NOW()
        ELSE longest_streak_date
      END,

      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_stats
    SET
      current_streak = 0,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

-- Category Streaks
  INSERT INTO user_category_streaks(user_id, category_id, current_streak, longest_streak)
  VALUES (p_user_id, v_category_id, 0, 0)
  ON CONFLICT (user_id, category_id) DO NOTHING;

  IF p_is_correct THEN
    UPDATE user_category_streaks
    SET
      current_streak = COALESCE(current_streak, 0) + 1,

      longest_streak = CASE
        WHEN current_streak + 1 > COALESCE(longest_streak, 0)
        THEN current_streak + 1
        ELSE longest_streak
      END,

      longest_streak_date = CASE
        WHEN current_streak + 1 > COALESCE(longest_streak, 0)
        THEN NOW()
        ELSE longest_streak_date
      END,

      updated_at = NOW()
    WHERE user_id = p_user_id
      AND category_id = v_category_id;
  ELSE
    UPDATE user_category_streaks
    SET
      current_streak = 0,
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND category_id = v_category_id;
  END IF;
END;
$$ LANGUAGE plpgsql;