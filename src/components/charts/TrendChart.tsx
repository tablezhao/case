import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { chartColors, chartColorsWithAlpha } from '@/lib/colors';

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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: chartColors.primary,
        borderWidth: 1,
        textStyle: {
          color: '#333',
          fontSize: 13,
        },
        padding: [10, 15],
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
          fontSize: 12,
          color: '#666',
        },
        axisLine: {
          lineStyle: {
            color: '#ddd',
            width: 1,
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 12,
          color: '#666',
        },
        splitLine: {
          lineStyle: {
            color: '#eee',
            width: 1,
          },
        },
      },
      series: [
        {
          name: '应用数量',
          type: 'line',
          smooth: true,
          data: data.map((item) => item.count),
          lineStyle: {
            width: 3,
            color: chartColors.primary,
          },
          itemStyle: {
            color: chartColors.primary,
            borderWidth: 2,
            borderColor: '#fff',
          },
          symbol: 'circle',
          symbolSize: 8,
          emphasis: {
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: chartColorsWithAlpha.primary(0.5),
            },
            scale: 1.2,
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
                  color: chartColorsWithAlpha.primary(0.3),
                },
                {
                  offset: 1,
                  color: chartColorsWithAlpha.primary(0.05),
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
