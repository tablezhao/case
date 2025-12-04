-- 创建部门级别枚举（如果不存在）
DO $$ BEGIN
  CREATE TYPE department_level AS ENUM ('national', 'provincial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 添加level字段（如果不存在）
DO $$ BEGIN
  ALTER TABLE regulatory_departments 
  ADD COLUMN level department_level DEFAULT 'provincial'::department_level NOT NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 删除旧约束（如果存在）
ALTER TABLE regulatory_departments DROP CONSTRAINT IF EXISTS check_provincial_has_province;

-- 添加约束：省级部门必须有province
ALTER TABLE regulatory_departments
ADD CONSTRAINT check_provincial_has_province 
CHECK (
  (level = 'provincial' AND province IS NOT NULL) OR
  (level = 'national' AND province IS NULL)
);

-- 添加level字段索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_departments_level ON regulatory_departments(level);

-- 添加组合索引：level + province（用于按省份查询省级部门）
CREATE INDEX IF NOT EXISTS idx_departments_level_province ON regulatory_departments(level, province) 
WHERE level = 'provincial';

-- 更新现有数据：将所有部门标记为省级
UPDATE regulatory_departments 
SET level = 'provincial'::department_level 
WHERE province IS NOT NULL AND level IS NULL;

-- 添加注释
COMMENT ON COLUMN regulatory_departments.level IS '部门级别：national-国家级，provincial-省级';
COMMENT ON COLUMN regulatory_departments.province IS '所属省份（仅省级部门需要）';