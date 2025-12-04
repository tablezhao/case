import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendChartProps {
  data: { month: string; count: number }[] | { year: string; count: number }[];
  title: string;
  type?: 'monthly' | 'yearly';
}

export default function TrendChart({ data, title, type = 'monthly' }: TrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => ('month' in item ? item.month : item.year)),
        axisLabel: {
          rotate: type === 'monthly' ? 45 : 0,
        },
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '案例数量',
          type: 'line',
          smooth: true,
          data: data.map((item) => item.count),
          itemStyle: {
            color: 'hsl(var(--primary))',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'hsla(var(--primary), 0.3)',
                },
                {
                  offset: 1,
                  color: 'hsla(var(--primary), 0.05)',
                },
              ],
            },
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data, type]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full h-80" />
      </CardContent>
    </Card>
  );
}
