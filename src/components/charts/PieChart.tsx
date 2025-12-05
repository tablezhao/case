import { useEffect, useRef, useState, ReactNode } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { chartPalette } from '@/lib/colors';

interface PieChartProps {
  data: { name: string; count: number }[];
  title: string;
  children?: ReactNode;
}

export default function PieChart({ data, title, children }: PieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const chart = echarts.init(chartRef.current);
    const width = chartRef.current.offsetWidth;
    setContainerWidth(width);

    // 响应式图例配置
    const isSmallScreen = width < 768;
    const isMediumScreen = width >= 768 && width < 1024;
    
    // 限制显示的图例数量，避免重叠
    const maxLegendItems = isSmallScreen ? 5 : isMediumScreen ? 8 : 10;
    const displayData = data.slice(0, maxLegendItems);
    
    // 如果有更多数据，合并为"其他"
    let chartData = displayData;
    if (data.length > maxLegendItems) {
      const othersCount = data.slice(maxLegendItems).reduce((sum, item) => sum + item.count, 0);
      chartData = [
        ...displayData,
        { name: '其他', count: othersCount }
      ];
    }

    const option = {
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
          name: title,
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

    chart.setOption(option);

    const handleResize = () => {
      const newWidth = chartRef.current?.offsetWidth || 0;
      setContainerWidth(newWidth);
      chart.resize();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data, title, containerWidth]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full h-96" />
        {children}
      </CardContent>
    </Card>
  );
}
