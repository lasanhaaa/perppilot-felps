"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { SetupShell } from "@/components/shell/setup-shell";
import { CandleRange, DraftAvatar, HeadingRow, MarketSelect, PositionSize, RangeBar, SettingsCard, StepperCard, ViewSwitch } from "@/components/create/ui";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { EXCHANGES } from "@/components/ui/exchange-logo";
import { Button, TextLink } from "@/components/ui/primitives";
import { CREATE_STEPS, draftLook, draftRange, useDraft } from "@/lib/draft";
import { PRESETS, money, priceFmt, type PresetId } from "@/lib/mock";
import { useStore } from "@/lib/store";

/** Create bot · 2 V3 settings, Simple (2108:7729) and Advanced (2108:7898). */
export default function V3SettingsPage() {
  const router = useRouter();
  const { allAccounts } = useStore();
  const { draft, update, ready } = useDraft();
  const account = allAccounts.find((a) => a.id === draft.account) ?? allAccounts[0];
  const range = draftRange(draft);
  const advanced = draft.mode === "advanced";
  const runsOn = account ? `Runs on ${account.name} · ${EXCHANGES[account.exchange].name}.` : "";

  if (!ready) return null;
  return (
    <SetupShell steps={CREATE_STEPS} current={1} exitLabel="Exit" align="top">
      <div className="flex w-[1152px] flex-col gap-6">
        <HeadingRow
          back="/create-bot/account"
          avatar={<DraftAvatar look={draftLook(draft)} original={draft.avatarOriginal ?? draftLook(draft)} name={`${draft.coin}-USD`} onChange={(avatar) => update({ avatar })} />}
          title="Set up your V3 bot"
          description={advanced ? `${runsOn} Set the market, price range and position yourself.` : `${runsOn} Pick a market and a strategy, we set the range for you.`}
          right={
            <ViewSwitch
              value={draft.mode}
              onChange={(mode) => update(mode === "advanced" ? { mode, minPct: range.lo, maxPct: range.hi } : { mode })}
              options={[
                { value: "simple", label: "Simple" },
                { value: "advanced", label: "Advanced" },
              ]}
            />
          }
        />

        <SettingsCard title="Market" description="Pick the pair your bot trades. Not sure? Explore Liquidity shows the deepest markets.">
          <MarketSelect value={draft.coin} onChange={(coin) => update({ coin })} />
        </SettingsCard>

        {!advanced ? (
          <>
            <section className="flex flex-col gap-4 rounded-sm border border-line bg-card p-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-[18px] leading-[27px] font-medium">Choose a strategy</h2>
                <p className="t-b16 text-white/30">Pick how wide your bot&apos;s price range is. You can fine-tune it later in Advanced.</p>
              </div>
              <StrategyTabs value={draft.preset} onChange={(preset) => update({ preset })} />
            </section>

            <section className="flex flex-col gap-5 rounded-sm border border-line bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="text-[13px] leading-4 text-white/40 uppercase">Price range · {PRESETS[draft.preset].name}</span>
                  <TextLink icon={null} onClick={() => update({ mode: "advanced", minPct: range.lo, maxPct: range.hi })}>
                    Edit in Advanced
                  </TextLink>
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="text-[13px] leading-4 text-white/40 uppercase">{draft.coin} price</span>
                  <span className="tnum text-[24px] leading-[29px] font-medium">{priceFmt(range.price)}</span>
                </span>
              </div>
              <RangeBar price={range.price} lo={range.lo} hi={range.hi} />
            </section>
          </>
        ) : (
          <section className="flex flex-col gap-4 rounded-sm border border-line bg-card p-5">
            <CandleRange coin={draft.coin} lo={draft.minPct} hi={draft.maxPct} />
            <div className="grid grid-cols-2 gap-2 pt-4">
              <StepperCard
                label="Min price"
                value={`$${money(range.min)}`}
                sub={<span className="t-b14 text-error">( {draft.minPct.toFixed(1)}% )</span>}
                onInc={() => update({ minPct: Math.min(-0.5, draft.minPct + 0.5) })}
                onDec={() => update({ minPct: Math.max(-40, draft.minPct - 0.5) })}
              />
              <StepperCard
                label="Max price"
                value={`$${money(range.max)}`}
                sub={<span className="t-b14 text-gain">( +{draft.maxPct.toFixed(1)}% )</span>}
                onInc={() => update({ maxPct: Math.min(60, draft.maxPct + 0.5) })}
                onDec={() => update({ maxPct: Math.max(0.5, draft.maxPct - 0.5) })}
              />
            </div>
          </section>
        )}

        <SettingsCard title="Position Size" description="Enter the amount in either token. The other side updates automatically">
          <PositionSize coin={draft.coin} value={draft.positionSize} onChange={(positionSize) => update({ positionSize })} />
          {!advanced && <p className="t-b14 text-white/30">Minimum balance and market cap limits are checked for you before the bot starts.</p>}
        </SettingsCard>

        {advanced && (
          <>
            <SettingsCard
              title="Minimum Balance"
              description="Smallest USD collateral that keeps the worst case position solvent if price falls to the bottom of your grid."
            >
              <div className="flex h-14 items-center rounded-sm border border-line bg-raised px-4">
                <span className="tnum text-[20px] leading-5 font-medium">${money(Math.max(draft.positionSize * (1 + Math.abs(draft.minPct) / 100), 398.45))}</span>
              </div>
            </SettingsCard>
            <SettingsCard title="Market Cap" description="New V3 Bots must stay below 80% total market usage and may use at most 15% of the market limit.">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Current usage", "24.12%"],
                  ["Remaining headroom", "$588,829.89"],
                  ["Maximum pool", "$150,000"],
                ].map(([l, v]) => (
                  <div key={l} className="flex flex-col gap-2 rounded-sm bg-raised p-4">
                    <span className="text-[14px] leading-[14px] text-white/60">{l}</span>
                    <span className="tnum text-[24px] leading-6 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </SettingsCard>
          </>
        )}

        <div className="flex justify-between">
          <Button variant="secondary" className="w-[200px]" href="/create-bot/account">
            Back
          </Button>
          <Button className="w-[240px]" disabled={draft.positionSize < 398.45} onClick={() => router.push("/create-bot/start")}>
            Continue
          </Button>
        </div>
      </div>
    </SetupShell>
  );
}

/** "Option tabs / Strategy" (horizontal). */
function StrategyTabs({ value, onChange, className }: { value: PresetId; onChange: (p: PresetId) => void; className?: string }) {
  return (
    <div className={cn("flex rounded-sm border border-line bg-raised p-3.5", className)}>
      {(Object.keys(PRESETS) as PresetId[]).map((id) => {
        const p = PRESETS[id];
        const on = id === value;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn("flex flex-1 flex-col gap-2 rounded-sm px-4 py-3 text-left transition-colors", on ? "bg-white/5" : "hover:bg-white/[0.025]")}
          >
            <span className="flex h-[27px] items-center gap-2">
              <span className={cn("text-[18px] leading-[27px] font-medium", on ? "text-white" : "text-white/60")}>{p.name}</span>
              {id === "balanced" && <span className="t-l12 border border-line px-1.5 py-0.5 text-white/60">Recommended</span>}
            </span>
            <span className={cn("t-b16", on ? "text-white/60" : "text-white/30")}>{p.description}</span>
            <span className="flex gap-3">
              <span className={cn("t-l12", on ? "text-white/60" : "text-white/30")}>
                ±{p.range}% range · {p.inRange}% in range
              </span>
              <span className={cn("t-l12 text-gain", !on && "opacity-60")}>{p.yr}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
