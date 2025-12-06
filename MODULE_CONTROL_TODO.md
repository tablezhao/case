# 模块可见性控制功能开发任务清单

## 📋 功能概述
实现一个集中的模块管理系统，允许管理员控制前台各功能模块的可见性。

## 🎯 需要控制的模块
1. ✅ 案例查询模块（cases）
2. ✅ 监管资讯模块（news）
3. ✅ 监管部门模块（departments）
4. ✅ 趋势分析模块（trends）
5. ✅ 问题分析模块（issues）

## 📝 开发任务

### 1. 数据库设计
- [x] 创建 `module_settings` 表
- [x] 插入初始模块数据
- [x] 创建更新触发器（自动更新 updated_at）

### 2. API 函数开发
- [x] `getModuleSettings()` - 获取所有模块设置
- [x] `updateModuleSetting()` - 更新单个模块状态
- [x] 添加类型定义到 `types.ts`

### 3. 后台管理页面
- [x] 创建 `ModuleSettingsPage.tsx`
- [x] 实现模块列表展示
- [x] 实现开关控制
- [x] 实现实时保存
- [x] 添加操作反馈（Toast）
- [x] 添加到后台导航菜单

### 4. 前台响应系统
- [x] 创建 `ModuleContext` 上下文
- [x] 在 App.tsx 中加载模块设置
- [x] 修改 Header 组件，动态显示导航链接
- [x] 修改首页，动态显示模块
- [x] 添加路由保护

### 5. 测试验证
- [ ] 后台开关功能测试
- [ ] 前台响应测试
- [ ] 导航菜单自适应测试
- [ ] 首页布局自适应测试
- [ ] 路由访问控制测试

## 🔧 技术实现要点

### 数据库表结构
```sql
module_settings (
  id uuid PRIMARY KEY,
  module_key text UNIQUE NOT NULL,
  module_name text NOT NULL,
  is_enabled boolean DEFAULT true,
  display_order int DEFAULT 0,
  description text,
  updated_at timestamptz DEFAULT now()
)
```

### 模块映射关系
| 模块Key | 模块名称 | 前台位置 | 路由 |
|---------|---------|---------|------|
| cases | 案例查询模块 | 导航菜单、首页 | /cases |
| news | 监管资讯模块 | 导航菜单、首页 | /news |
| departments | 监管部门模块 | 导航菜单 | /departments |
| trends | 趋势分析模块 | 首页 | / (首页模块) |
| issues | 问题分析模块 | 首页 | / (首页模块) |

### Context 结构
```typescript
interface ModuleContextType {
  modules: Record<string, boolean>;
  isModuleEnabled: (key: string) => boolean;
  refreshModules: () => Promise<void>;
}
```

## 📐 设计原则

### 后台管理界面
- 简洁直观的卡片式布局
- 清晰的模块描述
- 即时的操作反馈
- 统一的视觉风格

### 前台响应规则
- 模块关闭时完全隐藏
- 布局自动调整，无空白区域
- 路由访问被拦截，重定向到首页
- 用户体验流畅

### 扩展性设计
- 数据库驱动，易于添加新模块
- 统一的开关控制逻辑
- 模块化的代码结构
- 清晰的接口定义

## 🚀 实施计划

### 第一阶段：数据库和API（30分钟）
1. 创建数据库表和初始数据
2. 实现API函数
3. 添加类型定义

### 第二阶段：后台管理（30分钟）
1. 创建管理页面
2. 实现开关控制
3. 添加到导航菜单

### 第三阶段：前台响应（45分钟）
1. 创建Context
2. 修改Header组件
3. 修改首页组件
4. 添加路由保护

### 第四阶段：测试优化（15分钟）
1. 功能测试
2. 界面优化
3. 文档编写

## ✅ 验收标准

### 功能完整性
- ✅ 所有5个模块都可以独立控制
- ✅ 开关状态实时保存
- ✅ 前台立即响应变化

### 用户体验
- ✅ 操作简单直观
- ✅ 反馈及时明确
- ✅ 界面美观统一

### 技术质量
- ✅ 代码通过ESLint检查
- ✅ 无TypeScript错误
- ✅ 性能良好

### 扩展性
- ✅ 易于添加新模块
- ✅ 代码结构清晰
- ✅ 接口定义明确
