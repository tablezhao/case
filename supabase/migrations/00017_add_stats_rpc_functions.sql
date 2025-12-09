/*
# 添加统计RPC函数以优化首页加载性能

## 1. 功能说明
创建高性能的RPC函数来执行统计查询，将统计逻辑从前端迁移到后端，
使用SQL聚合函数减少数据传输量，提升首页加载速度。

## 2. 新增RPC函数

### `get_homepage_stats`
返回首页所需的所有统计数据，包括：
- 累计通报频次
- 累计涉及应用数
- 最近一次通报信息
- 本月/本季度/本年度统计
- 环比数据

### `get_yearly_trend_stats`
返回年度趋势统计数据（按应用数量）

### `get_monthly_trend_stats`
返回月度趋势统计数据（按应用数量）

### `get_department_distribution_stats`
返回监管部门分布统计（国家级和省级）

### `get_platform_distribution_stats`
返回应用平台分布统计

### `get_violation_keywords_stats`
返回违规问题关键词统计

## 3. 性能优势
- 使用SQL聚合函数，减少数据传输量
- 在数据库层面完成统计计算
- 减少前端JavaScript计算负担
- 支持后续添加缓存机制

## 4. 注意事项
- 所有函数使用SECURITY DEFINER权限
- 返回JSON格式数据便于前端使用
- 函数内部使用高效的SQL查询
*/

-- ============================================
-- 1. 首页核心统计数据
-- ============================================
CREATE OR REPLACE FUNCTION get_homepage_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  current_year int;
  current_month int;
  current_quarter int;
  last_month int;
  last_month_year int;
  last_quarter int;
  last_quarter_year int;
  quarter_start_month int;
  last_quarter_start_month int;
BEGIN
  -- 获取当前时间信息
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_quarter := CEIL(current_month / 3.0);
  
  -- 计算上月
  IF current_month = 1 THEN
    last_month := 12;
    last_month_year := current_year - 1;
  ELSE
    last_month := current_month - 1;
    last_month_year := current_year;
  END IF;
  
  -- 计算上季度
  IF current_quarter = 1 THEN
    last_quarter := 4;
    last_quarter_year := current_year - 1;
  ELSE
    last_quarter := current_quarter - 1;
    last_quarter_year := current_year;
  END IF;
  
  quarter_start_month := (current_quarter - 1) * 3 + 1;
  last_quarter_start_month := (last_quarter - 1) * 3 + 1;
  
  -- 执行统计查询
  WITH stats AS (
    -- 累计统计
    SELECT
      COUNT(DISTINCT department_id || '_' || report_date) as total_cases,
      COUNT(DISTINCT app_name) as total_apps
    FROM cases
  ),
  latest AS (
    -- 最近一次通报
    SELECT
      c.report_date,
      d.name as department_name
    FROM cases c
    LEFT JOIN regulatory_departments d ON c.department_id = d.id
    ORDER BY c.report_date DESC
    LIMIT 1
  ),
  current_month_stats AS (
    -- 本月统计
    SELECT
      COUNT(DISTINCT department_id || '_' || report_date) as cases_count,
      COUNT(DISTINCT app_name) as apps_count
    FROM cases
    WHERE EXTRACT(YEAR FROM report_date) = current_year
      AND EXTRACT(MONTH FROM report_date) = current_month
  ),
  last_month_stats AS (
    -- 上月统计
    SELECT
      COUNT(DISTINCT department_id || '_' || report_date) as cases_count,
      COUNT(DISTINCT app_name) as apps_count
    FROM cases
    WHERE EXTRACT(YEAR FROM report_date) = last_month_year
      AND EXTRACT(MONTH FROM report_date) = last_month
  ),
  current_quarter_stats AS (
    -- 本季度统计
    SELECT
      COUNT(DISTINCT department_id || '_' || report_date) as cases_count,
      COUNT(DISTINCT app_name) as apps_count
    FROM cases
    WHERE EXTRACT(YEAR FROM report_date) = current_year
      AND EXTRACT(MONTH FROM report_date) >= quarter_start_month
      AND EXTRACT(MONTH FROM report_date) < quarter_start_month + 3
  ),
  last_quarter_stats AS (
    -- 上季度统计
    SELECT
      COUNT(DISTINCT department_id || '_' || report_date) as cases_count,
      COUNT(DISTINCT app_name) as apps_count
    FROM cases
    WHERE EXTRACT(YEAR FROM report_date) = last_quarter_year
      AND EXTRACT(MONTH FROM report_date) >= last_quarter_start_month
      AND EXTRACT(MONTH FROM report_date) < last_quarter_start_month + 3
  ),
  current_year_stats AS (
    -- 本年度统计
    SELECT
      COUNT(DISTINCT department_id || '_' || report_date) as cases_count,
      COUNT(DISTINCT app_name) as apps_count
    FROM cases
    WHERE EXTRACT(YEAR FROM report_date) = current_year
  ),
  last_year_stats AS (
    -- 上年度统计
    SELECT
      COUNT(DISTINCT department_id || '_' || report_date) as cases_count,
      COUNT(DISTINCT app_name) as apps_count
    FROM cases
    WHERE EXTRACT(YEAR FROM report_date) = current_year - 1
  )
  SELECT jsonb_build_object(
    'total_cases', s.total_cases,
    'total_apps', s.total_apps,
    'latest_report_date', l.report_date,
    'latest_department', l.department_name,
    'current_month_cases', cm.cases_count,
    'current_month_apps', cm.apps_count,
    'last_month_cases', lm.cases_count,
    'last_month_apps', lm.apps_count,
    'current_quarter_cases', cq.cases_count,
    'current_quarter_apps', cq.apps_count,
    'last_quarter_cases', lq.cases_count,
    'last_quarter_apps', lq.apps_count,
    'current_year_cases', cy.cases_count,
    'current_year_apps', cy.apps_count,
    'last_year_cases', ly.cases_count,
    'last_year_apps', ly.apps_count
  ) INTO result
  FROM stats s
  CROSS JOIN latest l
  CROSS JOIN current_month_stats cm
  CROSS JOIN last_month_stats lm
  CROSS JOIN current_quarter_stats cq
  CROSS JOIN last_quarter_stats lq
  CROSS JOIN current_year_stats cy
  CROSS JOIN last_year_stats ly;
  
  RETURN result;
