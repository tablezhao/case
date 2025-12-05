import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Calendar, Building2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDepartments,
  getDepartmentTimeTrend,
  getDepartmentYearlyRanking,
  getDepartmentMonthlyRanking,
  getMultiDepartmentComparison,
  getHighFrequencyPeriods,
} from '@/db/api';
import type { RegulatoryDepartment } from '@/types/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// 颜色配置
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#a78bfa',
  '#fb923c',
];

export default function TrendAnalysisPage() {
  const navigate = useNavigate();
  
  const [departments, setDepartments] = useState<RegulatoryDepartment[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('01');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trend');

  // 数据状态
  const [trendData, setTrendData] = useState<any>(null);
  const [yearlyRanking, setYearlyRanking] = useState<any[]>([]);
  const [monthlyRanking, setMonthlyRanking] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [highFrequencyData, setHighFrequencyData] = useState<any[]>([]);

  // 可用年份列表
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    loadDepartments();
    generateYearsList();
  }, []);

  useEffect(() => {
    if (departments.length > 0) {
      loadAnalysisData();
    }
  }, [selectedDepartments, selectedYear, selectedMonth, activeTab]);

  const generateYearsList = () => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i.toString());
    }
    setAvailableYears(years);
  };

  const loadDepartments = async () => {
    try {
      const depts = await getDepartments();
      setDepartments(depts);
      // 默认选择前3个部门
      if (depts.length > 0) {
        setSelectedDepartments(depts.slice(0, 3).map(d => d.id));
      }
    } catch (error) {
      console.error('加载部门失败:', error);
      toast.error('加载部门失败');
    }
  };

  const loadAnalysisData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'trend') {
        // 加载趋势数据
        const data = await getDepartmentTimeTrend(
          selectedDepartments.length > 0 ? selectedDepartments : undefined,
          selectedYear,
          selectedYear
        );
        setTrendData(data);
      } else if (activeTab === 'ranking') {
        // 加载排名数据
        const [yearly, monthly] = await Promise.all([
          getDepartmentYearlyRanking(selectedYear, 10),
          getDepartmentMonthlyRanking(selectedYear, selectedMonth, 10),
        ]);
        setYearlyRanking(yearly);
        setMonthlyRanking(monthly);
      } else if (activeTab === 'comparison') {
        // 加载对比数据
        if (selectedDepartments.length > 0) {
          const data = await getMultiDepartmentComparison(selectedDepartments, selectedYear);
          setComparisonData(data);
        }
      } else if (activeTab === 'hotspot') {
        // 加载高频时段数据
        const data = await getHighFrequencyPeriods(5);
        setHighFrequencyData(data);
      }
    } catch (error) {
      console.error('加载分析数据失败:', error);
      toast.error('加载分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理部门选择
  const handleDepartmentToggle = (deptId: string) => {
    setSelectedDepartments(prev => {
      if (prev.includes(deptId)) {
        return prev.filter(id => id !== deptId);
      } else {
        if (prev.length >= 5) {
          toast.warning('最多只能选择5个部门进行对比');
          return prev;
        }
        return [...prev, deptId];
      }
    });
  };

  // 转换趋势数据为图表格式
  const convertTrendDataToChart = () => {
    if (!trendData) return [];

    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const chartData = months.map(month => {
      const dataPoint: any = { month: `${month}月` };
      
      Object.entries(trendData).forEach(([deptId, deptInfo]: [string, any]) => {
        const deptName = deptInfo.departmentName;
        const yearData = deptInfo.years[selectedYear];
        dataPoint[deptName] = yearData?.months[month] || 0;
      });

      return dataPoint;
    });

    return chartData;
  };

  // 转换对比数据为图表格式
  const convertComparisonDataToChart = () => {
    if (!comparisonData) return [];

    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const chartData = months.map(month => {
      const dataPoint: any = { month: `${month}月` };
      
      Object.entries(comparisonData).forEach(([deptId, deptInfo]: [string, any]) => {
        const deptName = deptInfo.name;
        dataPoint[deptName] = deptInfo.months[month] || 0;
      });

      return dataPoint;
    });

    return chartData;
  };

  // 获取选中部门的名称列表
  const getSelectedDepartmentNames = () => {
    return selectedDepartments
      .map(id => departments.find(d => d.id === id)?.name)
      .filter(Boolean);
  };

  if (loading && departments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">监管趋势多维度分析</h1>
          <p className="text-muted-foreground">
            深度分析监管部门、通报频次、时间维度之间的关联关系
          </p>
        </div>
        <Button 
          onClick={() => navigate('/violation-analysis')}
          className="gap-2"
        >
          查看问题分析
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 筛选控制面板 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">分析参数设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>选择年份</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-2">
              <Label>已选择部门 ({selectedDepartments.length}/5)</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                {selectedDepartments.length === 0 ? (
                  <span className="text-sm text-muted-foreground">未选择部门（将分析所有部门）</span>
                ) : (
                  getSelectedDepartmentNames().map((name, index) => (
                    <Badge key={index} variant="secondary">
                      {name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Label className="mb-2 block">选择监管部门（最多5个）</Label>
            <div className="flex flex-wrap gap-2">
              {departments.map(dept => (
                <Button
                  key={dept.id}
                  variant={selectedDepartments.includes(dept.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDepartmentToggle(dept.id)}
                >
                  {dept.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分析内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trend" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            趋势分析
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            排名统计
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <Building2 className="w-4 h-4" />
            部门对比
          </TabsTrigger>
          <TabsTrigger value="hotspot" className="gap-2">
            <Calendar className="w-4 h-4" />
            高频时段
          </TabsTrigger>
        </TabsList>

        {/* 趋势分析 */}
        <TabsContent value="trend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedYear}年 部门通报频次月度趋势
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                展示选定部门在{selectedYear}年各月的通报活动频次变化
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-96 bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={convertTrendDataToChart()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {getSelectedDepartmentNames().map((name, index) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 数据表格 */}
          <Card>
            <CardHeader>
              <CardTitle>详细数据表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>月份</TableHead>
                      {getSelectedDepartmentNames().map(name => (
                        <TableHead key={name}>{name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {convertTrendDataToChart().map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.month}</TableCell>
                        {getSelectedDepartmentNames().map(name => (
                          <TableCell key={name}>{row[name] || 0}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 排名统计 */}
        <TabsContent value="ranking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedYear}年度 部门通报排名 TOP 10</CardTitle>
                <p className="text-sm text-muted-foreground">
                  按全年通报频次排序
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-96 bg-muted" />
                ) : (
                  <div className="space-y-3">
                    {yearlyRanking.map((item, index) => (
                      <div
                        key={item.departmentId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? 'bg-yellow-500 text-white'
                                : index === 1
                                ? 'bg-gray-400 text-white'
                                : index === 2
                                ? 'bg-orange-600 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.departmentName}</span>
                        </div>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {item.count}次
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedYear}年{selectedMonth}月 部门通报排名 TOP 10
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  按当月通报频次排序
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-96 bg-muted" />
                ) : (
                  <div className="space-y-3">
                    {monthlyRanking.map((item, index) => (
                      <div
                        key={item.departmentId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? 'bg-yellow-500 text-white'
                                : index === 1
                                ? 'bg-gray-400 text-white'
                                : index === 2
                                ? 'bg-orange-600 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.departmentName}</span>
                        </div>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {item.count}次
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 部门对比 */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedYear}年 多部门通报频次对比
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                对比选定部门在各月的通报活跃度
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-96 bg-muted" />
              ) : selectedDepartments.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  请至少选择一个部门进行对比分析
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={convertComparisonDataToChart()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {getSelectedDepartmentNames().map((name, index) => (
                      <Bar
                        key={name}
                        dataKey={name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 高频时段 */}
        <TabsContent value="hotspot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>高频通报时段分析</CardTitle>
              <p className="text-sm text-muted-foreground">
                识别通报活动频繁的时间段及主要监管部门（阈值：≥5次）
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-96 bg-muted" />
              ) : (
                <div className="space-y-4">
                  {highFrequencyData.map((period, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {period.yearMonth}
                          </CardTitle>
                          <Badge variant="destructive" className="text-base px-3 py-1">
                            {period.totalCount}次通报
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            主要监管部门：
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {period.departments.slice(0, 6).map((dept: any) => (
                              <div
                                key={dept.departmentId}
                                className="flex items-center justify-between p-2 rounded border bg-card"
                              >
                                <span className="text-sm truncate flex-1">
                                  {dept.departmentName}
                                </span>
                                <Badge variant="outline" className="ml-2">
                                  {dept.count}次
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
