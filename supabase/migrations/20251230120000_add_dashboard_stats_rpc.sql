-- 创建获取仪表盘统计数据的 RPC 函数
-- 统一首页数据口径，解决前端计算与后端 RPC 不一致的问题

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- 当前时间相关变量
  v_now date := current_date;
  v_current_month_start date := date_trunc('month', v_now);
  v_last_month_start date := date_trunc('month', v_now - interval '1 month');
  v_next_month_start date := date_trunc('month', v_now + interval '1 month');
  
  v_current_quarter_start date := date_trunc('quarter', v_now);
  v_last_quarter_start date := date_trunc('quarter', v_now - interval '3 months');
  v_next_quarter_start date := date_trunc('quarter', v_now + interval '3 months');
  
  v_current_year_start date := date_trunc('year', v_now);
  v_last_year_start date := date_trunc('year', v_now - interval '1 year');
  v_next_year_start date := date_trunc('year', v_now + interval '1 year');

  -- 统计结果变量
  v_total_cases bigint;
  v_total_apps bigint;
  v_latest_report_date date;
  v_latest_department text;
  
  -- 月度
  v_current_month_cases bigint;
  v_current_month_apps bigint;
  v_last_month_cases bigint;
  v_last_month_apps bigint;
  
  -- 季度
  v_current_quarter_cases bigint;
  v_current_quarter_apps bigint;
  v_last_quarter_cases bigint;
  v_last_quarter_apps bigint;
  
  -- 年度
  v_current_year_cases bigint;
  v_current_year_apps bigint;
  v_last_year_cases bigint;
  v_last_year_apps bigint;

  -- 环比变化
  v_cases_change bigint;
  v_cases_change_percent numeric;
  v_apps_change bigint;
  v_apps_change_percent numeric;
  
  v_quarter_cases_change bigint;
  v_quarter_cases_change_percent numeric;
  v_quarter_apps_change bigint;
  v_quarter_apps_change_percent numeric;
  
  v_year_cases_change bigint;
  v_year_cases_change_percent numeric;
  v_year_apps_change bigint;
  v_year_apps_change_percent numeric;

BEGIN
  -- 1. 累计统计
  -- 通报频次：按 部门ID + 通报日期 去重
  SELECT count(DISTINCT department_id || '_' || report_date)
  INTO v_total_cases
  FROM cases;

  -- 应用总数：按 应用名称 去重
  SELECT count(DISTINCT app_name)
  INTO v_total_apps
  FROM cases;

  -- 2. 最近一次通报
  SELECT 
    c.report_date, 
    d.name
  INTO v_latest_report_date, v_latest_department
  FROM cases c
  LEFT JOIN regulatory_departments d ON c.department_id = d.id
  ORDER BY c.report_date DESC
  LIMIT 1;

  -- 3. 月度统计
  -- 本月
  SELECT 
    count(DISTINCT department_id || '_' || report_date),
    count(DISTINCT app_name)
  INTO v_current_month_cases, v_current_month_apps
  FROM cases
  WHERE report_date >= v_current_month_start AND report_date < v_next_month_start;

  -- 上月
  SELECT 
    count(DISTINCT department_id || '_' || report_date),
    count(DISTINCT app_name)
  INTO v_last_month_cases, v_last_month_apps
  FROM cases
  WHERE report_date >= v_last_month_start AND report_date < v_current_month_start;

  -- 4. 季度统计
  -- 本季度
  SELECT 
    count(DISTINCT department_id || '_' || report_date),
    count(DISTINCT app_name)
  INTO v_current_quarter_cases, v_current_quarter_apps
  FROM cases
  WHERE report_date >= v_current_quarter_start AND report_date < v_next_quarter_start;

  -- 上季度
  SELECT 
    count(DISTINCT department_id || '_' || report_date),
    count(DISTINCT app_name)
  INTO v_last_quarter_cases, v_last_quarter_apps
  FROM cases
  WHERE report_date >= v_last_quarter_start AND report_date < v_current_quarter_start;

  -- 5. 年度统计
  -- 本年度
  SELECT 
    count(DISTINCT department_id || '_' || report_date),
    count(DISTINCT app_name)
  INTO v_current_year_cases, v_current_year_apps
  FROM cases
  WHERE report_date >= v_current_year_start AND report_date < v_next_year_start;

  -- 上年度
  SELECT 
    count(DISTINCT department_id || '_' || report_date),
    count(DISTINCT app_name)
  INTO v_last_year_cases, v_last_year_apps
  FROM cases
  WHERE report_date >= v_last_year_start AND report_date < v_current_year_start;

  -- 6. 计算环比 (月度)
  v_cases_change := v_current_month_cases - v_last_month_cases;
  IF v_last_month_cases > 0 THEN
    v_cases_change_percent := round((v_cases_change::numeric / v_last_month_cases::numeric) * 100, 2);
  ELSE
    v_cases_change_percent := 0;
  END IF;

  v_apps_change := v_current_month_apps - v_last_month_apps;
  IF v_last_month_apps > 0 THEN
    v_apps_change_percent := round((v_apps_change::numeric / v_last_month_apps::numeric) * 100, 2);
  ELSE
    v_apps_change_percent := 0;
  END IF;

  -- 7. 计算环比 (季度)
  v_quarter_cases_change := v_current_quarter_cases - v_last_quarter_cases;
  IF v_last_quarter_cases > 0 THEN
    v_quarter_cases_change_percent := round((v_quarter_cases_change::numeric / v_last_quarter_cases::numeric) * 100, 2);
  ELSE
    v_quarter_cases_change_percent := 0;
  END IF;

  v_quarter_apps_change := v_current_quarter_apps - v_last_quarter_apps;
  IF v_last_quarter_apps > 0 THEN
    v_quarter_apps_change_percent := round((v_quarter_apps_change::numeric / v_last_quarter_apps::numeric) * 100, 2);
  ELSE
    v_quarter_apps_change_percent := 0;
  END IF;

  -- 8. 计算环比 (年度)
  v_year_cases_change := v_current_year_cases - v_last_year_cases;
  IF v_last_year_cases > 0 THEN
    v_year_cases_change_percent := round((v_year_cases_change::numeric / v_last_year_cases::numeric) * 100, 2);
  ELSE
    v_year_cases_change_percent := 0;
  END IF;

  -- 9. 返回 JSON
  RETURN json_build_object(
    'total_cases', v_total_cases,
    'total_apps', v_total_apps,
    'latest_report_date', v_latest_report_date,
    'latest_department', v_latest_department,
    
    'current_month_cases', v_current_month_cases,
    'current_month_apps', v_current_month_apps,
    
    'current_quarter_cases', v_current_quarter_cases,
    'current_quarter_apps', v_current_quarter_apps,
    
    'current_year_cases', v_current_year_cases,
    'current_year_apps', v_current_year_apps,
    
    'cases_change', v_cases_change,
    'cases_change_percent', v_cases_change_percent,
    'apps_change', v_apps_change,
    'apps_change_percent', v_apps_change_percent,
    
    'quarter_cases_change', v_quarter_cases_change,
    'quarter_cases_change_percent', v_quarter_cases_change_percent,
    'quarter_apps_change', v_quarter_apps_change,
    'quarter_apps_change_percent', v_quarter_apps_change_percent,
    
    'year_cases_change', v_year_cases_change,
    'year_cases_change_percent', v_year_cases_change_percent,
    'year_apps_change', v_year_apps_change,
    'year_apps_change_percent', v_year_apps_change_percent
  );
END;
$$;
