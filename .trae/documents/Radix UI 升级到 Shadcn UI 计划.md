# Radix UI 升级到 Shadcn UI 计划

## 项目现状分析
- 项目已使用 React 18 + TypeScript + Vite
- 已安装 Radix UI 组件库
- 已安装 Shadcn UI 所需依赖（class-variance-authority, clsx, tailwind-merge, lucide-react 等）
- 已配置 `components.json` 文件
- 已在 `src/components/ui` 目录下有部分 UI 组件文件
- `tailwind.config.js` 已配置 `tailwindcss-animate` 插件

## 升级目标
将现有项目从 Radix UI 升级到 Shadcn UI，保留现有功能的同时，利用 Shadcn UI 提供的现代化设计和更好的开发体验。

## 升级步骤

### 1. 安装 Shadcn UI CLI 工具
- 安装 Shadcn UI CLI 工具
- 验证 CLI 工具安装成功

### 2. 更新 components.json 配置
- 检查并更新 `components.json` 中的配置
- 确保配置与项目结构一致

### 3. 验证现有 UI 组件
- 检查 `src/components/ui` 目录下的现有组件
- 验证哪些组件已经符合 Shadcn UI 规范
- 确定需要更新或重新生成的组件

### 4. 更新/重新生成 UI 组件
- 使用 Shadcn UI CLI 重新生成需要更新的组件
- 更新组件导入路径和使用方式
- 确保组件样式与设计规范一致

### 5. 测试组件功能
- 运行项目确保所有组件正常工作
- 测试组件的交互功能
- 确保响应式设计正常

### 6. 更新项目文档
- 更新 README.md 中的技术栈信息
- 添加 Shadcn UI 使用说明
- 更新组件使用文档

## 升级范围
- UI 组件库从 Radix UI 升级到 Shadcn UI
- 保持现有功能不变
- 保持现有项目结构不变
- 保持现有设计风格不变

## 注意事项
- 升级过程中确保项目可以正常构建和运行
- 测试所有组件的功能，确保没有引入新的问题
- 保持代码质量，遵循项目的开发规则
- 升级后运行测试套件，确保测试通过