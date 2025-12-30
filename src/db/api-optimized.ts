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
    console.log('[getStatsOverviewOptimized] 使用缓存数据');
    return cached;
  }

  console.log('[getStatsOverviewOptimized] 调用 RPC: get_dashboard_stats');
  // 调用后端RPC函数 (get_dashboard_stats)
  // 该函数直接返回符合 StatsOverview 接口的完整数据
  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) {
    console.error('[getStatsOverviewOptimized] RPC调用失败:', error);
    throw error;
  }

  const stats = data as StatsOverview;
  console.log('[getStatsOverviewOptimized] 获取数据成功:', stats);

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
      ? data.national.map(item => ({ name: item.name, count: item.value || 0 })) 
      : [],
    provincial: Array.isArray(data?.provincial) 
      ? data.provincial.map(item => ({ name: item.name, count: item.value || 0 })) 
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
 * 获取违规问题关键词数据（优化版）
 */
export async function getViolationKeywordsOptimized() {
  const cacheKey = 'violation_keywords';
  
  const cached = cacheManager.get<any[]>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('get_violation_keywords_stats');

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
    violationKeywords,
    geographicDist,
  ] = await Promise.all([
    getYearlyTrendOptimized(),
    getMonthlyTrendOptimized(),
    getDepartmentDistributionOptimized(),
    getPlatformDistributionOptimized(),
    getViolationKeywordsOptimized(),
    getGeographicDistributionOptimized(),
  ]);

  const result = {
    yearlyTrend,
    monthlyTrend,
    departmentDist,
    platformDist,
    violationKeywords,
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
