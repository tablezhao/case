import { useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TooltipInfo from '@/components/ui/tooltip-info';
import { chartPalette } from '@/lib/colors';

interface PieChartProps {
  data: { name: string; count: number }[];
  title: string;
  children?: ReactNode;
  tooltipContent?: ReactNode;
  showHeader?: boolean;
  className?: string;
  limit?: number;
  showPercentage?: boolean;
}

export default function PieChart({ 
  data, 
  title, 
  children, 
  tooltipContent, 
  showHeader = true, 
  className,
  limit,
  showPercentage = false
}: PieChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<'sm' | 'md' | 'lg'>('lg');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId = 0;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const nextLayout = width < 768 ? 'sm' : width < 1024 ? 'md' : 'lg';
        setLayout((prev) => (prev === nextLayout ? prev : nextLayout));
      });
    });

    observer.observe(container);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  const chartData = useMemo(() => {
    const maxLegendItems = limit || (layout === 'sm' ? 8 : layout === 'md' ? 12 : 15);
    const displayData = data.slice(0, maxLegendItems);

    if (data.length <= maxLegendItems) return displayData;

    const othersCount = data.slice(maxLegendItems).reduce((sum, item) => sum + item.count, 0);
    return [...displayData, { name: '其他', count: othersCount }];
  }, [data, layout, limit]);

  const option = useMemo<EChartsOption>(() => {
    const isSmallScreen = layout === 'sm';
    const isMediumScreen = layout === 'md';

    return {
      animation: false,
      animationDuration: 0,
      animationDurationUpdate: 0,
      animationEasing: 'linear',
      animationEasingUpdate: 'linear',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
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
        orient: isSmallScreen ? 'horizontal' : 'vertical',
        [isSmallScreen ? 'bottom' : 'right']: isSmallScreen ? '0%' : '5%',
        [isSmallScreen ? 'left' : 'top']: isSmallScreen ? 'center' : 'center',
        textStyle: {
          fontSize: isSmallScreen ? 10 : 11,
          overflow: 'truncate',
          width: isSmallScreen ? 70 : 100,
        },
        itemGap: isSmallScreen ? 6 : 8,
        itemWidth: isSmallScreen ? 10 : 12,
        itemHeight: isSmallScreen ? 10 : 12,
        type: 'scroll',
        pageButtonItemGap: 5,
        pageButtonGap: 10,
        pageIconSize: 12,
        pageTextStyle: {
          fontSize: 11,
        },
      },
      series: [
        {
          name: title,
          type: 'pie',
          radius: isSmallScreen ? ['30%', '55%'] : ['40%', '70%'],
          center: isSmallScreen ? ['50%', '40%'] : ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: showPercentage,
            position: 'outside',
            formatter: '{b}\n{d}%',
            fontSize: isSmallScreen ? 10 : 12,
            lineHeight: 15,
            color: '#666',
          },
          labelLine: {
            show: showPercentage,
            length: isSmallScreen ? 10 : 15,
            length2: isSmallScreen ? 10 : 15,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: isSmallScreen ? 14 : 16,
              fontWeight: 'bold',
              formatter: '{b}: {d}%',
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
          data: chartData.map((item, index) => ({
            name: item.name,
            value: item.count,
            itemStyle: {
              color: chartPalette[index % chartPalette.length],
            },
          })),
        },
      ],
    };
  }, [chartData, layout, showPercentage, title]);

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-xl">{title}</CardTitle>
            {tooltipContent && <TooltipInfo content={tooltipContent} />}
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div ref={containerRef} className="w-full h-96">
          {data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">暂无数据</div>
          ) : (
            <ReactECharts
              option={option}
              style={{ height: '100%', width: '100%', touchAction: 'none' }}
              notMerge
              lazyUpdate
              opts={{ renderer: 'svg' }}
            />
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
