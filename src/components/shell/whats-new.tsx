"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons";
import { StatusTag } from "@/components/ui/primitives";

/** Popover / What's new (2236:12798) with What's new item (2236:12694), opened from the bell at the top of the menu. */
type Category = "Infrastructure" | "Interface" | "PointBot" | "V3 bot";
type Item = { id: string; category: Category; date: string; title: string; body: string; isNew?: boolean };

const ITEMS: Item[] = [
  { id: "nado", category: "Infrastructure", date: "Nov 14, 2026", title: "Nado is here", body: "Connect Nado with your browser wallet and run V3 bots on it.", isNew: true },
  { id: "explore", category: "Interface", date: "Nov 10, 2026", title: "Explore Liquidity", body: "Find the markets with the deepest liquidity and start a bot from a preset.", isNew: true },
  { id: "lighter", category: "Infrastructure", date: "Oct 28, 2026", title: "Lighter support", body: "Lighter accounts can now run PointBot and V3 bots." },
  { id: "pointbot", category: "PointBot", date: "Oct 15, 2026", title: "Faster PointBot closing", body: "Closing speed now has a Fast option, about 1 hour." },
  { id: "alerts", category: "V3 bot", date: "Oct 2, 2026", title: "V3 range alerts", body: "Get notified when a bot goes out of range." },
];
const TABS: ("All" | Category)[] = ["All", "Infrastructure", "Interface", "PointBot", "V3 bot"];

export function WhatsNewBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [read, setRead] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const unread = read ? 0 : ITEMS.filter((i) => i.isNew).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = tab === "All" ? ITEMS : ITEMS.filter((i) => i.category === tab);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="What's new"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn("relative flex size-10 items-center justify-center transition-colors", open ? "bg-hover" : "bg-raised hover:bg-hover")}
      >
        <Icon name="bell" size={32} className={open ? "opacity-90" : "opacity-50"} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-[21px] min-w-[21px] items-center justify-center bg-error px-2 text-[14px] leading-[21px] font-medium text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="What's new"
          className="absolute top-[calc(100%+8px)] left-0 z-50 flex max-h-[min(806px,calc(100vh-96px))] w-[460px] flex-col border border-line bg-screen [background-image:linear-gradient(var(--color-card),var(--color-card))] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
        >
          <div className="flex h-[60px] flex-none items-center gap-3 px-6">
            <span className="t-h20">What&apos;s new</span>
            {unread > 0 && <StatusTag tone="success">{unread} NEW</StatusTag>}
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => setRead(true)}
              disabled={unread === 0}
              className="t-b14 text-white/60 transition-colors hover:text-white disabled:text-white/25"
            >
              Mark all as read
            </button>
          </div>
          <div className="no-scrollbar flex flex-none overflow-x-auto px-6">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn("t-b14 h-[33px] flex-none px-3 whitespace-nowrap transition-colors", t === tab ? "bg-white/10 text-white" : "text-white/60 hover:text-white/90")}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-6">
            {list.map((it) => (
              <article key={it.id} className="flex flex-col gap-2 rounded-sm border border-line bg-card p-4">
                <div className="flex items-center gap-2">
                  {it.isNew && !read && <StatusTag tone="success">NEW</StatusTag>}
                  <span className="t-l12 text-white/60 uppercase">{it.category}</span>
                  <span className="flex-1" />
                  <span className="t-l12 text-white/40 uppercase">{it.date}</span>
                </div>
                <span className="t-b16m text-white">{it.title}</span>
                <span className="t-b14 text-white/60">{it.body}</span>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
