import { useEffect, useState } from 'react';
import { FileText, Building2, Calendar, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/home/StatsCard';
import TrendChart from '@/components/charts/TrendChart';
import PieChart from '@/components/charts/PieChart';
import WordCloud from '@/components/charts/WordCloud';
import GeoChart from '@/components/charts/GeoChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getStatsOverview,
  getMonthlyTrend,
  getDepartmentDistribution,
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
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);
  const [deptData, setDeptData] = useState<{ name: string; count: number }[]>([]);
  const [platformData, setPlatformData] = useState<{ name: string; count: number }[]>([]);
  const [geoData, setGeoData] = useState<{ province: string; count: number }[]>([]);
  const [keywords, setKeywords] = useState<{ name: string; value: number }[]>([]);
  const [recentNews, setRecentNews] = useState<RegulatoryNewsWithDetails[]>([]);
  const [configs, setConfigs] = useState<FrontendConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        monthlyTrend,
        deptDist,
        platformDist,
        geoDist,
        keywordsData,
        newsData,
        configsData,
      ] = await Promise.all([
        getStatsOverview(),
        getMonthlyTrend(),
        getDepartmentDistribution(),
        getPlatformDistribution(),
        getGeoDistribution(),
        getViolationKeywords(),
        getRecentNews(5),
        getFrontendConfigs(),
      ]);

      setStats(statsData);
      setMonthlyData(monthlyTrend);
      setDeptData(deptDist);
      setPlatformData(platformDist);
      setGeoData(geoDist);
      setKeywords(keywordsData);
      setRecentNews(newsData);
      setConfigs(configsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
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
    <div className="container mx-auto p-6 space-y-6">
      {isModuleVisible('stats_overview') && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-4">
          <StatsCard
            title="累计通报案例"
            value={stats?.total_cases || 0}
            icon={FileText}
            description="总案例数量"
          />
          <StatsCard
            title="涉及应用总数"
            value={stats?.total_apps || 0}
            icon={AlertCircle}
            description="去重后的应用数量"
          />
          <StatsCard
            title="最近通报日期"
            value={stats?.latest_report_date || '-'}
            icon={Calendar}
            description="最新一次通报时间"
          />
          <StatsCard
            title="最近通报部门"
            value={stats?.latest_department || '-'}
            icon={Building2}
            description="发布最新通报的部门"
          />
        </div>
      )}

      {isModuleVisible('trend_chart') && monthlyData.length > 0 && (
        <TrendChart data={monthlyData} title="月度通报趋势" type="monthly" />
      )}

      <div className="grid gap-6 grid-cols-1 2xl:grid-cols-2">
        {isModuleVisible('geo_map') && geoData.length > 0 && (
          <GeoChart data={geoData} title="地理分布（按省份）" />
        )}

        {isModuleVisible('department_chart') && deptData.length > 0 && (
          <PieChart data={deptData.slice(0, 10)} title="通报部门分布" />
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 2xl:grid-cols-2">
        {isModuleVisible('platform_chart') && platformData.length > 0 && (
          <PieChart data={platformData.slice(0, 10)} title="应用平台分布" />
        )}

        {isModuleVisible('wordcloud') && keywords.length > 0 && (
          <WordCloud data={keywords} title="违规问题词云" />
        )}
      </div>

      {isModuleVisible('recent_news') && recentNews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>近期监管资讯</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNews.map((news) => (
                <div
                  key={news.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{news.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {news.summary || '暂无摘要'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{news.publish_date}</span>
                      <span>{news.department?.name || '未知部门'}</span>
                    </div>
                  </div>
                  <Link
                    to={`/news/${news.id}`}
                    className="text-sm text-primary hover:underline ml-4"
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
