// ECharts颜色配置 - 使用实际的HSL值而不是CSS变量
// Canvas渲染器无法解析CSS变量格式

export const chartColors = {
  primary: 'hsl(213, 65%, 33%)',
  primaryLight: 'hsl(213, 65%, 45%)',
  secondary: 'hsl(18, 100%, 60%)',
  chart1: 'hsl(213, 65%, 33%)',
  chart2: 'hsl(18, 100%, 60%)',
  chart3: 'hsl(173, 58%, 39%)',
  chart4: 'hsl(43, 74%, 66%)',
  chart5: 'hsl(280, 65%, 60%)',
};

// 带透明度的颜色
export const chartColorsWithAlpha = {
  primary: (alpha: number) => `hsla(213, 65%, 33%, ${alpha})`,
  primaryLight: (alpha: number) => `hsla(213, 65%, 45%, ${alpha})`,
  secondary: (alpha: number) => `hsla(18, 100%, 60%, ${alpha})`,
  chart1: (alpha: number) => `hsla(213, 65%, 33%, ${alpha})`,
  chart2: (alpha: number) => `hsla(18, 100%, 60%, ${alpha})`,
  chart3: (alpha: number) => `hsla(173, 58%, 39%, ${alpha})`,
  chart4: (alpha: number) => `hsla(43, 74%, 66%, ${alpha})`,
  chart5: (alpha: number) => `hsla(280, 65%, 60%, ${alpha})`,
};

// 图表调色板
export const chartPalette = [
  chartColors.chart1,
  chartColors.chart2,
  chartColors.chart3,
  chartColors.chart4,
  chartColors.chart5,
];
