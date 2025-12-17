# 趋势分析页面数据统计逻辑修复方案

## 1. 修复背景

在对趋势分析页面的数据统计逻辑进行梳理时，发现其与监管部门页面存在数据统计口径不一致的问题。具体表现为：

- 趋势分析页面的`getDepartmentRanking`和`getDepartmentApplicationTrend`函数使用`application_count`字段累加计算应用数量
- 监管部门页面使用"按应用名称去重统计"的方式计算应用数量
- 这种不一致导致相同统计指标在不同页面展示不同结果，影响用户体验和数据可信度

## 2. 修复目标

1. 统一趋势分析页面与监管部门页面的数据统计口径
2. 修改`getDepartmentRanking`函数，将应用数量统计从"累加application_count"改为"按应用名称去重统计"
3. 修改`getDepartmentApplicationTrend`函数，将应用数量统计从"累加application_count"改为"按应用名称去重统计"
4. 确保修复后的数据统计逻辑与监管部门页面保持一致
5. 验证修复后的数据展示正确，无数据错位或计算错误

## 3. 修复范围

- 文件：`src/db/api.ts`
- 函数：
  - `getDepartmentRanking`（1940行开始）
  - `getDepartmentApplicationTrend`（2083行开始）

## 4. 具体修复步骤

### 4.1 修改`getDepartmentRanking`函数

#### 4.1.1 修改数据结构定义
将`totalApps`字段替换为`apps` Set集合，用于存储唯一应用名称

#### 4.1.2 修改数据初始化逻辑
将应用相关的初始化从数值改为Set集合

#### 4.1.3 修改数据统计逻辑
将应用数量累加改为添加到Set集合中

#### 4.1.4 修改结果转换逻辑
将结果转换时的`totalApps`改为`apps.size`

### 4.2 修改`getDepartmentApplicationTrend`函数

#### 4.2.1 修改数据结构定义
将`count`字段替换为`apps` Set集合，用于存储唯一应用名称

#### 4.2.2 修改数据初始化逻辑
将应用相关的初始化从数值改为Set集合

#### 4.2.3 修改数据统计逻辑
将应用数量累加改为添加到Set集合中

#### 4.2.4 修改结果转换逻辑
将结果转换时的`count`改为`apps.size`

## 5. 实施细节

### 5.1 原代码分析

#### 5.1.1 `getDepartmentRanking`函数原逻辑
```typescript
export async function getDepartmentRanking(params: {
  dimension: 'monthly' | 'half-yearly' | 'yearly' | 'all';
  year?: string;
  month?: string;
  halfYear?: 'H1' | 'H2';
  limit?: number;
}) {
  // ... 函数定义 ...
  
  // 统计每个部门的数据
  const deptStats: Record<string, {
    name: string;
    dates: Set<string>;
    totalApps: number;
  }> = {};

  (data || []).forEach(item => {
    // ... 其他代码 ...
    const appCount = item.application_count || 0;
    // 通报应用量：累加
    deptStats[deptId].totalApps += appCount;
  });

  // 转换为数组
  const deptArray = Object.entries(deptStats).map(([id, info]) => ({
    departmentId: id,
    departmentName: info.name,
    reportCount: info.dates.size, // 通报频次
    appCount: info.totalApps, // 通报应用量
  }));
  
  // ... 其余代码 ...
}
```

#### 5.1.2 `getDepartmentApplicationTrend`函数原逻辑
```typescript
export async function getDepartmentApplicationTrend(params: {
  departmentIds: string[];
  dimension: 'yearly' | 'all';
  year?: string;
}) {
  // ... 函数定义 ...
  
  // 按日期和部门分组统计
  const dateStats: Record<string, Record<string, {
    name: string;
    count: number;
  }>> = {};

  data.forEach(item => {
    // ... 其他代码 ...
    const appCount = item.application_count || 0;
    
    dateStats[date][deptId].count += appCount;
  });
  
  // ... 其余代码 ...
}
```

### 5.2 修改后的代码

#### 5.2.1 `getDepartmentRanking`函数修改后
```typescript
export async function getDepartmentRanking(params: {
  dimension: 'monthly' | 'half-yearly' | 'yearly' | 'all';
  year?: string;
  month?: string;
  halfYear?: 'H1' | 'H2';
  limit?: number;
}) {
  // ... 函数定义 ...
  
  // 统计每个部门的数据
  const deptStats: Record<string, {
    name: string;
    dates: Set<string>;
    apps: Set<string>; // 使用Set存储唯一应用名称
  }> = {};

  (data || []).forEach(item => {
    // ... 其他代码 ...
    
    if (!deptStats[deptId]) {
      deptStats[deptId] = {
        name: deptName,
        dates: new Set(),
        apps: new Set(), // 初始化应用Set集合
      };
    }

    // 通报频次：唯一日期数
    deptStats[deptId].dates.add(item.report_date);
    // 通报应用量：添加到Set中去重
    if (item.app_name) {
      deptStats[deptId].apps.add(item.app_name);
    }
  });

  // 转换为数组
  const deptArray = Object.entries(deptStats).map(([id, info]) => ({
    departmentId: id,
    departmentName: info.name,
    reportCount: info.dates.size, // 通报频次
    appCount: info.apps.size, // 通报应用量（改为Set大小）
  }));
  
  // ... 其余代码 ...
}
```

