"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "@/components/ui/button";
import { changelog } from "@/lib/mock-data";
import type { ChangelogEntry } from "@/lib/types";

const CATEGORIES: { value: ChangelogEntry["category"]; label: string }[] = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "interface", label: "Interface" },
  { value: "pointbot", label: "Pointbot" },
  { value: "v3bot", label: "v3 bot" },
];

/** "What is new" tray that slides out next to the sidebar (Figma: Change Logs / Tray). */
export function ChangelogTray({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [category, setCategory] = useState<ChangelogEntry["category"]>("infrastructure");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const entries = changelog.filter((e) => e.category === category);

  return (
    <div className="fixed inset-0 z-40">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="What is new"
        className="absolute top-0 bottom-0 left-0 flex w-full max-w-[541px] animate-slide-in flex-col bg-[#141414] lg:left-[264px] lg:top-6 lg:bottom-6"
      >
        <header className="flex items-start justify-between px-6 pt-6">
          <div>
            <h2 className="font-display text-[24px] leading-[1.3]">What is new</h2>
            <p className="text-[14px] text-white/60">Recent improvements to the platform.</p>
          </div>
          <IconButton icon="close" label="Close" onClick={onClose} className="-mr-2" />
        </header>
        <div role="tablist" className="mt-4 flex gap-1 overflow-x-auto px-6">
          {CATEGORIES.map((c) => {
            const unread = changelog.filter((e) => e.category === c.value && e.isNew).length;
            const active = c.value === category;
            return (
              <button
                key={c.value}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setCategory(c.value)}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 border-b px-2 text-[14px] transition-colors",
                  active ? "border-brand bg-fill-2 text-white" : "border-transparent text-white/50 hover:text-white/80",
                )}
              >
                {c.label}
                {unread > 0 && <span className="bg-danger/20 px-1.5 font-mono text-[12px] text-danger">{unread}</span>}
              </button>
            );
          })}
        </div>
        <ol className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin">
          {entries.length === 0 && <li className="py-10 text-center text-[14px] text-white/40">Nothing new here yet.</li>}
          {entries.map((entry) => (
            <li key={entry.id} className={cn("border-b border-line py-4", !entry.isNew && "opacity-50")}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="flex items-center gap-2 text-[16px]">
                  {entry.title}
                  {entry.isNew && <span className="font-mono text-[11px] text-danger uppercase">New</span>}
                </p>
                <span className="flex shrink-0 items-center gap-2 text-[12px] text-white/50">
                  {entry.date}
                  {entry.isNew && <span aria-label="unread" className="size-1 bg-danger" />}
                </span>
              </div>
              <ul className="mt-2 flex flex-col gap-1 pl-4 text-[14px] text-white/70">
                {entry.bullets.map((b) => (
                  <li key={b} className="list-disc marker:text-white/40">
                    {b}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
