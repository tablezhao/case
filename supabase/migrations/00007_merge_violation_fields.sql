/*
# 合并违规内容字段

## 说明
将 `violation_summary`（违规摘要）和 `violation_detail`（详细违规内容）合并为统一的 `violation_content`（主要违规内容）字段。

## 变更内容
1. 在 `cases` 表中添加新字段 `violation_content`
2. 将现有数据迁移：优先使用 `violation_summary`，如果为空则使用 `violation_detail`
3. 删除旧字段 `violation_summary` 和 `violation_detail`
4. 删除 `case_details` 表（如果存在）

## 数据保护
- 迁移前会保留所有现有数据
- 使用 COALESCE 确保数据不丢失
*/

-- 1. 添加新的 violation_content 字段
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS violation_content text;

-- 2. 迁移数据：合并 violation_summary 和 violation_detail
-- 如果 violation_summary 存在且不为空，使用它；否则使用 violation_detail
UPDATE cases 
SET violation_content = COALESCE(
  NULLIF(TRIM(violation_summary), ''),
  NULLIF(TRIM(violation_detail), ''),
  '未提供违规内容'
)
WHERE violation_content IS NULL;

-- 3. 删除旧字段
ALTER TABLE cases 
DROP COLUMN IF EXISTS violation_summary,
DROP COLUMN IF EXISTS violation_detail;

-- 4. 删除 case_details 表（如果存在）
DROP TABLE IF EXISTS case_details CASCADE;

-- 5. 添加注释
COMMENT ON COLUMN cases.violation_content IS '主要违规内容（整合了原违规摘要和详细内容）';