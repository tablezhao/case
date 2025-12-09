-- 为案例表添加全文搜索支持

-- 1. 创建tsvector列存储全文搜索向量
ALTER TABLE cases
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('chinese', coalesce(app_name, '')), 'A') || 
  setweight(to_tsvector('chinese', coalesce(app_developer, '')), 'B') || 
  setweight(to_tsvector('chinese', coalesce(violation_summary, '')), 'C') || 
  setweight(to_tsvector('chinese', coalesce(violation_detail, '')), 'C') ||
  setweight(to_tsvector('chinese', coalesce(source_url, '')) || '', 'D')
) STORED;

-- 2. 创建GIN索引加速全文搜索
CREATE INDEX cases_search_idx ON cases USING GIN(search_vector);

-- 3. 创建触发器函数，当相关字段更新时自动更新搜索向量
CREATE OR REPLACE FUNCTION update_cases_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('chinese', coalesce(NEW.app_name, '')), 'A') || 
    setweight(to_tsvector('chinese', coalesce(NEW.app_developer, '')), 'B') || 
    setweight(to_tsvector('chinese', coalesce(NEW.violation_summary, '')), 'C') || 
    setweight(to_tsvector('chinese', coalesce(NEW.violation_detail, '')), 'C') ||
    setweight(to_tsvector('chinese', coalesce(NEW.source_url, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
CREATE TRIGGER cases_search_vector_update
BEFORE INSERT OR UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION update_cases_search_vector();

-- 5. 创建用于全文搜索的RPC函数
CREATE OR REPLACE FUNCTION search_cases(
  query_text text,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 20,
  sort_by text DEFAULT 'report_date',
  sort_order text DEFAULT 'desc',
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  department_ids uuid[] DEFAULT NULL,
  platform_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  report_date date,
  app_name text,
  app_developer text,
  department_id uuid,
  platform_id uuid,
  violation_summary text,
  violation_detail text,
  source_url text,
  created_at timestamptz,
  updated_at timestamptz,
  search_rank float4
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_cases AS (
    SELECT *, 
           ts_rank(search_vector, plainto_tsquery('chinese', query_text)) AS search_rank
    FROM cases
    WHERE
      (query_text IS NULL OR search_vector @@ plainto_tsquery('chinese', query_text)) AND
      (start_date IS NULL OR report_date >= start_date) AND
      (end_date IS NULL OR report_date <= end_date) AND
      (department_ids IS NULL OR department_id = ANY(department_ids)) AND
      (platform_ids IS NULL OR platform_id = ANY(platform_ids))
  )
  SELECT 
    fc.id, fc.report_date, fc.app_name, fc.app_developer, 
    fc.department_id, fc.platform_id, fc.violation_summary, 
    fc.violation_detail, fc.source_url, fc.created_at, fc.updated_at,
    fc.search_rank
  FROM filtered_cases fc
  ORDER BY 
    CASE WHEN query_text IS NOT NULL THEN fc.search_rank END DESC NULLS LAST,
    CASE 
      WHEN sort_by = 'report_date' AND sort_order = 'desc' THEN fc.report_date
      WHEN sort_by = 'report_date' THEN fc.report_date
      WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN fc.created_at
      WHEN sort_by = 'created_at' THEN fc.created_at
      WHEN sort_by = 'updated_at' AND sort_order = 'desc' THEN fc.updated_at
      WHEN sort_by = 'updated_at' THEN fc.updated_at
      WHEN sort_order = 'desc' THEN fc.report_date
      ELSE fc.report_date
    END DESC NULLS LAST
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
END;
$$;

-- 6. 创建获取搜索结果总数的函数
CREATE OR REPLACE FUNCTION search_cases_count(
  query_text text,
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  department_ids uuid[] DEFAULT NULL,
  platform_ids uuid[] DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM cases
    WHERE
      (query_text IS NULL OR search_vector @@ plainto_tsquery('chinese', query_text)) AND
      (start_date IS NULL OR report_date >= start_date) AND
      (end_date IS NULL OR report_date <= end_date) AND
      (department_ids IS NULL OR department_id = ANY(department_ids)) AND
      (platform_ids IS NULL OR platform_id = ANY(platform_ids))
  );
END;
$$;

-- 7. 更新现有数据的search_vector列
UPDATE cases SET search_vector = NULL;