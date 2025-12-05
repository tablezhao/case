import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Calendar, Building2, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDepartments,
  getDepartmentTimeTrend,
  getDepartmentYearlyRanking,
  getDepartmentMonthlyRanking,
  getMultiDepartmentComparison,
  getHighFrequencyPeriods,
  getViolationTypeAnalysis,
  getViolationTimeTrend,
  getViolationDepartmentAnalysis,
  getViolationSeverityAnalysis,
  exportViolationAnalysis,
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
  PieChart,
  Pie,
  Cell,
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

  // 违规问题分析数据状态
  const [violationTypeData, setViolationTypeData] = useState<any[]>([]);
  const [violationTrendData, setViolationTrendData] = useState<any[]>([]);
  const [violationDeptData, setViolationDeptData] = useState<any[]>([]);
  const [violationSeverityData, setViolationSeverityData] = useState<any>(null);

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
      } else if (activeTab === 'violation') {
        // 加载违规问题分析数据
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;
        const deptIds = selectedDepartments.length > 0 ? selectedDepartments : undefined;

        const [typeData, trendData, deptData, severityData] = await Promise.all([
          getViolationTypeAnalysis(deptIds, startDate, endDate),
          getViolationTimeTrend(deptIds, selectedYear, 'month'),
          getViolationDepartmentAnalysis(selectedYear, 10),
          getViolationSeverityAnalysis(selectedYear),
        ]);

        setViolationTypeData(typeData);
        setViolationTrendData(trendData);
        setViolationDeptData(deptData);
        setViolationSeverityData(severityData);
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

  // 导出违规问题分析数据
  const handleExportViolationData = async () => {
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      const deptIds = selectedDepartments.length > 0 ? selectedDepartments : undefined;

      const data = await exportViolationAnalysis(deptIds, startDate, endDate);

      // 转换为CSV格式
      const headers = ['通报日期', '应用名称', '开发者', '监管部门', '应用平台', '违规内容', '违规关键词'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => [
          row.report_date,
          `"${row.app_name}"`,
          `"${row.app_developer}"`,
          `"${row.department}"`,
          `"${row.platform}"`,
          `"${row.violation_content.replace(/"/g, '""')}"`,
          `"${row.violation_keywords.replace(/"/g, '""')}"`,
        ].join(','))
      ].join('\n');

      // 创建下载链接
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `违规问题分析_${selectedYear}.csv`;
      link.click();

      toast.success('数据导出成功');
    } catch (error) {
      console.error('导出数据失败:', error);
      toast.error('导出数据失败');
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">监管趋势多维度分析</h1>
        <p className="text-muted-foreground">
          深度分析监管部门、通报频次、时间维度之间的关联关系
        </p>
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
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="violation" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            违规问题
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

        {/* 违规问题分析 */}
        <TabsContent value="violation" className="space-y-6">
          {/* 操作栏 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">违规问题深度分析</h3>
                </div>
                <Button onClick={handleExportViolationData} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  导出分析数据
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 违规类型分布 */}
          <Card>
            <CardHeader>
              <CardTitle>违规类型分布（TOP 15）</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-96 bg-muted" />
              ) : violationTypeData.length > 0 ? (
                <div className="space-y-4">
                  {/* 饼图 */}
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={violationTypeData.slice(0, 15)}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={(entry) => `${entry.type.substring(0, 15)}${entry.type.length > 15 ? '...' : ''}`}
                      >
                        {violationTypeData.slice(0, 15).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* 详细列表 */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">排名</TableHead>
                          <TableHead>违规类型</TableHead>
                          <TableHead className="text-right w-24">出现次数</TableHead>
                          <TableHead className="text-right w-24">占比</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {violationTypeData.slice(0, 15).map((item, index) => {
                          const total = violationTypeData.reduce((sum, v) => sum + v.count, 0);
                          const percentage = ((item.count / total) * 100).toFixed(1);
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">#{index + 1}</TableCell>
                              <TableCell className="max-w-md truncate" title={item.type}>
                                {item.type}
                              </TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                              <TableCell className="text-right">{percentage}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  暂无违规类型数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* 违规问题时间趋势 */}
          <Card>
            <CardHeader>
              <CardTitle>违规问题时间趋势（{selectedYear}年）</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-96 bg-muted" />
              ) : violationTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={violationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="违规问题数量"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  暂无时间趋势数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* 违规问题与部门关联 */}
          <Card>
            <CardHeader>
              <CardTitle>违规问题与监管部门关联分析（TOP 10）</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-96 bg-muted" />
              ) : violationDeptData.length > 0 ? (
                <div className="space-y-6">
                  {violationDeptData.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            #{index + 1} {item.violation}
                          </CardTitle>
                          <Badge variant="secondary" className="text-base px-3 py-1">
                            共{item.total}次
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            主要监管部门：
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {item.departments.slice(0, 6).map((dept: any) => (
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
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  暂无部门关联数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* 违规问题严重程度分析 */}
          <Card>
            <CardHeader>
              <CardTitle>违规问题严重程度分析（基于频次）</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-96 bg-muted" />
              ) : violationSeverityData ? (
                <div className="space-y-6">
                  {/* 高频违规问题 */}
                  {violationSeverityData.high.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="destructive" className="text-base px-3 py-1">
                          高频问题
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          （出现频次 ≥ 最大值的60%）
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {violationSeverityData.high.map((item: any, index: number) => (
                          <Card key={index} className="border-l-4 border-l-destructive">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium truncate flex-1">
                                  {item.violation}
                                </span>
                                <Badge variant="destructive" className="ml-2">
                                  {item.count}次
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 中频违规问题 */}
                  {violationSeverityData.medium.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="text-base px-3 py-1 bg-orange-500">
                          中频问题
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          （出现频次 ≥ 最大值的30%）
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {violationSeverityData.medium.slice(0, 12).map((item: any, index: number) => (
                          <Card key={index} className="border-l-4 border-l-orange-500">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm truncate flex-1" title={item.violation}>
                                  {item.violation}
                                </span>
                                <Badge variant="outline" className="ml-2">
                                  {item.count}次
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 低频违规问题统计 */}
                  {violationSeverityData.low.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          低频问题
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          （共{violationSeverityData.low.length}种，仅显示前15种）
                        </span>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>违规类型</TableHead>
                              <TableHead className="text-right w-24">出现次数</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {violationSeverityData.low.slice(0, 15).map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="max-w-md truncate" title={item.violation}>
                                  {item.violation}
                                </TableCell>
                                <TableCell className="text-right">{item.count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  暂无严重程度分析数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
