import * as React from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfQuarter, subQuarters, endOfQuarter } from 'date-fns';
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
      label: '今天',
      getValue: () => {
        const today = new Date();
        return { from: today, to: today };
      },
    },
    {
      label: '昨天',
      getValue: () => {
        const yesterday = subDays(new Date(), 1);
        return { from: yesterday, to: yesterday };
      },
    },
    {
      label: '最近7天',
      getValue: () => ({
        from: subDays(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: '最近15天',
      getValue: () => ({
        from: subDays(new Date(), 14),
        to: new Date(),
      }),
    },
    {
      label: '最近30天',
      getValue: () => ({
        from: subDays(new Date(), 29),
        to: new Date(),
      }),
    },
    {
      label: '本周',
      getValue: () => ({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      }),
    },
    {
      label: '上周',
      getValue: () => {
        const lastWeek = subDays(new Date(), 7);
        return {
          from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        };
      },
    },
    {
      label: '本月',
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      }),
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
      label: '本季度',
      getValue: () => ({
        from: startOfQuarter(new Date()),
        to: endOfQuarter(new Date()),
      }),
    },
    {
      label: '上季度',
      getValue: () => {
        const lastQuarter = subQuarters(new Date(), 1);
        return {
          from: startOfQuarter(lastQuarter),
          to: endOfQuarter(lastQuarter),
        };
      },
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
