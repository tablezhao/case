import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Award, LineChart, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { getDepartmentRanking, getDepartmentApplicationTrend, getDepartments, getTrendOverview, getAvailableYears } from '@/db/api';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TrendOverviewSection from '@/components/trend/TrendOverviewSection';

// 时间维度类型
type TimeDimension = 'monthly' | 'half-yearly' | 'yearly' | 'all';

// 趋势数据维度类型
type TrendDimension = 'yearly' | 'all';

// 排名数据项类型
interface RankingItem {
  departmentId: string;
  departmentName: string;
  reportCount: number;
  appCount: number;
}

// 排名数据类型
interface RankingData {
  byReportCount: RankingItem[];
  byAppCount: RankingItem[];
}

// 部门类型
interface Department {
  id: string;
  name: string;
}

export default function TrendAnalysisPage() {
  // 趋势概览状态管理
  const [trendOverviewData, setTrendOverviewData] = useState<any>(null);
  const [trendOverviewLoading, setTrendOverviewLoading] = useState(true);
  
  // 排名模块状态管理
  const [selectedDimension, setSelectedDimension] = useState<TimeDimension>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('01');
  const [selectedHalfYear, setSelectedHalfYear] = useState<'H1' | 'H2'>('H1');
  const [loading, setLoading] = useState(true);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  
  // 排行榜展开/收起状态
  const [isReportCountExpanded, setIsReportCountExpanded] = useState(false);
  const [isAppCountExpanded, setIsAppCountExpanded] = useState(false);

  // 趋势分析模块状态管理
  const [applicationTrendData, setApplicationTrendData] = useState<any[]>([]);
  const [selectedApplicationDataDimension, setSelectedApplicationDataDimension] = useState<TrendDimension>('all');
  const [selectedTrendYear, setSelectedTrendYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedTrendDepartment, setSelectedTrendDepartment] = useState<string>('');
  const [applicationTrendLoading, setApplicationTrendLoading] = useState(false);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);

  // 可用年份列表
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableYears();
    loadAllDepartments();
    loadTrendOverviewData();
  }, []);

  useEffect(() => {
    loadRankingData();
  }, [selectedDimension, selectedYear, selectedMonth, selectedHalfYear]);

  useEffect(() => {
    if (selectedTrendDepartment) {
      loadApplicationTrendData();
    } else {
      setApplicationTrendData([]);
    }
  }, [selectedTrendDepartment, selectedApplicationDataDimension, selectedTrendYear]);

  // 加载趋势概览数据
  const loadTrendOverviewData = async () => {
    try {
      setTrendOverviewLoading(true);
      const data = await getTrendOverview();
      setTrendOverviewData(data);
    } catch (error) {
      console.error('加载趋势概览数据失败:', error);
      toast.error('加载趋势概览数据失败');
    } finally {
      setTrendOverviewLoading(false);
    }
  };

  // 加载年份列表
  const loadAvailableYears = async () => {
    try {
      console.log('[TrendAnalysisPage] 开始加载年份列表...');
      const years = await getAvailableYears();
      console.log('[TrendAnalysisPage] 获取到的年份列表:', years);
      setAvailableYears(years);
      
      // 如果当前选中的年份不在列表中，选择第一个年份（最新年份）
      if (years.length > 0 && !years.includes(selectedYear)) {
        console.log(`[TrendAnalysisPage] 当前年份 ${selectedYear} 不在列表中，切换到 ${years[0]}`);
        setSelectedYear(years[0]);
      }
      
      // 同步更新监管部门趋势分析的年份
      if (years.length > 0 && !years.includes(selectedTrendYear)) {
        console.log(`[TrendAnalysisPage] 趋势年份 ${selectedTrendYear} 不在列表中，切换到 ${years[0]}`);
        setSelectedTrendYear(years[0]);
      }
    } catch (error) {
      console.error('[TrendAnalysisPage] 加载年份列表失败:', error);
      toast.error('加载年份列表失败');
      // 失败时使用当前年份
      const currentYear = new Date().getFullYear().toString();
      setAvailableYears([currentYear]);
    }
  };

  // 加载所有部门
  const loadAllDepartments = async () => {
    try {
      const departments = await getDepartments();
      setAllDepartments(departments);
    } catch (error) {
      console.error('加载部门列表失败:', error);
      toast.error('加载部门列表失败');
    }
  };

  // 加载排名数据
  const loadRankingData = async () => {
    try {
      setLoading(true);
      console.log('开始加载排名数据，参数:', {
        dimension: selectedDimension,
        year: selectedYear,
        month: selectedMonth,
        halfYear: selectedHalfYear,
      });

      const data = await getDepartmentRanking({
        dimension: selectedDimension,
        year: selectedYear,
        month: selectedMonth,
        halfYear: selectedHalfYear,
        limit: 10,
      });

      console.log('排名数据加载成功:', data);
      setRankingData(data);
    } catch (error) {
      console.error('加载排名数据失败:', error);
      toast.error('加载排名数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载应用趋势数据
  const loadApplicationTrendData = async () => {
    try {
      setApplicationTrendLoading(true);
      console.log('开始加载趋势数据，参数:', {
        departmentIds: [selectedTrendDepartment],
        dimension: selectedApplicationDataDimension,
        year: selectedTrendYear,
      });

      const data = await getDepartmentApplicationTrend({
        departmentIds: [selectedTrendDepartment],
        dimension: selectedApplicationDataDimension,
        year: selectedApplicationDataDimension === 'yearly' ? selectedTrendYear : undefined,
      });

      console.log('趋势数据加载成功:', data);
      setApplicationTrendData(data);
    } catch (error) {
      console.error('加载趋势数据失败:', error);
      toast.error('加载趋势数据失败');
    } finally {
      setApplicationTrendLoading(false);
    }
  };

  // 渲染排名徽章
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold">第1名</Badge>;
    } else if (rank === 2) {
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">第2名</Badge>;
    } else if (rank === 3) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">第3名</Badge>;
    } else {
      return <Badge variant="outline">第{rank}名</Badge>;
    }
  };

  // 渲染排名列表
  const renderRankingList = (items: RankingItem[], sortBy: 'report' | 'app', isExpanded: boolean, onToggle: () => void) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          暂无数据
        </div>
      );
    }

    // 根据展开状态决定显示的数据
    const displayItems = isExpanded ? items : items.slice(0, 3);
    const hasMore = items.length > 3;

    return (
      <div className="space-y-3">
        {displayItems.map((item, index) => (
          <div
            key={item.departmentId}
            className={`p-4 rounded-lg border transition-all ${
              index < 3
                ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20'
                : 'bg-muted/30 border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {renderRankBadge(index + 1)}
                <span className="font-medium">{item.departmentName}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">通报频次：</span>
                <span className={`font-semibold ${sortBy === 'report' ? 'text-primary' : ''}`}>
                  {item.reportCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-secondary" />
                <span className="text-muted-foreground">通报应用量：</span>
                <span className={`font-semibold ${sortBy === 'app' ? 'text-secondary' : ''}`}>
                  {item.appCount}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {/* 展开/收起按钮 */}
        {hasMore && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onToggle}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                收起
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                展开查看全部（共{items.length}名）
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  // 获取排序后的部门列表（国家级在前，省级在后）
  const getSortedDepartments = () => {
    const nationalKeywords = ['工业和信息化部', '国家', '中央', '公安部'];
    
    const national = allDepartments.filter(dept => 
      nationalKeywords.some(keyword => dept.name.includes(keyword))
    );
    
    const provincial = allDepartments.filter(dept => 
      !nationalKeywords.some(keyword => dept.name.includes(keyword))
    );
    
    return [...national, ...provincial];
  };

  // 渲染趋势图表
  const renderTrendChart = () => {
    if (!selectedTrendDepartment) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <LineChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>请选择部门以查看趋势分析</p>
        </div>
      );
    }

    if (applicationTrendLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full bg-muted" />
        </div>
      );
    }

    if (applicationTrendData.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>所选时间范围内暂无数据</p>
        </div>
      );
    }

    // 获取选中部门的名称
    const selectedDept = allDepartments.find(dept => dept.id === selectedTrendDepartment);
    const deptName = selectedDept?.name || '';

    // 计算总数
    const totalCount = applicationTrendData.reduce((sum, dataPoint) => {
      return sum + (dataPoint[deptName] || 0);
    }, 0);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 折线图 */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">趋势图表</h4>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={applicationTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{ value: '应用数量', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={deptName}
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">数据列表</h4>
          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">通报日期</TableHead>
                  <TableHead className="font-semibold text-right">应用数量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicationTrendData.map((dataPoint, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{dataPoint.date}</TableCell>
                    <TableCell className="text-right">
                      {dataPoint[deptName] || 0}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>合计</TableCell>
                  <TableCell className="text-right">{totalCount}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  // 加载状态
  if (loading && !rankingData) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2 bg-muted" />
          <Skeleton className="h-6 w-96 bg-muted" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full bg-muted" />
              <Skeleton className="h-12 w-full bg-muted" />
              <Skeleton className="h-12 w-full bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">监管趋势分析</h1>
        <p className="text-muted-foreground">
          多维度分析监管通报趋势
        </p>
      </div>

      {/* 趋势概览模块 */}
      <TrendOverviewSection data={trendOverviewData} loading={trendOverviewLoading} />

      {/* 通报排名模块 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Award className="w-6 h-6" />
            通报排名
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 分析参数设置 */}
          <div className="space-y-4">
            {/* 响应式网格布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* 时间维度选择 */}
              <div className="space-y-2">
                <Label>时间维度</Label>
                <Select
                  value={selectedDimension}
                  onValueChange={(value) => setSelectedDimension(value as TimeDimension)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">月度</SelectItem>
                    <SelectItem value="half-yearly">半年度</SelectItem>
                    <SelectItem value="yearly">年度</SelectItem>
                    <SelectItem value="all">全部时间段</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 年份选择 */}
              {selectedDimension !== 'all' && (
                <div className="space-y-2">
                  <Label>选择年份</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}年
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 月份选择 */}
              {selectedDimension === 'monthly' && (
                <div className="space-y-2">
                  <Label>选择月份</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = (i + 1).toString().padStart(2, '0');
                        return (
                          <SelectItem key={month} value={month}>
                            {month}月
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 半年度选择 */}
              {selectedDimension === 'half-yearly' && (
                <div className="space-y-2">
                  <Label>选择半年度</Label>
                  <Select
                    value={selectedHalfYear}
                    onValueChange={(value) => setSelectedHalfYear(value as 'H1' | 'H2')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="H1">上半年（1-6月）</SelectItem>
                      <SelectItem value="H2">下半年（7-12月）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 当前分析时段 - 宽屏时在同一行，窄屏时独立一行 */}
              <div className="lg:col-span-1 col-span-1 flex items-end">
                <div className="w-full p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-1">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">当前分析时段：</span>
                    <span className="font-semibold text-primary">
                      {selectedDimension === 'all' && '全部时间段'}
                      {selectedDimension === 'yearly' && `${selectedYear}年`}
                      {selectedDimension === 'half-yearly' &&
                        `${selectedYear}年${selectedHalfYear === 'H1' ? '上半年' : '下半年'}`}
                      {selectedDimension === 'monthly' && `${selectedYear}年${selectedMonth}月`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 排行榜 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 按通报频次排名 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-lg">通报频次排行榜 TOP 10</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                按部门通报频次（唯一日期数）降序排列
              </p>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full bg-muted" />
                  ))}
                </div>
              ) : (
                renderRankingList(
                  rankingData?.byReportCount || [], 
                  'report',
                  isReportCountExpanded,
                  () => setIsReportCountExpanded(!isReportCountExpanded)
                )
              )}
            </div>

            {/* 按通报应用量排名 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Award className="w-5 h-5 text-secondary" />
                <h4 className="font-semibold text-lg">通报应用量排行榜 TOP 10</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                按部门通报应用总数降序排列
              </p>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full bg-muted" />
                  ))}
                </div>
              ) : (
                renderRankingList(
                  rankingData?.byAppCount || [], 
                  'app',
                  isAppCountExpanded,
                  () => setIsAppCountExpanded(!isAppCountExpanded)
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 监管部门趋势分析模块 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <LineChart className="w-6 h-6" />
            监管部门趋势分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 部门选择和参数设置 */}
          <div className="space-y-4">
            {/* 参数选择 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 部门选择器 */}
              <div className="space-y-2">
                <Label>监管部门</Label>
                <Select
                  value={selectedTrendDepartment}
                  onValueChange={setSelectedTrendDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSortedDepartments().map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 数据维度选择 */}
              <div className="space-y-2">
                <Label>数据维度</Label>
                <Select
                  value={selectedApplicationDataDimension}
                  onValueChange={(value) => setSelectedApplicationDataDimension(value as TrendDimension)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">按年统计</SelectItem>
                    <SelectItem value="all">全部数据</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 年份选择 */}
              {selectedApplicationDataDimension === 'yearly' && (
                <div className="space-y-2">
                  <Label>选择年份</Label>
                  <Select value={selectedTrendYear} onValueChange={setSelectedTrendYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}年
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* 趋势图表 */}
          {renderTrendChart()}
        </CardContent>
      </Card>
    </div>
  );
}
