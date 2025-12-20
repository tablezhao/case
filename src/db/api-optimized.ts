/**
 * 优化版API - 使用后端RPC函数和缓存机制
 * 用于提升首页加载性能
 */

import { supabase } from './supabase';
import type { StatsOverview } from '@/types/types';

// ============ 缓存配置 ============
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  clearKey(key: string): void {
    this.cache.delete(key);
  }
}

const cacheManager = new CacheManager();

// ============ 优化版统计API ============

/**
 * 获取首页核心统计数据（优化版）
 * 使用后端RPC函数和缓存机制
 */
export async function getStatsOverviewOptimized(): Promise<StatsOverview> {
  const cacheKey = 'homepage_stats';
  
  // 尝试从缓存获取
  const cached = cacheManager.get<StatsOverview>(cacheKey);
  if (cached) {
    return cached;
  }

  // 调用后端RPC函数
  const { data, error } = await supabase.rpc('get_homepage_stats');

  if (error) throw error;

  // 计算环比数据
  const stats: StatsOverview = {
    total_cases: data.total_cases || 0,
    total_apps: data.total_apps || 0,
    latest_report_date: data.latest_report_date || null,
    latest_department: data.latest_department || null,
    
    // 本月数据
    current_month_cases: data.current_month_cases || 0,
    current_month_apps: data.current_month_apps || 0,
    
    // 本季度数据
    current_quarter_cases: data.current_quarter_cases || 0,
    current_quarter_apps: data.current_quarter_apps || 0,
    
    // 本年度数据
    current_year_cases: data.current_year_cases || 0,
    current_year_apps: data.current_year_apps || 0,
    
    // 月度环比
    cases_change: (data.current_month_cases || 0) - (data.last_month_cases || 0),
    cases_change_percent: data.last_month_cases === 0 ? 0 : 
      (((data.current_month_cases || 0) - (data.last_month_cases || 0)) / data.last_month_cases) * 100,
    apps_change: (data.current_month_apps || 0) - (data.last_month_apps || 0),
    apps_change_percent: data.last_month_apps === 0 ? 0 :
      (((data.current_month_apps || 0) - (data.last_month_apps || 0)) / data.last_month_apps) * 100,
    
    // 季度环比
    quarter_cases_change: (data.current_quarter_cases || 0) - (data.last_quarter_cases || 0),
    quarter_cases_change_percent: data.last_quarter_cases === 0 ? 0 :
      (((data.current_quarter_cases || 0) - (data.last_quarter_cases || 0)) / data.last_quarter_cases) * 100,
    quarter_apps_change: (data.current_quarter_apps || 0) - (data.last_quarter_apps || 0),
    quarter_apps_change_percent: data.last_quarter_apps === 0 ? 0 :
      (((data.current_quarter_apps || 0) - (data.last_quarter_apps || 0)) / data.last_quarter_apps) * 100,
    
    // 年度环比
    year_cases_change: (data.current_year_cases || 0) - (data.last_year_cases || 0),
    year_cases_change_percent: data.last_year_cases === 0 ? 0 :
      (((data.current_year_cases || 0) - (data.last_year_cases || 0)) / data.last_year_cases) * 100,
    year_apps_change: (data.current_year_apps || 0) - (data.last_year_apps || 0),
    year_apps_change_percent: data.last_year_apps === 0 ? 0 :
      (((data.current_year_apps || 0) - (data.last_year_apps || 0)) / data.last_year_apps) * 100,
  };

  // 存入缓存
  cacheManager.set(cacheKey, stats);

  return stats;
}

/**
 * 获取年度趋势数据（优化版）
 */
export async function getYearlyTrendOptimized() {
  const cacheKey = 'yearly_trend';
  
  const cached = cacheManager.get<any[]>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('get_yearly_trend_stats');

  if (error) throw error;

  const result = Array.isArray(data) ? data : [];
  cacheManager.set(cacheKey, result);

  return result;
}

/**
 * 获取月度趋势数据（优化版）
 */
export async function getMonthlyTrendOptimized() {
  const cacheKey = 'monthly_trend';
  
  const cached = cacheManager.get<any[]>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('get_monthly_trend_stats');

  if (error) throw error;

  const result = Array.isArray(data) ? data : [];
  cacheManager.set(cacheKey, result);

  return result;
}

/**
 * 获取监管部门分布数据（优化版）
 */
export async function getDepartmentDistributionOptimized() {
  const cacheKey = 'department_distribution';
  
  const cached = cacheManager.get<any>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('get_department_distribution_stats');

  if (error) throw error;

  const result = {
    national: Array.isArray(data?.national) 
      ? data.national.map((item: { name: string; value?: number | null }) => ({ name: item.name, count: item.value || 0 })) 
      : [],
    provincial: Array.isArray(data?.provincial) 
      ? data.provincial.map((item: { name: string; value?: number | null }) => ({ name: item.name, count: item.value || 0 })) 
      : [],
  };

  cacheManager.set(cacheKey, result);

  return result;
}

/**
 * 获取应用平台分布数据（优化版）
 */
export async function getPlatformDistributionOptimized() {
  const cacheKey = 'platform_distribution';
  
  const cached = cacheManager.get<any[]>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('get_platform_distribution_stats');

  if (error) throw error;

  const result = Array.isArray(data) ? data : [];
  cacheManager.set(cacheKey, result);

  return result;
}

/**
 * 获取地域分布数据（优化版）
 */
export async function getGeographicDistributionOptimized() {
  const cacheKey = 'geographic_distribution';
  
  const cached = cacheManager.get<any[]>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('get_geographic_distribution_stats');

  if (error) throw error;

  const result = Array.isArray(data) ? data : [];
  cacheManager.set(cacheKey, result);

  return result;
}

/**
 * 批量获取所有图表数据（优化版）
 * 一次性获取所有需要的数据，减少请求次数
 */
export async function getAllChartsDataOptimized() {
  const cacheKey = 'all_charts_data';
  
  const cached = cacheManager.get<any>(cacheKey);
  if (cached) return cached;

  // 并行请求所有数据
  const [
    yearlyTrend,
    monthlyTrend,
    departmentDist,
    platformDist,
    geographicDist,
  ] = await Promise.all([
    getYearlyTrendOptimized(),
    getMonthlyTrendOptimized(),
    getDepartmentDistributionOptimized(),
    getPlatformDistributionOptimized(),
    getGeographicDistributionOptimized(),
  ]);

  const result = {
    yearlyTrend,
    monthlyTrend,
    departmentDist,
    platformDist,
    geographicDist,
  };

  cacheManager.set(cacheKey, result);

  return result;
}

/**
 * 清除所有缓存
 * 在数据更新后调用
 */
export function clearAllCache() {
  cacheManager.clear();
}

/**
 * 清除特定缓存
 */
export function clearCache(key: string) {
  cacheManager.clearKey(key);
}

// 导出缓存管理器供外部使用
export { cacheManager };
