CREATE OR REPLACE FUNCTION get_home_charts_data(time_range TEXT DEFAULT 'all')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_date DATE;
  end_date DATE := CURRENT_DATE;
  trend jsonb;
  national jsonb;
  provincial jsonb;
  platform jsonb;
  violation jsonb;
BEGIN
  CASE time_range
    WHEN 'recent6' THEN
      start_date := date_trunc('month', CURRENT_DATE - INTERVAL '5 months')::date;
    WHEN 'thisYear' THEN
      start_date := date_trunc('year', CURRENT_DATE)::date;
    ELSE
      SELECT MIN(report_date) INTO start_date FROM cases;
      IF start_date IS NULL THEN
        start_date := date_trunc('year', CURRENT_DATE)::date;
      END IF;
  END CASE;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('month', month, 'count', count) ORDER BY month
    ),
    '[]'::jsonb
  )
  INTO trend
  FROM (
    SELECT
      TO_CHAR(date_trunc('month', report_date), 'YYYY-MM') AS month,
      COUNT(DISTINCT app_name)::INTEGER AS count
    FROM cases
    WHERE report_date >= start_date
      AND report_date <= end_date
      AND app_name IS NOT NULL
      AND app_name != ''
    GROUP BY date_trunc('month', report_date)
    ORDER BY date_trunc('month', report_date)
  ) t;

  WITH dept_stats AS (
    SELECT
      d.id,
      d.name,
      d.level,
      COUNT(DISTINCT c.app_name) AS app_count
    FROM regulatory_departments d
    LEFT JOIN cases c
      ON d.id = c.department_id
     AND c.report_date >= start_date
     AND c.report_date <= end_date
     AND c.app_name IS NOT NULL
     AND c.app_name != ''
    GROUP BY d.id, d.name, d.level
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('name', name, 'count', app_count) ORDER BY app_count DESC
    ),
    '[]'::jsonb
  )
  INTO national
  FROM dept_stats
  WHERE level = 'national' AND app_count > 0;

  WITH dept_stats AS (
    SELECT
      d.id,
      d.name,
      d.level,
      COUNT(DISTINCT c.app_name) AS app_count
    FROM regulatory_departments d
    LEFT JOIN cases c
      ON d.id = c.department_id
     AND c.report_date >= start_date
     AND c.report_date <= end_date
     AND c.app_name IS NOT NULL
     AND c.app_name != ''
    GROUP BY d.id, d.name, d.level
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('name', name, 'count', app_count) ORDER BY app_count DESC
    ),
    '[]'::jsonb
  )
  INTO provincial
  FROM dept_stats
  WHERE level = 'provincial' AND app_count > 0;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('name', platform_name, 'count', case_count) ORDER BY case_count DESC
    ),
    '[]'::jsonb
  )
  INTO platform
  FROM (
    SELECT
      COALESCE(p.name, '未知平台') AS platform_name,
      COUNT(*)::INTEGER AS case_count
    FROM cases c
    LEFT JOIN app_platforms p ON c.platform_id = p.id
    WHERE c.report_date >= start_date
      AND c.report_date <= end_date
    GROUP BY platform_name
    ORDER BY case_count DESC
  ) t;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('name', keyword, 'count', keyword_count) ORDER BY keyword_count DESC
    ),
    '[]'::jsonb
  )
  INTO violation
  FROM (
    WITH filtered_cases AS (
      SELECT violation_content
      FROM cases
      WHERE report_date >= start_date
        AND report_date <= end_date
    ),
    extracted_keywords AS (
      SELECT unnest(extract_violation_keywords(violation_content)) AS keyword
      FROM filtered_cases
    )
    SELECT
      keyword,
      COUNT(*)::INTEGER AS keyword_count
    FROM extracted_keywords
    WHERE keyword IS NOT NULL AND keyword != ''
    GROUP BY keyword
    ORDER BY keyword_count DESC
  ) t;

  RETURN jsonb_build_object(
    'trend', trend,
    'national', national,
    'provincial', provincial,
    'platform', platform,
    'violation', violation
  );
END;
$$;

COMMENT ON FUNCTION get_home_charts_data(TEXT) IS '首页图表聚合数据（趋势、部门、平台、违规类型），支持时间范围 recent6/thisYear/all';
