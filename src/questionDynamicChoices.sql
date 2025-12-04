CREATE OR REPLACE FUNCTION public.get_question_dynamic_choices(
  p_question_id INT,
  p_subcategory_id INT,
  p_difficulty TEXT,
  p_include_dependencies BOOLEAN
)
RETURNS TABLE (
  label CHAR(1),
  choice_text TEXT,
  is_correct BOOLEAN
)
AS $$
DECLARE
  v_category_name TEXT;
  v_region TEXT;
  v_correct_answer TEXT;
  v_required_count INT;
  v_labels TEXT[] := ARRAY['A','B','C','D','E','F'];
BEGIN
  -- get Category and Region
  SELECT c.category_name, s.region
  INTO v_category_name, v_region
  FROM subcategories s
  JOIN categories c ON s.category_id = c.category_id
  WHERE s.subcategory_id = p_subcategory_id;

  -- get Correct Answer
  SELECT qc.choice_text
  INTO v_correct_answer
  FROM question_choices qc
  WHERE qc.question_id = p_question_id AND qc.is_correct = TRUE;

  -- number of choices
  IF p_difficulty = 'easy' THEN
    v_required_count := 4;
  ELSIF p_difficulty = 'medium' THEN
    v_required_count := 6;
  ELSE
    RETURN;
  END IF;

  -- categories not Flags/Country Shapes or region World
  IF v_category_name NOT IN ('Flags','Country Shapes') OR v_region = 'World' THEN
    RETURN QUERY
    SELECT qc.label, qc.choice_text, qc.is_correct
    FROM question_choices qc
    WHERE qc.question_id = p_question_id
    ORDER BY qc.label;
    RETURN;
  END IF;

  -- Dependent Territories lub region, który nie istnieje w continents
  IF v_region = 'Dependent Territories' THEN
    RETURN QUERY
    WITH wrong AS (
      SELECT cou.country_name AS c_text
      FROM countries cou
      WHERE cou.country_name <> v_correct_answer
        AND (p_include_dependencies OR LOWER(TRIM(cou.type)) = 'country')
      ORDER BY RANDOM()
      LIMIT (v_required_count - 1)
    ),
    combined AS (
      SELECT v_correct_answer AS c_text, TRUE AS is_corr
      UNION ALL
      SELECT c_text, FALSE AS is_corr FROM wrong
    ),
    numbered AS (
      SELECT v_labels[ROW_NUMBER() OVER()]::CHAR(1) AS q_label, c_text, is_corr
      FROM combined
    )
    SELECT q_label AS label, c_text AS choice_text, is_corr AS is_correct
    FROM numbered
    ORDER BY label;
    RETURN;
  END IF;

  -- Normal case: regular continents
  RETURN QUERY
  WITH wrong AS (
    SELECT cou.country_name AS c_text
    FROM countries cou
    JOIN country_continent cc ON cou.country_id = cc.country_id
    JOIN continents con ON cc.continent_id = con.continent_id
    WHERE con.continent_name = v_region
      AND cou.country_name <> v_correct_answer
      AND (p_include_dependencies OR LOWER(TRIM(cou.type)) = 'country')
    ORDER BY RANDOM()
    LIMIT (v_required_count - 1)
  ),
  combined AS (
    SELECT v_correct_answer AS c_text, TRUE AS is_corr
    UNION ALL
    SELECT c_text, FALSE AS is_corr FROM wrong
  ),
  numbered AS (
    SELECT v_labels[ROW_NUMBER() OVER()]::CHAR(1) AS q_label, c_text, is_corr
    FROM combined
  )
  SELECT q_label AS label, c_text AS choice_text, is_corr AS is_correct
  FROM numbered
  ORDER BY label;

END;
$$ LANGUAGE plpgsql;
