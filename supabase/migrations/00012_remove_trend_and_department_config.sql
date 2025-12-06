/*
# 移除年度月度趋势图和部门频次分布的后台控制

## 变更说明
从首页配置管理中移除"年度月度趋势图"和"部门频次分布"两个模块的控制功能。
这两个模块将在前端保持显示，但不再受后台配置控制。

## 变更内容
1. 删除 trend_chart 模块配置
2. 删除 department_chart 模块配置
3. 更新其他模块的排序（将排序大于3的模块排序减2）

## 影响范围
- 后台首页配置页面将不再显示这两个模块的控制项
- 前端首页这两个模块将保持显示
- 其他模块的排序自动调整
*/

-- 删除年度月度趋势图模块配置
DELETE FROM frontend_config WHERE module_key = 'trend_chart';

-- 删除部门频次分布模块配置
DELETE FROM frontend_config WHERE module_key = 'department_chart';

-- 更新其他模块的排序（将排序大于3的模块排序减2）
UPDATE frontend_config 
SET sort_order = sort_order - 2,
    updated_at = now()
WHERE sort_order > 3;