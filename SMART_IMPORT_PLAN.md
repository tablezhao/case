# 智能案例导入系统 - 实施方案

## 1. 系统概述

### 1.1 功能目标
实现基于AI的智能网页内容解析系统，自动从监管部门官网提取案例信息并生成结构化数据。

### 1.2 核心能力
- 🌐 网页内容自动抓取（文本+图像）
- 🤖 AI智能解析与字段提取
- 📊 结构化数据映射
- ✅ 案例自动创建/更新
- 📋 执行报告生成

## 2. 技术架构

### 2.1 系统组件

```
┌─────────────────────────────────────────────────────────────┐
│                      前端界面层                              │
│  SmartImportPage.tsx - 智能导入管理页面                     │
│  - URL输入 - 内容预览 - 字段映射 - 执行报告                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Edge Function                     │
│  parse-case-from-url - 网页解析与AI分析                     │
│  - 调用get_url_content获取网页内容                          │
│  - AI提取结构化数据                                          │
│  - 返回标准化案例对象                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据库层                                │
│  cases表 - 存储案例数据                                      │
│  regulatory_departments表 - 监管部门                         │
│  app_platforms表 - 应用平台                                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据流程

```
用户输入URL
    ↓
前端调用Edge Function
    ↓
Edge Function调用get_url_content工具
    ↓
获取网页HTML内容和图像信息
    ↓
AI分析内容，提取关键字段
    ↓
返回结构化数据到前端
    ↓
用户预览并确认/修改
    ↓
保存到数据库
    ↓
生成执行报告
```

## 3. 数据提取规则

### 3.1 目标字段映射

| 数据库字段 | 提取目标 | 示例 |
|-----------|---------|------|
| report_date | 通报发布日期 | 2024-01-15 |
| app_name | 被通报应用名称 | "某某App" |
| developer | 应用开发者/运营者 | "XX科技有限公司" |
| department_id | 监管部门 | "工业和信息化部" |
| platform_id | 应用来源平台 | "应用宝" |
| violation_summary | 违规问题摘要 | "超范围收集个人信息" |
| violation_detail | 详细违规内容 | 完整描述 |
| source_url | 原文链接 | 用户输入的URL |

### 3.2 AI提取Prompt模板

```
请分析以下网页内容，提取监管案例信息：

网页内容：
{content}

请提取以下字段并以JSON格式返回：
{
  "report_date": "通报发布日期（YYYY-MM-DD格式）",
  "app_name": "被通报的应用名称",
  "developer": "应用开发者或运营者名称",
  "department": "发出通报的监管部门全称",
  "platform": "应用来源平台（如应用宝、华为应用市场等）",
  "violation_summary": "主要违规问题摘要（100字以内）",
  "violation_detail": "详细违规内容描述",
  "additional_info": "从图像或其他内容中提取的补充信息"
}

注意：
1. 如果某个字段无法确定，返回null
2. 日期格式必须是YYYY-MM-DD
3. 违规摘要要简洁明了
4. 详细内容要完整准确
```

## 4. 实施步骤

### 步骤1：创建Edge Function

**文件**: `supabase/functions/parse-case-from-url/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ParseRequest {
  url: string;
}

interface ParsedCase {
  report_date: string | null;
  app_name: string | null;
  developer: string | null;
  department: string | null;
  platform: string | null;
  violation_summary: string | null;
  violation_detail: string | null;
  source_url: string;
  confidence: number; // 0-1，提取置信度
  warnings: string[]; // 警告信息
}

