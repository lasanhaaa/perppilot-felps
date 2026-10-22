"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/icons";

export type TabItem<V extends string> = { value: V; label: ReactNode; icon?: IconName; count?: number };

/** Underlined page tabs with a count box ("⚡ Active [2]"). */
export function UnderlineTabs<V extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex items-stretch overflow-x-auto scrollbar-thin", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex h-14 shrink-0 items-center gap-2 border-b px-3 text-[16px] transition-colors",
              active ? "border-brand bg-fill-2 text-white" : "border-transparent text-white/40 hover:text-white/70",
            )}
          >
            {item.icon && <Icon name={item.icon} size={20} />}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 font-mono text-[14px] leading-[1.5]",
                  active ? "bg-brand/15 text-brand" : "bg-fill-2 text-white/40",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Boxed segmented control ("Market | Net Fees | Equity"). */
export function SegmentedTabs<V extends string>({
  items,
  value,
  onChange,
  size = "md",
  className,
}: {
  items: { value: V; label: ReactNode; disabled?: boolean; badge?: ReactNode }[];
  value: V;
  onChange: (value: V) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("inline-flex border border-line p-0.5", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap transition-colors disabled:cursor-not-allowed",
              size === "md" ? "h-9 px-3 text-[14px]" : "h-7 px-2 text-[12px]",
              active ? "bg-fill-3 text-white" : "text-white/50 hover:text-white/80",
            )}
          >
            {item.label}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
