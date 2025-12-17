# 监管部门趋势分析模块RPC优化方案

## 一、优化背景
当前趋势分析页面中的监管部门趋势分析模块使用前端JavaScript代码对从Supabase获取的原始数据进行分组和聚合，这种方式存在以下问题：
1. 数据传输量大：需要传输所有原始数据到客户端
2. 前端计算负载高：需要在客户端进行复杂的分组和聚合运算
3. 代码复杂度高：前端需要维护复杂的数据处理逻辑
4. 性能瓶颈：随着数据量增长，前端计算性能会下降

## 二、优化方案
将监管部门趋势分析的数据处理逻辑迁移到Supabase RPC函数中，由数据库端负责数据的过滤、分组和聚合，前端只需要调用RPC函数并展示结果。

### 1. 创建Supabase RPC函数

**SQL函数定义**：
```sql
-- 创建监管部门趋势分析统计函数
CREATE OR REPLACE FUNCTION get_department_application_trend(
  department_ids UUID[],
  dimension TEXT,
  year_param INT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  query_result JSON;
BEGIN
  -- 根据维度设置日期范围
  IF dimension = 'yearly' AND year_param IS NOT NULL THEN
    start_date := TO_DATE(CONCAT(year_param, '-01-01'), 'YYYY-MM-DD');
    end_date := TO_DATE(CONCAT(year_param, '-12-31'), 'YYYY-MM-DD');
  ELSE
    -- 全部数据
    start_date := (SELECT MIN(report_date) FROM cases);
    end_date := (SELECT MAX(report_date) FROM cases);
  END IF;
  
  -- 查询并聚合数据
  WITH case_stats AS (
    SELECT
      c.report_date,
      rd.id AS department_id,
      rd.name AS department_name,
      SUM(c.application_count) AS total_applications
    FROM cases c
    JOIN regulatory_departments rd ON c.department_id = rd.id
    WHERE c.department_id = ANY(department_ids)
      AND c.report_date BETWEEN start_date AND end_date
    GROUP BY c.report_date, rd.id, rd.name
    ORDER BY c.report_date
  ),
  -- 按日期分组，构建JSON结构
  date_groups AS (
    SELECT
      report_date,
      json_object_agg(department_name, total_applications) AS department_data
    FROM case_stats
    GROUP BY report_date
    ORDER BY report_date
  )
  -- 最终结果格式转换
  SELECT json_agg(
    json_build_object(
      'date', report_date,
      'data', department_data
    )
  ) INTO query_result
  FROM date_groups;
  
  RETURN query_result;
END;
$$;
```

### 2. 修改前端代码

**修改`src/db/api.ts`中的`getDepartmentApplicationTrend`函数**：

```typescript
export async function getDepartmentApplicationTrend(params: {
  departmentIds: string[];
  dimension: 'yearly' | 'all';
  year?: string;
}) {
  const { departmentIds, dimension, year } = params;

  console.log('[getDepartmentApplicationTrend] 开始查询，参数:', params);

  if (!departmentIds || departmentIds.length === 0) {
    console.log('[getDepartmentApplicationTrend] 未选择部门，返回空结果');
    return [];
  }

  try {
    // 调用Supabase RPC函数
    const { data, error } = await supabase.rpc('get_department_application_trend', {
      department_ids: departmentIds,
      dimension: dimension,
      year_param: year ? parseInt(year) : null
    });

    if (error) {
      console.error('[getDepartmentApplicationTrend] RPC调用失败:', error);
      throw error;
    }

    console.log('[getDepartmentApplicationTrend] 获取趋势数据成功', data);
    
    // 处理返回数据，确保格式一致
    const result = data.map((item: any) => ({
      date: item.date,
      ...item.data
    }));

    return result;
  } catch (error) {
    console.error('[getDepartmentApplicationTrend] 获取趋势数据失败:', error);
    throw error;
  }
}
```

## 三、优化优势

1. **减少数据传输量**：数据库只返回聚合后的结果，而不是所有原始数据
2. **提高性能**：数据库在服务端进行聚合计算，通常比客户端计算更快
3. **简化前端代码**：前端不需要再进行复杂的分组和聚合逻辑
4. **数据一致性**：所有数据处理逻辑都在数据库端，确保数据一致性
5. **更好的扩展性**：当数据量增长时，只需优化数据库端的查询，无需修改前端代码

## 四、注意事项

1. 确保在Supabase中正确创建RPC函数，并授予适当的权限
2. 测试RPC函数的性能和正确性，确保与当前实现返回相同的结果
3. 考虑添加错误处理和日志记录，便于调试
4. 监控RPC函数的执行情况，及时优化性能
5. 确保前端代码能够处理RPC函数可能返回的各种情况

## 五、实施步骤

1. 在Supabase控制台中执行SQL语句，创建RPC函数
2. 修改前端`getDepartmentApplicationTrend`函数，改为调用RPC函数
3. 测试功能是否正常工作
4. 监控性能和错误日志
5. 根据测试结果进行必要的调整

通过以上优化方案，可以显著提高监管部门趋势分析模块的性能和可维护性，为用户提供更好的体验。