#### 5.2.2 `getDepartmentApplicationTrend`函数修改后
```typescript
export async function getDepartmentApplicationTrend(params: {
  departmentIds: string[];
  dimension: 'yearly' | 'all';
  year?: string;
}) {
  // ... 函数定义 ...
  
  // 按日期和部门分组统计
  const dateStats: Record<string, Record<string, {
    name: string;
    apps: Set<string>; // 使用Set存储唯一应用名称
  }>> = {};

  data.forEach(item => {
    // ... 其他代码 ...
    
    if (!dateStats[date]) {
      dateStats[date] = {};
    }

    if (!dateStats[date][deptId]) {
      dateStats[date][deptId] = {
        name: deptName,
        apps: new Set(), // 初始化应用Set集合
      };
    }

    // 通报应用量：添加到Set中去重
    if (item.app_name) {
      dateStats[date][deptId].apps.add(item.app_name);
    }
  });
  
  // 转换为数组格式，便于图表展示
  const result = Object.entries(dateStats).map(([date, depts]) => {
    const dataPoint: any = {
      date,
    };

    // 为每个部门添加数据
    Object.entries(depts).forEach(([deptId, info]) => {
      dataPoint[info.name] = info.apps.size; // 改为Set大小
    });

    return dataPoint;
  }).sort((a, b) => a.date.localeCompare(b.date));
  
  // ... 其余代码 ...
}
```

## 6. 预期效果

1. **数据统计口径统一**：趋势分析页面与监管部门页面的数据统计逻辑保持一致
2. **应用数量准确**：通报应用数量按应用名称去重统计，确保每个应用只被计算一次
3. **页面展示一致**：相同统计指标在不同页面展示相同结果
4. **用户体验提升**：用户在不同页面查看相同指标时不会产生困惑
5. **数据可信度提高**：统一的数据统计口径增强数据的可信度和权威性

## 7. 验证方法

1. **代码验证**：
   - 运行TypeScript编译检查：`npx tsc --noEmit`
   - 运行ESLint检查：`npm run lint`

2. **功能验证**：
   - 启动开发服务器：`npm run dev`
   - 访问趋势分析页面：`http://localhost:5174/trend-analysis`
   - 检查通报排名模块的"通报应用量排行榜"数据
   - 检查监管部门趋势分析模块的图表数据
   - 与监管部门页面的数据进行对比，确认统计结果一致

3. **数据验证**：
   - 选择相同的时间范围和部门，对比不同页面的统计结果
   - 验证"通报应用量"指标的计算结果是否符合预期
   - 检查数据是否存在错位或计算错误

4. **日志验证**：
   - 查看浏览器控制台的日志输出
   - 检查是否有错误信息或异常情况
   - 验证API请求和响应是否正常

## 8. 风险评估

1. **数据变化风险**：修复后应用数量统计结果可能与之前不同
2. **性能影响**：使用Set集合存储和处理数据可能带来轻微的性能开销
3. **兼容性风险**：修改API返回数据结构可能影响前端组件的正常工作

## 9. 回滚方案

如果修复过程中出现问题，可通过以下方式回滚：

1. 使用Git版本控制回滚：
   ```bash
   git checkout src/db/api.ts
   ```

2. 手动恢复修改前的代码：
   - 恢复`getDepartmentRanking`函数的原始实现
   - 恢复`getDepartmentApplicationTrend`函数的原始实现

## 10. 修复完成标准

1. 代码通过TypeScript编译检查
2. 代码通过ESLint检查
3. 趋势分析页面数据统计逻辑与监管部门页面保持一致
4. 应用数量统计准确，按应用名称去重
5. 页面展示正常，无数据错位或计算错误
6. 修复过程可追溯，结果可验证

## 11. 后续建议

1. 建立统一的数据统计规范文档，确保所有页面遵循相同的统计规则
2. 定期进行数据统计逻辑的一致性检查
3. 考虑引入数据校验机制，确保数据质量
4. 完善数据异常处理机制，提高系统健壮性

---

**修复人**：AI助手
**修复日期**：2025-12-17
**修复版本**：1.0.0
**状态**：待实施