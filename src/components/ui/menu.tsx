"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/icons";

/** Closes when clicking outside or pressing Escape. */
export function useDismiss<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

type Option<V extends string> = { value: V; label: ReactNode };

/** Compact dropdown used in the bot overview toolbar ("All bot types ▾"). */
export function SelectMenu<V extends string>({
  value,
  options,
  onChange,
  icon,
  label,
  align = "right",
  className,
}: {
  value: V;
  options: Option<V>[];
  onChange: (value: V) => void;
  icon?: IconName;
  label: string;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center gap-2 bg-fill-2 pr-2 pl-3 text-[14px] text-white/80 transition-colors hover:bg-white/10"
      >
        {icon && <Icon name={icon} size={20} className="text-white/60" />}
        <span className="flex-1 truncate text-left">{current?.label}</span>
        <Icon name="arrow-dropdown" size={20} className={cn("text-white/60 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className={cn(
            "absolute top-[calc(100%+4px)] z-30 min-w-full animate-fade-in border border-line bg-[#181a19] py-1 shadow-2xl shadow-black/60",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-6 px-3 py-2 text-left text-[14px] whitespace-nowrap hover:bg-fill-2",
                  o.value === value ? "text-white" : "text-white/60",
                )}
              >
                {o.label}
                {o.value === value && <Icon name="check" size={18} className="text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