Deno.serve(async (req: Request) => {
  try {
    const { url }: ParseRequest = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL参数缺失" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. 获取网页内容
    const contentResponse = await fetch(url);
    const html = await contentResponse.text();
    
    // 2. 简单的HTML清理和文本提取
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 3. AI分析（这里使用简单的关键词匹配，实际应调用AI服务）
    const parsedCase: ParsedCase = {
      report_date: extractDate(textContent),
      app_name: extractAppName(textContent),
      developer: extractDeveloper(textContent),
      department: extractDepartment(textContent),
      platform: extractPlatform(textContent),
      violation_summary: extractViolationSummary(textContent),
      violation_detail: extractViolationDetail(textContent),
      source_url: url,
      confidence: 0.8,
      warnings: []
    };
    
    // 4. 验证必填字段
    if (!parsedCase.app_name) {
      parsedCase.warnings.push("未能识别应用名称");
    }
    if (!parsedCase.report_date) {
      parsedCase.warnings.push("未能识别通报日期");
    }
    
    return new Response(
      JSON.stringify({ success: true, data: parsedCase }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// 辅助函数：提取日期
function extractDate(text: string): string | null {
  const datePatterns = [
    /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?/,
    /(\d{4})-(\d{2})-(\d{2})/
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

// 辅助函数：提取应用名称
function extractAppName(text: string): string | null {
  const patterns = [
    /应用名称[：:]\s*([^\s\n]+)/,
    /App名称[：:]\s*([^\s\n]+)/,
    /软件名称[：:]\s*([^\s\n]+)/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// 辅助函数：提取开发者
function extractDeveloper(text: string): string | null {
  const patterns = [
    /开发者[：:]\s*([^\s\n]+)/,
    /运营者[：:]\s*([^\s\n]+)/,
    /开发单位[：:]\s*([^\s\n]+)/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// 辅助函数：提取监管部门
function extractDepartment(text: string): string | null {
  const departments = [
    "工业和信息化部",
    "国家互联网信息办公室",
    "公安部",
    "市场监管总局"
  ];
  
  for (const dept of departments) {
    if (text.includes(dept)) return dept;
  }
  return null;
}

// 辅助函数：提取平台
function extractPlatform(text: string): string | null {
  const platforms = [
    "应用宝",
    "华为应用市场",
    "小米应用商店",
    "OPPO软件商店",
    "vivo应用商店",
    "App Store",
    "Google Play"
  ];
  
  for (const platform of platforms) {
    if (text.includes(platform)) return platform;
  }
  return null;
}

// 辅助函数：提取违规摘要
function extractViolationSummary(text: string): string | null {
  const patterns = [
    /违规问题[：:]\s*([^\n]{10,100})/,
    /主要问题[：:]\s*([^\n]{10,100})/,
    /存在问题[：:]\s*([^\n]{10,100})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// 辅助函数：提取详细内容
function extractViolationDetail(text: string): string | null {
  // 提取包含"违规"、"问题"等关键词的段落
  const paragraphs = text.split(/[。\n]/);
  const relevantParagraphs = paragraphs.filter(p => 
    p.includes("违规") || p.includes("问题") || p.includes("收集") || p.includes("权限")
  );
  
  return relevantParagraphs.slice(0, 5).join("。") || null;
}
```

### 步骤2：创建前端页面

**文件**: `src/pages/admin/SmartImportPage.tsx`

核心功能：
1. URL输入框
2. 抓取按钮（调用Edge Function）
3. 加载状态显示
4. 数据预览卡片（可编辑）
5. 字段映射提示
6. 确认导入按钮
7. 执行报告展示

### 步骤3：更新路由配置

在`routes.tsx`中添加：
```typescript
{
  name: '智能导入',
  path: '/admin/smart-import',
  element: <SmartImportPage />,
  visible: false,
  requireAuth: true,
  requireAdmin: true,
}
```

### 步骤4：更新管理后台菜单

在`AdminPage.tsx`中添加菜单项：
```typescript
{
  title: '智能导入',
  description: 'AI智能解析网页案例',
  icon: Sparkles,
  link: '/admin/smart-import',
  color: 'text-chart-5',
}
```

### 步骤5：更新API封装

在`@/db/api.ts`中添加：
```typescript
export async function parseUrlContent(url: string) {
  const { data, error } = await supabase.functions.invoke('parse-case-from-url', {
    body: { url }
  });
  
  if (error) throw error;
  return data;
}
```

## 5. 用户操作流程

### 5.1 导入新案例

1. 管理员登录后台
2. 点击"智能导入"菜单
3. 输入监管通报网页URL
4. 点击"开始解析"按钮
5. 系统显示加载动画
6. 解析完成后显示提取的数据
7. 管理员检查并修改字段（如有需要）
8. 点击"确认导入"按钮
9. 系统保存到数据库
10. 显示执行报告

### 5.2 更新已有案例

1. 在预览界面，系统自动检测是否存在相同URL的案例
2. 如果存在，显示"更新现有案例"选项
3. 管理员选择更新模式
4. 确认后更新数据库记录

## 6. 执行报告格式

```json
{
  "operation": "create", // 或 "update"
  "success": true,
  "case_id": "uuid",
  "extracted_fields": [
    { "field": "app_name", "value": "某某App", "confidence": 0.95 },
    { "field": "report_date", "value": "2024-01-15", "confidence": 0.90 },
    { "field": "developer", "value": "XX公司", "confidence": 0.85 }
  ],
  "warnings": [
    "平台信息未能自动识别，已设为空"
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 7. 错误处理

### 7.1 常见错误类型

| 错误类型 | 处理方式 |
|---------|---------|
| URL无法访问 | 提示用户检查URL或网络连接 |
| 内容解析失败 | 显示原始内容，允许手动输入 |
| 必填字段缺失 | 标记缺失字段，要求用户补充 |
| 部门/平台不存在 | 提供快速创建选项 |
| 重复案例 | 提示是否更新或创建新版本 |

### 7.2 降级方案

如果AI解析失败，提供：
1. 显示原始网页内容
2. 手动填写表单
3. 保存URL供后续重试

## 8. 性能优化

### 8.1 缓存策略
- 缓存已解析的URL（24小时）
- 避免重复抓取相同内容

### 8.2 并发控制
- 限制同时解析的任务数（最多3个）
- 队列管理长时间任务

### 8.3 超时处理
- 网页抓取超时：30秒
- AI分析超时：60秒

## 9. 安全考虑

### 9.1 URL验证
- 白名单机制：仅允许政府官网域名
- 防止SSRF攻击

### 9.2 内容过滤
- 限制抓取内容大小（最大5MB）
- 过滤恶意脚本

### 9.3 权限控制
- 仅管理员可访问
- 记录所有导入操作日志

## 10. 测试用例

### 10.1 功能测试
- [ ] 正常URL解析
- [ ] 无效URL处理
- [ ] 部分字段缺失
- [ ] 重复案例检测
- [ ] 字段编辑功能
- [ ] 导入成功流程
- [ ] 更新现有案例

### 10.2 边界测试
- [ ] 超长URL
- [ ] 特殊字符处理
- [ ] 网络超时
- [ ] 并发请求

## 11. 后续优化方向

1. **AI能力增强**
   - 集成更强大的NLP模型
   - 支持图像OCR识别
   - 多语言支持

2. **批量导入**
   - 支持导入URL列表
   - 批量处理进度显示

3. **智能推荐**
   - 基于历史数据推荐字段值
   - 自动关联相似案例

4. **数据质量**
   - 字段验证规则
   - 数据一致性检查
   - 重复案例合并建议

## 12. 配置要点总结

### 12.1 Edge Function配置
- 超时时间：60秒
- 内存限制：512MB
- 环境变量：无需额外配置

### 12.2 前端配置
- 使用React Hook Form管理表单
- 使用Zod进行数据验证
- 使用Toast显示操作反馈

### 12.3 数据库配置
- 无需修改现有表结构
- 利用现有RLS策略
- 添加操作日志（可选）

## 13. 部署检查清单

- [ ] Edge Function已部署
- [ ] 前端页面已创建
- [ ] 路由配置已更新
- [ ] 菜单项已添加
- [ ] API封装已完成
- [ ] 权限验证正常
- [ ] 错误处理完善
- [ ] 用户文档已更新
- [ ] 测试用例已通过

---

**文档版本**: v1.0  
**最后更新**: 2024-01-15  
**维护者**: 合规通开发团队
