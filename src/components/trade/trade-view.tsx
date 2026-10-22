"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { PinModal } from "@/components/create-bot/pin-modal";
import { Icon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { useDismiss } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import { usePlatformData } from "@/lib/platform-data";
import { candleSeries, type Candle } from "@/lib/series";
import { CandleChart } from "./candle-chart";
import { MARKETS, TIMEFRAMES, VENUES, type Market, type Timeframe, type VenueId } from "./market-data";
import { OrderBook } from "./order-book";

/*
 * Trade terminal, copied from the live hub (hub.perppilot.app/trade): one market across
 * five venues, chart, order book and an order ticket that unlocks with the account PIN.
 */

const TF_SEED: Record<Timeframe, number> = { "1m": 1, "5m": 5, "15m": 15, "1h": 60, "4h": 240, "1d": 1440 };
const X_LABELS: Record<Timeframe, string[]> = {
  "1m": ["14:00", "14:15", "14:30", "14:45", "15:00"],
  "5m": ["Oct 22", "06:00", "12:00", "18:00", "Oct 23"],
  "15m": ["Oct 20", "Oct 21", "Oct 22"],
  "1h": ["Oct 18", "Oct 19", "Oct 20", "Oct 21", "Oct 22"],
  "4h": ["Sep 28", "Oct 4", "Oct 10", "Oct 16", "Oct 22"],
  "1d": ["Jun", "Jul", "Aug", "Sep", "Oct"],
};
const OVERLAYS = ["Signals", "Levels", "Liquidity"] as const;
const TOOLS = ["arrow-forward", "remove", "menu", "chart", "filter", "settings", "info", "close"] as const;

type Position = { id: number; market: string; side: "long" | "short"; size: number; entry: number; leverage: number };

const usd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

function priceFormatter(m: Market) {
  const decimals = m.tick >= 1 ? 0 : m.tick >= 0.1 ? 1 : 2;
  return (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Scale a generated series so its last close lands on the market price. */
function anchored(candles: Candle[], price: number) {
  const k = price / candles[candles.length - 1].c;
  return candles.map((c) => ({ o: c.o * k, h: c.h * k, l: c.l * k, c: c.c * k, v: c.v }));
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("min-w-0 bg-fill-2", className)}>{children}</section>;
}

function MarketSelect({ value, onChange }: { value: Market; onChange: (m: Market) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 border border-line bg-fill-2 px-3 text-[14px] hover:bg-fill-3"
      >
        <CoinDot base={value.base} />
        {value.base}
        <Icon name="chevron-down" size={18} className="text-white/50" />
      </button>
      {open && (
        <ul role="listbox" className="absolute top-[calc(100%+4px)] left-0 z-30 w-56 animate-fade-in border border-line bg-[#1a1a1a] py-1">
          {MARKETS.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                role="option"
                aria-selected={m.id === value.id}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
                className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] hover:bg-fill-2", m.id === value.id && "text-brand")}
              >
                <CoinDot base={m.base} />
                <span className="flex-1">{m.id}</span>
                <span className={cn("text-[12px]", m.change24h >= 0 ? "text-brand" : "text-danger")}>{m.change24h.toFixed(2)}%</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CoinDot({ base }: { base: string }) {
  const color = base === "BTC" ? "#f7931a" : base === "ETH" ? "#8a92b2" : "#9945ff";
  return (
    <span className="grid size-5 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: color }}>
      {base[0]}
    </span>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-white/40 uppercase">{label}</span>
      <span className="text-[14px] tabular">{children}</span>
    </div>
  );
}

function OrderTicket({ market, price, onPlace }: { market: Market; price: number; onPlace: (p: Omit<Position, "id">) => void }) {
  const [side, setSide] = useState<"long" | "short">("long");
  const [type, setType] = useState<"market" | "limit">("market");
  const [size, setSize] = useState("1000");
  const [limit, setLimit] = useState(price.toFixed(market.tick >= 1 ? 0 : 2));
  const [leverage, setLeverage] = useState(5);
  const notional = Number(size) || 0;
  const entry = type === "limit" ? Number(limit) || price : price;
  const liq = side === "long" ? entry * (1 - 0.9 / leverage) : entry * (1 + 0.9 / leverage);
  const fmt = priceFormatter(market);

  return (
    <form
      className="flex flex-col gap-4 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!notional) return;
        onPlace({ market: market.id, side, size: notional / entry, entry, leverage });
      }}
    >
      <div className="grid grid-cols-2 gap-1">
        {(["long", "short"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={side === s}
            onClick={() => setSide(s)}
            className={cn(
              "h-9 text-[13px] font-semibold uppercase transition-colors",
              side === s ? (s === "long" ? "bg-brand text-black" : "bg-danger text-black") : "bg-fill-2 text-white/50 hover:text-white",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-4 border-b border-line text-[13px]">
        {(["market", "limit"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => setType(t)}
            className={cn("-mb-px border-b pb-2 capitalize", type === t ? "border-white text-white" : "border-transparent text-white/40")}
          >
            {t}
          </button>
        ))}
      </div>
      {type === "limit" && (
        <label className="flex flex-col gap-1.5 text-[11px] text-white/40 uppercase">
          Limit price
          <input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} className="h-10 border border-line bg-transparent px-3 text-[14px] text-white tabular outline-none focus:border-brand/70" />
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-[11px] text-white/40 uppercase">
        Size (USD)
        <input inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value.replace(/[^\d.]/g, ""))} className="h-10 border border-line bg-transparent px-3 text-[14px] text-white tabular outline-none focus:border-brand/70" />
      </label>
      <label className="flex flex-col gap-2 text-[11px] text-white/40 uppercase">
        <span className="flex justify-between">
          Leverage <span className="text-white tabular">{leverage}x</span>
        </span>
        <input type="range" min={1} max={50} value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="accent-[#2fe8b4]" />
      </label>
      <dl className="grid grid-cols-2 gap-y-1.5 text-[12px]">
        <dt className="text-white/40">Size</dt>
        <dd className="text-right tabular">
          {(notional / entry).toFixed(5)} {market.base}
        </dd>
        <dt className="text-white/40">Margin</dt>
        <dd className="text-right tabular">{usd(notional / leverage)}</dd>
        <dt className="text-white/40">Est. liquidation</dt>
        <dd className="text-right tabular">{fmt(liq)}</dd>
      </dl>
      <Button type="submit" disabled={!notional} variant={side === "long" ? "primary" : "danger"} className="w-full">
        {side === "long" ? "Buy / Long" : "Sell / Short"}
      </Button>
    </form>
  );
}

export function TradeView() {
  const { accounts } = usePlatformData();
  const account = accounts[0];
  const [market, setMarket] = useState<Market>(MARKETS[0]);
  const [venue, setVenue] = useState<VenueId>("hyperliquid");
  const [tf, setTf] = useState<Timeframe>("1h");
  const [overlay, setOverlay] = useState<(typeof OVERLAYS)[number]>("Levels");
  const [pinOpen, setPinOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [bottomTab, setBottomTab] = useState<"positions" | "orders" | "fills">("positions");

  const v = VENUES.find((x) => x.id === venue)!;
  const price = market.price + v.offset * (market.price / 81348);
  const fmt = priceFormatter(market);
  const candles = useMemo(() => anchored(candleSeries(market.seed * 1000 + TF_SEED[tf], 110), price), [market, tf, price]);

  const pnl = (p: Position) => (p.side === "long" ? price - p.entry : p.entry - price) * p.size;

  return (
    <div className="flex min-h-dvh flex-col gap-1 p-1 text-white lg:h-dvh lg:min-h-0">
      {/* venue latency strip */}
      <div className="flex h-10 shrink-0 items-center gap-4 bg-fill-2 px-3">
        <span className="flex items-center gap-2 font-display text-[20px]">
          Trade
          <span className="bg-chip px-1 font-sans text-[11px] font-medium text-black uppercase">Beta</span>
        </span>
        <div className="hidden flex-1 items-center gap-5 overflow-hidden font-mono text-[11px] text-white/50 md:flex">
          {VENUES.map((x) => (
            <span key={x.id} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={cn("size-1.5 rounded-full", x.lagMs ? "bg-brand" : "bg-white/30")} />
              {x.short}
              <span className="text-white/70">{x.lagMs ? `${x.lagMs}ms` : "--"}</span>
              {x.lagMs && x.lagMs < 200 && <span className="text-white/30">lag</span>}
            </span>
          ))}
        </div>
        <Link href="/accounts" className="ml-auto flex h-7 items-center gap-1 border border-line px-2 text-[12px] text-white/70 uppercase hover:bg-fill-2 hover:text-white">
          <Icon name="add" size={16} /> Account
        </Link>
      </div>

      {/* market header */}
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 bg-fill-2 p-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <MarketSelect
            value={market}
            onChange={(m) => {
              setMarket(m);
            }}
          />
          <span className="font-display text-[26px] tabular">${fmt(price)}</span>
          <Stat label="Mark">${fmt(market.mark + (price - market.price))}</Stat>
          <Stat label="Funding">
            <span className={market.funding >= 0 ? "text-brand" : "text-danger"}>
              {market.funding >= 0 ? "+" : ""}
              {market.funding.toFixed(4)}%
            </span>
          </Stat>
          <Stat label="24h">
            <span className={market.change24h >= 0 ? "text-brand" : "text-danger"}>{market.change24h.toFixed(2)}%</span>
          </Stat>
          <Stat label="Open interest">{usd(market.openInterest)}</Stat>
          <Stat label="24h volume">{usd(market.volume24h)}</Stat>
        </div>
        <div role="radiogroup" aria-label="Venue" className="flex max-w-full gap-1 overflow-x-auto scrollbar-thin">
          {VENUES.map((x) => {
            const p = market.price + x.offset * (market.price / 81348);
            const on = x.id === venue;
            return (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setVenue(x.id)}
                className={cn("flex w-[128px] shrink-0 flex-col px-2 py-1.5 text-left transition-colors", on ? "bg-white/12" : "bg-fill-2 hover:bg-fill-3")}
              >
                <span className={cn("truncate text-[12px]", on ? "text-white" : "text-white/70")}>{x.name}</span>
                <span className="flex justify-between font-mono text-[11px] tabular">
                  <span className="text-white/50">{fmt(p)}</span>
                  {!on && <span className={x.change >= 0 ? "text-brand" : "text-danger"}>{x.change.toFixed(3)}%</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* chart, book, ticket */}
      <div className="grid min-h-0 flex-1 gap-1 lg:grid-cols-[minmax(0,1fr)_250px_260px] 2xl:grid-cols-[minmax(0,1fr)_280px_320px]">
        <Panel className="flex min-h-[420px] flex-col">
          <div className="flex h-10 items-center justify-between gap-2 border-b border-line px-2 text-[12px]">
            <div className="flex gap-0.5">
              {TIMEFRAMES.map((t) => (
                <button key={t} type="button" aria-pressed={tf === t} onClick={() => setTf(t)} className={cn("h-7 px-2", tf === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}>
                  {t}
                </button>
              ))}
            </div>
            <div className="hidden gap-0.5 sm:flex">
              {OVERLAYS.map((o) => (
                <button key={o} type="button" aria-pressed={overlay === o} onClick={() => setOverlay(o)} className={cn("h-7 px-2", overlay === o ? "bg-white/10 text-white" : "text-white/50 hover:text-white")}>
                  {o}
                </button>
              ))}
              <span className="flex h-7 items-center px-2 text-white/50">Indicators · 1</span>
            </div>
          </div>
          <div className="flex min-h-0 flex-1">
            <div aria-hidden className="hidden w-10 shrink-0 flex-col items-center gap-3 border-r border-line py-3 text-white/40 sm:flex">
              {TOOLS.map((t, i) => (
                <Icon key={t} name={t} size={18} className={i === 0 ? "-rotate-135 text-white" : ""} />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <CandleChart candles={candles} xLabels={X_LABELS[tf]} formatPrice={fmt} ariaLabel={`${market.id} on ${v.name}, ${tf} candles`} />
            </div>
          </div>
        </Panel>

        <OrderBook mid={price} tick={market.tick} venue={v.name} formatPrice={fmt} />

        <Panel className="min-h-0 overflow-y-auto scrollbar-thin">
          {unlocked ? (
            <OrderTicket
              market={market}
              price={price}
              onPlace={(p) => {
                setPositions((list) => [{ ...p, id: Date.now() }, ...list]);
                setBottomTab("positions");
              }}
            />
          ) : (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="max-w-[220px] text-[13px] text-white/70">Unlock an account to trade. Market data works without one.</p>
              {account ? (
                <Button size="sm" onClick={() => setPinOpen(true)}>
                  Unlock account
                </Button>
              ) : (
                <ButtonLink href="/accounts" size="sm">
                  Add account
                </ButtonLink>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* positions + account */}
      <div className="grid shrink-0 gap-1 lg:h-[200px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="flex flex-col">
          <div role="tablist" className="flex h-9 gap-4 border-b border-line px-3 text-[13px]">
            {(["positions", "orders", "fills"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={bottomTab === t}
                onClick={() => setBottomTab(t)}
                className={cn("-mb-px border-b capitalize", bottomTab === t ? "border-brand text-white" : "border-transparent text-white/40")}
              >
                {t}
                {t === "positions" && positions.length > 0 && <span className="ml-1 text-white/40">{positions.length}</span>}
              </button>
            ))}
          </div>
          {!unlocked ? (
            <p className="m-auto p-6 text-[13px] text-white/60">Positions, orders, and fills appear here once an account is unlocked.</p>
          ) : bottomTab === "positions" && positions.length > 0 ? (
            <div className="overflow-auto scrollbar-thin">
              <table className="w-full min-w-[560px] text-[12px] tabular">
                <thead className="text-left text-white/40">
                  <tr>
                    {["Market", "Side", "Size", "Entry", "Mark", "PnL", ""].map((h) => (
                      <th key={h} className="px-3 py-2 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const value = pnl(p);
                    return (
                      <tr key={p.id} className="border-t border-line">
                        <td className="px-3 py-2">
                          {p.market} <span className="text-white/40">{p.leverage}x</span>
                        </td>
                        <td className={cn("px-3 py-2 uppercase", p.side === "long" ? "text-brand" : "text-danger")}>{p.side}</td>
                        <td className="px-3 py-2">{p.size.toFixed(5)}</td>
                        <td className="px-3 py-2">{fmt(p.entry)}</td>
                        <td className="px-3 py-2">{fmt(price)}</td>
                        <td className={cn("px-3 py-2", value >= 0 ? "text-brand" : "text-danger")}>
                          {value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" onClick={() => setPositions((l) => l.filter((x) => x.id !== p.id))} className="border border-line px-2 py-0.5 text-white/70 hover:text-white">
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="m-auto p-6 text-[13px] text-white/40">Nothing here yet.</p>
          )}
        </Panel>
        <Panel className="flex flex-col gap-3 p-3">
          <h2 className="text-[13px] font-medium">Account</h2>
          {unlocked ? (
            <dl className="grid grid-cols-2 gap-y-1.5 text-[12px] tabular">
              <dt className="text-white/40">Account</dt>
              <dd className="text-right">{account?.name}</dd>
              <dt className="text-white/40">Balance</dt>
              <dd className="text-right">$12,480.22</dd>
              <dt className="text-white/40">Unrealized PnL</dt>
              <dd className="text-right">
                {(() => {
                  const total = positions.reduce((s, p) => s + pnl(p), 0);
                  return <span className={total >= 0 ? "text-brand" : "text-danger"}>{`${total >= 0 ? "+" : "-"}$${Math.abs(total).toFixed(2)}`}</span>;
                })()}
              </dd>
              <dt className="text-white/40">Margin used</dt>
              <dd className="text-right">${positions.reduce((s, p) => s + (p.size * p.entry) / p.leverage, 0).toFixed(2)}</dd>
            </dl>
          ) : (
            <>
              <p className="text-[12px] text-white/60">Unlock an account to see balances and positions.</p>
              {account ? (
                <Button size="sm" variant="secondary" className="self-start border border-line" onClick={() => setPinOpen(true)}>
                  Unlock
                </Button>
              ) : (
                <ButtonLink href="/accounts" size="sm" variant="secondary" className="self-start border border-line">
                  Add account
                </ButtonLink>
              )}
            </>
          )}
        </Panel>
      </div>

      <PinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        accountName={account?.name ?? "your account"}
        description={`This PIN decrypts the API credentials of ${account?.name ?? "your account"} so you can trade by hand.`}
        confirmLabel="Unlock account"
        pendingLabel="Unlocking…"
        onConfirm={() => {
          setPinOpen(false);
          setUnlocked(true);
        }}
      />
    </div>
  );
}
