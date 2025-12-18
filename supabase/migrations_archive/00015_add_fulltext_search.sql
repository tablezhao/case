/*
# 添加全文搜索功能

## 1. 功能说明
为cases表添加PostgreSQL全文搜索支持，提升关键词检索的准确性和性能。

## 2. 主要变更

### 2.1 搜索向量列
- 添加 `search_vector` 列（tsvector类型）
- 存储应用名称、开发者、违规内容的分词向量
- 支持中文分词

### 2.2 GIN索引
- 创建 `cases_search_vector_idx` 索引
- 加速全文搜索查询

### 2.3 自动更新触发器
- 创建 `cases_search_vector_update()` 函数
- 创建 `cases_search_vector_trigger` 触发器
- 自动维护搜索向量

### 2.4 搜索RPC函数
- 创建 `search_cases()` 函数
- 支持全文搜索 + 模糊匹配
- 支持多条件筛选（日期、部门、平台）
- 支持相关性排序
- 支持分页

## 3. 权重设置
- A（最高）：应用名称
- B（中等）：开发者
- C（较低）：违规内容

## 4. 安全设置
- 授权 authenticated 和 anon 角色执行权限
*/

-- =====================================================
-- 1. 添加搜索向量列
-- =====================================================
ALTER TABLE cases ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- =====================================================
-- 2. 创建GIN索引
-- =====================================================
CREATE INDEX IF NOT EXISTS cases_search_vector_idx ON cases USING GIN(search_vector);

-- =====================================================
-- 3. 创建搜索向量更新函数
-- =====================================================
CREATE OR REPLACE FUNCTION cases_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('chinese', COALESCE(NEW.app_name, '')), 'A') ||
    setweight(to_tsvector('chinese', COALESCE(NEW.app_developer, '')), 'B') ||
    setweight(to_tsvector('chinese', COALESCE(NEW.violation_content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. 创建触发器
-- =====================================================
DROP TRIGGER IF EXISTS cases_search_vector_trigger ON cases;
CREATE TRIGGER cases_search_vector_trigger
BEFORE INSERT OR UPDATE ON cases
FOR EACH ROW EXECUTE FUNCTION cases_search_vector_update();

-- =====================================================
-- 5. 更新现有数据的搜索向量
-- =====================================================
UPDATE cases SET search_vector = 
  setweight(to_tsvector('chinese', COALESCE(app_name, '')), 'A') ||
  setweight(to_tsvector('chinese', COALESCE(app_developer, '')), 'B') ||
  setweight(to_tsvector('chinese', COALESCE(violation_content, '')), 'C')
WHERE search_vector IS NULL;

-- =====================================================
-- 6. 创建搜索RPC函数
-- =====================================================
CREATE OR REPLACE FUNCTION search_cases(
  search_query text DEFAULT NULL,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 20,
  start_date text DEFAULT NULL,
  end_date text DEFAULT NULL,
  department_ids uuid[] DEFAULT NULL,
  platform_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  app_name text,
  app_developer text,
  department_id uuid,
  platform_id uuid,
  violation_content text,
  source_url text,
  report_date date,
  created_at timestamptz,
  updated_at timestamptz,
  department_name text,
  department_province text,
  platform_name text,
  total_count bigint,
  rank real
) AS $$
DECLARE
  offset_val integer;
  total bigint;
  has_search boolean;
BEGIN
  -- 计算偏移量
  offset_val := (page_num - 1) * page_size;
  has_search := search_query IS NOT NULL AND search_query != '';
  
  -- 计算总数
  SELECT COUNT(*) INTO total
  FROM cases c
  LEFT JOIN regulatory_departments d ON c.department_id = d.id
  LEFT JOIN app_platforms p ON c.platform_id = p.id
  WHERE
    -- 搜索条件：全文搜索 OR 模糊匹配
    (NOT has_search OR 
     c.search_vector @@ plainto_tsquery('chinese', search_query) OR
     c.app_name ILIKE '%' || search_query || '%' OR
     c.app_developer ILIKE '%' || search_query || '%' OR
     c.violation_content ILIKE '%' || search_query || '%' OR
     d.name ILIKE '%' || search_query || '%' OR
     p.name ILIKE '%' || search_query || '%')
    -- 日期筛选
    AND (start_date IS NULL OR c.report_date >= start_date::date)
    AND (end_date IS NULL OR c.report_date <= end_date::date)
    -- 部门筛选
    AND (department_ids IS NULL OR c.department_id = ANY(department_ids))
    -- 平台筛选
    AND (platform_ids IS NULL OR c.platform_id = ANY(platform_ids));
  
  -- 返回结果
  RETURN QUERY
  SELECT 
    c.id,
    c.app_name,
    c.app_developer,
    c.department_id,
    c.platform_id,
    c.violation_content,
    c.source_url,
    c.report_date,
    c.created_at,
    c.updated_at,
    d.name as department_name,
    d.province as department_province,
    p.name as platform_name,
    total as total_count,
    -- 计算相关性得分
    CASE 
      WHEN NOT has_search THEN 0::real
      ELSE ts_rank(c.search_vector, plainto_tsquery('chinese', search_query))
    END as rank
  FROM cases c
  LEFT JOIN regulatory_departments d ON c.department_id = d.id
  LEFT JOIN app_platforms p ON c.platform_id = p.id
  WHERE
    -- 搜索条件：全文搜索 OR 模糊匹配
    (NOT has_search OR 
     c.search_vector @@ plainto_tsquery('chinese', search_query) OR
     c.app_name ILIKE '%' || search_query || '%' OR
     c.app_developer ILIKE '%' || search_query || '%' OR
     c.violation_content ILIKE '%' || search_query || '%' OR
     d.name ILIKE '%' || search_query || '%' OR
     p.name ILIKE '%' || search_query || '%')
    -- 日期筛选
    AND (start_date IS NULL OR c.report_date >= start_date::date)
    AND (end_date IS NULL OR c.report_date <= end_date::date)
    -- 部门筛选
    AND (department_ids IS NULL OR c.department_id = ANY(department_ids))
    -- 平台筛选
    AND (platform_ids IS NULL OR c.platform_id = ANY(platform_ids))
  -- 排序：相关性 DESC, 日期 DESC
  ORDER BY 
    CASE WHEN has_search THEN rank ELSE 0 END DESC,
    c.report_date DESC
  -- 分页
  LIMIT page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_cases IS '全文搜索案例，支持中文分词、模糊匹配、多条件筛选和相关性排序';

-- =====================================================
-- 7. 授权
-- =====================================================
GRANT EXECUTE ON FUNCTION search_cases TO authenticated;
GRANT EXECUTE ON FUNCTION search_cases TO anon;
