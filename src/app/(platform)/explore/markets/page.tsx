"use client";

import { useRouter } from "next/navigation";
import { Fragment, useCallback, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { COIN_PRICE, PRESETS, priceFmt, type Bot, type Coin, type PresetId } from "@/lib/mock";
import { PageHeader } from "@/components/shell/page-header";
import { ArrowRight, Button, Dropdown } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { CoinIcon } from "@/components/ui/coin";
import { ExchangeLogo, EXCHANGES, type ExchangeId } from "@/components/ui/exchange-logo";
import { InfoButton, Popover } from "@/components/ui/tooltip";
import { BotFace } from "@/components/bots/bot-ui";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

type Liquidity = "High" | "Medium" | "Low";

/** One coin on one exchange. Volume and depth in $M, spread and funding in %. */
type Venue = {
  exchange: ExchangeId;
  volume: number;
  depth: number;
  spread: number;
  funding: number;
  liquidity: Liquidity;
  preset: PresetId | null;
  score: number;
};

/** A coin and every exchange it trades on. Volatility is the coin's own, the same everywhere. */
type Market = { coin: Coin; vol30: number; venues: Venue[] };

const v = (exchange: ExchangeId, volume: number, depth: number, spread: number, funding: number, liquidity: Liquidity, preset: PresetId | null, score: number): Venue => ({
  exchange,
  volume,
  depth,
  spread,
  funding,
  liquidity,
  preset,
  score,
});

/** Explore Liquidity data (2094:28361). Coin rows add up their venues, so the totals match the Figma rows. */
const MARKETS: Market[] = [
  {
    coin: "BTC",
    vol30: 46,
    venues: [
      v("extended", 1840, 12.4, 0.01, 0.011, "High", "balanced", 98),
      v("hyperliquid", 1210, 9.8, 0.01, 0.009, "High", "balanced", 95),
      v("nado", 412, 3.1, 0.02, 0.013, "Medium", "balanced", 80),
      v("lighter", 298, 2.2, 0.03, 0.01, "Medium", "conservative", 74),
    ],
  },
  {
    coin: "ETH",
    vol30: 58,
    venues: [
      v("hyperliquid", 410, 3.0, 0.02, 0.009, "High", "balanced", 93),
      v("extended", 322, 2.3, 0.02, 0.01, "High", "balanced", 90),
      v("lighter", 128, 0.9, 0.03, 0.008, "Medium", "balanced", 72),
      v("nado", 82, 0.6, 0.04, 0.012, "Medium", "conservative", 66),
    ],
  },
  {
    coin: "XRP",
    vol30: 43,
    venues: [
      v("lighter", 74, 0.52, 0.03, 0.006, "High", "aggressive", 88),
      v("extended", 52, 0.38, 0.03, 0.007, "High", "aggressive", 84),
      v("nado", 30, 0.2, 0.05, 0.004, "Medium", "balanced", 63),
    ],
  },
  {
    coin: "SOL",
    vol30: 71,
    venues: [
      v("extended", 196, 1.1, 0.03, 0.014, "High", "conservative", 86),
      v("hyperliquid", 142, 0.75, 0.03, 0.013, "High", "conservative", 83),
      v("lighter", 50, 0.25, 0.05, 0.016, "Medium", "conservative", 61),
    ],
  },
  {
    coin: "HYPE",
    vol30: 84,
    venues: [v("hyperliquid", 168, 1.05, 0.04, 0.021, "Medium", "conservative", 71), v("lighter", 46, 0.25, 0.06, 0.024, "Medium", "conservative", 58)],
  },
  {
    coin: "DOGE",
    vol30: 74,
    venues: [
      v("lighter", 44, 0.21, 0.06, 0.012, "Medium", "conservative", 64),
      v("hyperliquid", 30, 0.14, 0.06, 0.011, "Medium", "conservative", 62),
      v("extended", 14, 0.06, 0.09, 0.01, "Low", null, 40),
    ],
  },
  {
    coin: "SUI",
    vol30: 79,
    venues: [v("nado", 26, 0.21, 0.09, -0.004, "Medium", "conservative", 58), v("hyperliquid", 15, 0.11, 0.11, -0.002, "Low", null, 42)],
  },
  {
    coin: "BNB",
    vol30: 45,
    venues: [v("nado", 8, 0.05, 0.18, 0.003, "Low", null, 31), v("lighter", 4, 0.03, 0.24, 0.002, "Low", null, 25)],
  },
];

const LIQ: Record<Liquidity, { color: string; bars: number }> = {
  High: { color: "text-gain", bars: 3 },
  Medium: { color: "text-warning", bars: 2 },
  Low: { color: "text-error", bars: 1 },
};

const fmtVol = (m: number) => (m >= 1000 ? `$${(m / 1000).toFixed(2)}B` : `$${Math.round(m)}M`);
const fmtDepth = (m: number) => `$${m >= 1 ? m.toFixed(1) : m.toFixed(2)}M`;
const fmtSpread = (p: number) => `${p.toFixed(2)}%`;
const fmtFunding = (p: number) => `${p < 0 ? "−" : "+"}${Math.abs(p).toFixed(3)}%`;
const best = (venues: Venue[]) => [...venues].sort((a, b) => b.score - a.score)[0];
const sum = (venues: Venue[], k: "volume" | "depth") => venues.reduce((t, x) => t + x[k], 0);

/** Market cell (chevron + coin + bot chip) gets the most room; the last 40px column holds the arrow, covered by actions on hover. */
const COLS = "grid grid-cols-[minmax(264px,2.2fr)_1fr_1fr_0.8fr_1fr_1fr_1fr_1.25fr_40px] items-center gap-2 px-4";

/** Opaque row-hover color for the hover actions, so they cover the cells under them: screen + card + hover. */
const HOVER_BG = {
  background: "linear-gradient(var(--color-hover), var(--color-hover)), linear-gradient(var(--color-card), var(--color-card)), var(--color-screen)",
};

type Sel = { coin: Coin; ex: ExchangeId };

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Explore Liquidity (2094:28361). One expandable row per coin; expanded, it lists every exchange
 * with its own numbers, the user's account there and their bots. Row hover shows Apply <preset>
 * (when the user's bot runs another preset) and Create bot. Info icons explain the suggestion.
 */
export default function ExplorePage() {
  const router = useRouter();
  const { hasProfile, allAccounts, allBots } = useStore();
  const [ex, setEx] = useState<"all" | ExchangeId>("all");
  const [q, setQ] = useState("");
  const [botType, setBotType] = useState<"v3" | "point">("v3");
  const [sort, setSort] = useState("score");
  const [open, setOpen] = useState<Set<Coin>>(() => new Set<Coin>(["BTC"]));
  const [sel, setSel] = useState<Sel>({ coin: "BTC", ex: "extended" });
  const [preset, setPreset] = useState<PresetId>("balanced");
  const [why, setWhy] = useState<{ el: HTMLElement; side: "left" | "bottom" } | null>(null);
  const closeWhy = useCallback(() => setWhy(null), []);

  const rows = useMemo(() => {
    const l = MARKETS.map((m) => ({ ...m, venues: m.venues.filter((x) => ex === "all" || x.exchange === ex) })).filter(
      (m) => m.venues.length > 0 && `${m.coin}-USD`.toLowerCase().includes(q.trim().toLowerCase()),
    );
    if (sort === "volume") return l.sort((a, b) => sum(b.venues, "volume") - sum(a.venues, "volume"));
    if (sort === "spread") return l.sort((a, b) => best(a.venues).spread - best(b.venues).spread);
    return l.sort((a, b) => best(b.venues).score - best(a.venues).score);
  }, [ex, q, sort]);

  const market = MARKETS.find((m) => m.coin === sel.coin) ?? MARKETS[0];
  const venue = market.venues.find((x) => x.exchange === sel.ex) ?? best(market.venues);

  /** The user's bots of the chosen type on a coin (and exchange). */
  const botsOn = (coin: Coin, exchange?: ExchangeId, type: Bot["type"] = botType) =>
    allBots.filter((b) => b.type === type && b.coin === coin && (!exchange || b.exchange === exchange));
  const accountsOn = (exchange: ExchangeId) => allAccounts.filter((a) => a.exchange === exchange);

  const select = (coin: Coin, venueEx: ExchangeId) => {
    const m = MARKETS.find((x) => x.coin === coin) ?? MARKETS[0];
    const vv = m.venues.find((x) => x.exchange === venueEx) ?? best(m.venues);
    setSel({ coin, ex: vv.exchange });
    setPreset(vv.preset ?? "conservative");
    setWhy(null);
  };

  const toggle = (coin: Coin) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(coin)) n.delete(coin);
      else n.add(coin);
      return n;
    });

  const createHref = (coin: Coin, exchange: ExchangeId | null, p: PresetId) =>
    hasProfile ? `/create-bot?type=v3&market=${coin}&preset=${p}${exchange ? `&exchange=${exchange}` : ""}` : "/setup";
  const applyHref = (bot: Bot, p: PresetId) => `/bots/${bot.id}?preset=${p}`;

  const panelBots = botsOn(market.coin, undefined, "v3");

  return (
    <div className="flex min-h-screen">
      <div className="min-w-0 flex-1">
        <PageHeader
          border={false}
          className="min-h-[101px] px-8"
          title="Explore Liquidity"
          description="Find markets with deep order books and steady volume for range bots."
          actions={
            <span className="t-b14 flex items-center gap-2 self-start pt-3 text-white/50">
              <span className="size-1.5 rounded-full bg-success" />
              Live · updated 2 min ago
            </span>
          }
        />
        <div className="flex flex-col gap-4 px-8 pb-12">
          <div className="grid grid-cols-4 gap-4">
            {[
              ["Markets tracked", "148", "Across 4 exchanges"],
              ["Range-friendly now", "23", "High liquidity, calm price"],
              ["Deepest book", "BTC-USD", "$12.4M within ±2%"],
              ["Avg spread · Top 20", "0.021%", "Lower is cheaper to trade"],
            ].map(([l, val, s]) => (
              <div key={l} className="flex flex-col gap-2 rounded-sm border border-line bg-card p-5">
                <span className="t-l12 text-white/50">{l}</span>
                <span className="text-[24px] leading-[31px]">{val}</span>
                <span className="t-b14 text-white/60">{s}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            {(["all", "extended", "hyperliquid", "lighter", "nado"] as const).map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setEx(x)}
                className={cn("t-b14 h-10 rounded-sm border px-3.5 transition-colors", ex === x ? "border-transparent bg-white/10 text-white" : "border-line text-white/70 hover:text-white")}
              >
                {x === "all" ? "All exchanges" : EXCHANGES[x].name}
              </button>
            ))}
            <span className="flex-1" />
            <label className="flex h-10 w-[240px] items-center gap-2 rounded-sm border border-line bg-raised px-3 focus-within:border-white/30">
              <Icon name="search" size={18} className="opacity-50" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search market" className="t-b14 w-full bg-transparent placeholder:text-white/40" />
            </label>
            <Dropdown
              className="w-[184px]"
              value={botType}
              onChange={setBotType}
              options={[
                { value: "v3", label: "Bot type: V3 Bot" },
                { value: "point", label: "Bot type: PointBot" },
              ]}
            />
            <Dropdown
              className="w-[220px]"
              value={sort}
              onChange={setSort}
              options={[
                { value: "score", label: "Sort: Liquidity score" },
                { value: "volume", label: "Sort: 24h volume" },
                { value: "spread", label: "Sort: Spread" },
              ]}
            />
          </div>

          <section className="rounded-sm border border-line bg-card">
            <div className={cn(COLS, "t-l12 h-11 border-b border-line text-white/40")}>
              <span className="pl-8">Market</span>
              <span className="text-right">24H volume</span>
              <span className="text-right">Depth ±2%</span>
              <span className="text-right">Spread</span>
              <span className="text-right">Volatility · 30D</span>
              <span className="text-right">Funding · 8H</span>
              <span className="pl-3">Liquidity</span>
              <span className="flex items-center gap-1">
                Suggested preset
                <InfoButton
                  label="How the suggestion works"
                  tip="Suggested from the last 30 days of price moves and order book depth. Click for details."
                  active={why?.side === "bottom"}
                  onClick={(el) => setWhy((w) => (w?.el === el ? null : { el, side: "bottom" }))}
                />
              </span>
              <span />
            </div>

            {rows.map((m, i) => {
              const lastCoin = i === rows.length - 1;
              const single = m.venues.length === 1;
              const expanded = !single && open.has(m.coin);
              const top = best(m.venues);
              const coinBots = botsOn(m.coin, single ? top.exchange : undefined);
              return (
                <Fragment key={m.coin}>
                  <Row
                    className={cn(
                      !expanded && !lastCoin && "border-b border-white/6",
                      expanded ? "bg-field" : sel.coin === m.coin && (!single || sel.ex === top.exchange) && "bg-hover",
                    )}
                    onClick={() => {
                      if (!single) toggle(m.coin);
                      // A one-exchange row (exchange filter on) picks that exchange; a coin row keeps the exchange picked inside it.
                      if (single || sel.coin !== m.coin) select(m.coin, top.exchange);
                    }}
                    label={`${m.coin}-USD`}
                    expanded={single ? undefined : expanded}
                    actions={
                      <RowActions
                        suggested={top.preset}
                        apply={applyFor(coinBots, top.preset)}
                        onApply={(b) => top.preset && router.push(applyHref(b, top.preset))}
                        onCreate={() => router.push(createHref(m.coin, single ? top.exchange : null, top.preset ?? "conservative"))}
                      />
                    }
                    market={
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="grid size-6 flex-none place-items-center text-white/40">
                          {!single && <Icon name="chevron-right" size={16} className={cn("transition-transform", expanded && "rotate-90")} />}
                        </span>
                        <CoinIcon coin={m.coin} size={24} round />
                        <span className="flex min-w-0 flex-col pl-1">
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            {m.coin}-USD
                            {coinBots.length > 0 && <BotChip bots={coinBots} />}
                          </span>
                          {single ? (
                            <span className="flex items-center gap-1.5 text-white/40">
                              <ExchangeLogo id={top.exchange} size={14} />
                              {EXCHANGES[top.exchange].name}
                            </span>
                          ) : (
                            <span className="text-white/40">On {m.venues.length} exchanges</span>
                          )}
                        </span>
                      </span>
                    }
                    cells={{
                      volume: fmtVol(sum(m.venues, "volume")),
                      depth: fmtDepth(sum(m.venues, "depth")),
                      spread: fmtSpread(top.spread),
                      vol30: `${m.vol30}%`,
                      funding: fmtFunding(top.funding),
                      liquidity: top.liquidity,
                      preset: top.preset,
                    }}
                    tall
                  />
                  {expanded &&
                    m.venues.map((x, j) => {
                      const lastVenue = j === m.venues.length - 1;
                      const accs = accountsOn(x.exchange);
                      const vBots = botsOn(m.coin, x.exchange);
                      const on = sel.coin === m.coin && sel.ex === x.exchange;
                      return (
                        <Row
                          key={x.exchange}
                          className={cn(on ? "bg-hover" : "bg-field", lastVenue && !lastCoin && "border-b border-white/6")}
                          onClick={() => select(m.coin, x.exchange)}
                          label={`${m.coin}-USD on ${EXCHANGES[x.exchange].name}`}
                          pressed={on}
                          tree={lastVenue ? "last" : "mid"}
                          actions={
                            <RowActions
                              suggested={x.preset}
                              apply={applyFor(vBots, x.preset)}
                              onApply={(b) => x.preset && router.push(applyHref(b, x.preset))}
                              onCreate={() => router.push(createHref(m.coin, x.exchange, x.preset ?? "conservative"))}
                            />
                          }
                          market={
                            <span className="flex min-w-0 items-center gap-2.5 pl-11">
                              <ExchangeLogo id={x.exchange} size={20} />
                              <span className="flex min-w-0 flex-col">
                                <span className="flex items-center gap-2">
                                  {EXCHANGES[x.exchange].name}
                                  {x === top && <span className="t-l12 border border-line px-1.5 text-white/60">Best</span>}
                                </span>
                                <span className="truncate text-white/40">
                                  {accs.length > 0
                                    ? `Account: ${accs[0].name}${accs.length > 1 ? ` +${accs.length - 1}` : ""}${vBots.length > 0 ? ` · ${vBots.length} ${vBots.length === 1 ? "bot" : "bots"}` : ""}`
                                    : "Not connected"}
                                </span>
                              </span>
                            </span>
                          }
                          cells={{
                            volume: fmtVol(x.volume),
                            depth: fmtDepth(x.depth),
                            spread: fmtSpread(x.spread),
                            vol30: `${m.vol30}%`,
                            funding: fmtFunding(x.funding),
                            liquidity: x.liquidity,
                            preset: x.preset,
                          }}
                        />
                      );
                    })}
                </Fragment>
              );
            })}
            {rows.length === 0 && <p className="t-b14 p-6 text-center text-white/40">No market matches “{q}”.</p>}
          </section>
          <p className="t-b14 text-white/40">Coin rows add up volume and depth across exchanges. Liquidity combines depth within ±2%, spread and 24h volume. Not financial advice.</p>
        </div>
      </div>

      <aside className="sticky top-0 flex h-screen w-[336px] flex-none flex-col border-l border-line">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-6">
          <span className="flex items-center gap-3">
            <CoinIcon coin={market.coin} size={32} round />
            <span className="text-[24px] leading-[29px] font-medium">{market.coin}-USD</span>
          </span>
          <span className="flex items-center justify-between">
            <span className="t-b14 flex items-center gap-2 text-white/70">
              <ExchangeLogo id={venue.exchange} size={16} />
              {EXCHANGES[venue.exchange].name}
            </span>
            <span className={cn("t-l12 flex items-center gap-1.5", LIQ[venue.liquidity].color)}>
              <Bars n={LIQ[venue.liquidity].bars} />
              {venue.liquidity}
            </span>
          </span>
        </div>
        <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-3 border-b border-line px-5 py-5">
            <span className="t-l12 text-white/40">Order book depth · ±2%</span>
            <Depth seed={venue.score} />
            <span className="t-b14 flex justify-between text-white/70">
              <span>Bids {fmtDepth(venue.depth * 0.51)}</span>
              <span>Asks {fmtDepth(venue.depth * 0.49)}</span>
            </span>
          </div>
          {[
            ["Price", priceFmt(COIN_PRICE[market.coin])],
            ["24H volume", fmtVol(venue.volume)],
            ["Spread", fmtSpread(venue.spread)],
            ["Volatility · 30D", `${market.vol30}%`],
            ["Funding · 8H", fmtFunding(venue.funding)],
          ].map(([l, val]) => (
            <div key={l} className="flex h-[42px] items-center justify-between border-b border-white/6 px-5">
              <span className="t-l12 text-white/40">{l}</span>
              <span className="t-b14 tnum">{val}</span>
            </div>
          ))}
          <div className="flex flex-col gap-3 px-5 pt-6 pb-4">
            <span className="t-l12 flex items-center gap-1 text-white/40">
              Strategy preset
              <InfoButton
                label={`Why this preset for ${market.coin}-USD`}
                active={why?.side === "left"}
                onClick={(el) => setWhy((w) => (w?.el === el ? null : { el, side: "left" }))}
              />
            </span>
            <div className="flex flex-col gap-1 rounded-sm border border-line bg-raised p-3.5">
              {(Object.keys(PRESETS) as PresetId[]).map((id) => {
                const p = PRESETS[id];
                const on = id === preset;
                return (
                  <button key={id} type="button" onClick={() => setPreset(id)} className={cn("flex flex-col gap-1 rounded-sm px-3 py-2.5 text-left transition-colors", on ? "bg-white/8" : "hover:bg-white/[0.03]")}>
                    <span className="flex items-center gap-2">
                      <span className={cn("text-[18px] leading-[27px]", on ? "font-medium text-white" : "text-white/60")}>{p.name}</span>
                      {id === venue.preset && <span className="t-l12 border border-line px-1.5 py-0.5 text-white/60">Suggested</span>}
                    </span>
                    <span className="flex gap-2.5">
                      <span className={cn("t-l12", on ? "text-white/60" : "text-white/30")}>
                        ±{p.range}% · {p.inRange}% in range
                      </span>
                      <span className={cn("t-l12 text-gain", !on && "opacity-60")}>{p.yr}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {panelBots.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-sm border border-line bg-field px-3 py-2.5">
                <BotFace bot={b} size={24} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="t-b14 truncate">
                    {panelBots.length === 1 ? "Your bot" : b.name} on {b.account}
                  </span>
                  <span className="t-l12 text-white/40">
                    Uses {PRESETS[b.preset].name} · ±{PRESETS[b.preset].range}%
                  </span>
                </span>
                {b.preset === preset ? (
                  <span className="t-l12 px-1 text-white/40">In use</span>
                ) : (
                  <Button variant="secondary" size="xs" onClick={() => router.push(applyHref(b, preset))} aria-label={`Apply ${PRESETS[preset].name} to ${b.name}`}>
                    Apply
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 border-t border-line px-5 pt-5 pb-6">
          <Button className="w-full" iconRight={<ArrowRight />} onClick={() => router.push(createHref(market.coin, venue.exchange, preset))}>
            {hasProfile ? "Create V3 bot" : "Setup your profile"}
          </Button>
        </div>
      </aside>

      {why && (
        <Popover anchor={why.el} side={why.side} onClose={closeWhy} label="Why this preset">
          <WhyPreset market={market} venue={venue} />
        </Popover>
      )}
    </div>
  );
}

/** The first V3 bot that runs another preset than the suggested one (the one Apply opens), if any. */
function applyFor(bots: Bot[], suggested: PresetId | null) {
  if (!suggested) return null;
  return bots.find((b) => b.type === "v3" && b.preset !== suggested) ?? null;
}

/* ------------------------------------------------------------------ */
/* Rows                                                                 */
/* ------------------------------------------------------------------ */

function Row({
  market,
  cells,
  actions,
  onClick,
  className,
  label,
  expanded,
  pressed,
  tree,
  tall,
}: {
  market: ReactNode;
  cells: { volume: string; depth: string; spread: string; vol30: string; funding: string; liquidity: Liquidity; preset: PresetId | null };
  actions: ReactNode;
  onClick: () => void;
  className?: string;
  label: string;
  expanded?: boolean;
  pressed?: boolean;
  /** Exchange rows under an expanded coin: tree line + tick, inset divider. */
  tree?: "mid" | "last";
  tall?: boolean;
}) {
  return (
    <div className={cn("group relative transition-colors hover:bg-hover", className)}>
      {tree && (
        <>
          <span aria-hidden className={cn("absolute top-0 left-[28px] w-px bg-white/15", tree === "last" ? "h-1/2" : "h-full")} />
          <span aria-hidden className="absolute top-1/2 left-[28px] h-px w-[18px] bg-white/15" />
          <span aria-hidden className="absolute top-0 right-0 left-[60px] h-px bg-white/6" />
        </>
      )}
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-expanded={expanded}
        aria-pressed={pressed}
        className={cn(COLS, "t-b14 w-full text-left", tall ? "min-h-[67px] py-3" : "min-h-[59px] py-2")}
      >
        {market}
        <span className="tnum text-right">{cells.volume}</span>
        <span className="tnum text-right">{cells.depth}</span>
        <span className="tnum text-right">{cells.spread}</span>
        <span className="tnum text-right">{cells.vol30}</span>
        <span className="tnum text-right">{cells.funding}</span>
        <span className={cn("t-l12 flex items-center gap-2 pl-3", LIQ[cells.liquidity].color)}>
          <Bars n={LIQ[cells.liquidity].bars} />
          {cells.liquidity}
        </span>
        <span className={cells.preset ? "" : "text-white/40"}>{cells.preset ? PRESETS[cells.preset].name : "Not recommended"}</span>
        <Icon name="arrow-right" size={20} className="justify-self-end text-white/50" />
      </button>
      {actions}
    </div>
  );
}

/** Row hover actions (Button small, 2142:8347): Apply <suggested preset> to the user's bot, and Create bot. */
function RowActions({ suggested, apply, onApply, onCreate }: { suggested: PresetId | null; apply: Bot | null; onApply: (b: Bot) => void; onCreate: () => void }) {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 px-4 opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
      style={HOVER_BG}
    >
      {apply && suggested && (
        <Button variant="secondary" size="xs" onClick={() => onApply(apply)} title={`Opens ${apply.name} on ${apply.account} with ${PRESETS[suggested].name} picked`}>
          Apply {PRESETS[suggested].name}
        </Button>
      )}
      <Button size="xs" onClick={onCreate}>
        Create bot
      </Button>
    </div>
  );
}

/** "1 bot" chip next to the pair: the bots' faces (up to 2) and the count. */
function BotChip({ bots }: { bots: Bot[] }) {
  return (
    <span className="t-l12 flex h-5 flex-none items-center gap-1 border border-line pr-1.5 pl-1 whitespace-nowrap text-white/60" title={bots.map((b) => `${b.name} on ${b.account}`).join(", ")}>
      <span className="flex">
        {bots.slice(0, 2).map((b, i) => (
          <span key={b.id} className={cn(i > 0 && "-ml-1")}>
            <BotFace bot={b} size={14} />
          </span>
        ))}
      </span>
      {bots.length} {bots.length === 1 ? "bot" : "bots"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Why this preset (Info popover 2142:8352)                             */
/* ------------------------------------------------------------------ */

function WhyPreset({ market, venue }: { market: Market; venue: Venue }) {
  const p = venue.preset ? PRESETS[venue.preset] : null;
  const pair = `${market.coin}-USD`;
  const volWhy = !p
    ? "Doesn't matter while the book is this thin"
    : venue.preset === "conservative"
      ? `Big moves, so a wide ±${p.range}% range`
      : venue.preset === "balanced"
        ? `Medium moves, so a ±${p.range}% range`
        : `Calm price, so a tight ±${p.range}% range`;
  const depthWhy = venue.depth >= 1 ? "Deep enough for your size" : venue.depth >= 0.15 ? "Enough for a small bot" : "Too thin for a range bot";
  const spreadWhy = venue.spread <= 0.02 ? "Cheap to trade" : venue.spread <= 0.06 ? "Fine for a range bot" : "Costly, eats into the fees you earn";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="t-b16m">{p ? `Why ${p.name} for ${pair}` : `Why no preset for ${pair}`}</span>
        <span className="t-b14 text-white/60">
          {p
            ? "We set the range from how much the price moved in the last 30 days, then check the market is deep enough for your bot."
            : `On ${EXCHANGES[venue.exchange].name} this market is too thin for a range bot: fees and slippage would cost more than the bot earns.`}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {[
          ["Volatility · 30d", `${market.vol30}%`, volWhy],
          ["Depth ±2%", fmtDepth(venue.depth), depthWhy],
          ["Spread", fmtSpread(venue.spread), spreadWhy],
        ].map(([l, val, w]) => (
          <div key={l} className="flex flex-col gap-0.5">
            <span className="flex items-center justify-between">
              <span className="t-l12 text-white/40">{l}</span>
              <span className="t-b14 tnum">{val}</span>
            </span>
            <span className="t-b14 text-white/60">{w}</span>
          </div>
        ))}
      </div>
      <span className="h-px bg-line" />
      <span className="t-b14 text-white/60">Time in range: share of the last 30 days the price stayed inside this range. Est. yearly return comes from backtests and is not a promise.</span>
      <span className="t-b14 text-white/40">Data from {EXCHANGES[venue.exchange].name}, refreshed every 5 minutes. Not financial advice.</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bits                                                                 */
/* ------------------------------------------------------------------ */

function Bars({ n }: { n: number }) {
  return (
    <span className="flex items-end gap-[2px]">
      {[6, 9, 12].map((h, i) => (
        <span key={h} className={cn("w-[3px] bg-current", i >= n && "opacity-25")} style={{ height: h }} />
      ))}
    </span>
  );
}

function Depth({ seed }: { seed: number }) {
  const bars = 24;
  return (
    <div className="relative flex h-[96px] items-end gap-[2px]">
      {Array.from({ length: bars }, (_, i) => {
        const bid = i < bars / 2;
        const d = bid ? bars / 2 - i : i - bars / 2 + 1;
        const h = 18 + d * (60 / (bars / 2)) + ((seed * (i + 3)) % 13);
        return <span key={i} className={cn("flex-1", bid ? "bg-gain/60" : "bg-error/60")} style={{ height: Math.min(96, h) }} />;
      })}
      <span className="absolute inset-y-0 left-1/2 w-px bg-white/60" />
    </div>
  );
}
