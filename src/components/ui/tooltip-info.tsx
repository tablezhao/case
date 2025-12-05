import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TooltipInfoProps {
  content: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export default function TooltipInfo({ content, className, iconClassName }: TooltipInfoProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              className
            )}
            onClick={(e) => e.preventDefault()}
          >
            <Info className={cn("w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs sm:max-w-sm p-3 text-sm bg-background text-foreground border-2 border-primary/20 shadow-lg"
          sideOffset={5}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
