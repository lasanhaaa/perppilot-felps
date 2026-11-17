"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icons";

/** Shared surface for Tooltip (2142:8349) and Info popover (2142:8352): screen + raised, strong border, soft shadow. */
const SURFACE =
  "border border-line-strong bg-screen [background-image:linear-gradient(var(--color-raised),var(--color-raised))] shadow-[0_12px_32px_rgba(0,0,0,0.55)]";

/**
 * 14px info icon. Hover (or focus) shows `tip` below it; click calls `onClick`
 * (used to open an Info popover). The tooltip hides while `active` is true.
 */
export function InfoButton({
  label,
  tip,
  onClick,
  active = false,
  className,
}: {
  label: string;
  tip?: ReactNode;
  onClick?: (el: HTMLButtonElement) => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={onClick ? active : undefined}
        onClick={(e) => onClick?.(e.currentTarget)}
        className={cn("grid size-5 place-items-center rounded-sm transition-colors hover:text-white", active ? "text-white" : "text-white/40")}
      >
        <Icon name="info" size={14} />
      </button>
      {tip && !active && (
        <span
          role="tooltip"
          className={cn(
            SURFACE,
            "t-b14 pointer-events-none absolute top-full right-[-8px] z-30 mt-2 w-[260px] rounded-sm p-3 text-left font-normal tracking-normal text-white/80 normal-case opacity-0 transition-opacity delay-100 group-focus-within/tip:opacity-100 group-hover/tip:opacity-100",
          )}
        >
          {tip}
        </span>
      )}
    </span>
  );
}

/**
 * Floating panel anchored to an element (fixed position). `side="left"` opens to the left of the
 * anchor, top aligned; `side="bottom"` opens below it, right aligned. Closes on outside click,
 * Escape, scroll and resize.
 */
export function Popover({
  anchor,
  side = "bottom",
  width = 320,
  onClose,
  children,
  label,
}: {
  anchor: HTMLElement;
  side?: "left" | "bottom";
  width?: number;
  onClose: () => void;
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect();
    const h = ref.current?.offsetHeight ?? 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = side === "left" ? r.top - 12 : r.bottom + 8;
    let left = side === "left" ? r.left - width - 16 : r.right - width + 8;
    top = Math.max(12, Math.min(top, vh - h - 12));
    left = Math.max(12, Math.min(left, vw - width - 12));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPos({ top, left });
  }, [anchor, side, width]);

  useEffect(() => {
    const inside = (t: EventTarget | null) => !!t && (ref.current?.contains(t as Node) || anchor.contains(t as Node));
    const down = (e: PointerEvent) => !inside(e.target) && onClose();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const scroll = (e: Event) => !inside(e.target) && onClose();
    document.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", scroll, true);
    return () => {
      document.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [anchor, onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className={cn(SURFACE, "anim-fade fixed z-50 rounded-sm p-5", !pos && "invisible")}
      style={{ width, top: pos?.top ?? 0, left: pos?.left ?? 0 }}
    >
      {children}
    </div>
  );
}
