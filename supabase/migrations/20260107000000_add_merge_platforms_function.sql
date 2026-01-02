/*
# 创建平台合并存储过程

## 功能说明
该存储过程用于合并多个应用平台，确保数据一致性：
1. 将所有引用要删除平台的案例更新为主平台ID
2. 删除要合并的平台记录
3. 返回合并操作的统计信息

## 参数
- main_platform_id: UUID - 主平台ID（保留的平台）
- platforms_to_merge: UUID[] - 要合并的平台ID数组（将被删除）

## 返回值
- merged_count: INTEGER - 受影响的案例数量
- main_platform_name: TEXT - 主平台名称
- merged_platform_names: TEXT[] - 被合并的平台名称数组
*/

CREATE OR REPLACE FUNCTION merge_app_platforms(
  main_platform_id UUID, 
  platforms_to_merge UUID[]
)
RETURNS TABLE(
  merged_count INTEGER,
  main_platform_name TEXT,
  merged_platform_names TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER;
  platform_names TEXT[];
  main_name TEXT;
BEGIN
  -- 验证主平台是否存在
  SELECT name INTO main_name
  FROM app_platforms 
  WHERE id = main_platform_id;
  
  IF main_name IS NULL THEN
    RAISE EXCEPTION '主平台不存在 (ID: %)', main_platform_id;
  END IF;
  
  -- 获取要删除的平台名称
  SELECT ARRAY_AGG(name) INTO platform_names
  FROM app_platforms 
  WHERE id = ANY(platforms_to_merge);
  
  IF platform_names IS NULL OR ARRAY_LENGTH(platform_names, 1) = 0 THEN
    RAISE EXCEPTION '未找到要合并的平台';
  END IF;
  
  -- 更新所有指向要删除平台的案例，使其指向主平台
  UPDATE cases 
  SET 
    platform_id = main_platform_id,
    updated_at = NOW()
  WHERE platform_id = ANY(platforms_to_merge);
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- 删除要合并的平台
  DELETE FROM app_platforms 
  WHERE id = ANY(platforms_to_merge);
  
  -- 记录日志
  RAISE NOTICE '平台合并成功: 主平台=%, 合并了%个平台, 影响%条案例', 
    main_name, ARRAY_LENGTH(platform_names, 1), affected_rows;
  
  -- 返回结果
  RETURN QUERY
    SELECT 
      affected_rows::INTEGER,
      main_name,
      platform_names;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION merge_app_platforms IS '合并多个应用平台，将案例数据转移到主平台并删除其他平台';
