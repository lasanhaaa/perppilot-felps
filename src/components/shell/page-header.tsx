import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";

/** Title + subtitle on the left, actions on the right (Figma: Top header). */
export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 px-4 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14 lg:pt-6", className)}>
      <div className="flex items-center gap-4">
        {backHref && (
          <Link href={backHref} aria-label="Back" className="grid size-12 shrink-0 place-items-center bg-fill-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <Icon name="arrow-back" size={24} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-[24px] leading-[1.3] tracking-[-0.01em] sm:text-[24px]">{title}</h1>
          {subtitle && <div className="text-[14px] leading-[1.5] text-white/60">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/** Content padding shared by platform pages. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-4 pb-16 sm:px-8 lg:px-14", className)}>{children}</div>;
}
