/*
# 移除地理分布地图模块

## 1. 变更说明
从首页配置中移除"地理分布地图"模块（geo_map）

## 2. 变更原因
根据产品需求，地理分布地图功能不再作为独立模块展示，
相关功能已整合到监管趋势分析中

## 3. 影响范围
- 首页配置管理页面将不再显示"地理分布地图"配置项
- 前台首页将移除地理分布地图相关展示
- 不影响其他模块的正常使用

## 4. 变更后的模块列表
- stats_overview (核心数据总览) - 排序1
- trend_chart (年度月度趋势图) - 排序2
- department_chart (部门频次分布) - 排序3
- platform_chart (平台分布图) - 排序4
- wordcloud (违规问题词云) - 排序5
- recent_news (近期监管资讯) - 排序6
*/

-- 删除地理分布地图模块配置
DELETE FROM frontend_config WHERE module_key = 'geo_map';

-- 更新其他模块的排序（将排序大于3的模块排序减1）
UPDATE frontend_config 
SET sort_order = sort_order - 1,
    updated_at = now()
WHERE sort_order > 3;
