# Genius Rules
1. **绝对的美学 (Aesthetic Obsession)**
   这是一个造梦的产品，**美即是正义**。必须追求视觉的极致优雅与细腻，善用高级的留白、Glassmorphism (毛玻璃) 和丝滑的微动效。任何平庸、粗糙或“工程师审美”的 UI 都是对用户的犯罪，绝对不可接受。

2. **极简主义 (Radical Simplicity)**
   **如无必要，勿增实体**。像乔布斯一样做减法，砍掉所有干扰情感流动的多余元素。让界面隐形，让核心内容（角色、对话、情感）成为绝对的焦点。不要让用户思考，让体验直觉化。

3. **情感化微交互 (Emotional Micro-interactions)**
   不要做冰冷的点击，要做**有温度的触碰**。每一个弹窗的浮现、每一个按钮的起伏、每一段文字的展示，都要经过精心编排（Choreography）。交互要有物理质感和呼吸感，传递出精致的高级感。

4. **极致性能 (Performance is Magic)**
   **卡顿会打破梦境**。在受限的环境下，必须锱铢必较地优化渲染性能。严控 `setData` 频率，精简节点。任何掉帧都会瞬间破坏沉浸感，必须像洁癖一样消除性能瓶颈。

5. **第一性原理 (First Principles Thinking)**

# 项目开发规则

## 1. 框架版本及依赖规范
- 使用React 18 + TypeScript作为核心技术栈，禁止降级使用旧版本
- 构建工具使用Vite，禁止使用Webpack或Create React App
- 样式必须使用Tailwind CSS，禁止引入其他CSS框架
- UI组件必须使用Shadcn UI，禁止使用Ant Design、Material UI等外部组件库
- 图表必须使用ECharts及其React封装(echarts-for-react)
- 数据库操作必须通过Supabase JS Client，禁止直接使用SQL语句
- 路由管理使用React Router v6，禁止使用其他路由库
- 状态管理优先使用React Context API，复杂场景可考虑Zustand

## 2. 代码结构与命名规范
- 组件文件使用PascalCase命名，如`PieChart.tsx`
- 函数和变量使用camelCase命名，如`getNationalDepartmentDistribution`
- 常量使用UPPER_SNAKE_CASE命名，如`CACHE_DURATION`
- 页面组件放在`src/pages`目录，通用组件放在`src/components`目录
- API函数统一放在`src/db`目录，按功能模块划分
- 自定义hooks放在`src/hooks`目录，使用`use`前缀
- 类型定义放在`src/types`目录，使用TypeScript接口定义

## 3. 测试框架与要求
- 测试框架使用Vitest，禁止使用Jest
- 组件测试使用@testing-library/react
- 测试文件与被测试文件放在同一目录，命名格式为`*.test.tsx`或`*.spec.tsx`
- 核心功能必须编写单元测试，覆盖率不低于80%
- 测试数据使用Mock或Supabase测试数据库，禁止使用生产数据
- 集成测试必须在CI/CD流程中自动运行

## 4. API使用规范
- 所有API请求必须通过封装的API函数，禁止在组件中直接调用Supabase客户端
- API函数必须处理错误，返回明确的错误信息
- 频繁访问的数据必须使用缓存，缓存默认时长为5分钟
- 数据更新操作必须清除相关缓存，确保数据实时性
- 批量数据处理必须使用Promise.all，禁止串行请求
- 分页请求必须实现`page`和`pageSize`参数

## 5. 性能优化规范
- 组件必须使用`React.memo`或`useMemo`优化渲染性能
- 列表渲染必须使用唯一的`key`属性
- 大数据渲染必须实现虚拟滚动
- 图片必须使用懒加载，设置适当的尺寸
- 避免不必要的重新渲染，使用`useCallback`缓存回调函数
- 合理使用`useEffect`，避免无限循环

## 6. 安全性规范
- 禁止在前端代码中存储敏感信息，如API密钥、数据库密码
- 用户认证必须通过Supabase Auth，禁止自定义认证逻辑
- 权限控制必须在后端实现，前端只做展示控制
- 输入数据必须进行验证，使用Zod或Joi进行 schema 验证
- 禁止直接拼接SQL语句，必须使用参数化查询
- 文件上传必须限制大小和类型

## 7. 禁止使用的API和库
- 禁止使用`document.querySelector`和`document.getElementById`等原生DOM操作，必须使用React ref
- 禁止使用`setTimeout`和`setInterval`，必须使用`useEffect`管理
- 禁止使用`localStorage`存储敏感数据，必须使用Supabase Auth
- 禁止使用jQuery或其他旧版库
- 禁止使用`eval`或`Function`构造函数
- 禁止使用`any`类型，必须明确类型定义

## 8. 代码质量规范
- 代码必须通过TypeScript编译检查，无类型错误
- 代码必须通过ESLint检查，符合Biome配置
- 禁止使用未使用的导入和变量
- 函数长度不超过100行，组件不超过200行
- 代码必须添加必要的注释，解释复杂逻辑
- 提交代码前必须运行`npm run lint`和`npm run test`

## 9. 部署与CI/CD规范
- 部署必须使用Vercel，禁止使用其他部署平台
- 代码必须通过GitHub Actions自动构建和测试
- 主分支禁止直接推送，必须通过Pull Request
- 每次提交必须包含清晰的提交信息，使用Conventional Commits规范
- 版本号必须使用Semantic Versioning规范

以上规则适用于所有项目开发人员和AI助手，违反规则的代码将被拒绝合并。