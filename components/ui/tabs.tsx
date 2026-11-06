"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

/* Tab set built on Base UI, which owns the tablist roles, aria-selected,
   arrow-key movement and the panel hookup. Tabs are the site's pills; the
   active one fills in brand cyan, so the state never rests on colour alone
   (the fill is a shape change too) and aria-selected carries it to
   assistive tech. A tab switch is a high-frequency interaction, so only
   colour moves, in 150ms, and the panel swaps without animation. */

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  );
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "inline-flex h-9 cursor-pointer select-none items-center rounded-full border border-transparent bg-card px-3.5 text-sm font-medium text-foreground shadow-ring outline-none",
        "transition-[color,background-color,transform] duration-150 ease-hover",
        "hover:bg-muted active:scale-[0.97]",
        "data-active:bg-brand-cyan data-active:text-white data-active:shadow-none data-active:hover:bg-brand-cyan",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn(
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTab, TabsPanel };
