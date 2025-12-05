import { useEffect, useState } from 'react';
import { FileText, Building2, Calendar, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/home/StatsCard';
import TrendComparisonChart from '@/components/charts/TrendComparisonChart';
import PieChart from '@/components/charts/PieChart';
import WordCloud from '@/components/charts/WordCloud';
import GeoChart from '@/components/charts/GeoChart';
import StatisticsInfo from '@/components/common/StatisticsInfo';
import TooltipInfo from '@/components/ui/tooltip-info';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  getStatsOverview,
  getMonthlyAppTrend,
  getYearlyAppTrend,
  getMonthlyReportTrend,
  getYearlyReportTrend,
  getDepartmentDistribution,
  getNationalDepartmentDistribution,
  getProvincialDepartmentDistribution,
  getPlatformDistribution,
  getGeoDistribution,
  getViolationKeywords,
  getRecentNews,
  getFrontendConfigs,
} from '@/db/api';
import type { StatsOverview, RegulatoryNewsWithDetails, FrontendConfig } from '@/types/types';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [monthlyAppData, setMonthlyAppData] = useState<{ month: string; count: number }[]>([]);
  const [yearlyAppData, setYearlyAppData] = useState<{ year: string; count: number }[]>([]);
  const [monthlyReportData, setMonthlyReportData] = useState<{ month: string; count: number }[]>([]);
  const [yearlyReportData, setYearlyReportData] = useState<{ year: string; count: number }[]>([]);
  const [deptData, setDeptData] = useState<{ name: string; count: number }[]>([]);
  const [nationalDeptData, setNationalDeptData] = useState<{ name: string; count: number }[]>([]);
  const [provincialDeptData, setProvincialDeptData] = useState<{ name: string; count: number }[]>([]);
  const [platformData, setPlatformData] = useState<{ name: string; count: number }[]>([]);
  const [geoData, setGeoData] = useState<{ province: string; count: number }[]>([]);
  const [keywords, setKeywords] = useState<{ name: string; value: number }[]>([]);
  const [recentNews, setRecentNews] = useState<RegulatoryNewsWithDetails[]>([]);
  const [configs, setConfigs] = useState<FrontendConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendView, setTrendView] = useState<'monthly' | 'yearly'>('monthly');
  const [trendDimension, setTrendDimension] = useState<'app' | 'report' | 'comparison'>('app');
  const [analysisView, setAnalysisView] = useState<'department' | 'geography'>('department');
  const [deptLevelView, setDeptLevelView] = useState<'national' | 'provincial'>('national');
  const [timeDimension, setTimeDimension] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        monthlyAppTrend,
        yearlyAppTrend,
        monthlyReportTrend,
        yearlyReportTrend,
        deptDist,
        nationalDeptDist,
        provincialDeptDist,
        platformDist,
        geoDist,
        keywordsData,
        newsData,
        configsData,
      ] = await Promise.all([
        getStatsOverview(),
        getMonthlyAppTrend(),
        getYearlyAppTrend(),
        getMonthlyReportTrend(),
        getYearlyReportTrend(),
        getDepartmentDistribution(),
        getNationalDepartmentDistribution(),
        getProvincialDepartmentDistribution(),
        getPlatformDistribution(),
        getGeoDistribution(),
        getViolationKeywords(),
        getRecentNews(5),
        getFrontendConfigs(),
      ]);

      console.log('首页数据加载成功:', {
        statsData,
        monthlyAppTrend,
        yearlyAppTrend,
        monthlyReportTrend,
        yearlyReportTrend,
        deptDist,
        nationalDeptDist,
        provincialDeptDist,
        platformDist,
        geoDist,
        keywordsData,
        newsData,
        configsData,
      });

      setStats(statsData);
      setMonthlyAppData(monthlyAppTrend);
      setYearlyAppData(yearlyAppTrend);
      setMonthlyReportData(monthlyReportTrend);
      setYearlyReportData(yearlyReportTrend);
      setDeptData(deptDist);
      setNationalDeptData(nationalDeptDist);
      setProvincialDeptData(provincialDeptDist);
      setPlatformData(platformDist);
      setGeoData(geoDist);
      setKeywords(keywordsData);
      setRecentNews(newsData);
      setConfigs(configsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error(`加载数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const isModuleVisible = (moduleKey: string) => {
    const config = configs.find((c) => c.module_key === moduleKey);
    return config?.is_visible !== false;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
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
            <h2 className="text-lg font-semibold">数据概览</h2>
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
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">统计口径</p>
                  <p className="text-xs leading-relaxed">
                    按"部门+日期"去重统计通报活动次数。同一个部门在同一天发布的通报算作1次通报活动。
                  </p>
                  <div className="pt-2 border-t border-border/50 space-y-1">
                    <p className="text-xs font-medium text-foreground">示例说明</p>
                    <p className="text-xs text-muted-foreground">
                      2025-12-04，国家计算机病毒应急处理中心发布通报 → 1次通报活动
                    </p>
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
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">统计口径</p>
                  <p className="text-xs leading-relaxed">
                    按应用名称去重统计，同一应用在多个平台被通报只计算1次。
                  </p>
                  <div className="pt-2 border-t border-border/50 space-y-1">
                    <p className="text-xs font-medium text-foreground">数据关系</p>
                    <p className="text-xs text-muted-foreground">
                      1次通报活动可能涉及多个应用
                    </p>
                    <p className="text-xs text-muted-foreground">
                      示例：81条记录 → 69个应用（去重后）
                    </p>
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

      {isModuleVisible('trend_chart') && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-lg sm:text-xl">通报趋势分析</CardTitle>
                  <TooltipInfo
                    content={
                      <div className="space-y-3">
                        <p className="font-semibold text-base">统计说明</p>
                        <div className="space-y-2.5 text-xs leading-relaxed">
                          <div>
                            <div className="font-semibold mb-1">📱 通报应用数量</div>
                            <div className="text-muted-foreground">按应用名称去重统计，同一应用在多个平台被通报只计算1次</div>
                          </div>
                          <div>
                            <div className="font-semibold mb-1">📢 通报频次</div>
                            <div className="text-muted-foreground">按"部门+日期"去重统计，同一部门在同一天发布的通报算作1次通报活动</div>
                          </div>
                          <div>
                            <div className="font-semibold mb-1">🔗 数据关系</div>
                            <div className="text-muted-foreground">1次通报活动可能涉及多个应用</div>
                          </div>
                        </div>
                      </div>
                    }
                  />
                </div>
                <Tabs value={trendView} onValueChange={(v) => setTrendView(v as 'monthly' | 'yearly')}>
                  <TabsList className="grid grid-cols-2 w-full xl:w-auto xl:min-w-[240px]">
                    <TabsTrigger value="monthly" className="text-sm">月度视图</TabsTrigger>
                    <TabsTrigger value="yearly" className="text-sm">年度视图</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Tabs value={trendDimension} onValueChange={(v) => setTrendDimension(v as 'app' | 'report' | 'comparison')}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="app" className="text-sm">通报应用数量</TabsTrigger>
                  <TabsTrigger value="report" className="text-sm">通报频次</TabsTrigger>
                  <TabsTrigger value="comparison" className="text-sm">对比分析</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {trendView === 'monthly' && (
              <TrendComparisonChart 
                appData={monthlyAppData} 
                reportData={monthlyReportData}
                type="monthly"
                mode={trendDimension}
              />
            )}
            {trendView === 'yearly' && (
              <TrendComparisonChart 
                appData={yearlyAppData} 
                reportData={yearlyReportData}
                type="yearly"
                mode={trendDimension}
              />
            )}
            {((trendView === 'monthly' && monthlyAppData.length === 0 && monthlyReportData.length === 0) ||
              (trendView === 'yearly' && yearlyAppData.length === 0 && yearlyReportData.length === 0)) && (
              <div className="text-center py-8 text-muted-foreground">暂无数据</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 监管趋势分析 - 二层级结构 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-lg sm:text-xl">监管趋势分析</CardTitle>
            <TooltipInfo
              content={
                <div className="space-y-2">
                  <p className="font-semibold">统计说明</p>
                  <p className="text-xs text-muted-foreground">
                    展示各监管部门的通报活动分布情况，包括国家级部门、省级部门以及地域分布统计
                  </p>
                </div>
              }
            />
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <Tabs value={analysisView} onValueChange={(v) => setAnalysisView(v as typeof analysisView)}>
            <TabsList className="mb-4 grid grid-cols-2 w-full xl:w-auto xl:min-w-[240px]">
              <TabsTrigger value="department" className="text-sm">按部门</TabsTrigger>
              <TabsTrigger value="geography" className="text-sm">按地域</TabsTrigger>
            </TabsList>
            
            <TabsContent value="department" className="mt-0">
              <Tabs value={deptLevelView} onValueChange={(v) => setDeptLevelView(v as typeof deptLevelView)}>
                <TabsList className="mb-4 grid grid-cols-2 w-full xl:w-auto xl:min-w-[240px]">
                  <TabsTrigger value="national" className="text-sm">
                    <span className="flex items-center gap-1">
                      国家级部门
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="provincial" className="text-sm">
                    <span className="flex items-center gap-1">
                      省级部门
                    </span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="national" className="mt-0">
                  {nationalDeptData.length > 0 ? (
                    <div className="w-full">
                      <div className="mb-3 flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-foreground">国家级部门分布</h3>
                        <TooltipInfo
                          content={
                            <div className="space-y-3">
                              <p className="font-semibold text-base">统计说明</p>
                              <div className="space-y-2.5 text-xs leading-relaxed">
                                <div>
                                  <div className="font-semibold mb-1">🏛️ 国家级部门</div>
                                  <div className="text-muted-foreground">统计各国家级监管部门发布的通报数量，展示不同部门的监管力度</div>
                                </div>
                                <div>
                                  <div className="font-semibold mb-1">📊 数据来源</div>
                                  <div className="text-muted-foreground">基于所有案例记录中的部门信息进行统计</div>
                                </div>
                              </div>
                            </div>
                          }
                        />
                      </div>
                      <PieChart data={nationalDeptData} title="" />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">暂无国家级部门数据</div>
                  )}
                </TabsContent>
                
                <TabsContent value="provincial" className="mt-0">
                  {provincialDeptData.length > 0 ? (
                    <div className="w-full">
                      <div className="mb-3 flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-foreground">省级部门分布</h3>
                        <TooltipInfo
                          content={
                            <div className="space-y-3">
                              <p className="font-semibold text-base">统计说明</p>
                              <div className="space-y-2.5 text-xs leading-relaxed">
                                <div>
                                  <div className="font-semibold mb-1">🏢 省级部门</div>
                                  <div className="text-muted-foreground">统计各省级监管部门发布的通报数量，展示地方监管活跃度</div>
                                </div>
                                <div>
                                  <div className="font-semibold mb-1">📊 数据来源</div>
                                  <div className="text-muted-foreground">基于所有案例记录中的部门信息进行统计</div>
                                </div>
                              </div>
                            </div>
                          }
                        />
                      </div>
                      <PieChart data={provincialDeptData} title="" />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">暂无省级部门数据</div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="geography" className="mt-0">
              {geoData.length > 0 ? (
                <div className="w-full">
                  <div className="mb-3 flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-foreground">地域分布</h3>
                    <TooltipInfo
                      content={
                        <div className="space-y-3">
                          <p className="font-semibold text-base">统计说明</p>
                          <div className="space-y-2.5 text-xs leading-relaxed">
                            <div>
                              <div className="font-semibold mb-1">🗺️ 地域分布</div>
                              <div className="text-muted-foreground">按监管部门所在省份统计通报数量，颜色深浅代表通报数量多少</div>
                            </div>
                            <div>
                              <div className="font-semibold mb-1">📍 统计维度</div>
                              <div className="text-muted-foreground">基于部门所在地进行统计，非被通报应用的所在地</div>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <GeoChart data={geoData} title="" />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">暂无数据</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 2xl:grid-cols-2">
        {isModuleVisible('platform_chart') && platformData.length > 0 && (
          <PieChart 
            data={platformData.slice(0, 10)} 
            title="应用平台分布"
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
                </div>
              </div>
            }
          />
        )}

        {isModuleVisible('wordcloud') && keywords.length > 0 && (
          <WordCloud 
            data={keywords} 
            title="违规问题词云"
            tooltipContent={
              <div className="space-y-3">
                <p className="font-semibold text-base">统计说明</p>
                <div className="space-y-2.5 text-xs leading-relaxed">
                  <div>
                    <div className="font-semibold mb-1">☁️ 词云展示</div>
                    <div className="text-muted-foreground">提取违规问题描述中的关键词，字体大小代表出现频率</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">🔍 热点问题</div>
                    <div className="text-muted-foreground">快速识别当前监管重点关注的违规问题类型</div>
                  </div>
                </div>
              </div>
            }
          />
        )}
      </div>

      {isModuleVisible('recent_news') && recentNews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">近期监管资讯</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
