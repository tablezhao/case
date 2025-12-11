-- 创建高频问题分析RPC函数
CREATE OR REPLACE FUNCTION get_high_frequency_issues(
  p_department_id uuid DEFAULT NULL,
  p_dimension text DEFAULT 'all',
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  violation_issue text,
  frequency bigint,
  percentage numeric
) 
LANGUAGE sql
STABLE
AS $$
  WITH filtered_cases AS (
    SELECT 
      TRIM(violation_content) as issue
    FROM cases
    WHERE 
      violation_content IS NOT NULL 
      AND violation_content != ''
      -- 部门筛选
      AND (p_department_id IS NULL OR department_id = p_department_id)
      -- 维度筛选
      AND (
        p_dimension = 'all' 
        OR (p_dimension = 'yearly' AND EXTRACT(YEAR FROM report_date) = p_year)
        OR (p_dimension = 'monthly' AND EXTRACT(YEAR FROM report_date) = p_year AND EXTRACT(MONTH FROM report_date) = p_month)
      )
  ),
  issue_counts AS (
    SELECT 
      issue,
      COUNT(*) as freq
    FROM filtered_cases
    GROUP BY issue
  ),
  total_count AS (
    SELECT SUM(freq) as total FROM issue_counts
  )
  SELECT 
    ic.issue as violation_issue,
    ic.freq as frequency,
    ROUND((ic.freq::numeric / tc.total * 100), 2) as percentage
  FROM issue_counts ic
  CROSS JOIN total_count tc
  ORDER BY ic.freq DESC
  LIMIT p_limit;
$$;

-- 添加函数注释
COMMENT ON FUNCTION get_high_frequency_issues IS '获取高频违规问题统计，支持多维度筛选';