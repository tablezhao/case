import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { chartColorsWithAlpha, chartColors } from '@/lib/colors';

interface TrendData {
  month: string;
  count: number;
}

interface TrendOverviewChartProps {
  data: TrendData[];
  timeRange: 'recent6' | 'thisYear' | 'all';
}

export default function TrendOverviewChart({ data, timeRange }: TrendOverviewChartProps) {
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return [...data].sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  const formatMonth = (month: string) => {
    const [year, mon] = month.split('-');
    return `${year}年${mon}月`;
  };

  const rangeLabel =
    timeRange === 'recent6' ? '近6个月' : timeRange === 'thisYear' ? '本年至今' : '全部';

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        暂无数据
      </div>
    );
  }

  const option = useMemo<EChartsOption>(() => {
    return {
      animation: false,
      animationDuration: 0,
      animationDurationUpdate: 0,
      animationEasing: 'linear',
      animationEasingUpdate: 'linear',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: chartColors.primary,
        borderWidth: 1,
        textStyle: {
          color: '#333',
          fontSize: 13,
        },
        padding: [10, 14],
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const first = params[0];
          if (!first || typeof first !== 'object') return '';

          const maybe = first as { axisValue?: string; data?: number; value?: number };
          const month = typeof maybe.axisValue === 'string' ? maybe.axisValue : '';
          const value =
            typeof maybe.data === 'number'
              ? maybe.data
              : typeof maybe.value === 'number'
                ? maybe.value
                : 0;

          return [
            `<div style="font-weight:600;margin-bottom:4px;">${formatMonth(month)}</div>`,
            `<div style="color:${chartColors.primary};font-weight:600;">应用数量：${value} 个</div>`,
            `<div style="margin-top:4px;color:#666;font-size:12px;">范围：${rangeLabel}</div>`,
          ].join('');
        },
      },
      grid: {
        left: 36,
        right: 20,
        top: 18,
        bottom: 42,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: filteredData.map((d) => d.month),
        axisLabel: {
          formatter: (value: string) => formatMonth(value),
          color: '#666',
          fontSize: 12,
        },
        axisLine: { lineStyle: { color: '#ddd' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#666',
          fontSize: 12,
        },
        splitLine: { lineStyle: { color: '#eee' } },
      },
      series: [
        {
          name: '应用数量',
          type: 'line',
          smooth: true,
          data: filteredData.map((d) => d.count),
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: chartColors.primary,
          },
          itemStyle: {
            color: chartColors.primary,
            borderColor: '#fff',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: chartColorsWithAlpha.primary(0.28) },
                { offset: 1, color: chartColorsWithAlpha.primary(0.02) },
              ],
            },
          },
        },
      ],
    };
  }, [filteredData, rangeLabel]);

  return (
    <div className="w-full h-[300px]">
      <ReactECharts
        option={option}
        style={{ height: 300, width: '100%', touchAction: 'none' }}
        notMerge
        lazyUpdate
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}


