# 案例编辑界面 - 可创建新选项功能说明文档

## 一、功能概述

在案例编辑界面中，用户现在可以在选择监管部门和应用平台时，直接创建系统中尚未记录的新选项，无需跳转到其他管理页面。

---

## 二、功能特性

### 2.1 核心功能
- ✅ **搜索现有选项**：输入时实时搜索匹配的监管部门或应用平台
- ✅ **创建新选项**：当输入的名称不存在时，显示"新增：[名称]"选项
- ✅ **自动保存**：选择新增选项后，自动保存到对应的主数据模块
- ✅ **即时可用**：新创建的选项立即可在当前表单中使用
- ✅ **无缝体验**：整个过程不中断案例编辑流程

### 2.2 用户体验优化
- 🔍 **智能搜索**：支持模糊搜索，不区分大小写
- 💬 **即时反馈**：创建成功后显示Toast提示
- 🔄 **自动刷新**：新选项自动添加到下拉列表
- ⚡ **快速操作**：无需跳转页面，一键完成创建

---

## 三、使用场景

### 场景1：编辑案例时发现监管部门不存在
**操作流程**：
1. 打开案例编辑对话框
2. 点击"监管部门"选择框
3. 输入新部门名称（如"北京市网信办"）
4. 系统显示"新增：北京市网信办"选项
5. 点击该选项
6. 系统自动创建并选中该部门
7. 显示成功提示："成功创建监管部门：北京市网信办（可在"部门与平台"模块中补充详细信息）"

### 场景2：编辑案例时发现应用平台不存在
**操作流程**：
1. 打开案例编辑对话框
2. 点击"应用平台"选择框
3. 输入新平台名称（如"鸿蒙应用市场"）
4. 系统显示"新增：鸿蒙应用市场"选项
5. 点击该选项
6. 系统自动创建并选中该平台
7. 显示成功提示："成功创建应用平台：鸿蒙应用市场"

### 场景3：搜索现有选项
**操作流程**：
1. 点击选择框
2. 输入关键词（如"工信"）
3. 系统自动过滤显示匹配的选项（如"工信部"）
4. 点击选择即可

---

## 四、技术实现

### 4.1 核心组件：CreatableCombobox

**文件位置**：`src/components/ui/creatable-combobox.tsx`

**主要特性**：
- 基于shadcn/ui的Command和Popover组件
- 支持搜索、过滤和创建功能
- 异步创建处理，支持加载状态
- 完整的错误处理机制

**组件接口**：
```typescript
interface CreatableComboboxProps {
  value?: string;                              // 当前选中的值
  onValueChange: (value: string) => void;      // 值变化回调
  options: ComboboxOption[];                   // 选项列表
  placeholder?: string;                        // 占位文本
  emptyText?: string;                          // 无结果时的提示文本
  onCreate?: (name: string) => Promise<string>; // 创建新选项的回调函数
  disabled?: boolean;                          // 是否禁用
  className?: string;                          // 自定义样式
}
```

---

### 4.2 创建逻辑

#### 监管部门创建
```typescript
const handleCreateDepartment = async (name: string): Promise<string> => {
  try {
    // 创建新部门（默认为国家级）
    const newDept = await createDepartment({ 
      name,
      level: 'national',
      province: null,
    });
    
    // 重新加载部门列表
    const updatedDepts = await getDepartments();
    setDepartments(updatedDepts);
    
    // 显示成功提示
    toast.success(`成功创建监管部门：${name}（可在"部门与平台"模块中补充详细信息）`);
    
    // 返回新部门的ID
    return newDept.id;
  } catch (error) {
    toast.error('创建部门失败');
    throw error;
  }
};
```

#### 应用平台创建
```typescript
const handleCreatePlatform = async (name: string): Promise<string> => {
  try {
    // 创建新平台
    const newPlat = await createPlatform({ name });
    
    // 重新加载平台列表
    const updatedPlats = await getPlatforms();
    setPlatforms(updatedPlats);
    
    // 显示成功提示
    toast.success(`成功创建应用平台：${name}`);
    
    // 返回新平台的ID
    return newPlat.id;
  } catch (error) {
    toast.error('创建平台失败');
    throw error;
  }
};
```

