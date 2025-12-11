/*
# 添加高频问题分析RPC函数

## 功能说明
创建RPC函数用于分析案例数据库中的高频违规问题，支持多维度筛选。

## 函数详情
- **函数名**: get_high_frequency_issues
- **参数**:
  - `p_department_id` (uuid, 可选): 监管部门ID筛选
  - `p_dimension` (text): 数据维度 ('all', 'yearly', 'monthly')
  - `p_year` (integer, 可选): 年份筛选
  - `p_month` (integer, 可选): 月份筛选
  - `p_limit` (integer, 默认10): 返回前N个高频问题
- **返回类型**: TABLE(violation_issue text, frequency bigint, percentage numeric)
- **功能**: 
  - 从cases表中提取违规内容
  - 统计每个违规问题的出现频次
  - 按频次降序排列
  - 计算每个问题占总数的百分比

## 使用场景
- 问题分析页面的高频问题统计
- 支持按部门、年份、月份筛选
- 支持全部数据、按年、按月三种维度

## 技术要点
1. 使用CTE (Common Table Expression) 代替临时表
2. 使用GROUP BY统计频次
3. 使用窗口函数计算百分比
4. 支持灵活的参数组合
*/

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
