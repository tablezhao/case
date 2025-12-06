import * as React from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface DateRangePickerProps {
  value?: { from?: Date; to?: Date };
  onChange?: (range: { from?: Date; to?: Date }) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = '选择日期范围',
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined
  );
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateChange = (newDate: DateRange | undefined) => {
    // 验证日期范围
    if (newDate?.from && newDate?.to && newDate.from > newDate.to) {
      toast.error('开始日期不能晚于结束日期');
      return;
    }

    setDate(newDate);
    if (onChange) {
      onChange({
        from: newDate?.from,
        to: newDate?.to,
      });
    }
  };

  // 快捷选项
  const quickOptions = [
    {
      label: '全部日期',
      getValue: () => ({
        from: undefined,
        to: undefined,
      }),
    },
    {
      label: '本月',
      getValue: () => {
        const now = new Date();
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      },
    },
    {
      label: '上月',
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      },
    },
    {
      label: '最近1周',
      getValue: () => ({
        from: subDays(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: '最近1个月',
      getValue: () => ({
        from: subMonths(new Date(), 1),
        to: new Date(),
      }),
    },
    {
      label: '最近3个月',
      getValue: () => ({
        from: subMonths(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: '最近6个月',
      getValue: () => ({
        from: subMonths(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: '最近1年',
      getValue: () => ({
        from: subMonths(new Date(), 12),
        to: new Date(),
      }),
    },
  ];

  const handleQuickSelect = (option: typeof quickOptions[0]) => {
    const range = option.getValue();
    handleDateChange(range);
    // 选择快捷选项后自动关闭弹窗
    setIsOpen(false);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal min-h-[44px]',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'yyyy-MM-dd', { locale: zhCN })} -{' '}
                  {format(date.to, 'yyyy-MM-dd', { locale: zhCN })}
                </>
              ) : (
                format(date.from, 'yyyy-MM-dd', { locale: zhCN })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            {/* 快捷选项 */}
            <div className="border-b sm:border-b-0 sm:border-r p-3 space-y-1 min-w-[120px]">
              <div className="text-sm font-medium mb-2 text-muted-foreground px-2">快捷选择</div>
              <div className="space-y-0.5">
                {quickOptions.map((option) => (
                  <Button
                    key={option.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm h-8 hover:bg-accent"
                    onClick={() => handleQuickSelect(option)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            {/* 日历 */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateChange}
                numberOfMonths={2}
                locale={zhCN}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
