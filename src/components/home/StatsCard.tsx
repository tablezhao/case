import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  change,
  changePercent,
  showTrend = false,
}: StatsCardProps) {
  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    // 增长显示红色（警示），减少显示绿色（改善）
    return change > 0 ? 'text-red-600' : 'text-green-600';
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0) return Minus;
    return change > 0 ? ArrowUp : ArrowDown;
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        
        {showTrend && change !== undefined && changePercent !== undefined && (
          <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', getTrendColor())}>
            <TrendIcon className="h-3 w-3" />
            <span>
              {change > 0 ? '+' : ''}{change} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
            </span>
            <span className="text-muted-foreground ml-1">较上月</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

