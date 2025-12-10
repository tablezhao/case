# 季度和年度统计逻辑说明文档

## 一、功能概述

本文档详细说明了合规通平台中季度和年度统计功能的实现逻辑，包括数据计算方法、环比计算规则以及前端展示方式。

---

## 二、时间维度定义

### 2.1 本月
- **定义**：当前自然月（从1日到月末最后一天）
- **示例**：2025年12月 = 2025-12-01 至 2025-12-31

### 2.2 本季度
- **定义**：当前所在的自然季度
- **季度划分**：
  - Q1（第一季度）：1月、2月、3月
  - Q2（第二季度）：4月、5月、6月
  - Q3（第三季度）：7月、8月、9月
  - Q4（第四季度）：10月、11月、12月
- **示例**：
  - 当前月份为12月 → 本季度为Q4（10月-12月）
  - 当前月份为3月 → 本季度为Q1（1月-3月）

### 2.3 本年度
- **定义**：当前自然年（从1月1日到12月31日）
- **示例**：2025年度 = 2025-01-01 至 2025-12-31

---

## 三、统计口径说明

### 3.1 通报频次统计
**核心原则**：同一个监管部门在同一天内发布的所有应用通报，整体计为**1次通报频次**。

**计算方法**：按 `部门ID + 通报日期` 进行去重统计。

**适用范围**：本月、本季度、本年度的通报频次统计均采用此口径。

**示例**：
```
案例1：工信部 2025-12-01 通报了 App A
案例2：工信部 2025-12-01 通报了 App B
案例3：工信部 2025-12-02 通报了 App C
案例4：网信办 2025-12-01 通报了 App D

本月通报频次：3次
- 工信部 2025-12-01：1次（包含2个应用）
- 工信部 2025-12-02：1次（包含1个应用）
- 网信办 2025-12-01：1次（包含1个应用）
```

### 3.2 涉及应用统计
**核心原则**：统计时间范围内所有被通报的应用，按应用名称去重。

**计算方法**：按 `应用名称` 进行去重统计。

**适用范围**：本月、本季度、本年度的涉及应用统计均采用此口径。

**示例**：
```
案例1：工信部 2025-12-01 通报了 微信
案例2：工信部 2025-12-01 通报了 抖音
案例3：工信部 2025-12-02 通报了 微信（重复）
案例4：网信办 2025-12-01 通报了 快手

本月涉及应用：3个（微信、抖音、快手）
```

---

## 四、季度统计详细说明

### 4.1 本季度数据计算

#### 4.1.1 季度范围确定
```typescript
// 计算当前季度（1-4）
const currentQuarter = Math.ceil(currentMonth / 3);

// 计算季度起始月份
const quarterStartMonth = (currentQuarter - 1) * 3 + 1;

// 计算季度结束月份
const quarterEndMonth = currentQuarter * 3;

// 构建查询范围
const quarterStartStr = `${currentYear}-${quarterStartMonth}-01`;
const quarterEndStr = `${quarterEndYear}-${quarterEndMonthNext}-01`; // 下个月1日
```

#### 4.1.2 跨年处理
当季度结束月份为12月时，需要特殊处理：
```typescript
let quarterEndYear = currentYear;
let quarterEndMonthNext = quarterEndMonth + 1;
if (quarterEndMonthNext > 12) {
  quarterEndMonthNext = 1;
  quarterEndYear = currentYear + 1;
}
```

**示例**：
- Q4（10-12月）的结束日期：2026-01-01（而非2025-13-01）

#### 4.1.3 数据查询
```sql
SELECT report_date, department_id, app_name
FROM cases
WHERE report_date >= '2025-10-01'
  AND report_date < '2026-01-01';
```

#### 4.1.4 通报频次计算
```typescript
const currentQuarterFrequency = new Set(
  (currentQuarterCases || []).map(c => `${c.department_id}_${c.report_date}`)
).size;
```

#### 4.1.5 涉及应用计算
```typescript
const currentQuarterApps = new Set(
  (currentQuarterCases || []).map(c => c.app_name)
).size;
```

---

### 4.2 上季度数据计算

