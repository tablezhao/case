import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ParseRequest {
  type: 'url' | 'text' | 'image' | 'pdf';
  content: string; // URL、文本内容、或文件URL
}

interface ParsedCase {
  report_date: string | null;
  app_name: string | null;
  developer: string | null;
  department: string | null;
  platform: string | null;
  violation_summary: string | null;
  violation_detail: string | null;
  source_url: string | null;
  confidence: number;
  warnings: string[];
  input_type: string;
}

Deno.serve(async (req: Request) => {
  try {
    const { type, content }: ParseRequest = await req.json();
    
    if (!type || !content) {
      return new Response(
        JSON.stringify({ error: "参数缺失：需要type和content" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!['url', 'text', 'image', 'pdf'].includes(type)) {
      return new Response(
        JSON.stringify({ error: "无效的type参数，必须是url、text、image或pdf" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    
    // 根据输入类型处理内容
    let textContent: string;
    let sourceUrl: string | null = null;
    
    switch (type) {
      case 'url':
        // URL输入：抓取网页内容
        const urlResult = await processUrl(content);
        textContent = urlResult.text;
        sourceUrl = content;
        break;
        
      case 'text':
        // 文本输入：直接使用
        textContent = processText(content);
        break;
        
      case 'image':
        // 图片输入：提示用户（简化版）
        textContent = processImage(content);
        break;
        
      case 'pdf':
        // PDF输入：提示用户（简化版）
        textContent = processPdf(content);
        break;
        
      default:
        throw new Error("不支持的输入类型");
    }
    
    // 提取结构化数据
    const warnings: string[] = [];
    
    const report_date = extractDate(textContent);
    if (!report_date) warnings.push("未能识别通报日期");
    
    const app_name = extractAppName(textContent);
    if (!app_name) warnings.push("未能识别应用名称");
    
    const developer = extractDeveloper(textContent);
    if (!developer) warnings.push("未能识别开发者信息");
    
    const department = extractDepartment(textContent);
    if (!department) warnings.push("未能识别监管部门");
    
    const platform = extractPlatform(textContent);
    if (!platform) warnings.push("未能识别应用平台");
    
    const violation_summary = extractViolationSummary(textContent);
    if (!violation_summary) warnings.push("未能识别违规摘要");
    
    const violation_detail = extractViolationDetail(textContent);
    if (!violation_detail) warnings.push("未能提取详细内容");
    
    // 计算置信度
    const extractedFields = [
      report_date, app_name, developer, department, 
      platform, violation_summary, violation_detail
    ].filter(Boolean).length;
    const confidence = extractedFields / 7;
    
    const parsedCase: ParsedCase = {
      report_date,
      app_name,
      developer,
      department,
      platform,
      violation_summary,
      violation_detail,
      source_url: sourceUrl,
      confidence,
      warnings,
      input_type: type
    };
    
    return new Response(
      JSON.stringify({ success: true, data: parsedCase }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("解析错误:", error);
    return new Response(
      JSON.stringify({ error: `系统错误: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// 处理URL输入
async function processUrl(url: string): Promise<{ text: string }> {
  // 验证URL格式
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("URL格式无效");
  }

  // 安全检查：仅允许HTTP/HTTPS协议
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error("仅支持HTTP/HTTPS协议");
  }

  // 获取网页内容
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ComplianceBot/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    clearTimeout(timeoutId);
    
    // 限制内容大小（5MB）
    if (html.length > 5 * 1024 * 1024) {
      throw new Error("网页内容过大（超过5MB）");
    }
    
    // 清理HTML并提取文本
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
    
    return { text };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("请求超时（30秒）");
    }
    throw error;
  }
}

// 处理文本输入
function processText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

// 处理图片输入（简化版）
function processImage(imageUrl: string): string {
  // 简化实现：返回提示信息
  // 完整实现需要集成OCR服务
  return `[图片内容] 系统检测到您上传了图片。当前版本暂不支持自动识别图片内容，请根据图片手动填写案例信息。图片URL: ${imageUrl}`;
}

// 处理PDF输入（简化版）
function processPdf(pdfUrl: string): string {
  // 简化实现：返回提示信息
  // 完整实现需要集成PDF解析库
  return `[PDF文档] 系统检测到您上传了PDF文档。当前版本暂不支持自动解析PDF内容，请根据文档手动填写案例信息。PDF URL: ${pdfUrl}`;
}

// 提取日期
function extractDate(text: string): string | null {
  const datePatterns = [
    /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /发布时间[：:]\s*(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/,
    /通报时间[：:]\s*(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/
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

// 提取应用名称
function extractAppName(text: string): string | null {
  const patterns = [
    /应用名称[：:]\s*[《"]?([^》"\s\n]{2,30})[》"]?/,
    /App名称[：:]\s*[《"]?([^》"\s\n]{2,30})[》"]?/,
    /软件名称[：:]\s*[《"]?([^》"\s\n]{2,30})[》"]?/,
    /[《"]([^》"]{2,20}App)[》"]/,
    /[《"]([^》"]{2,20})[》"].*?存在.*?问题/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// 提取开发者
function extractDeveloper(text: string): string | null {
  const patterns = [
    /开发者[：:]\s*([^\s\n]{2,50})/,
    /运营者[：:]\s*([^\s\n]{2,50})/,
    /开发单位[：:]\s*([^\s\n]{2,50})/,
    /开发商[：:]\s*([^\s\n]{2,50})/,
    /([^\s]{2,30}(?:公司|企业|工作室|团队))/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// 提取监管部门
function extractDepartment(text: string): string | null {
  const departments = [
    "工业和信息化部",
    "国家互联网信息办公室",
    "公安部",
    "市场监管总局",
    "国家市场监督管理总局",
    "中央网信办",
    "工信部",
    "网信办"
  ];
  
  for (const dept of departments) {
    if (text.includes(dept)) {
      // 返回全称
      if (dept === "工信部") return "工业和信息化部";
      if (dept === "网信办" || dept === "中央网信办") return "国家互联网信息办公室";
      return dept;
    }
  }
  
  // 尝试匹配省级部门
  const provinceMatch = text.match(/([^\s]{2,10}(?:省|市)).*?(?:通信管理局|网信办|市场监管局)/);
  if (provinceMatch) return provinceMatch[0];
  
  return null;
}

// 提取平台
function extractPlatform(text: string): string | null {
  const platforms = [
    "应用宝",
    "华为应用市场",
    "小米应用商店",
    "OPPO软件商店",
    "vivo应用商店",
    "魅族应用商店",
    "三星应用商店",
    "App Store",
    "Google Play",
    "百度手机助手",
    "360手机助手",
    "豌豆荚"
  ];
  
  for (const platform of platforms) {
    if (text.includes(platform)) return platform;
  }
  return null;
}

// 提取违规摘要
function extractViolationSummary(text: string): string | null {
  const patterns = [
    /违规问题[：:]\s*([^\n。]{10,150})/,
    /主要问题[：:]\s*([^\n。]{10,150})/,
    /存在问题[：:]\s*([^\n。]{10,150})/,
    /存在([^\n。]{10,100}(?:违规|问题|行为))/,
    /((?:超范围|违规|未经|强制).*?(?:收集|获取|使用|权限).*?(?:信息|数据)[^\n。]{0,50})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let summary = match[1].trim();
      // 限制长度
      if (summary.length > 150) {
        summary = summary.substring(0, 147) + '...';
      }
      return summary;
    }
  }
  return null;
}

// 提取详细内容
function extractViolationDetail(text: string): string | null {
  // 查找包含关键词的段落
  const keywords = ['违规', '问题', '收集', '权限', '个人信息', '隐私', '整改', '下架'];
  const sentences = text.split(/[。！？\n]/);
  
  const relevantSentences = sentences.filter(s => {
    const hasKeyword = keywords.some(kw => s.includes(kw));
    return hasKeyword && s.length > 20 && s.length < 500;
  });
  
  if (relevantSentences.length === 0) return null;
  
  // 取前5个相关句子
  let detail = relevantSentences.slice(0, 5).join('。');
  
  // 限制总长度
  if (detail.length > 1000) {
    detail = detail.substring(0, 997) + '...';
  }
  
  return detail || null;
}
