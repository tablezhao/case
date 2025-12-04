import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted/50 inline-flex h-11 w-fit items-center justify-center rounded-lg p-1 gap-1",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // 基础样式
        "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2",
        "text-sm font-medium whitespace-nowrap transition-all duration-200",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        
        // 未激活态样式 - 低饱和度，清晰但视觉权重低
        "text-muted-foreground bg-transparent",
        "border border-transparent",
        
        // 悬停态样式 - 微妙的背景色变化
        "hover:bg-background/60 hover:text-foreground",
        "hover:border-border/50",
        
        // 激活态样式 - 使用品牌主色，高对比度
        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
        "data-[state=active]:shadow-sm data-[state=active]:border-primary",
        "dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground",
        
        // 焦点样式
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