#### 4.2.1 上季度范围确定
```typescript
// 计算上季度（1-4）
const lastQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;

// 计算上季度所在年份
const lastQuarterYear = currentQuarter === 1 ? currentYear - 1 : currentYear;

// 计算上季度起始月份
const lastQuarterStartMonth = (lastQuarter - 1) * 3 + 1;

// 计算上季度结束月份
const lastQuarterEndMonth = lastQuarter * 3;
```

#### 4.2.2 跨年处理
```typescript
let lastQuarterEndYear = lastQuarterYear;
let lastQuarterEndMonthNext = lastQuarterEndMonth + 1;
if (lastQuarterEndMonthNext > 12) {
  lastQuarterEndMonthNext = 1;
  lastQuarterEndYear = lastQuarterYear + 1;
}
```

**示例**：
- 当前为2025年Q1，上季度为2024年Q4（2024-10-01 至 2025-01-01）

---

### 4.3 季度环比计算

#### 4.3.1 通报频次环比
```typescript
const quarterCasesChange = currentQuarterFrequency - lastQuarterFrequency;
const quarterCasesChangePercent = lastQuarterFrequency === 0 
  ? 0 
  : (quarterCasesChange / lastQuarterFrequency) * 100;
```

#### 4.3.2 涉及应用环比
```typescript
const quarterAppsChange = currentQuarterApps - lastQuarterApps;
const quarterAppsChangePercent = lastQuarterApps === 0 
  ? 0 
  : (quarterAppsChange / lastQuarterApps) * 100;
```

#### 4.3.3 环比示例
```
本季度（Q4）：
- 通报频次：10次
- 涉及应用：25个

上季度（Q3）：
- 通报频次：8次
- 涉及应用：20个

环比结果：
- 通报频次：+2次 (+25.0%)
- 涉及应用：+5个 (+25.0%)
```

---

## 五、年度统计详细说明

### 5.1 本年度数据计算

#### 5.1.1 年度范围确定
```typescript
const yearStartStr = `${currentYear}-01-01`;
const yearEndStr = `${currentYear + 1}-01-01`;
```

#### 5.1.2 数据查询
```sql
SELECT report_date, department_id, app_name
FROM cases
WHERE report_date >= '2025-01-01'
  AND report_date < '2026-01-01';
```

#### 5.1.3 通报频次计算
```typescript
const currentYearFrequency = new Set(
  (currentYearCases || []).map(c => `${c.department_id}_${c.report_date}`)
).size;
```

#### 5.1.4 涉及应用计算
```typescript
const currentYearApps = new Set(
  (currentYearCases || []).map(c => c.app_name)
).size;
```

---

### 5.2 上年度数据计算

#### 5.2.1 上年度范围确定
```typescript
const lastYearStartStr = `${currentYear - 1}-01-01`;
const lastYearEndStr = `${currentYear}-01-01`;
```

#### 5.2.2 数据查询
```sql
SELECT report_date, department_id, app_name
FROM cases
WHERE report_date >= '2024-01-01'
  AND report_date < '2025-01-01';
```

---

### 5.3 年度环比计算

#### 5.3.1 通报频次环比
```typescript
const yearCasesChange = currentYearFrequency - lastYearFrequency;
const yearCasesChangePercent = lastYearFrequency === 0 
  ? 0 
  : (yearCasesChange / lastYearFrequency) * 100;
```

#### 5.3.2 涉及应用环比
```typescript
const yearAppsChange = currentYearApps - lastYearApps;
const yearAppsChangePercent = lastYearApps === 0 
  ? 0 
  : (yearAppsChange / lastYearApps) * 100;
```

#### 5.3.3 环比示例
```
本年度（2025年）：
- 通报频次：120次
- 涉及应用：300个

上年度（2024年）：
- 通报频次：100次
- 涉及应用：250个

环比结果：
- 通报频次：+20次 (+20.0%)
- 涉及应用：+50个 (+20.0%)
```

---

## 六、数据一致性保证

### 6.1 统计逻辑一致性
**原则**：本月、本季度、本年度的统计逻辑完全一致，仅时间范围不同。

