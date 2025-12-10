import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Building2, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import TooltipInfo from '@/components/ui/tooltip-info';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TrendOverviewData {
  currentMonthRisk: {
    level: 'high' | 'medium' | 'low';
    count: number;
    month: string;
  };
  highFrequencyMonths: Array<{
    month: string;
    count: number;
  }>;
  topDepartments: {
    monthly: Array<{ name: string; count: number }>;
    yearly: Array<{ name: string; count: number }>;
  };
  topPlatforms: {
    monthly: Array<{ name: string; count: number }>;
    yearly: Array<{ name: string; count: number }>;
  };
}

interface TrendOverviewSectionProps {
  data: TrendOverviewData | null;
  loading: boolean;
}

export default function TrendOverviewSection({ data, loading }: TrendOverviewSectionProps) {
  // 高频时段展开/收起状态
  const [isHighFrequencyExpanded, setIsHighFrequencyExpanded] = useState(false);
  
  // 获取风险等级的颜色和文本
  const getRiskInfo = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return {
          color: 'text-[#F5222D]',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: '高风险',
          badgeClass: 'bg-[#F5222D] text-white hover:bg-[#F5222D]/90',
        };
      case 'medium':
        return {
          color: 'text-[#FA8C16]',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: '中风险',
          badgeClass: 'bg-[#FA8C16] text-white hover:bg-[#FA8C16]/90',
        };
      case 'low':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: '低风险',
          badgeClass: 'bg-blue-600 text-white hover:bg-blue-600/90',
        };
    }
  };

  // 格式化月份显示
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}年${parseInt(monthNum)}月`;
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">趋势总览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const riskInfo = getRiskInfo(data.currentMonthRisk.level);
  
  // 高频时段数据处理
  const displayHighFrequencyMonths = isHighFrequencyExpanded 
    ? data.highFrequencyMonths 
    : data.highFrequencyMonths.slice(0, 3);
  const hasMoreMonths = data.highFrequencyMonths.length > 3;

  return (
    <Card className="mb-6 bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="w-6 h-6" />
          趋势总览
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. 本月通报风险等级 */}
          <Card className="bg-gradient-to-br from-background to-accent/5 border-accent/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    本月通报风险等级
                  </span>
                  <TooltipInfo 
                    content={
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold">统计口径：</p>
                        <p>• 高风险：当月全部监管部门通报总频次 &gt; 5次</p>
                        <p>• 中风险：当月全部监管部门通报总频次 &gt; 1次 且 ≤ 5次</p>
                        <p>• 低风险：当月全部监管部门通报总频次 ≤ 1次</p>
                      </div>
                    } 
                  />
                </div>
                <AlertTriangle className={`w-5 h-5 ${riskInfo.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex flex-col items-center">
              <div className={`${riskInfo.badgeClass} px-6 py-2 rounded-md text-xl font-bold min-w-[120px] text-center`}>
                {riskInfo.label}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span>{data.currentMonthRisk.month}</span>
                <span>·</span>
                <span>通报频次 {data.currentMonthRisk.count}次</span>
              </div>
            </CardContent>
          </Card>

          {/* 2. 本年通报高频时段 */}
          <Card className="bg-gradient-to-br from-background to-accent/5 border-accent/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    本年通报高频时段
                  </span>
                  <TooltipInfo 
                    content={
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold">统计口径：</p>
                        <p>• 统计范围：本年度1月至当前月份</p>
                        <p>• 筛选条件：当月全部监管部门通报频次 ≥ 5次</p>
                      </div>
                    } 
                  />
                </div>
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              {data.highFrequencyMonths.length > 0 ? (
                <div className="space-y-2">
                  {displayHighFrequencyMonths.map((item) => (
                    <div key={item.month} className="flex items-center justify-between">
                      <span className="font-bold text-sm">{formatMonth(item.month)}</span>
                      <span className="font-bold text-sm">{item.count}次</span>
                    </div>
                  ))}
                  
                  {/* 展开/收起按钮 */}
                  {hasMoreMonths && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 bg-accent/10 hover:bg-accent/20"
                      onClick={() => setIsHighFrequencyExpanded(!isHighFrequencyExpanded)}
                    >
                      {isHighFrequencyExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          收起
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          展开查看全部（共{data.highFrequencyMonths.length}个月）
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无高频时段</p>
              )}
            </CardContent>
          </Card>

          {/* 3. 高频通报部门 */}
          <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    高频通报部门
                  </span>
                  <TooltipInfo 
                    content={
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold">统计口径：</p>
                        <p>• 本月前三：当前月份通报频次最多的前三个部门</p>
                        <p>• 本年前三：本年度累计通报频次最多的前三个部门</p>
                      </div>
                    } 
                  />
                </div>
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-primary/10">
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-primary/30 data-[state=active]:text-primary data-[state=active]:font-semibold">本月前三</TabsTrigger>
                  <TabsTrigger value="yearly" className="data-[state=active]:bg-primary/30 data-[state=active]:text-primary data-[state=active]:font-semibold">本年前三</TabsTrigger>
                </TabsList>
                <TabsContent value="monthly" className="mt-3">
                  {data.topDepartments.monthly.length > 0 ? (
                    <div className="space-y-2">
                      {data.topDepartments.monthly.map((dept, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="truncate flex-1 font-bold text-sm">{dept.name}</span>
                          <span className="ml-2 font-bold text-sm">{dept.count}次</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无数据</p>
                  )}
                </TabsContent>
                <TabsContent value="yearly" className="mt-3">
                  {data.topDepartments.yearly.length > 0 ? (
                    <div className="space-y-2">
                      {data.topDepartments.yearly.map((dept, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="truncate flex-1 font-bold text-sm">{dept.name}</span>
                          <span className="ml-2 font-bold text-sm">{dept.count}次</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无数据</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 4. 高频被通报平台 */}
          <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    高频被通报平台
                  </span>
                  <TooltipInfo 
                    content={
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold">统计口径：</p>
                        <p>• 本月前三：当前月份被通报应用所属平台出现频次最高的前三个</p>
                        <p>• 本年前三：本年度累计被通报应用所属平台出现频次最高的前三个</p>
                      </div>
                    } 
                  />
                </div>
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-primary/10">
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-primary/30 data-[state=active]:text-primary data-[state=active]:font-semibold">本月前三</TabsTrigger>
                  <TabsTrigger value="yearly" className="data-[state=active]:bg-primary/30 data-[state=active]:text-primary data-[state=active]:font-semibold">本年前三</TabsTrigger>
                </TabsList>
                <TabsContent value="monthly" className="mt-3">
                  {data.topPlatforms.monthly.length > 0 ? (
                    <div className="space-y-2">
                      {data.topPlatforms.monthly.map((platform, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="truncate flex-1 font-bold text-sm">{platform.name}</span>
                          <span className="ml-2 font-bold text-sm">{platform.count}次</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无数据</p>
                  )}
                </TabsContent>
                <TabsContent value="yearly" className="mt-3">
                  {data.topPlatforms.yearly.length > 0 ? (
                    <div className="space-y-2">
                      {data.topPlatforms.yearly.map((platform, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="truncate flex-1 font-bold text-sm">{platform.name}</span>
                          <span className="ml-2 font-bold text-sm">{platform.count}次</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无数据</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
