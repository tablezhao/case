// ECharts颜色配置 - 使用实际的HSL值而不是CSS变量
// Canvas渲染器无法解析CSS变量格式

export const chartColors = {
  primary: 'hsl(213, 78%, 35%)',
  primaryLight: 'hsl(213, 78%, 45%)',
  secondary: 'hsl(18, 95%, 55%)',
  chart1: 'hsl(213, 78%, 35%)',
  chart2: 'hsl(142, 71%, 35%)',
  chart3: 'hsl(18, 95%, 55%)',
  chart4: 'hsl(280, 65%, 45%)',
  chart5: 'hsl(340, 75%, 45%)',
  chart6: 'hsl(195, 70%, 50%)',
  chart7: 'hsl(45, 85%, 55%)',
  chart8: 'hsl(160, 60%, 45%)',
  chart9: 'hsl(25, 80%, 50%)',
  chart10: 'hsl(260, 55%, 50%)',
};

// 带透明度的颜色
export const chartColorsWithAlpha = {
  primary: (alpha: number) => `hsla(213, 78%, 35%, ${alpha})`,
  primaryLight: (alpha: number) => `hsla(213, 78%, 45%, ${alpha})`,
  secondary: (alpha: number) => `hsla(18, 95%, 55%, ${alpha})`,
  chart1: (alpha: number) => `hsla(213, 78%, 35%, ${alpha})`,
  chart2: (alpha: number) => `hsla(142, 71%, 35%, ${alpha})`,
  chart3: (alpha: number) => `hsla(18, 95%, 55%, ${alpha})`,
  chart4: (alpha: number) => `hsla(280, 65%, 45%, ${alpha})`,
  chart5: (alpha: number) => `hsla(340, 75%, 45%, ${alpha})`,
  chart6: (alpha: number) => `hsla(195, 70%, 50%, ${alpha})`,
  chart7: (alpha: number) => `hsla(45, 85%, 55%, ${alpha})`,
  chart8: (alpha: number) => `hsla(160, 60%, 45%, ${alpha})`,
  chart9: (alpha: number) => `hsla(25, 80%, 50%, ${alpha})`,
  chart10: (alpha: number) => `hsla(260, 55%, 50%, ${alpha})`,
};

// 图表调色板 - 扩展到10种颜色以支持更多数据展示
export const chartPalette = [
  chartColors.chart1,
  chartColors.chart2,
  chartColors.chart3,
  chartColors.chart4,
  chartColors.chart5,
  chartColors.chart6,
  chartColors.chart7,
  chartColors.chart8,
  chartColors.chart9,
  chartColors.chart10,
];
