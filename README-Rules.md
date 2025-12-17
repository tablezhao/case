# 项目描述

本项目是一个基于React的监管案例分析系统，用于展示和分析监管部门的通报案例数据。系统提供了全面的数据统计、趋势分析、部门分布和违规问题可视化等功能，帮助用户直观了解监管动态和趋势。

## 功能模块

1. **首页统计**：展示核心统计数据、趋势概览、监管部门分布和应用平台分布等信息
2. **案例管理**：提供案例列表、详情查看、批量导入导出和智能分析功能
3. **部门管理**：监管部门的增删改查和统计分析
4. **新闻管理**：监管新闻的发布、编辑和展示
5. **趋势分析**：多维度的趋势分析图表，支持按月份、季度、年度查看
6. **违规分析**：违规问题的词云展示和热点问题识别
7. **系统配置**：站点设置、模块控制、导航配置和用户管理
8. **智能导入**：支持自动创建不存在的部门和平台，批量导入案例数据

## 技术栈

1. **前端框架**：React 18 + TypeScript
2. **构建工具**：Vite
3. **样式框架**：Tailwind CSS
4. **UI组件库**：Shadcn UI
5. **图表库**：ECharts
6. **数据库**：Supabase
7. **路由管理**：React Router
8. **状态管理**：React Context API
9. **HTTP客户端**：Supabase JS Client

## 依赖

1. **核心依赖**：
   - @supabase/supabase-js：Supabase数据库客户端
   - echarts：图表库
   - echarts-for-react：React ECharts封装
   - react-router-dom：路由管理
   - clsx：CSS类名管理
   - tailwind-merge：Tailwind CSS类名合并
   - sonner：通知组件
   - lucide-react：图标库
   - date-fns：日期处理库

2. **开发依赖**：
   - @types/react：React类型定义
   - @types/react-dom：React DOM类型定义
   - @vitejs/plugin-react：Vite React插件
   - tailwindcss：Tailwind CSS核心
   - postcss：CSS预处理
   - autoprefixer：CSS前缀处理
   - vitest：测试框架
   - @testing-library/react：React测试库

## 数据流

1. **数据获取**：客户端通过API函数从Supabase数据库获取数据
2. **数据处理**：API函数对原始数据进行过滤、统计和格式化
3. **数据缓存**：使用自定义缓存管理器对频繁访问的数据进行缓存（默认5分钟）
4. **数据渲染**：将处理后的数据传递给图表组件和统计卡片进行渲染
5. **用户交互**：用户操作触发新的数据请求，更新视图
6. **数据更新**：管理后台的数据更新会触发相关缓存的清除，确保数据实时性

## 数据库

1. **主要表结构**：
   - `cases`：案例表，存储监管通报案例数据
   - `regulatory_departments`：监管部门表，存储监管部门信息
   - `app_platforms`：应用平台表，存储应用发布平台信息
   - `regulatory_news`：监管新闻表，存储监管部门发布的新闻
   - `frontend_config`：前端配置表，控制模块显示和排序
   - `footer_settings`：页脚配置表，控制页脚内容
   - `profiles`：用户表，存储系统用户信息

2. **数据关联**：
   - 案例表关联监管部门表和应用平台表
   - 新闻表关联监管部门表
   - 所有表都支持创建时间和更新时间的跟踪

3. **查询优化**：
   - 使用Supabase的RPC函数进行复杂查询
   - 对频繁访问的数据进行缓存
   - 支持分页和过滤查询

4. **数据导入导出**：
   - 支持Excel格式的案例导入
   - 支持批量导入和去重处理
   - 支持智能导入，自动创建不存在的部门和平台