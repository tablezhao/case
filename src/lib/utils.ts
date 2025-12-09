import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Params = Partial<
  Record<keyof URLSearchParams, string | number | null | undefined>
>;

export function createQueryString(
  params: Params,
  searchParams: URLSearchParams
) {
  const newSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      newSearchParams.delete(key);
    } else {
      newSearchParams.set(key, String(value));
    }
  }

  return newSearchParams.toString();
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

/**
 * 解析Excel中的日期格式，转换为 YYYY-MM-DD 格式
 * 支持多种日期格式：
 * - Excel序列号（如 44927）
 * - ISO格式（如 "2024-01-01"）
 * - 斜杠格式（如 "2024/01/01"）
 * - 中文格式（如 "2024年1月1日"）
 */
export function parseExcelDate(value: any): string | null {
  if (!value) return null;

  try {
    let date: Date;

    // 如果是数字，可能是Excel序列号
    if (typeof value === 'number') {
      // Excel日期从1900年1月1日开始计算（但Excel错误地认为1900年是闰年）
      // 所以需要减去1（因为Excel从1开始计数）
      const excelEpoch = new Date(1900, 0, 1);
      const days = value - 2; // 减2是因为Excel的bug（1900年2月29日不存在）
      date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    }
    // 如果是字符串
    else if (typeof value === 'string') {
      // 移除中文字符
      let cleanValue = value.replace(/[年月日]/g, '-').replace(/\s+/g, '');
      // 移除末尾的连字符
      cleanValue = cleanValue.replace(/-+$/, '');
      // 替换斜杠为连字符
      cleanValue = cleanValue.replace(/\//g, '-');
      
      // 尝试解析
      date = new Date(cleanValue);
      
      // 如果解析失败，尝试其他格式
      if (isNaN(date.getTime())) {
        // 尝试 MM/DD/YYYY 格式
        const parts = value.split(/[\/\-]/);
        if (parts.length === 3) {
          // 假设是 YYYY-MM-DD 或 MM/DD/YYYY
          const [first, second, third] = parts.map(p => parseInt(p, 10));
          
          if (first > 1000) {
            // YYYY-MM-DD
            date = new Date(first, second - 1, third);
          } else {
            // MM/DD/YYYY
            date = new Date(third, first - 1, second);
          }
        }
      }
    }
    // 如果已经是Date对象
    else if (value instanceof Date) {
      date = value;
    }
    else {
      return null;
    }

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的日期值:', value);
      return null;
    }

    // 格式化为 YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('日期解析失败:', value, error);
    return null;
  }
}
