import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendData {
  month: string;
  count: number;
}

interface TrendOverviewChartProps {
  data: TrendData[];
  timeRange: 'recent6' | 'thisYear' | 'all';
}

export default function TrendOverviewChart({ data, timeRange }: TrendOverviewChartProps) {
  // 数据已在服务端筛选，只需确保排序正确
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // 确保数据按月份排序，保证时间序列的连续性和可读性
    return [...data].sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  // 格式化月份显示
  const formatMonth = (month: string) => {
    const [year, mon] = month.split('-');
    return `${year}年${mon}月`;
  };

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-medium">{formatMonth(payload[0].payload.month)}</p>
          <p className="text-sm text-primary font-semibold">
            应用数量：{payload[0].value} 个
          </p>
        </div>
      );
    }
    return null;
  };

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{ value: '应用数量', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}