---

### 4.3 表单集成

**文件位置**：`src/pages/admin/CaseManagePage.tsx`

**使用示例**：
```tsx
{/* 监管部门选择 */}
<CreatableCombobox
  value={formData.department_id}
  onValueChange={(value) => setFormData({ ...formData, department_id: value })}
  options={departments.map(d => ({ value: d.id, label: d.name }))}
  placeholder="选择或新增监管部门"
  emptyText="未找到匹配的部门"
  onCreate={handleCreateDepartment}
/>

{/* 应用平台选择 */}
<CreatableCombobox
  value={formData.platform_id}
  onValueChange={(value) => setFormData({ ...formData, platform_id: value })}
  options={platforms.map(p => ({ value: p.id, label: p.name }))}
  placeholder="选择或新增应用平台"
  emptyText="未找到匹配的平台"
  onCreate={handleCreatePlatform}
/>
```

---

## 五、数据管理

### 5.1 初始数据
新创建的记录包含以下信息：

**监管部门**：
- `name`：用户输入的部门名称
- `level`：默认为 `'national'`（国家级）
- `province`：默认为 `null`

**应用平台**：
- `name`：用户输入的平台名称

### 5.2 后续补充
管理员可以在"部门与平台"管理模块中：
- 补充监管部门的级别（国家级/省级/市级）
- 补充监管部门的所属省份
- 修改部门或平台的名称
- 删除不需要的记录

**导航路径**：
```
监管部门 → 部门与平台管理
```

---

## 六、交互细节

### 6.1 搜索行为
- **实时过滤**：输入时立即过滤选项列表
- **不区分大小写**：搜索时忽略大小写
- **模糊匹配**：支持部分匹配（如输入"工信"可匹配"工信部"）

### 6.2 创建触发条件
**显示"新增"选项的条件**：
1. 用户已输入内容（非空）
2. 输入内容与现有选项不完全匹配（不区分大小写）

**"新增"选项的显示位置**：
- 当搜索无结果时：显示在空状态区域
- 当有搜索结果时：显示在列表底部（带分隔线）

### 6.3 加载状态
- 创建过程中按钮显示"创建中..."
- 按钮处于禁用状态，防止重复提交
- 创建完成后自动关闭下拉框

### 6.4 错误处理
- 创建失败时显示错误提示
- 不会关闭下拉框，用户可以重试
- 错误信息通过Toast显示

---

## 七、视觉设计

### 7.1 选择框样式
- 使用shadcn/ui的Button样式
- 右侧显示下拉箭头图标
- 选中后显示选项名称
- 未选中时显示占位文本

### 7.2 下拉列表样式
- 使用Command组件的搜索框
- 选项列表支持滚动
- 选中项显示勾选图标
- "新增"选项显示加号图标

### 7.3 提示信息
- 成功提示：绿色Toast，显示3秒
- 错误提示：红色Toast，显示3秒
- 监管部门创建成功后提示用户可补充详细信息

---

## 八、数据流程图

```
用户输入新名称
    ↓
系统检查是否存在
    ↓
不存在 → 显示"新增：[名称]"选项
    ↓
用户点击新增选项
    ↓
调用创建API
    ↓
创建成功
    ↓
重新加载选项列表
    ↓
自动选中新创建的选项
    ↓
显示成功提示
    ↓
用户继续编辑案例
```

---

## 九、API调用

### 9.1 创建监管部门
**函数**：`createDepartment(department)`

**参数**：
```typescript
{
  name: string;        // 部门名称
  level: DepartmentLevel; // 部门级别（'national' | 'provincial' | 'municipal'）
  province: string | null; // 所属省份
}
```

**返回**：
```typescript
{
  id: string;          // 新部门的ID
  name: string;
  level: DepartmentLevel;
  province: string | null;
  created_at: string;
}
```

---

### 9.2 创建应用平台
**函数**：`createPlatform(platform)`

