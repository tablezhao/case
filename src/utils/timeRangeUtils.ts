export type TimeRangeType = 'recent6' | 'thisYear' | 'all';

export interface TimeRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * 计算时间范围
 * @param timeRange 时间范围类型
 * @returns 起始和结束日期
 */
export function calculateTimeRange(timeRange: TimeRangeType): TimeRange {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  let startDate: Date;
  let endDate = now;
  
  switch (timeRange) {
    case 'recent6':
      // 近6个月：从当前月份起往前推6个月，1号开始
      startDate = new Date(currentYear, currentMonth - 5, 1);
      // 重置时间为00:00:00，避免时区问题
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'thisYear':
      // 本年至今：从当前年份1月1日开始
      startDate = new Date(currentYear, 0, 1);
      // 重置时间为00:00:00，避免时区问题
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'all':
      // 全部数据：起始日期设为1970-01-01，确保包含所有数据
      startDate = new Date(1970, 0, 1);
      // 重置时间为00:00:00，避免时区问题
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  
  // 格式化日期，确保使用本地时间
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

/**
 * 格式化日期为YYYY-MM格式
 * @param date 日期对象
 * @returns 格式化后的月份字符串
 */
export function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