**实现方式**：
1. 所有时间维度均使用相同的去重键生成规则：`${department_id}_${report_date}`
2. 所有时间维度均使用相同的应用去重规则：按 `app_name` 去重
3. 所有时间维度均使用相同的环比计算公式

### 6.2 数据关系验证
**理论关系**：
```
本年度通报频次 >= 本季度通报频次 >= 本月通报频次
本年度涉及应用 >= 本季度涉及应用 >= 本月涉及应用
```

**验证方法**：
```typescript
// 验证数据合理性
if (stats.current_year_cases < stats.current_quarter_cases) {
  console.warn('数据异常：年度通报频次小于季度通报频次');
}
if (stats.current_quarter_cases < stats.current_month_cases) {
  console.warn('数据异常：季度通报频次小于月度通报频次');
}
```

---

## 七、前端展示说明

### 7.1 时间维度切换
**实现方式**：使用Tab组件切换本月、本季度、本年度三个维度。

**代码示例**：
```tsx
<Tabs value={timeDimension} onValueChange={(v) => setTimeDimension(v)}>
  <TabsList>
    <TabsTrigger value="month">本月</TabsTrigger>
    <TabsTrigger value="quarter">本季度</TabsTrigger>
    <TabsTrigger value="year">本年度</TabsTrigger>
  </TabsList>
</Tabs>
```

---

### 7.2 动态数据显示
**实现方式**：根据选中的时间维度，动态显示对应的数据和环比信息。

**代码示例**：
```tsx
<StatsCard
  title={
    timeDimension === 'month' ? '本月通报频次' 
    : timeDimension === 'quarter' ? '本季度通报频次' 
    : '本年度通报频次'
  }
  value={
    timeDimension === 'month' ? stats?.current_month_cases 
    : timeDimension === 'quarter' ? stats?.current_quarter_cases 
    : stats?.current_year_cases
  }
  change={
    timeDimension === 'month' ? stats?.cases_change 
    : timeDimension === 'quarter' ? stats?.quarter_cases_change 
    : stats?.year_cases_change
  }
  changePercent={
    timeDimension === 'month' ? stats?.cases_change_percent 
    : timeDimension === 'quarter' ? stats?.quarter_cases_change_percent 
    : stats?.year_cases_change_percent
  }
  trendLabel={
    timeDimension === 'month' ? '较上月' 
    : timeDimension === 'quarter' ? '较上季度' 
    : '较上年度'
  }
/>
```

---

### 7.3 环比标签动态显示
**实现方式**：根据时间维度，动态显示"较上月"、"较上季度"或"较上年度"。

**显示效果**：
- 本月：`+2 (+100.0%) 较上月`
- 本季度：`+5 (+50.0%) 较上季度`
- 本年度：`+20 (+20.0%) 较上年度`

---

## 八、边界情况处理

### 8.1 除零保护
**场景**：上期数据为0时，环比百分比无法计算。

**处理方式**：
```typescript
const changePercent = lastPeriodValue === 0 ? 0 : (change / lastPeriodValue) * 100;
```

**显示效果**：
- 上期为0，本期为5：`+5 (0.0%) 较上期`

---

### 8.2 跨年季度处理
**场景**：当前为Q1时，上季度为上一年的Q4。

**处理方式**：
```typescript
const lastQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
const lastQuarterYear = currentQuarter === 1 ? currentYear - 1 : currentYear;
```

**示例**：
- 当前：2025年Q1（2025-01-01 至 2025-04-01）
- 上季度：2024年Q4（2024-10-01 至 2025-01-01）

---

### 8.3 数据为空处理
**场景**：某个时间范围内没有任何案例数据。

**处理方式**：
```typescript
const frequency = new Set((cases || []).map(...)).size; // 空数组返回0
```

**显示效果**：
- 通报频次：0
- 涉及应用：0
- 环比：+0 (0.0%) 较上期

---

## 九、性能优化建议

### 9.1 数据缓存
**建议**：将统计结果缓存5-10分钟，减少数据库查询压力。

**实现方式**：
```typescript
// 使用React Query或SWR进行数据缓存
const { data: stats } = useQuery('stats-overview', getStatsOverview, {
  staleTime: 5 * 60 * 1000, // 5分钟
  cacheTime: 10 * 60 * 1000, // 10分钟
});
```

