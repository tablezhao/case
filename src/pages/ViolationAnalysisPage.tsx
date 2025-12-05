import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getViolationTypeAnalysis,
  getViolationTimeTrend,
  getViolationDepartmentAnalysis,
  getViolationSeverityAnalysis,
  exportViolationAnalysis,
  getDepartments,
} from '@/db/api';
import type { RegulatoryDepartment } from '@/types/types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#FF6B35',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#52B788',
  '#E76F51',
  '#2A9D8F',
  '#E9C46A',
];

export default function ViolationAnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<RegulatoryDepartment[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // 违规问题分析数据
  const [violationTypeData, setViolationTypeData] = useState<any[]>([]);
  const [violationTrendData, setViolationTrendData] = useState<any[]>([]);
  const [violationDeptData, setViolationDeptData] = useState<any[]>([]);
  const [violationSeverityData, setViolationSeverityData] = useState<any>(null);

  // 生成最近6年的年份选项
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadAnalysisData();
  }, [selectedYear, selectedDepartments]);

  const loadDepartments = async () => {
    try {
      const depts = await getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('加载部门数据失败:', error);
    }
  };

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('加载分析数据失败:', error);
      toast.error('加载分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (value: string) => {
    if (value === 'all') {
      setSelectedDepartments([]);
    } else {
      if (selectedDepartments.includes(value)) {
        setSelectedDepartments(selectedDepartments.filter(id => id !== value));
      } else {
        if (selectedDepartments.length >= 5) {
          toast.error('最多只能选择5个监管部门');
          return;
        }
        setSelectedDepartments([...selectedDepartments, value]);
      }
    }
  };

  const handleExportViolationData = async () => {
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      const deptIds = selectedDepartments.length > 0 ? selectedDepartments : undefined;

      const data = await exportViolationAnalysis(deptIds, startDate, endDate);

      if (data.length === 0) {
        toast.error('没有可导出的数据');
        return;
      }

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

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">问题分析</h1>
          <p className="text-muted-foreground mt-2">深度分析违规问题的多维度数据，识别高频问题和监管重点</p>
        </div>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">选择年份</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">选择监管部门（最多5个）</label>
              <Select onValueChange={handleDepartmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    selectedDepartments.length === 0
                      ? '全部部门'
                      : `已选择 ${selectedDepartments.length} 个部门`
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {selectedDepartments.includes(dept.id) ? '✓ ' : ''}{dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDepartments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDepartments.map(deptId => {
                    const dept = departments.find(d => d.id === deptId);
                    return dept ? (
                      <Badge key={deptId} variant="secondary" className="cursor-pointer" onClick={() => handleDepartmentChange(deptId)}>
                        {dept.name} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
