# 修改迁移文件使用pg_trgm实现搜索

## 1. 迁移文件分析

当前迁移文件 `00015_add_fulltext_search.sql` 使用了中文分词扩展 `zhparser` 和 `chinese` 配置，但在Supabase环境中无法安装该扩展。需要修改为使用PostgreSQL内置的 `pg_trgm` 扩展实现搜索功能。

## 2. 修改计划

### 2.1 添加pg_trgm扩展安装
- 添加 `CREATE EXTENSION IF NOT EXISTS pg_trgm;` 语句
- 确保扩展可用

### 2.2 修改搜索向量列和索引
- 保留现有 `search_vector` 列，但修改其生成方式
- 使用 `simple` 配置替代 `chinese` 配置
- 添加基于 `pg_trgm` 的GIN索引

### 2.3 更新搜索向量函数
- 修改 `cases_search_vector_update()` 函数
- 将 `to_tsvector('chinese', ...)` 替换为 `to_tsvector('simple', ...)`

### 2.4 更新触发器
- 保留现有触发器，但确保它调用更新后的函数

### 2.5 更新搜索RPC函数
- 修改 `search_cases()` 函数
- 将 `plainto_tsquery('chinese', ...)` 替换为 `plainto_tsquery('simple', ...)`
- 将 `ts_rank()` 函数中的配置替换为 `simple`
- 添加基于 `pg_trgm` 的相似性搜索支持

### 2.6 更新现有数据
- 修改 `UPDATE cases SET search_vector = ...` 语句
- 使用 `simple` 配置替代 `chinese` 配置

## 3. 具体修改内容

### 3.1 添加pg_trgm扩展
```sql
-- =====================================================
-- 0. 安装pg_trgm扩展
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 3.2 修改搜索向量更新函数
```sql
-- =====================================================
-- 3. 创建搜索向量更新函数
-- =====================================================
CREATE OR REPLACE FUNCTION cases_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', COALESCE(NEW.app_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.app_developer, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.violation_content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3.3 添加pg_trgm索引
```sql
-- =====================================================
-- 2.1 创建GIN索引（全文搜索）
-- =====================================================
CREATE INDEX IF NOT EXISTS cases_search_vector_idx ON cases USING GIN(search_vector);

-- =====================================================
-- 2.2 创建pg_trgm索引（模糊搜索）
-- =====================================================
CREATE INDEX IF NOT EXISTS cases_app_name_trgm_idx ON cases USING GIN(app_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cases_app_developer_trgm_idx ON cases USING GIN(app_developer gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cases_violation_content_trgm_idx ON cases USING GIN(violation_content gin_trgm_ops);
```

### 3.4 修改搜索RPC函数
```sql
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
     c.search_vector @@ plainto_tsquery('simple', search_query) OR
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
      ELSE ts_rank(c.search_vector, plainto_tsquery('simple', search_query))
    END as rank
  FROM cases c
  LEFT JOIN regulatory_departments d ON c.department_id = d.id
  LEFT JOIN app_platforms p ON c.platform_id = p.id
  WHERE
    -- 搜索条件：全文搜索 OR 模糊匹配
    (NOT has_search OR 
     c.search_vector @@ plainto_tsquery('simple', search_query) OR
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
```

### 3.5 修改现有数据更新
```sql
-- =====================================================
-- 5. 更新现有数据的搜索向量
-- =====================================================
UPDATE cases SET search_vector = 
  setweight(to_tsvector('simple', COALESCE(app_name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(app_developer, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(violation_content, '')), 'C')
WHERE search_vector IS NULL;
```

## 4. 执行修改

1. 直接编辑 `supabase/migrations/00015_add_fulltext_search.sql` 文件
2. 按照上述修改内容更新文件
3. 保存文件
4. 重新执行迁移：`supabase db push`

## 5. 验证修改

1. 检查迁移是否成功执行
2. 验证搜索功能是否正常工作
3. 检查索引是否正确创建
4. 测试搜索RPC函数是否返回预期结果

通过以上修改，迁移文件将不再依赖 `zhparser` 扩展，而是使用PostgreSQL内置的 `pg_trgm` 扩展实现搜索功能，能够在Supabase环境中正常执行。