import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WordCloudProps {
  data: { name: string; value: number }[];
  title: string;
}

export default function WordCloud({ data, title }: WordCloudProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        show: true,
      },
      series: [
        {
          type: 'wordCloud',
          shape: 'circle',
          left: 'center',
          top: 'center',
          width: '90%',
          height: '90%',
          right: null,
          bottom: null,
          sizeRange: [12, 40],
          rotationRange: [-45, 45],
          rotationStep: 45,
          gridSize: 8,
          drawOutOfBound: false,
          layoutAnimation: true,
          textStyle: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            color: () => {
              const colors = [
                'hsl(var(--primary))',
                'hsl(var(--secondary))',
                'hsl(var(--chart-3))',
                'hsl(var(--chart-4))',
                'hsl(var(--chart-5))',
              ];
              return colors[Math.floor(Math.random() * colors.length)];
            },
          },
          emphasis: {
            focus: 'self',
            textStyle: {
              textShadowBlur: 10,
              textShadowColor: '#333',
            },
          },
          data: data,
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
        <div ref={chartRef} className="w-full h-80" />
      </CardContent>
    </Card>
  );
}
