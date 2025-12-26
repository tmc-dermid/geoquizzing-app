CREATE OR REPLACE FUNCTION public.get_subcategory_full(slug_input TEXT)
RETURNS TABLE (
  subcategory_id INT,
  category_id INT,
  subcategory_name TEXT,
  region TEXT,
  subcategory_img TEXT,
  subcategory_img_source TEXT,
  slug TEXT,
  countries_count INT,
  territories_count INT
) 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.subcategory_id,
    s.category_id,
    s.subcategory_name,
    s.region,
    s.subcategory_img,
    s.subcategory_img_source,
    s.slug,
    COALESCE(r.countries_count, 0) AS countries_count,
    COALESCE(r.territories_count, 0) AS territories_count
  FROM subcategories s
  LEFT JOIN public.region_stats r ON r.region = s.region
  WHERE s.slug = slug_input;
$$ LANGUAGE sql STABLE;