/*
# 为网站基本信息表添加浏览器标题字段

## 1. 功能说明
为site_settings表添加browser_title字段，用于存储在浏览器标签上显示的网站标题
*/

-- 为site_settings表添加browser_title字段
ALTER TABLE IF EXISTS site_settings
ADD COLUMN IF NOT EXISTS browser_title text NULL
CHECK (char_length(browser_title) <= 100);

-- 为现有记录设置默认值（使用site_title的值）
UPDATE site_settings
SET browser_title = site_title
WHERE browser_title IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_site_settings_browser_title 
ON site_settings(browser_title);
