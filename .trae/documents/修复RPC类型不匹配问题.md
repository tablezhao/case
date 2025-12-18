# 修复RPC类型不匹配问题

## 问题分析

当前问题：Supabase RPC函数返回 `bigint` 类型，而前端期望 `integer` 类型，导致类型不匹配错误。

根本原因：
- RPC函数定义返回 `INTEGER` 类型
- PostgreSQL中 `COUNT(DISTINCT app_name)` 返回 `BIGINT` 类型
- 缺少显式类型转换

## 解决方案

### 1. 修改RPC函数，添加类型转换

**文件**：`supabase/migrations/20251218_fix_trend_overview_rpc.sql`

**修改点**：在SELECT语句中添加显式类型转换，将 `COUNT(DISTINCT app_name)` 转换为 `INTEGER`

**实现**：
```sql
-- 修改前
SELECT 
    TO_CHAR(date_trunc('month', report_date), 'YYYY-MM') AS month,
    COUNT(DISTINCT app_name) AS count

-- 修改后
SELECT 
    TO_CHAR(date_trunc('month', report_date), 'YYYY-MM') AS month,
    COUNT(DISTINCT app_name)::INTEGER AS count
```

### 2. 更新API函数，重新使用RPC

**文件**：`src/db/api.ts`

**修改点**：
- 恢复RPC调用
- 添加类型安全处理，确保返回值为 `number` 类型
- 保留详细的日志记录

**实现**：
```typescript
// 使用Supabase RPC函数获取数据
const { data, error } = await supabase.rpc('get_monthly_app_count_trend', {
  time_range: timeRange
});

if (error) {
  console.error('[getMonthlyAppCountTrend] RPC调用失败:', error);
  throw error;
}

// 确保返回数据类型为number
const result = data?.map(item => ({
  month: item.month,
  count: Number(item.count) // 确保count为number类型
})) || [];
```

### 3. 验证修复效果

**测试步骤**：
1. 运行类型检查，确保TypeScript类型正确
2. 运行单元测试，确保时间范围计算正确
3. 验证API函数能正常调用RPC并返回正确类型的数据

## 预期效果

1. ✅ RPC函数返回正确的 `INTEGER` 类型
2. ✅ API函数能正常调用RPC，无类型不匹配错误
3. ✅ 前端能正常接收和处理数据
4. ✅ 保持代码的可维护性和性能

## 技术亮点

1. **显式类型转换**：解决了PostgreSQL与前端类型不匹配问题
2. **类型安全**：确保API返回数据类型一致
3. **代码复用**：重新利用了服务端聚合的性能优势
4. **可维护性**：代码结构清晰，便于后续修改

## 风险评估

| 风险 | 影响 | 应对措施 |
|-----|------|----------|
| RPC部署失败 | 服务不可用 | 保留现有客户端筛选逻辑作为备选 |
| 类型转换失败 | 数据错误 | 添加类型检查和错误处理 |
| 性能问题 | 查询缓慢 | 优化数据库索引，监控查询性能 |

## 实施计划

1. 首先修改RPC函数，添加显式类型转换
2. 然后更新API函数，重新使用RPC调用
3. 最后运行测试，验证修复效果

## 交付物

1. 修改后的RPC迁移文件
2. 更新后的API函数
3. 验证测试结果

## 后续优化建议

1. 添加API响应类型定义
2. 实现API调用缓存
3. 添加监控和告警机制
4. 定期优化数据库性能