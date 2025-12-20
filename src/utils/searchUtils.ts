/**
 * 搜索工具函数
 * 提供关键词预处理、搜索建议等功能
 */

/**
 * 关键词预处理
 * 统一全角半角、移除多余空格、统一大小写
 */
export function preprocessKeyword(keyword: string): string {
  if (!keyword) return '';
  
  let processed = keyword.trim();
  
  // 1. 统一全角半角字符
  processed = processed.replace(/[\uff01-\uff5e]/g, (ch) => 
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  
  // 2. 移除多余空格
  processed = processed.replace(/\s+/g, ' ');
  
  // 3. 统一大小写（英文）
  processed = processed.toLowerCase();
  
  // 4. 移除特殊字符（保留中文、英文、数字、空格）
  processed = processed.replace(/[^\u4e00-\u9fa5a-z0-9\s]/gi, '');
  
  return processed;
}

/**
 * 生成搜索建议
 * 基于常见同义词映射
 */
export function generateSearchSuggestions(keyword: string): string[] {
  const suggestions: string[] = [];
  
  // 常见同义词映射
  const synonyms: Record<string, string[]> = {
    '应用': ['APP', '软件', '程序', '应用程序'],
    'APP': ['应用', '软件', '应用程序'],
    'app': ['应用', 'APP', '软件'],
    '微信': ['WeChat', '腾讯微信', 'wechat'],
    'wechat': ['微信', 'WeChat', '腾讯微信'],
    '隐私': ['个人信息', '用户数据', '私密信息'],
    '泄露': ['泄漏', '暴露', '披露', '外泄'],
    '收集': ['采集', '获取', '抓取'],
    '违规': ['违法', '不合规', '违反规定'],
    '安全': ['保护', '防护', '安全性'],
    '数据': ['信息', '资料'],
    '用户': ['使用者', '客户'],
    '强制': ['强迫', '必须', '要求'],
    '广告': ['推广', '营销', '宣传'],
    '权限': ['许可', '授权'],
  };
  
  const lowerKeyword = keyword.toLowerCase();
  
  // 添加同义词建议
  Object.entries(synonyms).forEach(([key, values]) => {
    if (lowerKeyword.includes(key.toLowerCase())) {
      values.forEach(value => {
        const suggestion = keyword.replace(new RegExp(key, 'gi'), value);
        if (suggestion !== keyword && !suggestions.includes(suggestion)) {
          suggestions.push(suggestion);
        }
      });
    }
  });
  
  return suggestions.slice(0, 5); // 最多返回5个建议
}

/**
 * 高亮关键词
 * 返回包含高亮标记的HTML字符串
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword.trim() || !text) return text;
  
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');
  
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}

/**
 * 延迟执行函数（防抖）
 * 用于搜索输入框，避免频繁触发搜索
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 检查是否为空搜索
 */
export function isEmptySearch(keyword: string): boolean {
  return !keyword || keyword.trim().length === 0;
}

/**
 * 格式化搜索结果数量
 */
export function formatSearchResultCount(count: number): string {
  if (count === 0) return '未找到结果';
  if (count === 1) return '找到 1 条结果';
  if (count < 1000) return `找到 ${count} 条结果`;
  if (count < 10000) return `找到 ${(count / 1000).toFixed(1)}k 条结果`;
  return `找到 ${(count / 10000).toFixed(1)}w 条结果`;
}
