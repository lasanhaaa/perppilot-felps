import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "@/components/ui/primitives";

/** Top header of platform pages: title + description, optional back button and actions. */
export function PageHeader({
  title,
  description,
  back,
  actions,
  border = true,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: string;
  actions?: ReactNode;
  border?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex items-center gap-4 py-6",
        // No class merging in this project: only add the defaults the caller did not override.
        !/\bmin-h-/.test(className ?? "") && "min-h-[108px]",
        !/\bpx-/.test(className ?? "") && "px-14",
        border && "border-b border-line",
        className,
      )}
    >
      {back && <IconButton href={back} label="Back" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="t-h24">{title}</h1>
        {description && <p className="t-b16 text-white/60">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4 px-14 py-8", className)}>{children}</div>;
}
