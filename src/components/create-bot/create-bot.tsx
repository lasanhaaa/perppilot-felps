"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { BotTypeLogo, BtcLogo } from "@/components/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, FieldLabel, RadioRow, Section, StepperCard } from "@/components/ui/field";
import { useDismiss } from "@/components/ui/menu";
import { SegmentedTabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/tag";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { PriceChart } from "@/components/bots/price-chart";
import { markets } from "@/lib/mock-data";
import { formatUsd } from "@/lib/format";
import { priceSeries } from "@/lib/series";
import type { BotKind } from "@/lib/types";
import { AccountSelect, getAccountOption } from "./account-select";
import { PinModal } from "./pin-modal";

const BOT_TYPES: { value: BotKind; title: string; text: string }[] = [
  { value: "v3", title: "V3 Bot", text: "Advanced V3 Liquidity Pool automation on a single exchange." },
  { value: "pointbot", title: "PointBot", text: "Cross-exchange arbitrage between multiple exchanges" },
];

function BotTypeSelect({ value, onChange }: { value: BotKind; onChange: (v: BotKind) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const current = BOT_TYPES.find((b) => b.value === value)!;
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label="Bot type" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 bg-fill-2 p-2 text-left hover:bg-fill-3">
        <BotTypeLogo type={value} size={32} />
        <span className="flex flex-1 flex-col">
          <span className="text-[14px]">{current.title}</span>
          <span className="text-[12px] leading-[1.35] text-white/50">{current.text}</span>
        </span>
        <Icon name="arrow-dropdown" size={20} className="text-white/60" />
      </button>
      {open && (
        <ul role="listbox" className="absolute inset-x-0 top-[calc(100%+2px)] z-30 animate-fade-in bg-[#1d1f1e] shadow-2xl shadow-black/60">
          {BOT_TYPES.map((b) => (
            <li key={b.value}>
              <button
                type="button"
                role="option"
                aria-selected={b.value === value}
                onClick={() => {
                  onChange(b.value);
                  setOpen(false);
                }}
                className={cn("flex w-full items-center gap-3 p-2 text-left hover:bg-fill-3", b.value === value && "bg-fill-2")}
              >
                <BotTypeLogo type={b.value} size={32} />
                <span className="flex flex-col">
                  <span className="text-[14px]">{b.title}</span>
                  <span className="text-[12px] text-white/50">{b.text}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function pctLabel(value: number, base: number) {
  const pct = ((value - base) / base) * 100;
  return `(${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;
}

function V3Form() {
  const [marketId, setMarketId] = useState("BTC-USD");
  const market = markets.find((m) => m.id === marketId)!;
  const [feeRate, setFeeRate] = useState("0.15");
  const [tf, setTf] = useState<"1M" | "1W" | "1D">("1M");
  const mid = market.mark * 1.0072;
  const [min, setMin] = useState(() => Math.round(mid * 0.95 * 100) / 100);
  const [max, setMax] = useState(() => Math.round(mid * 1.1 * 100) / 100);
  const [btc, setBtc] = useState("0.006453");
  const [selfManaged, setSelfManaged] = useState(false);
  const step = mid * 0.005;

  const series = useMemo(() => priceSeries({ seed: tf === "1M" ? 42 : tf === "1W" ? 43 : 44, start: mid * 0.97, volatility: 0.004, points: 160 }), [mid, tf]);
  const usd = (parseFloat(btc) || 0) * mid;

  return (
    <div className="flex flex-col gap-2">
      <Section title="Main settings" description="Pick the market and the fee tier of the pool the bot provides liquidity to.">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="market">Market</FieldLabel>
            <div className="relative flex items-center gap-3 bg-fill-2 p-2">
              <BtcLogo size={32} />
              <select id="market" value={marketId} onChange={(e) => setMarketId(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
              <span className="flex flex-1 flex-col">
                <span className="text-[14px]">{market.id.replace("-", " - ")}</span>
                <span className="text-[12px] text-white/50 tabular">Mark: {formatUsd(market.mark)}</span>
              </span>
              <Icon name="arrow-dropdown" size={20} className="text-white/60" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="fee">Fee rate %</FieldLabel>
            <input id="fee" inputMode="decimal" value={`${feeRate}%`} onChange={(e) => setFeeRate(e.target.value.replace(/[^\d.]/g, ""))} className="h-12 bg-fill-2 px-3 text-[16px] outline-none focus:ring-1 focus:ring-brand/60" />
          </div>
        </div>
      </Section>

      <Section>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-display text-[24px] tabular">{formatUsd(mid)}</p>
            <p className="text-[12px] font-medium uppercase text-white/40">Current mid price</p>
          </div>
          <div className="flex gap-1">
            {(["1M", "1W", "1D"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={tf === t} onClick={() => setTf(t)} className={cn("h-8 px-2.5 text-[13px]", tf === t ? "bg-fill-3 text-white" : "text-white/40 hover:text-white/80")}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <PriceChart
          data={series}
          height={300}
          ariaLabel="Price range preview"
          xLabels={["Mar 6", "Aug 28", "Feb 19", "Aug 12", "Feb 3", "Jul 28", "Jan 19", "Jan 19"]}
          refLines={[
            { value: max, color: "#2fe8b4" },
            { value: min, color: "#ff3737" },
          ]}
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <StepperCard
            label="Min price"
            value={formatUsd(min)}
            sub={<span className="text-[12px] text-danger tabular">{pctLabel(min, mid)}</span>}
            onIncrement={() => setMin((v) => Math.min(v + step, max - step))}
            onDecrement={() => setMin((v) => Math.max(v - step, 0))}
          />
          <StepperCard
            label="Max price"
            value={formatUsd(max)}
            sub={<span className="text-[12px] text-brand tabular">{pctLabel(max, mid)}</span>}
            onIncrement={() => setMax((v) => v + step)}
            onDecrement={() => setMax((v) => Math.max(v - step, min + step))}
          />
        </div>
      </Section>

      <Section title="Position Size" description="Enter the amount in either token. The other side updates automatically.">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-3 bg-fill-2 p-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <input aria-label="Position size in BTC" inputMode="decimal" value={btc} onChange={(e) => setBtc(e.target.value.replace(/[^\d.]/g, ""))} className="w-full bg-transparent font-display text-[20px] outline-none tabular" />
              <span className="text-[12px] text-white/50 tabular">{formatUsd(usd)}</span>
            </span>
            <span className="text-[14px] text-white/80">{market.base}</span>
            <BtcLogo size={28} />
          </label>
          <label className="flex items-center gap-3 bg-fill-2 p-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <input
                aria-label="Position size in USD"
                inputMode="decimal"
                value={usd ? usd.toFixed(2) : ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(/[^\d.]/g, "")) || 0;
                  setBtc((v / mid).toFixed(6));
                }}
                className="w-full bg-transparent font-display text-[20px] outline-none tabular"
              />
              <span className="text-[12px] text-white/50 tabular">min $398.45</span>
            </span>
            <span className="text-[14px] text-white/80">USD</span>
            <span className="grid size-7 place-items-center bg-brand font-display text-[18px] text-black">$</span>
          </label>
        </div>
        <div className="mt-4">
          <Checkbox checked={selfManaged} onChange={setSelfManaged}>
            Do not open any long position for me. I manage it myself.
          </Checkbox>
        </div>
      </Section>

      <Section title="Minimum Balance" description="Smallest USD collateral that keeps the worst case position solvent if price falls to the bottom of your grid.">
        <p className="bg-fill-2 px-3 py-3 font-display text-[16px] tabular">{formatUsd(usd)}</p>
      </Section>

      <Section title="Market Cap" description="New V3 Bots must stay below 80% total market usage and may use at most 15% of the market limit.">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["Current usage", "24.12%"],
            ["Remaining headroom", "$588,829.89"],
            ["Maximum pool", "$150,000"],
          ].map(([k, v]) => (
            <div key={k} className="bg-fill-2 p-3">
              <p className="text-[12px] text-white/50">{k}</p>
              <p className="font-display text-[20px] tabular">{v}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function PointBotForm() {
  const [universe, setUniverse] = useState<"top20" | "top30" | "all">("top20");
  const [size, setSize] = useState(500);
  const [perMarketLev, setPerMarketLev] = useState(3);
  const [maxLev, setMaxLev] = useState(10);
  const [spread, setSpread] = useState<"fee" | "near" | "half" | "custom">("fee");
  const [custom, setCustom] = useState("");
  const [speed, setSpeed] = useState<"none" | "slow" | "medium" | "fast">("none");

  const universes = [
    { value: "top20" as const, title: "Top 20 Crypto", text: "Top 20 Crypto pairs by combined open interest. Excludes equities, commodities, FX." },
    { value: "top30" as const, title: "Top 30 incl. RWA", text: "Top 30 markets including equities, commodities, and FX." },
    { value: "all" as const, title: "All matched", text: "Every market the executor sees at least 2 of your selected exchanges." },
  ];

  return (
    <div className="flex flex-col gap-2">
      <Section title="Markets" description="Which markets the bot will scan. Markets are matched across the exchanges you select and ranked by cumulative open interest.">
        <div role="radiogroup" className="grid border border-line sm:grid-cols-3">
          {universes.map((u) => (
            <button
              key={u.value}
              type="button"
              role="radio"
              aria-checked={universe === u.value}
              onClick={() => setUniverse(u.value)}
              className={cn("flex flex-col gap-1 p-4 text-left transition-colors", universe === u.value ? "bg-fill-3" : "hover:bg-fill-2")}
            >
              <span className={cn("text-[16px]", universe === u.value ? "text-white" : "text-white/70")}>{u.title}</span>
              <span className={cn("text-[14px]", universe === u.value ? "text-white/70" : "text-white/40")}>{u.text}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Main Settings">
        <div className="grid gap-2 md:grid-cols-3">
          <StepperCard label="Per market position size" value={`$${size}`} onIncrement={() => setSize((v) => v + 50)} onDecrement={() => setSize((v) => Math.max(50, v - 50))} />
          <StepperCard label="Per market leverage" value={`${perMarketLev}x`} onIncrement={() => setPerMarketLev((v) => Math.min(20, v + 1))} onDecrement={() => setPerMarketLev((v) => Math.max(1, v - 1))} />
          <StepperCard label="Reduce all leverage" value={`${maxLev}x`} onIncrement={() => setMaxLev((v) => Math.min(50, v + 1))} onDecrement={() => setMaxLev((v) => Math.max(1, v - 1))} />
        </div>
      </Section>

      <Section title="Spread mode" description="How far from the mid price the bot quotes on each exchange.">
        <div role="radiogroup" className="flex flex-col gap-2">
          <RadioRow name="spread" checked={spread === "fee"} onSelect={() => setSpread("fee")} title="Fee Neutral" />
          <RadioRow name="spread" checked={spread === "near"} onSelect={() => setSpread("near")} title="Near Neutral (Recommended)" />
          <RadioRow name="spread" checked={spread === "half"} onSelect={() => setSpread("half")} title="Half Neutral" />
          <RadioRow name="spread" checked={spread === "custom"} onSelect={() => setSpread("custom")} title="Custom">
            <input
              aria-label="Custom spread in basis points"
              placeholder="e.g 8,12"
              value={custom}
              onFocus={() => setSpread("custom")}
              onChange={(e) => setCustom(e.target.value)}
              className="mt-2 border-b border-line bg-transparent py-1 text-[14px] outline-none placeholder:text-white/40 focus:border-brand"
            />
          </RadioRow>
        </div>
      </Section>

      <Section title="Cloning Speed" description="The bot reduces the expected profit over time in order to close within this timeframe.">
        <div role="radiogroup" className="flex flex-col gap-2">
          <RadioRow name="speed" checked={speed === "none"} onSelect={() => setSpeed("none")} title="None" />
          <RadioRow name="speed" checked={speed === "slow"} onSelect={() => setSpeed("slow")} title="Slow" description="~7 days" />
          <RadioRow name="speed" checked={speed === "medium"} onSelect={() => setSpeed("medium")} title="Medium" description="~3 days" />
          <RadioRow name="speed" checked={speed === "fast"} onSelect={() => setSpeed("fast")} title="Fast" description="~1 hour" />
        </div>
      </Section>
    </div>
  );
}

export function CreateBot({ initialKind = "v3" }: { initialKind?: BotKind }) {
  const router = useRouter();
  const [kind, setKind] = useState<BotKind>(initialKind);
  const [mode, setMode] = useState<"advanced" | "simple">("advanced");
  const [accountIds, setAccountIds] = useState<(string | null)[]>(["acc-main", "acc-grvt-bot"]);
  const [pinOpen, setPinOpen] = useState(false);

  const needed = kind === "pointbot" ? accountIds.length : 1;
  const firstAccount = getAccountOption(accountIds[0]);

  return (
    <>
      <PageHeader backHref="/bots" title="Create New Bot" subtitle="Configure and deploy a new trading bot" />
      <PageBody className="pt-4">
        <div className="grid items-start gap-2 lg:grid-cols-[minmax(280px,330px)_1fr] xl:gap-4">
          <div className="flex flex-col gap-2 lg:sticky lg:top-6">
            <Section title="Setup" description="Choose the bot type and the account it runs on.">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-white/60">Bot Type</span>
                  <BotTypeSelect value={kind} onChange={setKind} />
                </div>
                {Array.from({ length: needed }, (_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <span className="flex items-center justify-between text-[14px] text-white/60">
                      {kind === "pointbot" ? `Account ${i + 1}` : "Account"}
                      {kind === "pointbot" && i > 1 && (
                        <button type="button" className="text-[12px] text-white/40 hover:text-danger" onClick={() => setAccountIds((ids) => ids.filter((_, j) => j !== i))}>
                          Remove
                        </button>
                      )}
                    </span>
                    <AccountSelect
                      label={`Account ${i + 1}`}
                      value={accountIds[i] ?? null}
                      exclude={accountIds.filter((_, j) => j !== i).filter(Boolean) as string[]}
                      onChange={(id) => setAccountIds((ids) => ids.map((x, j) => (j === i ? id : x)))}
                    />
                  </div>
                ))}
                {kind === "pointbot" && accountIds.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setAccountIds((ids) => [...ids, null])}
                    className="flex h-10 items-center justify-center gap-2 bg-fill-2 text-[13px] text-white/60 hover:bg-fill-3 hover:text-white"
                  >
                    <Icon name="add-diamond" size={18} />
                    Add another account
                    <span className="font-mono text-white/40">[{accountIds.length}/5]</span>
                  </button>
                )}
              </div>
            </Section>
            {kind === "pointbot" && (
              <div role="note" className="border-l-2 border-warn bg-warn/10 p-4">
                <p className="flex items-center gap-2 font-mono text-[12px] uppercase text-warn">
                  <Icon name="info" size={16} /> Warning
                </p>
                <p className="mt-2 text-[14px] leading-[1.5] text-white/90">
                  You need at least $167 margin on each account for the bot to place trades. Below this, the bot will fail to start with an insufficient equity error.
                </p>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="border-b border-line">
              <SegmentedTabs
                className="border-0 p-0"
                value={mode}
                onChange={setMode}
                items={[
                  { value: "advanced", label: "Advanced" },
                  { value: "simple", label: "Simple", disabled: true, badge: <Badge tone="grey" className="bg-fill-2 text-white/50">Coming soon</Badge> },
                ]}
              />
            </div>
            {kind === "v3" ? <V3Form /> : <PointBotForm />}
            <div className="flex items-center justify-between gap-2">
              <ButtonLink href="/bots" variant="secondary" icon="arrow-back">
                Cancel
              </ButtonLink>
              <Button iconRight="arrow-forward" onClick={() => setPinOpen(true)} disabled={accountIds.slice(0, needed).some((a) => !a)}>
                Next step
              </Button>
            </div>
          </div>
        </div>
      </PageBody>
      <PinModal open={pinOpen} onClose={() => setPinOpen(false)} accountName={firstAccount?.title ?? "your account"} onConfirm={() => router.push("/bots/bot-001")} />
    </>
  );
}
