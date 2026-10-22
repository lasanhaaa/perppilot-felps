"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { EXCHANGES, ExchangeLogo } from "@/components/brand";
import { useDismiss } from "@/components/ui/menu";
import { accounts } from "@/lib/mock-data";
import type { ExchangeId } from "@/lib/types";

type Option = { id: string; title: string; subtitle: string; exchange: ExchangeId };

const options: Option[] = [
  ...accounts.map((a) => ({ id: a.id, title: a.name, subtitle: EXCHANGES[a.exchange].name, exchange: a.exchange })),
  // exchanges without an account yet: picking one sends the user to connect it
  ...(["hyperliquid", "lighter", "nado"] as const).map((x) => ({ id: `new-${x}`, title: EXCHANGES[x].name, subtitle: EXCHANGES[x].tagline, exchange: x })),
];

export function getAccountOption(id: string | null) {
  return options.find((o) => o.id === id) ?? null;
}

/** Account picker with exchange logos (Figma: Add Bot / V3 dropdown). */
export function AccountSelect({ value, onChange, label, exclude = [] }: { value: string | null; onChange: (id: string) => void; label: string; exclude?: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const current = getAccountOption(value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 bg-fill-2 p-2 text-left transition-colors hover:bg-fill-3"
      >
        {current ? <ExchangeLogo id={current.exchange} size={32} /> : <span className="size-8 bg-fill-2" />}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14px]">{current?.title ?? "Select account"}</span>
          <span className="truncate text-[12px] text-white/50">{current?.subtitle ?? "Choose where the bot runs"}</span>
        </span>
        <Icon name="arrow-dropdown" size={20} className={cn("text-white/60 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className="absolute inset-x-0 top-[calc(100%+2px)] z-30 max-h-[300px] animate-fade-in overflow-y-auto bg-[#1d1f1e] shadow-2xl shadow-black/60 scrollbar-thin">
          {options
            .filter((o) => !exclude.includes(o.id))
            .map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.id === value}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={cn("flex w-full items-center gap-3 p-2 text-left hover:bg-fill-3", o.id === value && "bg-fill-2")}
                >
                  <ExchangeLogo id={o.exchange} size={32} />
                  <span className="flex flex-col">
                    <span className="text-[14px]">{o.title}</span>
                    <span className="text-[12px] text-white/50">{o.subtitle}</span>
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
