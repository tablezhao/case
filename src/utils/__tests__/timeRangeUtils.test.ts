import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateTimeRange, formatMonth } from '../timeRangeUtils';

describe('calculateTimeRange', () => {
  // 模拟当前时间为2025年12月15日
  const mockNow = new Date(2025, 11, 15);
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should return correct range for recent6 months in December', () => {
    const { startDate, endDate } = calculateTimeRange('recent6');
    expect(startDate).toBe('2025-07-01');
    expect(endDate).toBe('2025-12-15');
  });
  
  it('should return correct range for thisYear in December', () => {
    const { startDate, endDate } = calculateTimeRange('thisYear');
    expect(startDate).toBe('2025-01-01');
    expect(endDate).toBe('2025-12-15');
  });
  
  it('should return correct range for all time', () => {
    const { startDate, endDate } = calculateTimeRange('all');
    expect(startDate).toBe('1970-01-01');
    expect(endDate).toBe('2025-12-15');
  });
  
  // 测试年初情况
  it('should return correct range for recent6 months in January', () => {
    // 模拟当前时间为2025年1月15日
    const mockJanuary = new Date(2025, 0, 15);
    vi.setSystemTime(mockJanuary);
    
    const { startDate, endDate } = calculateTimeRange('recent6');
    expect(startDate).toBe('2024-08-01');
    expect(endDate).toBe('2025-01-15');
  });
  
  // 测试年末年初跨年度情况
  it('should return correct range for recent6 months in January across years', () => {
    // 模拟当前时间为2026年1月15日
    const mockJanuary2026 = new Date(2026, 0, 15);
    vi.setSystemTime(mockJanuary2026);
    
    const { startDate, endDate } = calculateTimeRange('recent6');
    expect(startDate).toBe('2025-08-01');
    expect(endDate).toBe('2026-01-15');
  });
  
  // 测试本年至今在年初的情况
  it('should return correct range for thisYear in January', () => {
    // 模拟当前时间为2025年1月15日
    const mockJanuary = new Date(2025, 0, 15);
    vi.setSystemTime(mockJanuary);
    
    const { startDate, endDate } = calculateTimeRange('thisYear');
    expect(startDate).toBe('2025-01-01');
    expect(endDate).toBe('2025-01-15');
  });
});

describe('formatMonth', () => {
  it('should format date correctly for middle month', () => {
    const date = new Date(2025, 6, 15); // 2025年7月15日
    expect(formatMonth(date)).toBe('2025-07');
  });
  
  it('should format January correctly', () => {
    const date = new Date(2025, 0, 15); // 2025年1月15日
    expect(formatMonth(date)).toBe('2025-01');
  });
  
  it('should format December correctly', () => {
    const date = new Date(2025, 11, 15); // 2025年12月15日
    expect(formatMonth(date)).toBe('2025-12');
  });
  
  it('should format February correctly', () => {
    const date = new Date(2025, 1, 15); // 2025年2月15日
    expect(formatMonth(date)).toBe('2025-02');
  });
});
