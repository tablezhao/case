/*
# 监管部门表结构升级 - 添加级别字段

## 1. 变更说明
将监管部门的组织维度从"省份-城市"调整为"级别-省份"：
- 国家级部门：不关联省份和城市
- 省级部门：关联具体省份，不关联城市

## 2. 表结构变更

### 2.1 regulatory_departments表
- 新增 `level` (department_level枚举) - 部门级别
  - 'national'：国家级
  - 'provincial'：省级
- 调整 `province` 字段逻辑：
  - 国家级部门：province为NULL
  - 省级部门：province必填
- 废弃 `city` 字段（保留但不再使用）

## 3. 数据迁移
- 将现有所有部门标记为"省级"（因为原有数据都有省份信息）
- 保留原有的province和city数据

## 4. 约束条件
- 省级部门必须有province值
- 国家级部门的province必须为NULL

## 5. 索引优化
- 添加level字段索引以优化查询性能
*/

-- 创建部门级别枚举
CREATE TYPE department_level AS ENUM ('national', 'provincial');

-- 添加level字段（默认为provincial以兼容现有数据）
ALTER TABLE regulatory_departments 
ADD COLUMN level department_level DEFAULT 'provincial'::department_level NOT NULL;

-- 添加约束：省级部门必须有province
ALTER TABLE regulatory_departments
ADD CONSTRAINT check_provincial_has_province 
CHECK (
  (level = 'provincial' AND province IS NOT NULL) OR
  (level = 'national' AND province IS NULL)
);

-- 添加level字段索引
CREATE INDEX idx_departments_level ON regulatory_departments(level);

-- 添加组合索引：level + province（用于按省份查询省级部门）
CREATE INDEX idx_departments_level_province ON regulatory_departments(level, province) 
WHERE level = 'provincial';

-- 更新现有数据：将所有部门标记为省级
-- （因为现有数据都有province信息）
UPDATE regulatory_departments 
SET level = 'provincial'::department_level 
WHERE province IS NOT NULL;

-- 添加注释
COMMENT ON COLUMN regulatory_departments.level IS '部门级别：national-国家级，provincial-省级';
COMMENT ON COLUMN regulatory_departments.province IS '所属省份（仅省级部门需要）';
COMMENT ON COLUMN regulatory_departments.city IS '所属城市（已废弃，保留用于历史数据）';
