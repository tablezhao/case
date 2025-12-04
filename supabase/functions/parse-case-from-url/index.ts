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
  confidence: number;
  warnings: string[];
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

    // 验证URL格式
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "URL格式无效" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 安全检查：仅允许HTTP/HTTPS协议
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(
        JSON.stringify({ error: "仅支持HTTP/HTTPS协议" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 获取网页内容
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    let html: string;
    try {
      const contentResponse = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ComplianceBot/1.0)',
        },
      });
      
      if (!contentResponse.ok) {
        throw new Error(`HTTP ${contentResponse.status}: ${contentResponse.statusText}`);
      }
      
      html = await contentResponse.text();
      clearTimeout(timeoutId);
      
      // 限制内容大小（5MB）
      if (html.length > 5 * 1024 * 1024) {
        throw new Error("网页内容过大（超过5MB）");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: "请求超时（30秒）" }),
          { status: 408, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `无法获取网页内容: ${error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 清理HTML并提取文本
    const textContent = html
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
      source_url: url,
      confidence,
      warnings
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
