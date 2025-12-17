# 个人开发规则

## 1. 对话与交流规则
- 保持对话语言为中文
- 系统为Windows，所有命令和路径使用Windows格式
- 回复简洁明了，避免冗余信息
- 遇到问题时主动提供解决方案和建议
- 对复杂问题提供详细的分析和解释

## 2. 代码生成规则
- 生成代码时必须添加函数级注释，说明函数功能、参数和返回值
- 代码必须符合TypeScript语法规范，使用严格模式
- 组件必须包含类型定义和Props接口
- API函数必须处理错误并返回明确的错误信息
- 生成的代码必须通过TypeScript编译检查

## 3. 开发习惯
- 使用React函数组件和Hooks，禁止使用类组件
- 样式优先使用Tailwind CSS，复杂样式可使用CSS Modules
- 组件设计遵循单一职责原则，避免大型组件
- 代码结构清晰，按功能模块划分
- 优先使用现有组件和工具函数，避免重复造轮子
- 代码中添加必要的注释，解释复杂逻辑和业务规则

## 4. 项目特定规则
- 所有API请求必须通过封装的API函数，禁止直接调用Supabase客户端
- 组件命名使用PascalCase，如`PieChart.tsx`
- 函数和变量使用camelCase，如`getDepartmentDistribution`
- 常量使用UPPER_SNAKE_CASE，如`CACHE_DURATION`
- 测试文件与被测试文件放在同一目录，命名为`*.test.tsx`
- 核心功能必须编写单元测试，覆盖率不低于80%

## 5. 性能与安全
- 组件必须使用`React.memo`或`useMemo`优化渲染性能
- 列表渲染必须使用唯一的`key`属性
- 禁止在前端代码中存储敏感信息
- 输入数据必须进行验证，使用Zod或Joi
- 避免不必要的重新渲染，使用`useCallback`缓存回调函数

## 6. 工具与命令
- 使用PowerShell作为命令行工具，禁止使用Bash命令
- 项目构建使用`npm run build`或`pnpm build`
- 开发服务器使用`npm run dev`或`pnpm dev`
- 代码检查使用`npm run lint`或`pnpm lint`
- 测试运行使用`npm run test`或`pnpm test`

## 7. 文件与路径
- 文件路径使用绝对路径，如`c:\Users\tonyz\Documents\cases-deploy-dev\src\components\PieChart.tsx`
- 导入路径使用相对路径，如`../components/PieChart`
- 禁止使用`../../`等多级相对路径，优先使用绝对导入
- 文件名必须使用英文，禁止使用中文

以上规则适用于所有开发任务，请严格遵循。