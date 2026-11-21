"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CoinIcon } from "@/components/ui/coin";
import { Icon } from "@/components/ui/icons";
import type { Coin } from "@/lib/mock";
import type { Asset, Category, Entry, Setup } from "./data";
import { ENTRY_LABEL, posOf, priceFmt, priceNow, widthOf } from "./data";

/* ---------- Coin icon (2094:5804), with the RWA variants GOLD (AU) and SILVER (AG) ---------- */

export function AssetIcon({ coin, size = 24 }: { coin: Asset; size?: number }) {
  if (coin === "GOLD" || coin === "SILVER") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <circle cx="12" cy="12" r="12" fill={coin === "GOLD" ? "#E3B341" : "#B8C0CC"} />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="600" fill="#141414" fontFamily="var(--font-inter-tight), sans-serif">
          {coin === "GOLD" ? "AU" : "AG"}
        </text>
      </svg>
    );
  }
  return <CoinIcon coin={coin as Coin} size={size} round />;
}

/* ---------- Entry verdict: a status tag like the bot StatusPill ---------- */

const ENTRY_TONE: Record<Entry, string> = {
  good: "bg-success/10 text-success",
  neutral: "bg-warning/10 text-warning",
  wait: "bg-error/10 text-error",
};

export function EntryPill({ entry, className }: { entry: Entry; className?: string }) {
  return <span className={cn("t-l12 inline-flex h-[22px] flex-none items-center px-1.5 whitespace-nowrap", ENTRY_TONE[entry], className)}>{ENTRY_LABEL[entry]}</span>;
}

/** Neutral tag for setups whose APR is rising fast (the reference tool's "Hot"). */
export function TrendingTag() {
  return (
    <span className="t-l12 inline-flex h-[22px] flex-none items-center gap-1 bg-white/5 px-1.5 whitespace-nowrap text-white/60">
      <Icon name="trending-up" size={12} />
      Trending
    </span>
  );
}

/* ---------- Category glyphs (crown, bolt, anchor, rocket, bank), drawn in the text colour ---------- */

const CAT_PATHS: Record<Category["icon"], ReactNode> = {
  crown: <path d="M2 18h20M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  anchor: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 7.5V21M5 12H2a10 10 0 0 0 20 0h-3M8 11h8" />
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>
  ),
  bank: <path d="M3 21h18M4 10h16M12 3l8 5H4l8-5ZM6 10v8M10 10v8M14 10v8M18 10v8" />,
};

export function CategoryGlyph({ icon, size = 18 }: { icon: Category["icon"]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {CAT_PATHS[icon]}
    </svg>
  );
}

/* ---------- Price range: low and high bounds, a square marker at today's price ---------- */

export function RangeMeter({ setup, size = "md" }: { setup: Setup; size?: "sm" | "md" | "lg" }) {
  const pos = posOf(setup);
  const lg = size === "lg";
  const bar = (
    <div className={cn("relative", lg ? "h-3" : "h-2.5")}>
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/20" />
      <span className="absolute top-0 left-0 h-full w-px bg-white/40" />
      <span className="absolute top-0 right-0 h-full w-px bg-white/40" />
      <span className={cn("absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white", lg ? "size-3" : "size-2")} style={{ left: `${pos * 100}%` }} />
    </div>
  );
  if (size === "sm")
    return (
      <div className="flex w-full flex-col gap-1.5">
        {bar}
        <span className="flex justify-between text-[12px] leading-[15px] text-white/40 tnum">
          <span>{priceFmt(setup.lo)}</span>
          <span>{priceFmt(setup.hi)}</span>
        </span>
      </div>
    );
  if (lg)
    return (
      <div className="flex flex-col gap-3">
        {/* "Now" sits over the marker, kept inside the bar's width. */}
        <div className="relative h-[38px]">
          <span
            className="absolute top-0 flex w-[120px] flex-col items-center gap-0.5 text-center"
            style={{ left: `clamp(0px, calc(${pos * 100}% - 60px), calc(100% - 120px))` }}
          >
            <span className="t-l12 text-white/50">Price now</span>
            <span className="t-b16m tnum">{priceFmt(priceNow(setup))}</span>
          </span>
        </div>
        {bar}
        <div className="flex justify-between">
          <span className="flex flex-col gap-0.5">
            <span className="t-b14 tnum">{priceFmt(setup.lo)}</span>
            <span className="t-l12 text-white/40">Lower bound</span>
          </span>
          <span className="flex flex-col items-end gap-0.5">
            <span className="t-b14 tnum">{priceFmt(setup.hi)}</span>
            <span className="t-l12 text-white/40">Upper bound</span>
          </span>
        </div>
      </div>
    );
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="t-l12 text-white/50">
          Price range <span className="text-white/30">·</span> {widthOf(setup)}
        </span>
        <span className="t-b14 tnum">
          <span className="text-white/50">Now </span>
          {priceFmt(priceNow(setup))}
        </span>
      </div>
      {bar}
      <div className="t-b14 flex justify-between text-white/50 tnum">
        <span>{priceFmt(setup.lo)}</span>
        <span>{priceFmt(setup.hi)}</span>
      </div>
    </div>
  );
}
