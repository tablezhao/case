-- Align get_high_frequency_issues with get_violation_type_analysis logic
-- Use the same regex-based keyword extraction for consistency

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
    -- Step 1: Filter cases
    SELECT 
      violation_keywords
    FROM cases
    WHERE 
      violation_keywords IS NOT NULL
      -- Department filter
      AND (p_department_id IS NULL OR department_id = p_department_id)
      -- Dimension filter
      AND (
        p_dimension = 'all' 
        OR (p_dimension = 'yearly' AND EXTRACT(YEAR FROM report_date) = p_year)
        OR (p_dimension = 'monthly' AND EXTRACT(YEAR FROM report_date) = p_year AND EXTRACT(MONTH FROM report_date) = p_month)
      )
  ),
  extracted_issues AS (
    -- Step 2: Use precomputed keyword extraction (write-time)
    SELECT 
      unnest(violation_keywords) as issue
    FROM filtered_cases
  ),
  issue_counts AS (
    -- Step 3: Count frequencies
    SELECT 
      issue,
      COUNT(*) as freq
    FROM extracted_issues
    GROUP BY issue
  ),
  total_count AS (
    -- Step 4: Calculate total
    SELECT SUM(freq) as total FROM issue_counts
  )
  -- Step 5: Calculate percentage and return
  SELECT 
    ic.issue as violation_issue,
    ic.freq as frequency,
    ROUND((ic.freq::numeric / NULLIF(tc.total, 0) * 100), 2) as percentage
  FROM issue_counts ic
  CROSS JOIN total_count tc
  WHERE tc.total > 0
  ORDER BY ic.freq DESC, ic.issue ASC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_high_frequency_issues IS '获取高频违规问题统计（已对齐首页逻辑），使用正则提取关键词';
