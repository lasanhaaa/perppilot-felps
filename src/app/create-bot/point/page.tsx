"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SetupShell } from "@/components/shell/setup-shell";
import { DraftAvatar, HeadingRow, SettingsCard, StepperCard } from "@/components/create/ui";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { EXCHANGES } from "@/components/ui/exchange-logo";
import { Button } from "@/components/ui/primitives";
import { CREATE_STEPS, draftLook, useDraft, type Draft } from "@/lib/draft";
import { useStore } from "@/lib/store";

const MARKET_SETS: { id: Draft["markets"]; title: string; description: string }[] = [
  { id: "top20", title: "Top 20 Crypto", description: "Top 20 Crypto pairs by combined open interest. Excludes equities, commodities, FX." },
  { id: "top30", title: "Top 30 incl. RWA", description: "Top 30 markets including equities, commodities, and FX." },
  { id: "all", title: "All matched", description: "Every market the executor sees on at least 2 of your selected exchanges." },
];

const SPREADS: { id: Draft["spread"]; label: string }[] = [
  { id: "fee", label: "Fee Neutral" },
  { id: "near", label: "Near Neutral (Recommended)" },
  { id: "half", label: "Half Neutral" },
  { id: "custom", label: "Custom" },
];

const CLONING: { id: Draft["cloning"]; label: string; meta?: string }[] = [
  { id: "none", label: "None" },
  { id: "slow", label: "Slow", meta: "~7 days" },
  { id: "medium", label: "Medium", meta: "~3 days" },
  { id: "fast", label: "Fast", meta: "~1 hour" },
];

/** Create bot · 2 PointBot settings (2110:8038). */
export default function PointSettingsPage() {
  const router = useRouter();
  const { allAccounts } = useStore();
  const { draft, update, ready } = useDraft();
  const picked = allAccounts.filter((a) => draft.accounts.includes(a.id));
  if (!ready) return null;
  return (
    <SetupShell steps={CREATE_STEPS} current={1} exitLabel="Exit" align="top">
      <div className="flex w-[1152px] flex-col gap-6">
        <HeadingRow
          back="/create-bot/accounts"
          avatar={<DraftAvatar look={draftLook(draft)} original={draft.avatarOriginal ?? draftLook(draft)} name={"PointBot"} onChange={(avatar) => update({ avatar })} />}
          title="Set up your PointBot"
          description={`Runs on ${picked.map((a) => `${a.name} · ${EXCHANGES[a.exchange].name}`).join(" and ")}. Choose the markets, size and spread.`}
        />

        <SettingsCard
          title="Markets"
          description="Which markets the bot will scan. Markets are matched across the exchanges you select and ranked by cumulative open interest."
        >
          <div className="flex rounded-sm border border-line p-1">
            {MARKET_SETS.map((m) => {
              const on = draft.markets === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => update({ markets: m.id })}
                  className={cn("flex flex-1 flex-col gap-2 rounded-sm px-4 py-3 text-left transition-all", on ? "bg-raised" : "opacity-50 hover:opacity-80")}
                >
                  <span className="text-[18px] leading-[18px] font-semibold text-white/90">{m.title}</span>
                  <span className="t-b16 text-white/60">{m.description}</span>
                </button>
              );
            })}
          </div>
        </SettingsCard>

        <SettingsCard title="Main Settings">
          <div className="grid grid-cols-3 gap-4">
            <StepperCard
              size="md"
              label="Per market position size"
              value={`$${draft.perMarket}`}
              onInc={() => update({ perMarket: draft.perMarket + 50 })}
              onDec={() => update({ perMarket: Math.max(100, draft.perMarket - 50) })}
            />
            <StepperCard
              size="md"
              label="Leverage"
              value={`${draft.leverage}x`}
              onInc={() => update({ leverage: Math.min(10, draft.leverage + 1) })}
              onDec={() => update({ leverage: Math.max(1, draft.leverage - 1) })}
            />
            <StepperCard
              size="md"
              label="Reduce all leverage"
              value={`${draft.reduceLeverage}x`}
              onInc={() => update({ reduceLeverage: Math.min(20, draft.reduceLeverage + 1) })}
              onDec={() => update({ reduceLeverage: Math.max(draft.leverage, draft.reduceLeverage - 1) })}
            />
          </div>
        </SettingsCard>

        <SettingsCard title="Spread mode" description="How much price gap between exchanges the bot needs before it trades. Neutral modes cover the trading fees.">
          <div className="flex flex-col gap-2">
            {SPREADS.map((s) => (
              <ListOption key={s.id} on={draft.spread === s.id} onClick={() => update({ spread: s.id })} label={s.label}>
                {s.id === "custom" && (
                  <input
                    placeholder="e.g 8,12"
                    onFocus={() => update({ spread: "custom" })}
                    onClick={(e) => e.stopPropagation()}
                    className="t-b16 mt-1 w-full border-b border-line bg-transparent py-2.5 outline-none placeholder:text-white/50 focus:border-white/40"
                  />
                )}
              </ListOption>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Closing Speed" description="The bot reduces the expected profit over time in order to close within this timeframe.">
          <div className="flex flex-col gap-2">
            {CLONING.map((c) => (
              <ListOption key={c.id} on={draft.cloning === c.id} onClick={() => update({ cloning: c.id })} label={c.label} meta={c.meta} />
            ))}
          </div>
        </SettingsCard>

        <div className="flex justify-between">
          <Button variant="secondary" className="w-[200px]" href="/create-bot/accounts">
            Back
          </Button>
          <Button className="w-[240px]" onClick={() => router.push("/create-bot/start")}>
            Continue
          </Button>
        </div>
      </div>
    </SetupShell>
  );
}

function ListOption({ on, onClick, label, meta, children }: { on: boolean; onClick: () => void; label: string; meta?: string; children?: ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn("flex min-h-14 cursor-pointer flex-col justify-center rounded-sm px-4 py-3.5 transition-colors", on ? "bg-white/[0.07]" : "bg-field hover:bg-white/[0.045]")}
    >
      <span className="flex items-center gap-3">
        <span className={cn("size-5 flex-none rounded-full", on ? "border-[5px] border-white" : "border border-white/30")} />
        <span className={cn("text-[18px] leading-[26px]", on ? "text-white" : "text-white/80")}>{label}</span>
      </span>
      {meta && <span className="t-b16 pl-8 text-white/50">{meta}</span>}
      {children && <span className="pl-8">{children}</span>}
    </div>
  );
}
