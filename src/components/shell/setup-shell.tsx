import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, Logo } from "@/components/ui/icons";

/**
 * Full-screen flows (Setup your profile, Create bot): "Setup top bar" (2066:4561) with the
 * "Setup stepper" (2066:4560) in the middle and Exit on the right. No side menu.
 */
export function SetupShell({
  steps,
  current,
  exitLabel = "Exit setup",
  exitHref = "/overview",
  children,
  align = "center",
}: {
  steps: string[];
  /** 0-based; steps.length means every step is done. */
  current: number;
  exitLabel?: string;
  exitHref?: string;
  children: ReactNode;
  align?: "center" | "top";
}) {
  return (
    <div className="flex min-h-screen flex-col bg-screen">
      <header className="sticky top-0 z-30 grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-screen px-8">
        <Link href="/overview" aria-label="PerpPilot home" className="justify-self-start">
          <Logo />
        </Link>
        <Stepper steps={steps} current={current} />
        <Link href={exitHref} className="t-l12 flex items-center gap-1.5 justify-self-end text-white/60 transition-colors hover:text-white">
          <Icon name="close" size={16} />
          {exitLabel}
        </Link>
      </header>
      <main className={cn("flex flex-1 justify-center px-6", align === "center" ? "items-center py-12" : "items-start pt-12 pb-16")}>
        <div className="anim-rise flex w-full justify-center">{children}</div>
      </main>
    </div>
  );
}

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-3">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-3">
            {i > 0 && <span className={cn("h-px w-10", i <= current ? "bg-success" : "bg-line")} />}
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-[2px] text-[12px] leading-[18px] font-medium",
                  done ? "bg-success/10 text-success" : active ? "bg-white text-black" : "bg-raised text-white/30",
                )}
              >
                {done ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className={cn("t-l12", done ? "text-success" : active ? "text-white" : "text-white/30")}>{s}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Centered heading used on flow screens. */
export function FlowHeading({ title, description, className }: { title: ReactNode; description?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 text-center", className)}>
      <h1 className="t-h36">{title}</h1>
      {description && <p className="t-b16 text-white/60">{description}</p>}
    </div>
  );
}
