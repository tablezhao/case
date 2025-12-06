/*
# 创建模块设置表

## 1. 新建表
- `module_settings`
  - `id` (uuid, 主键, 自动生成)
  - `module_key` (text, 唯一, 非空) - 模块标识符
  - `module_name` (text, 非空) - 模块显示名称
  - `is_enabled` (boolean, 默认true) - 是否启用
  - `display_order` (int, 默认0) - 显示顺序
  - `description` (text) - 模块描述
  - `updated_at` (timestamptz, 默认now()) - 更新时间

## 2. 安全策略
- 允许所有用户读取模块设置（前台需要）
- 不启用RLS，因为这是公开的配置信息

## 3. 初始数据
插入5个默认模块：
- 案例查询模块
- 监管资讯模块
- 监管部门模块
- 趋势分析模块
- 问题分析模块

## 4. 触发器
自动更新 updated_at 字段
*/

-- 创建模块设置表
CREATE TABLE IF NOT EXISTS module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text UNIQUE NOT NULL,
  module_name text NOT NULL,
  is_enabled boolean DEFAULT true NOT NULL,
  display_order int DEFAULT 0 NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_module_settings_key ON module_settings(module_key);
CREATE INDEX IF NOT EXISTS idx_module_settings_enabled ON module_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_module_settings_order ON module_settings(display_order);

-- 插入初始模块数据
INSERT INTO module_settings (module_key, module_name, display_order, description, is_enabled) VALUES
  ('cases', '案例查询模块', 1, '展示App违规监管案例查询功能，包括案例列表、详情查看、筛选排序等', true),
  ('news', '监管资讯模块', 2, '展示监管资讯查询功能，包括资讯列表、详情查看、筛选排序等', true),
  ('departments', '监管部门模块', 3, '展示监管部门信息，包括国家级和省级部门的统计数据', true),
  ('trends', '趋势分析模块', 4, '展示年度及月度通报趋势图表，帮助用户了解监管动态', true),
  ('issues', '问题分析模块', 5, '展示违规问题词云分析，直观呈现热点违规问题', true)
ON CONFLICT (module_key) DO NOTHING;

-- 创建更新时间自动更新的触发器函数
CREATE OR REPLACE FUNCTION update_module_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_module_settings_updated_at ON module_settings;
CREATE TRIGGER trigger_update_module_settings_updated_at
  BEFORE UPDATE ON module_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_module_settings_updated_at();

-- 添加表注释
COMMENT ON TABLE module_settings IS '前台功能模块可见性控制表';
COMMENT ON COLUMN module_settings.module_key IS '模块唯一标识符';
COMMENT ON COLUMN module_settings.module_name IS '模块显示名称';
COMMENT ON COLUMN module_settings.is_enabled IS '模块是否启用';
COMMENT ON COLUMN module_settings.display_order IS '模块显示顺序';
COMMENT ON COLUMN module_settings.description IS '模块功能描述';
COMMENT ON COLUMN module_settings.updated_at IS '最后更新时间';