import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { chartColors } from '@/lib/colors';

interface GeoChartProps {
  data: { province: string; count: number }[];
  title: string;
}

export default function GeoChart({ data, title }: GeoChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const chart = echarts.init(chartRef.current);

    // 按数值降序排序，取前15个
    const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 15);

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
        type: 'value',
      },
      yAxis: {
        type: 'category',
        data: sortedData.map((item) => item.province),
        inverse: true, // 反转y轴，使最大值显示在顶部
      },
      series: [
        {
          name: '案例数量',
          type: 'bar',
          data: sortedData.map((item) => item.count),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: chartColors.primary,
                },
                {
                  offset: 1,
                  color: chartColors.primaryLight,
                },
              ],
            },
            borderRadius: [0, 4, 4, 0],
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
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full h-96" />
      </CardContent>
    </Card>
  );
}
