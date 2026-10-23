"use client";

import { cn } from "@/lib/cn";

/**
 * Preview-only shortcut: a faint "Skip" in the bottom-right corner that fills the
 * current step with test data and moves on, so testers can walk the whole flow fast.
 */
export function TestSkip({ onSkip, label = "Skip", className }: { onSkip: () => void; label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      title="Preview only: skip this step with test data"
      className={cn(
        "fixed right-3 bottom-3 z-[70] px-2 py-1 font-mono text-[11px] text-white/20 uppercase transition-colors hover:bg-white/10 hover:text-white focus-visible:text-white",
        className,
      )}
    >
      {label} ›
    </button>
  );
}
