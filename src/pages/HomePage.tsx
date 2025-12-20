import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Calendar, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/home/StatsCard';
import TrendOverviewChart from '@/components/charts/TrendOverviewChart';
import PieChart from '@/components/charts/PieChart';

import TooltipInfo from '@/components/ui/tooltip-info';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { calculateTimeRange, type TimeRangeType } from '@/utils/timeRangeUtils';
import {
  getMonthlyAppCountTrend,
  getNationalDepartmentDistribution,
  getProvincialDepartmentDistribution,
  getPlatformDistribution,
  getRecentNews,
  getViolationTypeAnalysis,
  getFrontendConfigs,
} from '@/db/api';
import {
  getStatsOverviewOptimized,
} from '@/db/api-optimized';
import type { StatsOverview, RegulatoryNewsWithDetails, FrontendConfig } from '@/types/types';
import { Link } from 'react-router-dom';

const CHARTS_CACHE_TTL_MS = 5 * 60 * 1000;

function parseTimeRangeParam(value: string | null): TimeRangeType | null {
  if (value === 'recent6' || value === 'thisYear' || value === 'all') return value;
  return null;
}

export default function HomePage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [nationalDeptData, setNationalDeptData] = useState<{ name: string; count: number }[]>([]);
  const [provincialDeptData, setProvincialDeptData] = useState<{ name: string; count: number }[]>([]);
  const [platformData, setPlatformData] = useState<{ name: string; count: number }[]>([]);
  const [violationData, setViolationData] = useState<{ name: string; count: number }[]>([]);
  const [recentNews, setRecentNews] = useState<RegulatoryNewsWithDetails[]>([]);
  const [configs, setConfigs] = useState<FrontendConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [timeDimension, setTimeDimension] = useState<'month' | 'quarter' | 'year'>('month');
  const [trendOverviewData, setTrendOverviewData] = useState<{ month: string; count: number }[]>([]);
  const [trendOverviewRange, setTrendOverviewRange] = useState<TimeRangeType>(() => {
    const initial = parseTimeRangeParam(new URLSearchParams(window.location.search).get('range'));
    return initial ?? 'recent6';
  });

  const chartsCacheRef = useRef<
    Map<
      TimeRangeType,
      {
        timestamp: number;
        trend: { month: string; count: number }[];
        national: { name: string; count: number }[];
        provincial: { name: string; count: number }[];
        platform: { name: string; count: number }[];
        violation: { name: string; count: number }[];
      }
    >
  >(new Map());
  const chartsRequestIdRef = useRef(0);

  const handleRangeChange = useCallback(
    async (range: TimeRangeType, updateHistory = true) => {
      const cached = chartsCacheRef.current.get(range);
      if (cached && Date.now() - cached.timestamp <= CHARTS_CACHE_TTL_MS) {
        setTrendOverviewRange(range);
        setTrendOverviewData(cached.trend);
        setNationalDeptData(cached.national);
        setProvincialDeptData(cached.provincial);
        setPlatformData(cached.platform);
        setViolationData(cached.violation);
        setChartsLoading(false);

        if (updateHistory) {
          const url = new URL(window.location.href);
          url.searchParams.set('range', range);
          window.history.pushState({ range }, '', url.toString());
        }

        return;
      }

      setTrendOverviewRange(range);
      if (updateHistory) {
        const url = new URL(window.location.href);
        url.searchParams.set('range', range);
        window.history.pushState({ range }, '', url.toString());
      }

      const requestId = ++chartsRequestIdRef.current;
      setChartsLoading(true);

      try {
        const { startDate, endDate } = calculateTimeRange(range);
        const [trendData, nationalData, provincialData, platformDist, violationDist] = await Promise.all([
          getMonthlyAppCountTrend(range),
          getNationalDepartmentDistribution(range),
          getProvincialDepartmentDistribution(range),
          getPlatformDistribution('case_count', range),
          range === 'all' ? getViolationTypeAnalysis() : getViolationTypeAnalysis(undefined, startDate, endDate),
        ]);

        if (requestId !== chartsRequestIdRef.current) return;

        const violation = violationDist.map((item) => ({
          name: item.type,
          count: item.count,
        }));

        setTrendOverviewData(trendData);
        setNationalDeptData(nationalData);
        setProvincialDeptData(provincialData);
        setPlatformData(platformDist);
        setViolationData(violation);

        chartsCacheRef.current.set(range, {
          timestamp: Date.now(),
          trend: trendData,
          national: nationalData,
          provincial: provincialData,
          platform: platformDist,
          violation,
        });
      } catch (error) {
        if (requestId !== chartsRequestIdRef.current) return;
        console.error('[HomePage] 加载图表数据失败:', error);
        toast.error('数据更新失败，请重试');
      } finally {
        if (requestId !== chartsRequestIdRef.current) return;
        setChartsLoading(false);
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setStatsLoading(true);

      const [statsData, configsData] = await Promise.all([
        getStatsOverviewOptimized(),
        getFrontendConfigs(),
      ]);

      setStats(statsData);
      setConfigs(configsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error(`加载数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setStatsLoading(false);
      setLoading(false);
    }

    void handleRangeChange(trendOverviewRange, false);

    setNewsLoading(true);
    try {
      const newsData = await getRecentNews(5);
      setRecentNews(newsData);
    } catch (error) {
      console.error('[HomePage] 加载资讯失败:', error);
    } finally {
      setNewsLoading(false);
    }
  }, [handleRangeChange, trendOverviewRange]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const onPopState = () => {
      const range = parseTimeRangeParam(new URLSearchParams(window.location.search).get('range')) ?? 'recent6';
      void handleRangeChange(range, false);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [handleRangeChange]);

  const isModuleVisible = (moduleKey: string) => {
    // 所有首页模块现在都由frontend_config统一控制
    const config = configs.find((c) => c.module_key === moduleKey);
    return config?.is_visible !== false;
  };

  const rangeDescription =
    trendOverviewRange === 'recent6'
      ? '统计近6个月内的数据'
      : trendOverviewRange === 'thisYear'
        ? '统计本年度至今的数据'
        : '统计全部历史数据';

  if (loading && statsLoading) {
    // 初始加载状态：显示完整骨架屏
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
        <Skeleton className="h-96 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
      {isModuleVisible('stats_overview') && (
        <div className="space-y-3">
          {/* 时间维度切换 */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">数据概览</h2>
            <Tabs value={timeDimension} onValueChange={(v) => setTimeDimension(v as 'month' | 'quarter' | 'year')}>
              <TabsList className="grid grid-cols-3 w-full xl:w-auto xl:min-w-[280px]">
                <TabsTrigger value="month">本月</TabsTrigger>
                <TabsTrigger value="quarter">本季度</TabsTrigger>
                <TabsTrigger value="year">本年度</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 统计卡片 */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4">
            <StatsCard
              title={timeDimension === 'month' ? '本月通报频次' : timeDimension === 'quarter' ? '本季度通报频次' : '本年度通报频次'}
              value={
                timeDimension === 'month' 
                  ? stats?.current_month_cases || 0 
                  : timeDimension === 'quarter'
                  ? stats?.current_quarter_cases || 0
                  : stats?.current_year_cases || 0
              }
              icon={FileText}
              description={
                timeDimension === 'month' 
                  ? '当月通报活动次数' 
                  : timeDimension === 'quarter'
                  ? '当季度通报活动次数'
                  : '当年度通报活动次数'
              }
              change={
                timeDimension === 'month' 
                  ? stats?.cases_change 
                  : timeDimension === 'quarter'
                  ? stats?.quarter_cases_change
                  : stats?.year_cases_change
              }
              changePercent={
                timeDimension === 'month' 
                  ? stats?.cases_change_percent 
                  : timeDimension === 'quarter'
                  ? stats?.quarter_cases_change_percent
                  : stats?.year_cases_change_percent
              }
              showTrend={true}
              variant="gradient"
              trendLabel={timeDimension === 'month' ? '较上月' : timeDimension === 'quarter' ? '较上季度' : '较上年度'}
              tooltipContent={
                <div className="space-y-3">
                  <p className="font-semibold text-base">统计说明</p>
                  <div className="space-y-2.5 text-xs leading-relaxed">
                    <div>
                      <div className="font-semibold mb-1">📢 通报频次</div>
                      <div className="text-muted-foreground">按"部门+日期"去重统计通报活动次数。同一个部门在同一天发布的通报算作1次通报活动</div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">📊 统计维度</div>
                      <div className="text-muted-foreground">
                        {timeDimension === 'month' ? '统计当前自然月内的通报活动次数' : timeDimension === 'quarter' ? '统计当前季度内的通报活动次数' : '统计当前自然年内的通报活动次数'}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">💡 示例说明</div>
                      <div className="text-muted-foreground">2025-12-04，国家计算机病毒应急处理中心发布通报 → 1次通报活动</div>
                    </div>
                  </div>
                </div>
              }
            />
            <StatsCard
              title={timeDimension === 'month' ? '本月涉及应用' : timeDimension === 'quarter' ? '本季度涉及应用' : '本年度涉及应用'}
              value={
                timeDimension === 'month' 
                  ? stats?.current_month_apps || 0 
                  : timeDimension === 'quarter'
                  ? stats?.current_quarter_apps || 0
                  : stats?.current_year_apps || 0
              }
              icon={AlertCircle}
              description={
                timeDimension === 'month' 
                  ? '当月涉及应用数量' 
                  : timeDimension === 'quarter'
                  ? '当季度涉及应用数量'
                  : '当年度涉及应用数量'
              }
              change={
                timeDimension === 'month' 
                  ? stats?.apps_change 
                  : timeDimension === 'quarter'
                  ? stats?.quarter_apps_change
                  : stats?.year_apps_change
              }
              changePercent={
                timeDimension === 'month' 
                  ? stats?.apps_change_percent 
                  : timeDimension === 'quarter'
                  ? stats?.quarter_apps_change_percent
                  : stats?.year_apps_change_percent
              }
              showTrend={true}
              variant="gradient"
              trendLabel={timeDimension === 'month' ? '较上月' : timeDimension === 'quarter' ? '较上季度' : '较上年度'}
              tooltipContent={
                <div className="space-y-3">
                  <p className="font-semibold text-base">统计说明</p>
                  <div className="space-y-2.5 text-xs leading-relaxed">
                    <div>
                      <div className="font-semibold mb-1">📱 通报应用数量</div>
                      <div className="text-muted-foreground">按应用名称去重统计，同一应用在多个平台被通报只计算1次</div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">📊 统计维度</div>
                      <div className="text-muted-foreground">
                        {timeDimension === 'month' ? '统计当前自然月内涉及的应用数量' : timeDimension === 'quarter' ? '统计当前季度内涉及的应用数量' : '统计当前自然年内涉及的应用数量'}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">🔗 数据关系</div>
                      <div className="text-muted-foreground">1次通报活动可能涉及多个应用。示例：81条记录 → 69个应用（去重后）</div>
                    </div>
                  </div>
                </div>
              }
            />
            <Card className="overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                  累计统计
                </CardTitle>
                <FileText className="h-8 w-8 p-1.5 rounded-lg bg-primary/10 text-primary" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {stats?.total_cases || 0}
                    </span>
                    <span className="text-base font-medium text-muted-foreground">次通报</span>
                  </div>
                  <p className="text-xs text-muted-foreground">累计通报频次</p>
                </div>
                <div className="pt-2 border-t border-border/50 space-y-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {stats?.total_apps || 0}
                    </span>
                    <span className="text-base font-medium text-muted-foreground">个应用</span>
                  </div>
                  <p className="text-xs text-muted-foreground">累计涉及应用总数</p>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden bg-gradient-to-br from-background to-accent/5 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                  最近通报
                </CardTitle>
                <Calendar className="h-8 w-8 p-1.5 rounded-lg bg-accent/10 text-accent" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <div className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {stats?.latest_report_date || '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">最新通报日期</p>
                </div>
                <div className="pt-2 border-t border-border/50 space-y-1.5">
                  <div className="text-sm font-semibold text-foreground line-clamp-2" title={stats?.latest_department || '-'}>
                    {stats?.latest_department || '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">发布部门</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 趋势概览 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-lg sm:text-xl">趋势概览</CardTitle>
                <TooltipInfo
                  content={
                    <div className="space-y-2">
                      <p className="font-semibold">统计说明</p>
                      <p className="text-xs text-muted-foreground">
                        展示每月被通报的应用数量变化趋势，帮助您快速把握整体动态
                      </p>
                    </div>
                  }
                />
              </div>
              <Tabs value={trendOverviewRange} onValueChange={(v) => void handleRangeChange(v as TimeRangeType, true)}>
                <TabsList className="grid grid-cols-3 w-full xl:w-auto xl:min-w-[280px]">
                  <TabsTrigger value="recent6">近6个月</TabsTrigger>
                  <TabsTrigger value="thisYear">本年至今</TabsTrigger>
                  <TabsTrigger value="all">全部</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[300px] w-full bg-muted" />
            </div>
          ) : (
            <TrendOverviewChart data={trendOverviewData} timeRange={trendOverviewRange} />
          )}
        </CardContent>
      </Card>

      {/* 监管部门分布 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 2xl:grid-cols-2">
        {/* 国家级部门分布 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-lg sm:text-xl">国家级部门分布</CardTitle>
              <TooltipInfo
                content={
                  <div className="space-y-3">
                    <p className="font-semibold text-base">统计说明</p>
                    <div className="space-y-2.5 text-xs leading-relaxed">
                      <div>
                        <div className="font-semibold mb-1">🏛️ 部门分布</div>
                        <div className="text-muted-foreground">统计国家级监管部门通报的应用数量，展示各部门的监管力度分布</div>
                      </div>
                      <div>
                        <div className="font-semibold mb-1">📊 统计逻辑</div>
                        <div className="text-muted-foreground">按应用名称去重统计，同一部门多次通报同一应用只计算1次</div>
                      </div>
                      <div>
                        <div className="font-semibold mb-1">📅 数据范围</div>
                        <div className="text-muted-foreground">{rangeDescription}</div>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {chartsLoading ? (
              <Skeleton className="h-80 bg-muted" />
            ) : nationalDeptData.length > 0 ? (
              <div className="w-full">
                <PieChart 
                  data={nationalDeptData} 
                  title="国家级部门通报相关应用分布"
                  showHeader={false}
                  showPercentage={true}
                  className="border-none shadow-none"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">暂无国家级部门数据</div>
            )}
          </CardContent>
        </Card>

        {/* 省级部门分布 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-lg sm:text-xl">省级部门分布</CardTitle>
              <TooltipInfo
                content={
                  <div className="space-y-3">
                    <p className="font-semibold text-base">统计说明</p>
                    <div className="space-y-2.5 text-xs leading-relaxed">
                      <div>
                        <div className="font-semibold mb-1">🏛️ 部门分布</div>
                        <div className="text-muted-foreground">统计省级监管部门通报的应用数量，展示各部门的监管力度分布</div>
                      </div>
                      <div>
                        <div className="font-semibold mb-1">📊 统计逻辑</div>
                        <div className="text-muted-foreground">按应用名称去重统计，同一部门多次通报同一应用只计算1次</div>
                      </div>
                      <div>
                        <div className="font-semibold mb-1">📅 数据范围</div>
                        <div className="text-muted-foreground">{rangeDescription}</div>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {chartsLoading ? (
              <Skeleton className="h-80 bg-muted" />
            ) : provincialDeptData.length > 0 ? (
              <div className="w-full">
                <PieChart 
                  data={provincialDeptData} 
                  title="省级部门通报相关应用分布"
                  showHeader={false}
                  showPercentage={true}
                  className="border-none shadow-none"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">暂无省级部门数据</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 应用平台分布 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 2xl:grid-cols-2">
        {isModuleVisible('platform_chart') && (
          chartsLoading ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">应用平台分布</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 bg-muted" />
              </CardContent>
            </Card>
          ) : platformData.length > 0 ? (
            <PieChart 
              data={platformData} 
              title="应用平台分布"
              limit={10}
              showPercentage={true}
                  tooltipContent={
                    <div className="space-y-3">
                      <p className="font-semibold text-base">统计说明</p>
                      <div className="space-y-2.5 text-xs leading-relaxed">
                    <div>
                      <div className="font-semibold mb-1">📦 平台分布</div>
                      <div className="text-muted-foreground">统计被通报应用的来源平台，展示各平台的应用合规情况</div>
                    </div>
                        <div>
                          <div className="font-semibold mb-1">🔢 显示数量</div>
                          <div className="text-muted-foreground">展示通报数量最多的前10个平台，其余平台归入"其他"类别</div>
                        </div>
                        <div>
                          <div className="font-semibold mb-1">📅 数据范围</div>
                          <div className="text-muted-foreground">{rangeDescription}</div>
                        </div>
                      </div>
                    </div>
                  }
                />
          ) : null
        )}

        {isModuleVisible('violation_chart') && (
          chartsLoading ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">问题分布饼图</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 bg-muted" />
              </CardContent>
            </Card>
          ) : violationData.length > 0 ? (
            <PieChart 
              data={violationData} 
              title="问题分布饼图"
              limit={10}
              showPercentage={true}
                  tooltipContent={
                    <div className="space-y-3">
                      <p className="font-semibold text-base">统计说明</p>
                      <div className="space-y-2.5 text-xs leading-relaxed">
                    <div>
                      <div className="font-semibold mb-1">🚫 问题类型</div>
                      <div className="text-muted-foreground">统计被通报应用存在的具体违规问题类型，如"违规收集个人信息"等</div>
                    </div>
                        <div>
                          <div className="font-semibold mb-1">🔢 显示数量</div>
                          <div className="text-muted-foreground">基于全量数据统计，展示各类问题占比（Top 10以外自动归为"其他"）</div>
                        </div>
                        <div>
                          <div className="font-semibold mb-1">📅 数据范围</div>
                          <div className="text-muted-foreground">{rangeDescription}</div>
                        </div>
                      </div>
                    </div>
                  }
                />
          ) : null
        )}
      </div>

      {isModuleVisible('recent_news') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">近期监管资讯</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {newsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 bg-muted" />
                ))}
              </div>
            ) : recentNews.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentNews.map((news) => (
                  <div
                    key={news.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-2 text-base leading-snug">{news.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                        <span>{news.publish_date}</span>
                        <span className="truncate max-w-[200px]">{news.department?.name || '未知部门'}</span>
                      </div>
                    </div>
                    <Link
                      to={`/news/${news.id}`}
                      className="text-sm text-primary hover:underline min-h-[44px] flex items-center justify-center sm:justify-start sm:ml-4 shrink-0"
                    >
                      查看详情
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">暂无资讯</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
