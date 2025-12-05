import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatisticsInfoItem {
  label: string;
  description: string;
  icon?: string;
}

interface StatisticsInfoProps {
  title?: string;
  items: StatisticsInfoItem[];
  className?: string;
}

export default function StatisticsInfo({ 
  title = '统计说明', 
  items,
  className 
}: StatisticsInfoProps) {
  return (
    <div className={cn(
      'mt-4 border-2 border-primary/20 rounded-lg overflow-hidden',
      className
    )}>
      {/* 标题栏 - 使用浅色背景和深色文字 */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-primary/10">
        <Info className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      
      {/* 内容区域 - 白色背景，深色文字 */}
      <div className="px-4 py-3 bg-background space-y-2.5">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2.5">
            {/* 图标或序号 */}
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {item.icon ? (
                <span className="text-base">{item.icon}</span>
              ) : (
                <span className="text-xs font-semibold text-primary">
                  {index + 1}
                </span>
              )}
            </div>
            
            {/* 内容 */}
            <div className="flex-1 text-sm leading-relaxed">
              <span className="font-semibold text-foreground">{item.label}</span>
              <span className="text-foreground/80">：{item.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
