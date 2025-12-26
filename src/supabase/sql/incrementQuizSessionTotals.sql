CREATE OR REPLACE FUNCTION public.increment_quiz_session_totals(
  p_session_id UUID,
  p_inc_correct INT,
  p_inc_incorrect INT,
  p_add_points INT,
  p_mark_completed BOOLEAN
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE quiz_sessions
  SET
    total_correct = COALESCE(total_correct, 0) + p_inc_correct,
    total_incorrect = COALESCE(total_incorrect, 0) + p_inc_incorrect,
    base_points = COALESCE(base_points, 0) + p_add_points,
    completed_at = CASE WHEN p_mark_completed THEN NOW() ELSE completed_at END,
    status = CASE WHEN p_mark_completed THEN 'completed' ELSE status END
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;