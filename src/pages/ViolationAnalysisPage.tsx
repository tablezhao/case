import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getHighFrequencyIssues, getDepartments, getAvailableYears } from '@/db/api';
import { sortDepartments } from '@/utils/sortUtils';
import type { RegulatoryDepartment } from '@/types/types';
import ReactECharts from 'echarts-for-react';
import PageMeta from '@/components/common/PageMeta';
import { chartPalette } from '@/lib/colors';

// 数据维度类型
type DataDimension = 'all' | 'yearly' | 'monthly';

// 高频问题数据类型
interface HighFrequencyIssue {
  violation_issue: string;
  frequency: number;
  percentage: number;
}

export default function ViolationAnalysisPage() {
  // 筛选条件状态
  const [departments, setDepartments] = useState<RegulatoryDepartment[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [dataDimension, setDataDimension] = useState<DataDimension>('all');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('1');
  
  // 数据状态
  const [loading, setLoading] = useState(false);
  const [issuesData, setIssuesData] = useState<HighFrequencyIssue[]>([]);
  
  // 容器宽度状态，用于响应式布局
  const [containerWidth, setContainerWidth] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // 月份选项
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1}月`,
  }));

  // 初始化加载
  useEffect(() => {
    loadDepartments();
    loadAvailableYears();
  }, []);

  // 监听容器宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // 当筛选条件变化时重新加载数据
  useEffect(() => {
    if (dataDimension === 'all' || (dataDimension === 'yearly' && selectedYear) || (dataDimension === 'monthly' && selectedYear)) {
      loadHighFrequencyIssues();
    }
  }, [selectedDepartment, dataDimension, selectedYear, selectedMonth]);

  // 加载部门列表
  const loadDepartments = async () => {
    try {
      const depts = await getDepartments();
      const sortedDepts = sortDepartments(depts);
      setDepartments(sortedDepts);
    } catch (error) {
      console.error('加载部门列表失败:', error);
      toast.error('加载部门列表失败');
    }
  };

  // 加载可用年份
  const loadAvailableYears = async () => {
    try {
      const years = await getAvailableYears();
      setAvailableYears(years);
      if (years.length > 0) {
        setSelectedYear(years[0]); // 默认选择最新年份
      }
    } catch (error) {
      console.error('加载年份列表失败:', error);
      toast.error('加载年份列表失败');
    }
  };

  // 加载高频问题数据
  const loadHighFrequencyIssues = async () => {
    try {
      setLoading(true);
      
      const departmentId = selectedDepartment === 'all' ? undefined : selectedDepartment;
      const year = (dataDimension === 'yearly' || dataDimension === 'monthly') ? parseInt(selectedYear) : undefined;
      const month = dataDimension === 'monthly' ? parseInt(selectedMonth) : undefined;
      
      const data = await getHighFrequencyIssues(
        departmentId,
        dataDimension,
        year,
        month,
        10 // 获取前10个高频问题
      );
      
      setIssuesData(data);
    } catch (error) {
      console.error('加载高频问题数据失败:', error);
      toast.error('加载高频问题数据失败');
      setIssuesData([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理数据维度变化
  const handleDimensionChange = (value: DataDimension) => {
    setDataDimension(value);
    // 如果切换到按年或按月，确保有选中的年份
    if ((value === 'yearly' || value === 'monthly') && !selectedYear && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  };

  // 生成饼图配置
  const getPieChartOption = () => {
    if (issuesData.length === 0) {
      return null;
    }

    // 响应式布局判断
    const isSmallScreen = containerWidth < 768;

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}<br/>频次: {c}<br/>占比: {d}%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: {
          color: '#333',
          fontSize: 13,
        },
        padding: [10, 15],
      },
      legend: {
        // 小屏幕使用底部横向布局，大屏幕使用右侧纵向布局
        orient: isSmallScreen ? 'horizontal' : 'vertical',
        [isSmallScreen ? 'bottom' : 'right']: isSmallScreen ? '0%' : '5%',
        [isSmallScreen ? 'left' : 'top']: isSmallScreen ? 'center' : 'center',
        // 图例文字样式
        textStyle: {
          fontSize: isSmallScreen ? 11 : 12,
          overflow: 'truncate',
          width: isSmallScreen ? 80 : 120,
        },
        // 图例项之间的间距
        itemGap: isSmallScreen ? 8 : 10,
        // 图例图标大小
        itemWidth: isSmallScreen ? 12 : 14,
        itemHeight: isSmallScreen ? 12 : 14,
        // 启用图例滚动
        type: isSmallScreen ? 'scroll' : 'plain',
        pageButtonItemGap: 5,
        pageButtonGap: 10,
        pageIconSize: 12,
        pageTextStyle: {
          fontSize: 11,
        },
      },
      series: [
        {
          name: '违规问题',
          type: 'pie',
          // 根据屏幕大小调整饼图位置和大小
          radius: isSmallScreen ? ['30%', '55%'] : ['40%', '70%'],
          center: isSmallScreen ? ['50%', '40%'] : ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: isSmallScreen ? 16 : 20,
              fontWeight: 'bold',
            },
            itemStyle: {
              shadowBlur: 15,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
            scale: true,
            scaleSize: 10,
          },
          labelLine: {
            show: false,
          },
          data: issuesData.map((item, index) => ({
            value: item.frequency,
            name: item.violation_issue.length > 20 
              ? item.violation_issue.substring(0, 20) + '...' 
              : item.violation_issue,
            itemStyle: {
              // 使用与首页一致的配色方案
              color: chartPalette[index % chartPalette.length],
            },
          })),
        },
      ],
    };
  };

  const pieChartOption = getPieChartOption();

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <PageMeta description="高频违规问题统计分析" />
      
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">问题分析</h1>
        <p className="text-muted-foreground mt-2">统计分析高频违规问题，识别监管重点</p>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>选择监管部门和数据维度进行分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 监管部门筛选 */}
            <div className="space-y-2">
              <Label>监管部门</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 数据维度筛选 */}
            <div className="space-y-2">
              <Label>数据维度</Label>
              <Select value={dataDimension} onValueChange={handleDimensionChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部数据</SelectItem>
                  <SelectItem value="yearly">按年统计</SelectItem>
                  <SelectItem value="monthly">按月统计</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 年份筛选（当选择按年或按月时显示） */}
            {(dataDimension === 'yearly' || dataDimension === 'monthly') && (
              <div className="space-y-2">
                <Label>选择年份</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择年份" />
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
            )}

            {/* 月份筛选（当选择按月时显示） */}
            {dataDimension === 'monthly' && (
              <div className="space-y-2">
                <Label>选择月份</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 高频问题分析 */}
      <Card>
        <CardHeader>
          <CardTitle>高频问题分析（TOP 10）</CardTitle>
          <CardDescription>
            展示出现频次最高的10个违规问题及其占比分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-96 bg-muted" />
              <Skeleton className="h-64 bg-muted" />
            </div>
          ) : issuesData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={chartContainerRef}>
              {/* 左侧：饼图 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">问题分布饼图</h3>
                {pieChartOption && (
                  <ReactECharts
                    option={pieChartOption}
                    style={{ height: '500px', touchAction: 'none' }}
                    opts={{ renderer: 'svg' }}
                  />
                )}
              </div>

              {/* 右侧：详细表格 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">问题详情列表</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">排名</TableHead>
                        <TableHead>违规问题</TableHead>
                        <TableHead className="text-right w-20">频次</TableHead>
                        <TableHead className="text-right w-20">占比</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issuesData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">#{index + 1}</TableCell>
                          <TableCell 
                            className="max-w-xs truncate" 
                            title={item.violation_issue}
                          >
                            {item.violation_issue}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.frequency}
                          </TableCell>
                          <TableCell className="text-right text-primary font-medium">
                            {item.percentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">暂无数据</p>
              <p className="text-sm mt-2">请调整筛选条件后重试</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
