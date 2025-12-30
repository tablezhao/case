-- 修复部门分布统计逻辑：从通报活动次数改为通报应用数量
CREATE OR REPLACE FUNCTION get_department_distribution_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH dept_stats AS (
    SELECT
      d.id,
      d.name,
      d.level,
      COUNT(DISTINCT c.app_name) as app_count
    FROM regulatory_departments d
    LEFT JOIN cases c ON d.id = c.department_id AND c.app_name IS NOT NULL AND c.app_name != ''
    GROUP BY d.id, d.name, d.level
  )
  SELECT jsonb_build_object(
    'national', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', name,
          'value', app_count
        ) ORDER BY app_count DESC
      )
      FROM dept_stats
      WHERE level = 'national' AND app_count > 0
    ),
    'provincial', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', name,
          'value', app_count
        ) ORDER BY app_count DESC
      )
      FROM dept_stats
      WHERE level = 'provincial' AND app_count > 0
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 更新函数注释
COMMENT ON FUNCTION get_department_distribution_stats() IS '获取监管部门分布统计（国家级和省级，按应用名称去重）';
