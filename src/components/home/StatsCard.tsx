import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  change?: number;
  changePercent?: number;
  showTrend?: boolean;
  variant?: 'default' | 'gradient' | 'accent';
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
        return 'h-10 w-10 p-2 rounded-lg bg-primary/10 text-primary';
      case 'accent':
        return 'h-10 w-10 p-2 rounded-lg bg-accent/10 text-accent';
      default:
        return 'h-5 w-5 text-muted-foreground';
    }
  };

  return (
    <Card className={cn('overflow-hidden', getCardStyles())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
          {title}
        </CardTitle>
        <Icon className={getIconStyles()} />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 核心数据展示 - 超大字号，强烈视觉冲击 */}
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {value}
          </span>
          {variant === 'gradient' && (
            <span className="text-lg font-medium text-muted-foreground">
              {title.includes('案例') ? '个' : title.includes('应用') ? '个' : ''}
            </span>
          )}
        </div>
        
        {/* 说明文字 - 中等字号，次要信息 */}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        
        {/* 趋势变化 - 使用Badge突出显示 */}
        {showTrend && change !== undefined && changePercent !== undefined && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Badge 
              variant={getTrendBadgeVariant()} 
              className="flex items-center gap-1 px-2 py-1"
            >
              <TrendIcon className="h-3 w-3" />
              <span className="font-semibold">
                {change > 0 ? '+' : ''}{change} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
              </span>
            </Badge>
            <span className="text-xs text-muted-foreground">较上月</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

