# 数据与功能调整任务清单

## 1. 后台监管部门页面数据修正
- [x] 核查并修复"累计通报频次"数据
- [x] 核查并补充"相关应用总数"数据

## 2. 后台应用平台页面功能增强
- [x] 增加"累计通报频次"数据展示模块
- [x] 增加"相关应用总数"数据展示模块

## 3. 前台监管部门页面功能同步
- [x] 增加"累计通报频次"数据展示
- [x] 增加"相关应用总数"数据展示

## 4. 通报频次计算逻辑优化
- [x] 调整为按自然日合并计算
- [x] 同一天多个通报只计1次
- [x] 跨日通报分别累计
- [x] 更新所有相关API函数

## 5. 应用总数显示优化
- [x] 字体颜色改为深色系（#1a1a1a）
- [x] 暗色模式下自动切换为白色
- [x] 添加半透明背景衬底（前台卡片）
- [x] 添加边框强化设计（前台卡片）
- [x] 确保对比度符合WCAG AA标准

## 6. 测试验证
- [x] 后台监管部门页面数据准确性测试
- [x] 后台应用平台页面功能测试
- [x] 前台监管部门页面功能测试
- [x] 前后台数据一致性验证
- [x] 通报频次计算逻辑验证
- [x] 界面对比度测试

## 完成情况总结

### API函数优化
1. ✅ 优化 `getDepartmentsWithStats()` - 按日期分组统计通报频次
2. ✅ 优化 `getNationalDepartmentsWithStats()` - 按日期分组统计通报频次
3. ✅ 优化 `getProvincialDepartmentsWithStats()` - 按日期分组统计通报频次
4. ✅ 优化 `getPlatformsWithStats()` - 按日期分组统计通报频次

### 通报频次计算逻辑
- ✅ 查询案例时同时获取 `report_date` 和 `app_name` 字段
- ✅ 使用 `Set` 对日期进行去重
- ✅ 提取日期部分（YYYY-MM-DD）进行比较
- ✅ 同一天的多个案例只计数1次
- ✅ 不同天的案例分别计数
- ✅ 空日期的案例被正确过滤

### 后台管理页面更新
1. ✅ 后台监管部门页面 (`/src/pages/admin/DepartmentsPage.tsx`)
   - 应用总数字体颜色改为 `text-[#1a1a1a]`
   - 暗色模式下使用 `dark:text-white`
   - 图标颜色同步调整
   - 保持表格布局不变

2. ✅ 后台应用平台页面 (同一文件的平台标签页)
   - 应用总数字体颜色改为 `text-[#1a1a1a]`
   - 暗色模式下使用 `dark:text-white`
   - 图标颜色同步调整
   - 保持表格布局不变

### 前台展示页面更新
1. ✅ 前台监管部门页面 (`/src/pages/DepartmentsPage.tsx`)
   - 国家级部门卡片：
     - 应用总数字体颜色改为 `text-[#1a1a1a]`
     - 暗色模式下使用 `dark:text-white`
     - 背景改为 `bg-muted/30`（半透明灰色）
     - 添加边框 `border border-border/50`
   - 省级部门卡片：
     - 应用总数字体颜色改为 `text-[#1a1a1a]`
     - 暗色模式下使用 `dark:text-white`
     - 背景改为 `bg-muted/30`（半透明灰色）
     - 添加边框 `border border-border/50`

### 数据准确性保证
- ✅ 通报频次：按自然日合并，每日只计1次
- ✅ 应用总数：通过 `Set` 去重确保准确性
- ✅ 前后台使用相同的API函数，确保数据一致性
- ✅ 所有代码通过 ESLint 检查

### 界面设计优化
- ✅ 应用总数使用深色字体（#1a1a1a），确保高对比度
- ✅ 暗色模式下自动切换为白色字体
- ✅ 前台卡片添加半透明背景和边框，增强视觉层次
- ✅ 后台表格保持简洁，只调整字体颜色
- ✅ 对比度符合 WCAG 2.1 AAA 标准（>7:1）
- ✅ 响应式设计，适配不同屏幕尺寸

### 优化效果
- ✅ 通报频次统计更准确，避免重复计数
- ✅ 应用总数显示更清晰，对比度显著提升
- ✅ 界面视觉层次更分明
- ✅ 符合无障碍访问标准
- ✅ 用户体验显著提升

### 技术实现亮点
1. **日期分组统计**：
   ```typescript
   const uniqueDates = new Set(
     casesArray
       .map(item => {
         if (!item.report_date) return null;
         const date = new Date(item.report_date);
         return date.toISOString().split('T')[0];
       })
       .filter(Boolean)
   );
   ```

2. **高对比度颜色**：
   ```typescript
   // 浅色模式：深色字体
   text-[#1a1a1a]
   
   // 暗色模式：白色字体
   dark:text-white
   ```

3. **增强背景**：
   ```typescript
   // 半透明背景 + 边框
   bg-muted/30 rounded-lg border border-border/50
   ```

