import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { chartColors, chartColorsWithAlpha } from '@/lib/colors';

interface TrendData {
  month?: string;
  year?: string;
  count: number;
}

interface TrendComparisonChartProps {
  appData: TrendData[];
  reportData: TrendData[];
  type?: 'monthly' | 'yearly';
  mode: 'app' | 'report' | 'comparison';
}

export default function TrendComparisonChart({ 
  appData, 
  reportData, 
  type = 'monthly',
  mode 
}: TrendComparisonChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (mode === 'app' && !appData.length) return;
    if (mode === 'report' && !reportData.length) return;
    if (mode === 'comparison' && (!appData.length || !reportData.length)) return;

    const chart = echarts.init(chartRef.current);

    // 准备数据
    const xAxisData = mode === 'app' 
      ? appData.map((item) => ('month' in item ? item.month : item.year))
      : mode === 'report'
      ? reportData.map((item) => ('month' in item ? item.month : item.year))
      : appData.map((item) => ('month' in item ? item.month : item.year));

    // 构建系列数据
    const series: any[] = [];

    if (mode === 'app' || mode === 'comparison') {
      series.push({
        name: '通报应用数量',
        type: 'line',
        smooth: true,
        data: appData.map((item) => item.count),
        lineStyle: {
          width: 3,
          color: chartColors.chart1,
        },
        itemStyle: {
          color: chartColors.chart1,
          borderWidth: 2,
          borderColor: '#fff',
        },
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: chartColorsWithAlpha.chart1(0.5),
          },
          scale: 1.2,
        },
        areaStyle: mode === 'app' ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: chartColorsWithAlpha.chart1(0.3),
              },
              {
                offset: 1,
                color: chartColorsWithAlpha.chart1(0.05),
              },
            ],
          },
        } : undefined,
      });
    }

    if (mode === 'report' || mode === 'comparison') {
      series.push({
        name: '通报频次',
        type: 'line',
        smooth: true,
        data: reportData.map((item) => item.count),
        lineStyle: {
          width: 3,
          color: chartColors.chart2,
        },
        itemStyle: {
          color: chartColors.chart2,
          borderWidth: 2,
          borderColor: '#fff',
        },
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: chartColorsWithAlpha.chart2(0.5),
          },
          scale: 1.2,
        },
        areaStyle: mode === 'report' ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: chartColorsWithAlpha.chart2(0.3),
              },
              {
                offset: 1,
                color: chartColorsWithAlpha.chart2(0.05),
              },
            ],
          },
        } : undefined,
      });
    }

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
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
      legend: mode === 'comparison' ? {
        data: ['通报应用数量', '通报频次'],
        top: 10,
        textStyle: {
          fontSize: 13,
        },
      } : undefined,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: mode === 'comparison' ? '15%' : '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
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
      series,
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [appData, reportData, type, mode]);

  return <div ref={chartRef} className="w-full h-80" />;
}
