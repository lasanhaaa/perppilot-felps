"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { mulberry32 } from "@/lib/series";

type Level = { price: number; size: number };
type Fill = { id: number; price: number; size: number; side: "buy" | "sell"; time: string };

const ROWS = 8;

function makeBook(mid: number, tick: number, seed: number) {
  const rand = mulberry32(seed);
  const size = () => Number((rand() ** 2 * 3.6 + 0.002).toFixed(4));
  const asks: Level[] = Array.from({ length: ROWS }, (_, i) => ({ price: mid + tick * (i + 0.5), size: size() }));
  const bids: Level[] = Array.from({ length: ROWS }, (_, i) => ({ price: mid - tick * (i + 0.5), size: size() }));
  return { asks, bids };
}

const clock = (offset: number) => {
  const s = 14 * 3600 + 32 * 60 + 8 - offset * 3;
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
};

/** Order book and recent trades. Sizes tick every second so the panel feels live. */
export function OrderBook({ mid, tick, venue, formatPrice }: { mid: number; tick: number; venue: string; formatPrice: (v: number) => string }) {
  const [tab, setTab] = useState<"book" | "trades">("book");
  const [seed, setSeed] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => setSeed((s) => s + 1), 1200);
    return () => window.clearInterval(id);
  }, []);

  const { asks, bids } = useMemo(() => makeBook(mid, tick, seed * 7919 + Math.round(mid)), [mid, tick, seed]);
  const withTotals = (levels: Level[]) => {
    let total = 0;
    return levels.map((l) => ({ ...l, total: (total += l.size) }));
  };
  const askRows = withTotals(asks).reverse();
  const bidRows = withTotals(bids);
  const maxTotal = Math.max(askRows[0].total, bidRows[bidRows.length - 1].total);
  const bidShare = (bidRows[bidRows.length - 1].total / (bidRows[bidRows.length - 1].total + askRows[0].total)) * 100;

  const trades = useMemo<Fill[]>(() => {
    const rand = mulberry32(seed * 31 + 7);
    return Array.from({ length: 19 }, (_, i) => ({
      id: seed * 100 + i,
      price: mid + (rand() - 0.5) * tick * 6,
      size: Number((rand() ** 3 * 1.8 + 0.001).toFixed(4)),
      side: rand() > 0.48 ? "buy" : "sell",
      time: clock(i),
    }));
  }, [mid, tick, seed]);

  return (
    <section className="flex min-h-0 flex-col overflow-hidden bg-fill-2">
      <header className="flex h-10 items-center justify-between border-b border-line px-3 text-[13px]">
        <div role="tablist" className="flex h-full gap-4">
          {(
            [
              ["book", "Order book"],
              ["trades", "Trades"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={tab === v}
              onClick={() => setTab(v)}
              className={cn("-mb-px border-b px-1", tab === v ? "border-brand text-white" : "border-transparent text-white/40 hover:text-white/70")}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-white/50">{venue}</span>
      </header>

      {tab === "book" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-1.5 py-1 font-mono text-[12px] tabular">
          <div className="grid grid-cols-3 px-1.5 py-1 font-sans text-[11px] text-white/40">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>
          {askRows.map((l) => (
            <Row key={`a${l.price}`} {...l} max={maxTotal} side="ask" formatPrice={formatPrice} />
          ))}
          <div className="my-1 flex items-center justify-between bg-white/[0.04] px-1.5 py-1.5 font-sans text-[12px]">
            <span className="text-white/80">Mid {formatPrice(mid)}</span>
            <span className="text-white/40">{((tick / mid) * 100).toFixed(3)}%</span>
          </div>
          {bidRows.map((l) => (
            <Row key={`b${l.price}`} {...l} max={maxTotal} side="bid" formatPrice={formatPrice} />
          ))}
          <div className="mt-auto flex h-5 overflow-hidden pt-1 font-sans text-[11px]">
            <span className="flex items-center bg-brand/20 px-1.5 text-brand" style={{ width: `${bidShare}%` }}>
              Bid {bidShare.toFixed(1)}%
            </span>
            <span className="flex flex-1 items-center justify-end bg-danger/20 px-1.5 text-danger">{(100 - bidShare).toFixed(1)}% Ask</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[12px] tabular scrollbar-thin">
          <div className="grid grid-cols-3 py-1 font-sans text-[11px] text-white/40">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>
          {trades.map((f) => (
            <div key={f.id} className="grid grid-cols-3 py-[3px]">
              <span className={f.side === "buy" ? "text-brand" : "text-danger"}>{formatPrice(f.price)}</span>
              <span className="text-right text-white/70">{f.size}</span>
              <span className="text-right text-white/40">{f.time}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Row({ price, size, total, max, side, formatPrice }: Level & { total: number; max: number; side: "ask" | "bid"; formatPrice: (v: number) => string }) {
  return (
    <div className="relative grid shrink-0 grid-cols-3 px-1.5 py-[2px]">
      <span aria-hidden className={cn("absolute inset-y-px right-0", side === "ask" ? "bg-danger/12" : "bg-brand/12")} style={{ width: `${(total / max) * 100}%` }} />
      <span className={cn("relative", side === "ask" ? "text-danger" : "text-brand")}>{formatPrice(price)}</span>
      <span className="relative text-right text-white/70">{size}</span>
      <span className="relative text-right text-white/70">{total.toFixed(4)}</span>
    </div>
  );
}
