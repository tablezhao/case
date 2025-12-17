-- 创建趋势总览统计函数
CREATE OR REPLACE FUNCTION get_trend_overview(
  current_year INT,
  current_month INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  current_month_start DATE := TO_DATE(CONCAT(current_year, '-', LPAD(current_month::TEXT, 2, '0'), '-01'), 'YYYY-MM-DD');
  current_month_end DATE := (current_month_start + INTERVAL '1 month') - INTERVAL '1 day';
  year_start DATE := TO_DATE(CONCAT(current_year, '-01-01'), 'YYYY-MM-DD');
  year_end DATE := TO_DATE(CONCAT(current_year, '-12-31'), 'YYYY-MM-DD');
BEGIN
  RETURN (
    SELECT json_build_object(
      -- 1. 当前月通报风险等级
      'current_month_risk', (
        SELECT json_build_object(
          'level', CASE
            WHEN COUNT(DISTINCT report_date) > 5 THEN 'high'::TEXT
            WHEN COUNT(DISTINCT report_date) > 1 THEN 'medium'::TEXT
            ELSE 'low'::TEXT
          END,
          'count', COUNT(DISTINCT report_date),
          'month', TO_CHAR(CURRENT_DATE, 'YYYY"年"MM"月"')
        )
        FROM cases
        WHERE report_date BETWEEN current_month_start AND current_month_end
      ),
      
      -- 2. 本年通报高频时段
      'high_frequency_months', (
        SELECT COALESCE(json_agg(json_build_object(
          'month', TO_CHAR(month, 'YYYY-MM'),
          'count', count
        ) ORDER BY count DESC), '[]')
        FROM (
          SELECT
            DATE_TRUNC('month', report_date) AS month,
            COUNT(DISTINCT report_date) AS count
          FROM cases
          WHERE report_date BETWEEN year_start AND year_end
          GROUP BY DATE_TRUNC('month', report_date)
          HAVING COUNT(DISTINCT report_date) >= 5
        ) AS monthly_stats
      ),
      
      -- 3. 高频通报部门
      'top_departments', json_build_object(
        -- 月度前三
        'monthly', (
          SELECT COALESCE(json_agg(json_build_object(
            'name', department_name,
            'count', count
          ) ORDER BY count DESC), '[]')
          FROM (
            SELECT
              rd.name AS department_name,
              COUNT(DISTINCT c.report_date) AS count
            FROM cases c
            JOIN regulatory_departments rd ON c.department_id = rd.id
            WHERE c.report_date BETWEEN current_month_start AND current_month_end
            GROUP BY rd.name
            ORDER BY count DESC
            LIMIT 3
          ) AS monthly_depts
        ),
        
        -- 年度前三
        'yearly', (
          SELECT COALESCE(json_agg(json_build_object(
            'name', department_name,
            'count', count
          ) ORDER BY count DESC), '[]')
          FROM (
            SELECT
              rd.name AS department_name,
              COUNT(DISTINCT c.report_date) AS count
            FROM cases c
            JOIN regulatory_departments rd ON c.department_id = rd.id
            WHERE c.report_date BETWEEN year_start AND year_end
            GROUP BY rd.name
            ORDER BY count DESC
            LIMIT 3
          ) AS yearly_depts
        )
      ),
      
      -- 4. 高频被通报平台
      'top_platforms', json_build_object(
        -- 月度前三
        'monthly', (
          SELECT COALESCE(json_agg(json_build_object(
            'name', platform_name,
            'count', count
          ) ORDER BY count DESC), '[]')
          FROM (
            SELECT
              ap.name AS platform_name,
              COUNT(*) AS count
            FROM cases c
            JOIN app_platforms ap ON c.platform_id = ap.id
            WHERE c.report_date BETWEEN current_month_start AND current_month_end
            GROUP BY ap.name
            ORDER BY count DESC
            LIMIT 3
          ) AS monthly_platforms
        ),
        
        -- 年度前三
        'yearly', (
          SELECT COALESCE(json_agg(json_build_object(
            'name', platform_name,
            'count', count
          ) ORDER BY count DESC), '[]')
          FROM (
            SELECT
              ap.name AS platform_name,
              COUNT(*) AS count
            FROM cases c
            JOIN app_platforms ap ON c.platform_id = ap.id
            WHERE c.report_date BETWEEN year_start AND year_end
            GROUP BY ap.name
            ORDER BY count DESC
            LIMIT 3
          ) AS yearly_platforms
        )
      )
    );
END;
$$;