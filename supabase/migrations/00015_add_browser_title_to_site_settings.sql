/*
# 添加浏览器标签标题字段

## 1. 功能说明
为 site_settings 表添加 browser_title 字段，用于控制浏览器标签页显示的标题

## 2. 表结构变更

### `site_settings` 表
添加新字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| browser_title | text | 浏览器标签标题，可选，最大100字符，默认为"合规通 Case Wiki" |

## 3. 数据迁移
为现有记录设置默认的浏览器标题为"合规通 Case Wiki"

## 4. 注意事项
- 该字段用于 HTML <title> 标签
- 如果为空，前端将使用默认标题
- 建议标题简洁明了，不超过60个字符以确保在浏览器标签中完整显示
*/

-- 添加浏览器标题字段
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS browser_title text CHECK (char_length(browser_title) <= 100);

-- 为现有记录设置默认值
UPDATE site_settings
SET browser_title = '合规通 Case Wiki'
WHERE browser_title IS NULL;

-- 添加注释
COMMENT ON COLUMN site_settings.browser_title IS '浏览器标签页显示的标题，最多100个字符';