END;
$$;

-- ============================================
-- 2. 年度趋势统计
-- ============================================
CREATE OR REPLACE FUNCTION get_yearly_trend_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'year', year,
      'count', app_count
    ) ORDER BY year
  ) INTO result
  FROM (
    SELECT
      EXTRACT(YEAR FROM report_date)::text as year,
      COUNT(DISTINCT app_name) as app_count
    FROM cases
    GROUP BY EXTRACT(YEAR FROM report_date)
  ) t;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ============================================
-- 3. 月度趋势统计
-- ============================================
CREATE OR REPLACE FUNCTION get_monthly_trend_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month,
      'count', app_count
    ) ORDER BY month
  ) INTO result
  FROM (
    SELECT
      TO_CHAR(report_date, 'YYYY-MM') as month,
      COUNT(DISTINCT app_name) as app_count
    FROM cases
    WHERE report_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY TO_CHAR(report_date, 'YYYY-MM')
  ) t;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ============================================
-- 4. 监管部门分布统计
-- ============================================
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
      COUNT(DISTINCT c.department_id || '_' || c.report_date) as case_count
    FROM regulatory_departments d
    LEFT JOIN cases c ON d.id = c.department_id
    GROUP BY d.id, d.name, d.level
  )
  SELECT jsonb_build_object(
    'national', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', name,
          'value', case_count
        ) ORDER BY case_count DESC
      )
      FROM dept_stats
      WHERE level = 'national' AND case_count > 0
    ),
    'provincial', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', name,
          'value', case_count
        ) ORDER BY case_count DESC
      )
      FROM dept_stats
      WHERE level = 'provincial' AND case_count > 0
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================
-- 5. 应用平台分布统计
-- ============================================
CREATE OR REPLACE FUNCTION get_platform_distribution_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', platform_name,
      'value', case_count
    ) ORDER BY case_count DESC
  ) INTO result
  FROM (
    SELECT
      p.name as platform_name,
      COUNT(*) as case_count
    FROM cases c
    LEFT JOIN app_platforms p ON c.platform_id = p.id
    WHERE p.name IS NOT NULL
    GROUP BY p.name
  ) t;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ============================================
-- 6. 违规问题关键词统计
-- ============================================
CREATE OR REPLACE FUNCTION get_violation_keywords_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- 提取违规问题摘要中的关键词并统计
  -- 这里简化处理，统计完整的违规问题摘要
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', violation_summary,
      'value', count
    )
  ) INTO result
  FROM (
    SELECT
      violation_summary,
      COUNT(*) as count
    FROM cases
    WHERE violation_summary IS NOT NULL AND violation_summary != ''
    GROUP BY violation_summary
    ORDER BY count DESC
    LIMIT 50
  ) t;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ============================================
-- 7. 地域分布统计（基于部门所在省份）
-- ============================================
CREATE OR REPLACE FUNCTION get_geographic_distribution_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', province,
      'value', case_count
    ) ORDER BY case_count DESC
  ) INTO result
  FROM (
    SELECT
      d.province,
      COUNT(DISTINCT c.department_id || '_' || c.report_date) as case_count
    FROM regulatory_departments d
    LEFT JOIN cases c ON d.id = c.department_id
    WHERE d.province IS NOT NULL
    GROUP BY d.province
  ) t;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION get_homepage_stats() IS '获取首页核心统计数据，包括累计数据、本月/季度/年度数据及环比';
COMMENT ON FUNCTION get_yearly_trend_stats() IS '获取年度趋势统计数据（按应用数量）';
COMMENT ON FUNCTION get_monthly_trend_stats() IS '获取月度趋势统计数据（按应用数量）';
COMMENT ON FUNCTION get_department_distribution_stats() IS '获取监管部门分布统计（国家级和省级）';
COMMENT ON FUNCTION get_platform_distribution_stats() IS '获取应用平台分布统计';
COMMENT ON FUNCTION get_violation_keywords_stats() IS '获取违规问题关键词统计';
COMMENT ON FUNCTION get_geographic_distribution_stats() IS '获取地域分布统计（基于部门所在省份）';
