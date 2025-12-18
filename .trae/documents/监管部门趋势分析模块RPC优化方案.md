# 基于现有RPC函数的部门分布优化方案

## 一、现有RPC函数分析

### 1. 函数功能

用户提供的现有RPC函数具有以下功能：
- 查询所有监管部门的数据
- 统计每个部门的通报频次（按部门+日期去重）
- 返回一个JSON对象，包含两个主要部分：
  - `national`：国家级部门的通报频次统计
  - `provincial`：省级部门的通报频次统计
- 每个部门的统计数据包含 `name`（部门名称）和 `value`（通报频次）

### 2. 现有函数的优势

- **解决N+1查询问题**：将多个部门查询合并为一个RPC调用
- **减少数据传输量**：只返回聚合后的结果
- **降低前端计算负载**：将数据处理逻辑迁移到数据库端
- **合并国家级和省级部门数据**：一次调用即可获取两种级别的部门分布数据

### 3. 现有函数的局限性

- **只统计通报频次**：不支持按应用数量统计
- **返回字段名不一致**：返回`value`字段，而当前前端代码使用`count`字段
- **省级部门无省份筛选**：不支持筛选特定省份的省级部门
- **统计维度单一**：只支持按通报频次统计，不支持扩展其他统计维度

## 二、优化方案

基于现有RPC函数，我们可以通过以下方式优化国家级和省级部门分布模块，无需创建新的RPC函数：

### 1. 修改前端代码适配现有RPC函数

**修改`src/db/api.ts`中的函数**：

```typescript
// 获取国家级部门分布数据
export async function getNationalDepartmentDistribution() {
  try {
    const { data, error } = await supabase.rpc('get_dept_distribution'); // 假设现有函数名为get_dept_distribution
    
    if (error) {
      console.error('[getNationalDepartmentDistribution] RPC调用失败:', error);
      throw error;
    }
    
    // 适配现有函数返回格式，将value字段转换为count字段
    const nationalData = (data?.national || []).map((item: any) => ({
      name: item.name,
      count: item.value
    }));
    
    return nationalData;
  } catch (error) {
    console.error('[getNationalDepartmentDistribution] 获取国家级部门分布数据失败:', error);
    throw error;
  }
}

// 获取省级部门分布数据
export async function getProvincialDepartmentDistribution(province?: string) {
  try {
    const { data, error } = await supabase.rpc('get_dept_distribution'); // 假设现有函数名为get_dept_distribution
    
    if (error) {
      console.error('[getProvincialDepartmentDistribution] RPC调用失败:', error);
      throw error;
    }
    
    // 适配现有函数返回格式，将value字段转换为count字段
    let provincialData = (data?.provincial || []).map((item: any) => ({
      name: item.name,
      count: item.value
    }));
    
    // 注意：现有函数不支持按省份筛选，如果需要此功能，仍需创建新的RPC函数
    // if (province) {
    //   provincialData = provincialData.filter(item => item.province === province);
    // }
    
    return provincialData;
  } catch (error) {
    console.error('[getProvincialDepartmentDistribution] 获取省级部门分布数据失败:', error);
    throw error;
  }
}
```

### 2. 扩展现有函数支持应用数量统计

如果需要支持按应用数量统计，可以扩展现有函数：

**SQL函数扩展**：
```sql
-- 扩展现有函数，支持多维度统计
CREATE OR REPLACE FUNCTION get_dept_distribution(
  stat_dimension TEXT DEFAULT 'case_count'  -- case_count: 通报频次, app_count: 应用数量
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH dept_stats AS (
    SELECT
      d.id,
      d.name,
      d.level,
      d.province,
      COUNT(DISTINCT c.department_id || '_' || c.report_date) as case_count,
      COUNT(DISTINCT c.app_name) as app_count
    FROM regulatory_departments d
    LEFT JOIN cases c ON d.id = c.department_id
    GROUP BY d.id, d.name, d.level, d.province
  )
  SELECT jsonb_build_object(
    'national', (SELECT jsonb_agg(
      jsonb_build_object(
        'name', name,
        'value', CASE 
          WHEN stat_dimension = 'app_count' THEN app_count 
          ELSE case_count 
        END,
        'province', province
      ) ORDER BY CASE 
        WHEN stat_dimension = 'app_count' THEN app_count 
        ELSE case_count 
      END DESC
    ) FROM dept_stats WHERE level = 'national' AND CASE 
      WHEN stat_dimension = 'app_count' THEN app_count > 0 
      ELSE case_count > 0 
    END),
    'provincial', (SELECT jsonb_agg(
      jsonb_build_object(
        'name', name,
        'value', CASE 
          WHEN stat_dimension = 'app_count' THEN app_count 
          ELSE case_count 
        END,
        'province', province
      ) ORDER BY CASE 
        WHEN stat_dimension = 'app_count' THEN app_count 
        ELSE case_count 
      END DESC
    ) FROM dept_stats WHERE level = 'provincial' AND CASE 
      WHEN stat_dimension = 'app_count' THEN app_count > 0 
      ELSE case_count > 0 
    END)
  ) INTO result;
  
  RETURN result;
END;
$$;
```

**前端代码适配扩展后的函数**：