---

### 9.2 查询优化
**建议**：在 `report_date` 和 `department_id` 字段上建立复合索引。

**SQL示例**：
```sql
CREATE INDEX idx_cases_report_dept ON cases(report_date, department_id);
```

---

### 9.3 前端优化
**建议**：使用骨架屏提升用户体验。

**实现方式**：
```tsx
{loading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <StatsCard {...props} />
)}
```

---

## 十、测试验证

### 10.1 功能测试场景

#### 场景1：本月有数据，本季度应包含本月数据
```
输入：
- 本月通报频次：1次
- 本月涉及应用：2个

预期输出：
- 本季度通报频次：≥1次
- 本季度涉及应用：≥2个
```

#### 场景2：跨年季度环比计算
```
输入：
- 当前：2025年Q1
- 上季度：2024年Q4

预期输出：
- 正确计算2024年Q4的数据
- 正确显示环比变化
```

#### 场景3：年度数据包含所有季度数据
```
输入：
- Q1通报频次：10次
- Q2通报频次：15次
- Q3通报频次：12次
- Q4通报频次：8次

预期输出：
- 本年度通报频次：≥45次（可能有重复应用导致实际值小于简单相加）
```

---

### 10.2 边界测试场景

#### 场景1：1月份（Q1第一个月）
```
输入：当前月份 = 1月

预期输出：
- 本季度 = Q1（1-3月）
- 上季度 = 上一年Q4（10-12月）
```

#### 场景2：12月份（Q4最后一个月）
```
输入：当前月份 = 12月

预期输出：
- 本季度 = Q4（10-12月）
- 季度结束日期 = 下一年1月1日
```

#### 场景3：上期数据为0
```
输入：
- 本期通报频次：5次
- 上期通报频次：0次

预期输出：
- 环比：+5 (0.0%) 较上期
```

---

## 十一、常见问题解答

### Q1：为什么本季度数据显示为0，但本月有数据？
**A**：这可能是季度范围计算错误导致的。请检查：
1. 季度起始和结束日期是否正确
2. 是否正确处理了跨年情况（如Q4的结束日期）
3. 数据库查询的日期范围是否正确

### Q2：季度环比如何计算？
**A**：季度环比 = (本季度数据 - 上季度数据) / 上季度数据 × 100%

### Q3：本年度数据是否等于所有季度数据之和？
**A**：不一定。因为统计口径是按"部门+日期"去重，所以：
- 通报频次：本年度 = Q1 + Q2 + Q3 + Q4（因为不同季度的通报日期不会重复）
- 涉及应用：本年度 ≤ Q1 + Q2 + Q3 + Q4（因为同一应用可能在多个季度被通报）

### Q4：如何验证季度统计逻辑是否正确？
**A**：可以通过以下方法验证：
1. 检查本季度数据是否 ≥ 本月数据
2. 检查本年度数据是否 ≥ 本季度数据
3. 手动统计某个季度的数据，与系统显示对比
4. 检查跨年季度（Q1和Q4）的数据是否正确

### Q5：环比标签如何动态显示？
**A**：通过 `trendLabel` 属性传递：
- 本月：`trendLabel="较上月"`
- 本季度：`trendLabel="较上季度"`
- 本年度：`trendLabel="较上年度"`

---

## 十二、总结

### 12.1 核心要点
1. ✅ 季度和年度统计逻辑与月度完全一致，仅时间范围不同
2. ✅ 正确处理跨年情况（Q1的上季度、Q4的结束日期）
3. ✅ 所有时间维度均支持环比计算和显示
4. ✅ 前端支持动态切换时间维度，实时显示对应数据

### 12.2 数据关系
```
累计统计 >= 本年度 >= 本季度 >= 本月
```

### 12.3 环比计算
```
月度环比：本月 vs 上月
季度环比：本季度 vs 上季度
年度环比：本年度 vs 上年度
```

---

**文档版本**：v1.0  
**更新日期**：2025-12-04  
**维护者**：合规通开发团队
