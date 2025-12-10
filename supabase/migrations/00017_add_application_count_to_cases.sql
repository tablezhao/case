/*
# 添加应用数量字段到cases表

## 变更说明
为cases表添加application_count字段，用于记录每次通报涉及的应用数量。

## 字段说明
- `application_count` (integer, 默认1, 非空) - 通报涉及的应用数量

## 注意事项
- 默认值设为1，表示每个案例至少涉及1个应用
- 对现有数据，自动设置为1
*/

-- 添加application_count字段
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS application_count integer DEFAULT 1 NOT NULL;

-- 为现有数据设置默认值
UPDATE cases 
SET application_count = 1 
WHERE application_count IS NULL;

-- 添加注释
COMMENT ON COLUMN cases.application_count IS '通报涉及的应用数量';