**参数**：
```typescript
{
  name: string;        // 平台名称
}
```

**返回**：
```typescript
{
  id: string;          // 新平台的ID
  name: string;
  created_at: string;
}
```

---

### 9.3 重新加载列表
**函数**：`getDepartments()` / `getPlatforms()`

**返回**：
```typescript
RegulatoryDepartment[] | AppPlatform[]
```

---

## 十、注意事项

### 10.1 数据完整性
- 新创建的监管部门默认为"国家级"，需要后续在管理模块中调整
- 新创建的记录只包含名称，其他信息需要后续补充

### 10.2 权限控制
- 当前所有登录用户均可创建新选项
- 如需限制权限，可在API层面添加权限检查

### 10.3 重复检查
- 前端通过不区分大小写的匹配防止创建重复选项
- 后端数据库层面没有唯一性约束，理论上可能存在重复
- 建议在数据库层面添加唯一性约束（可选）

### 10.4 性能考虑
- 创建成功后会重新加载整个选项列表
- 对于大量数据场景，可以考虑只添加新项到列表而不重新加载

---

## 十一、未来优化方向

### 11.1 功能增强
- [ ] 支持批量创建（从Excel导入时自动创建不存在的部门和平台）
- [ ] 创建时支持填写更多字段（如部门级别、省份）
- [ ] 支持编辑已选中的选项（快捷编辑）

### 11.2 用户体验
- [ ] 添加键盘快捷键支持（Enter创建、Esc取消）
- [ ] 优化搜索算法（支持拼音搜索、首字母搜索）
- [ ] 添加最近使用记录

### 11.3 数据管理
- [ ] 添加重复检测提示
- [ ] 支持合并重复选项
- [ ] 添加使用频率统计

---

## 十二、测试场景

### 12.1 功能测试
- [x] 创建新监管部门
- [x] 创建新应用平台
- [x] 搜索现有选项
- [x] 选择现有选项
- [x] 创建后立即使用
- [x] 创建失败处理

### 12.2 边界测试
- [ ] 输入空白字符
- [ ] 输入超长名称
- [ ] 输入特殊字符
- [ ] 网络异常情况
- [ ] 并发创建相同名称

### 12.3 用户体验测试
- [x] 加载状态显示
- [x] 成功提示显示
- [x] 错误提示显示
- [x] 下拉框自动关闭
- [x] 选项列表自动更新

---

## 十三、常见问题

### Q1：创建的新选项在哪里可以查看和管理？
**A**：在"监管部门"→"部门与平台管理"页面中，可以查看、编辑和删除所有监管部门和应用平台。

### Q2：新创建的监管部门为什么默认是"国家级"？
**A**：为了简化创建流程，系统默认设置为"国家级"。您可以在"部门与平台管理"页面中修改为正确的级别。

### Q3：如果输入的名称已存在会怎样？
**A**：系统会自动过滤显示匹配的现有选项，不会显示"新增"选项，避免创建重复记录。

### Q4：创建失败后怎么办？
**A**：系统会显示错误提示，下拉框不会关闭，您可以修改名称后重试，或选择现有选项。

### Q5：可以在批量编辑时创建新选项吗？
**A**：目前批量编辑对话框中的选择框仍使用普通Select组件，暂不支持创建新选项。如需创建，请先在单个案例编辑中完成。

---

## 十四、总结

### 14.1 功能价值
- ✅ **提升效率**：无需跳转页面，一站式完成案例编辑
- ✅ **降低门槛**：新用户无需提前了解所有部门和平台
- ✅ **灵活性强**：随时添加新选项，适应动态变化的监管环境
- ✅ **体验流畅**：无缝集成，不中断工作流程

### 14.2 技术亮点
- 🎯 **组件化设计**：CreatableCombobox可复用于其他场景
- 🔄 **异步处理**：完整的加载和错误状态管理
- 💡 **智能搜索**：实时过滤，提升选择效率
- 🛡️ **错误处理**：完善的异常处理机制

---

**文档版本**：v1.0  
**更新日期**：2025-12-04  
**维护者**：合规通开发团队