```typescript
// 获取国家级部门分布数据
export async function getNationalDepartmentDistribution(
  statDimension: 'case_count' | 'app_count' = 'app_count'
) {
  try {
    const { data, error } = await supabase.rpc('get_dept_distribution', {
      stat_dimension: statDimension
    });
    
    if (error) {
      console.error('[getNationalDepartmentDistribution] RPC调用失败:', error);
      throw error;
    }
    
    // 适配函数返回格式，将value字段转换为count字段
    const nationalData = (data?.national || []).map((item: any) => ({
      name: item.name,
      count: item.value
    }));
    
    return nationalData;
  } catch (error) {
    console.error('[getNationalDepartmentDistribution] 获取国家级部门分布数据失败:', error);
    throw error;
  }
}
```

### 3. 新增省份筛选功能

如果需要支持按省份筛选省级部门，可以进一步扩展现有函数：

**SQL函数扩展**：
```sql
-- 进一步扩展，支持按省份筛选
CREATE OR REPLACE FUNCTION get_dept_distribution(
  stat_dimension TEXT DEFAULT 'case_count',
  province_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH dept_stats AS (
    SELECT
      d.id,
      d.name,
      d.level,
      d.province,
      COUNT(DISTINCT c.department_id || '_' || c.report_date) as case_count,
      COUNT(DISTINCT c.app_name) as app_count
    FROM regulatory_departments d
    LEFT JOIN cases c ON d.id = c.department_id
    GROUP BY d.id, d.name, d.level, d.province
  )
  SELECT jsonb_build_object(
    'national', (SELECT jsonb_agg(
      jsonb_build_object(
        'name', name,
        'value', CASE 
          WHEN stat_dimension = 'app_count' THEN app_count 
          ELSE case_count 
        END,
        'province', province
      ) ORDER BY CASE 
        WHEN stat_dimension = 'app_count' THEN app_count 
        ELSE case_count 
      END DESC
    ) FROM dept_stats WHERE level = 'national' AND CASE 
      WHEN stat_dimension = 'app_count' THEN app_count > 0 
      ELSE case_count > 0 
    END),
    'provincial', (SELECT jsonb_agg(
      jsonb_build_object(
        'name', name,
        'value', CASE 
          WHEN stat_dimension = 'app_count' THEN app_count 
          ELSE case_count 
        END,
        'province', province
      ) ORDER BY CASE 
        WHEN stat_dimension = 'app_count' THEN app_count 
        ELSE case_count 
      END DESC
    ) FROM dept_stats WHERE level = 'provincial' AND CASE 
      WHEN stat_dimension = 'app_count' THEN app_count > 0 
      ELSE case_count > 0 
    END AND (province_param IS NULL OR province = province_param))
  ) INTO result;
  
  RETURN result;
END;
$$;
```

**前端代码适配省份筛选功能**：

```typescript
// 获取省级部门分布数据
export async function getProvincialDepartmentDistribution(
  province?: string,
  statDimension: 'case_count' | 'app_count' = 'app_count'
) {
  try {
    const { data, error } = await supabase.rpc('get_dept_distribution', {
      stat_dimension: statDimension,
      province_param: province || null
    });
    
    if (error) {
      console.error('[getProvincialDepartmentDistribution] RPC调用失败:', error);
      throw error;
    }
    
    // 适配函数返回格式，将value字段转换为count字段
    const provincialData = (data?.provincial || []).map((item: any) => ({
      name: item.name,
      count: item.value,
      province: item.province
    }));
    
    return provincialData;
  } catch (error) {
    console.error('[getProvincialDepartmentDistribution] 获取省级部门分布数据失败:', error);
    throw error;
  }
}
```

## 三、优化优势

### 1. 基于现有函数的优化优势

- **无需创建新函数**：可以直接使用或扩展现有RPC函数
- **减少开发工作量**：避免了创建和测试新函数的过程
- **保持系统稳定性**：基于现有成熟函数进行扩展，风险较低
- **提高代码复用性**：一次调用即可获取多种级别的部门分布数据

### 2. 扩展后的函数优势

- **支持多维度统计**：可以灵活切换按通报频次或应用数量统计
- **支持省份筛选**：可以筛选特定省份的省级部门
- **返回更多字段**：包含省份信息，便于后续扩展
- **更好的扩展性**：可以方便地添加新的统计维度

## 四、实施建议

1. **评估现有函数性能**：在正式使用前，测试现有函数的性能和准确性
2. **逐步扩展功能**：先使用现有函数进行基础优化，再根据需求逐步扩展功能
3. **保持向后兼容**：扩展函数时，确保与现有代码兼容
4. **测试返回数据格式**：确保函数返回的数据格式与前端代码期望的格式一致
5. **监控函数执行情况**：在生产环境中监控函数的执行情况，及时发现和解决问题

## 五、结论

基于现有Supabase RPC函数，我们可以通过扩展其功能和修改前端代码来优化国家级和省级部门分布模块，无需创建新的RPC函数。这种方案既可以利用现有函数的优势，又可以满足我们的优化需求，是一种高效、低风险的优化方式。

如果现有函数的性能或功能无法满足需求，再考虑创建新的更灵活的RPC函数。