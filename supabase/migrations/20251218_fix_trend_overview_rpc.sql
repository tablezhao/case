-- 创建月度应用数量趋势RPC函数
CREATE OR REPLACE FUNCTION get_monthly_app_count_trend(time_range TEXT DEFAULT 'all')
RETURNS TABLE(month TEXT, count INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    start_date DATE;
    end_date DATE := CURRENT_DATE;
BEGIN
    -- 根据时间范围计算起始日期
    CASE time_range
        WHEN 'recent6' THEN
            -- 近6个月：包含当前月共6个月
            start_date := date_trunc('month', CURRENT_DATE - INTERVAL '5 months');
        
        WHEN 'thisYear' THEN
            -- 本年至今：从当年1月1日开始
            start_date := date_trunc('year', CURRENT_DATE);
        
        ELSE -- 'all'
            -- 全部数据：从数据集最早日期开始
            SELECT MIN(report_date) INTO start_date FROM cases;
            -- 如果没有数据，设置默认值
            IF start_date IS NULL THEN
                start_date := date_trunc('year', CURRENT_DATE);
            END IF;
    END CASE;
    
    -- 返回聚合结果
    RETURN QUERY
    SELECT 
        TO_CHAR(date_trunc('month', report_date), 'YYYY-MM') AS month,
        COUNT(DISTINCT app_name)::INTEGER AS count -- 显式转换为INTEGER类型
    FROM cases
    WHERE report_date >= start_date
      AND report_date <= end_date
    GROUP BY date_trunc('month', report_date)
    ORDER BY date_trunc('month', report_date);
END;
$$;
