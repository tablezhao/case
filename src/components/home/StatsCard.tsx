import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import TooltipInfo from '@/components/ui/tooltip-info';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  change?: number;
  changePercent?: number;
  showTrend?: boolean;
  variant?: 'default' | 'gradient' | 'accent';
  trendLabel?: string; // 环比标签，如"较上月"、"较上季度"、"较上年度"
  tooltipContent?: React.ReactNode; // 统计口径说明（Tooltip内容）
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  change,
  changePercent,
  showTrend = false,
  variant = 'gradient',
  trendLabel = '较上月',
  tooltipContent,
}: StatsCardProps) {
  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    // 增长显示红色（警示），减少显示绿色（改善）
    return change > 0 ? 'text-destructive' : 'text-green-600';
  };

  const getTrendBadgeVariant = () => {
    if (change === undefined || change === 0) return 'secondary';
    return change > 0 ? 'destructive' : 'default';
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0) return Minus;
    return change > 0 ? ArrowUp : ArrowDown;
  };

  const TrendIcon = getTrendIcon();

  // 根据variant选择不同的样式
  const getCardStyles = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg';
      case 'accent':
        return 'bg-gradient-to-br from-background to-accent/5 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg';
      default:
        return 'hover:shadow-md transition-shadow duration-300';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'gradient':
        return 'h-8 w-8 p-1.5 rounded-lg bg-primary/10 text-primary';
      case 'accent':
        return 'h-8 w-8 p-1.5 rounded-lg bg-accent/10 text-accent';
      default:
        return 'h-5 w-5 text-muted-foreground';
    }
  };

  return (
    <Card className={cn('overflow-hidden', getCardStyles())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            {title}
          </CardTitle>
          {tooltipContent && <TooltipInfo content={tooltipContent} />}
        </div>
        <Icon className={getIconStyles()} />
      </CardHeader>
      <CardContent className="space-y-2">
        {/* 核心数据展示 - 适中字号 */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {value}
          </span>
          {variant === 'gradient' && (
            <span className="text-base font-medium text-muted-foreground">
              {title.includes('案例') ? '个' : title.includes('应用') ? '个' : ''}
            </span>
          )}
        </div>
        
        {/* 说明文字 - 小字号，次要信息 */}
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        
        {/* 趋势变化 - 使用Badge突出显示 */}
        {showTrend && change !== undefined && changePercent !== undefined && (
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/50">
            {change === 0 ? (
              // 当变化为0时，显示"持平 (0%)"
              <Badge 
                variant="secondary" 
                className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs"
              >
                <Minus className="h-2.5 w-2.5" />
                <span className="font-semibold">持平 (0%)</span>
              </Badge>
            ) : (
              // 当有变化时，显示具体数值
              <Badge 
                variant={getTrendBadgeVariant()} 
                className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs"
              >
                <TrendIcon className="h-2.5 w-2.5" />
                <span className="font-semibold">
                  {change > 0 ? '+' : ''}{change} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                </span>
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

