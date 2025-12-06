/*
# 恢复首页配置模块

## 1. 变更说明
恢复以下4个首页展示模块到 frontend_config 表：
- stats_overview (核心数据总览/统计概览)
- trend_chart (年度月度趋势图/监管趋势分析)
- platform_chart (平台分布图/应用平台分布)
- recent_news (近期监管资讯)

## 2. 恢复后的完整模块列表
- stats_overview (核心数据总览) - 排序1
- trend_chart (年度月度趋势图) - 排序2
- geo_map (地理分布地图) - 排序3
- department_chart (部门频次分布) - 排序4
- platform_chart (平台分布图) - 排序5
- wordcloud (违规问题词云) - 排序6
- recent_news (近期监管资讯) - 排序7

## 3. 影响范围
- 首页配置管理页面将显示全部7个模块的控制选项
- 前台首页可以根据配置显示这7个模块
- 管理员可以通过首页配置页面控制这些模块的显示/隐藏
*/

-- 恢复已删除的首页模块
INSERT INTO frontend_config (module_key, module_name, is_visible, sort_order) VALUES
  ('stats_overview', '核心数据总览', true, 1),
  ('trend_chart', '年度月度趋势图', true, 2),
  ('platform_chart', '平台分布图', true, 5),
  ('recent_news', '近期监管资讯', true, 7)
ON CONFLICT (module_key) DO UPDATE SET
  module_name = EXCLUDED.module_name,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
