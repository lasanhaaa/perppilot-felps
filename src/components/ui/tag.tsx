import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "positive" | "negative" | "neutral" | "info" | "warn";

const tones: Record<Tone, { box: string; dot: string }> = {
  positive: { box: "bg-brand/10 text-brand", dot: "bg-brand" },
  negative: { box: "bg-danger/10 text-danger", dot: "bg-danger" },
  neutral: { box: "bg-white/10 text-white/60", dot: "bg-white/60" },
  info: { box: "bg-info/10 text-info", dot: "bg-info" },
  warn: { box: "bg-warn/10 text-warn", dot: "bg-warn" },
};

/** Status pill with the 4px square dot ("• IN RANGE"). */
export function StatusPill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] px-1.5 py-0.5 text-[14px] leading-[1.5] uppercase whitespace-nowrap",
        tones[tone].box,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1 shrink-0", tones[tone].dot)} />
      {children}
    </span>
  );
}

/** Grey label chip ("EXTENDED", "V3 BOT", "50X"). */
export function Chip({ children, className, outline = false }: { children: ReactNode; className?: string; outline?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1 text-[14px] leading-[1.5] font-medium uppercase whitespace-nowrap",
        outline ? "border border-line px-1.5 text-white/80" : "bg-fill-2 text-white/40",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Highlighted value box inside a caption ("NET FEES [5.80%] OF POOL"). */
export function ValueBox({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("bg-fill-2 px-1 font-semibold text-white/80", className)}>{children}</span>;
}

/** "COMING SOON" style badge. */
export function Badge({ children, tone = "info", className }: { children: ReactNode; tone?: "info" | "danger" | "grey"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1 text-[12px] leading-[1.5] font-medium uppercase whitespace-nowrap text-black",
        tone === "info" && "bg-info",
        tone === "danger" && "bg-danger text-white",
        tone === "grey" && "bg-chip",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Monospace tag used on auth and course art ("LIVE CURRENT TVL"). */
export function MonoTag({ children, tone = "dark", className }: { children: ReactNode; tone?: "dark" | "brand" | "info" | "light"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-1.5 py-1 font-mono text-[13px] leading-[1.1] uppercase",
        tone === "dark" && "bg-white/5 text-white",
        tone === "brand" && "bg-brand text-black",
        tone === "info" && "bg-info-strong text-white",
        tone === "light" && "bg-chip text-black",
        className,
      )}
    >
      {children}
    </span>
  );
}
