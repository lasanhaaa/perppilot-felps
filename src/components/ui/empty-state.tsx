import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/icons";

/** Centered empty state from the live hub ("No bots yet", "No exchange accounts"). */
export function EmptyState({ icon = "bot", title, description, actions, className }: { icon?: IconName; title: string; description: string; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-4 py-14 text-center", className)}>
      <Icon name={icon} size={28} className="mb-2 text-white/50" />
      <p className="text-[16px] font-medium">{title}</p>
      <p className="max-w-[420px] text-[14px] text-white/60">{description}</p>
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
