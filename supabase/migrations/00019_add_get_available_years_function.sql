/*
# 添加获取可用年份列表的RPC函数

## 功能说明
创建一个RPC函数，用于从cases表中提取所有不重复的年份，供前端年份筛选器使用。

## 函数详情
- **函数名**: get_available_years
- **返回类型**: TABLE(year integer)
- **功能**: 从cases表的report_date字段中提取年份，去重并按倒序排列
- **性能优化**: 使用DISTINCT和索引优化查询性能

## 使用场景
- 趋势分析页面的年份筛选器
- 通报排名模块的年份选择
- 监管部门趋势分析模块的年份选择

## 技术要点
1. 使用EXTRACT函数从日期字段提取年份
2. 使用DISTINCT去重
3. 按年份倒序排列（最新到最旧）
4. 只返回有效的年份数据（非NULL）
*/

-- 创建获取可用年份列表的RPC函数
CREATE OR REPLACE FUNCTION get_available_years()
RETURNS TABLE(year integer) 
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT EXTRACT(YEAR FROM report_date)::integer AS year
  FROM cases
  WHERE report_date IS NOT NULL
  ORDER BY year DESC;
$$;

-- 添加函数注释
COMMENT ON FUNCTION get_available_years() IS '获取系统中所有案例的年份列表，按倒序排列';
