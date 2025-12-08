/*
# 添加通报趋势分析到首页配置

## 迁移说明
将"通报趋势分析"（trend_chart）的控制权从module_settings迁移到frontend_config，
实现首页内部模块的统一管理。

## 变更内容

### 1. 新增配置记录
- 在frontend_config表中添加trend_chart配置
- 模块名称：通报趋势分析
- 默认状态：显示（is_visible = true）
- 排序位置：2（在核心统计之后，平台分布之前）

### 2. 调整现有模块排序
- stats_overview: 1（核心数据总览）
- trend_chart: 2（通报趋势分析）⭐ 新增
- platform_chart: 3（应用平台分布）
- wordcloud: 4（违规问题词云）
- recent_news: 5（近期监管资讯）

## 迁移原因
- 统一首页模块的控制机制
- 简化管理员的配置流程
- 避免module_settings和frontend_config的混淆
- 提升系统的可维护性

## 注意事项
- 此迁移不影响trends模块（趋势分析页面）的导航控制
- module_settings中的trends模块继续控制趋势分析页面的显示
- frontend_config中的trend_chart模块控制首页趋势图表的显示
- 两者功能独立，互不影响
*/

-- 插入通报趋势分析配置
INSERT INTO frontend_config (module_key, module_name, is_visible, sort_order)
VALUES ('trend_chart', '通报趋势分析', true, 2)
ON CONFLICT (module_key) DO NOTHING;

-- 更新其他模块的排序
UPDATE frontend_config SET sort_order = 3 WHERE module_key = 'platform_chart';
UPDATE frontend_config SET sort_order = 4 WHERE module_key = 'wordcloud';
UPDATE frontend_config SET sort_order = 5 WHERE module_key = 'recent_news';

