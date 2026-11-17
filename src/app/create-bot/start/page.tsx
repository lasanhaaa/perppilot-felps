"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlowHeading, SetupShell } from "@/components/shell/setup-shell";
import { SummaryRow } from "@/components/flow/rows";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { ExchangeLogo, EXCHANGES } from "@/components/ui/exchange-logo";
import { Icon } from "@/components/ui/icons";
import { Button, Notice, PinInput } from "@/components/ui/primitives";
import { CREATE_STEPS, draftRange, useDraft } from "@/lib/draft";
import { PRESETS, money, priceFmt, series, type Bot } from "@/lib/mock";
import { useStore } from "@/lib/store";

/** Create bot · 3 Start bot (2103:8521): summary, PIN, start. */
export default function StartBotPage() {
  const router = useRouter();
  const { allAccounts, addBot } = useStore();
  const { draft, clear, ready } = useDraft();
  const [pin, setPin] = useState("");
  const [starting, setStarting] = useState(false);
  if (!ready) return null;

  const isV3 = draft.type === "v3";
  const account = allAccounts.find((a) => a.id === draft.account) ?? allAccounts[0];
  const picked = allAccounts.filter((a) => draft.accounts.includes(a.id));
  const range = draftRange(draft);
  const avatar = isV3 ? { shape: 9, eyes: 1, color: 0 } : { shape: 6, eyes: 0, color: 6 };
  const presetLabel = draft.mode === "simple" ? PRESETS[draft.preset].name : "Custom range";
  const marketsLabel = { top20: "Top 20 Crypto", top30: "Top 30 incl. RWA", all: "All matched" }[draft.markets];

  const start = () => {
    if (pin.length < 6 || starting) return;
    setStarting(true);
    const now = new Date();
    const hour = now.getHours();
    const id = `bot-mine-${now.getTime().toString(36)}`;
    const bot: Bot = {
      id,
      name: isV3 ? `${draft.coin}-USD` : "PointBot",
      type: draft.type,
      coin: isV3 ? draft.coin : "BTC",
      exchange: isV3 ? account.exchange : picked[0]?.exchange ?? "extended",
      account: isV3 ? account.name : picked[0]?.name ?? "",
      accounts: isV3 ? undefined : picked.map((a) => a.name),
      avatar: { ...avatar, shape: Math.floor(Math.random() * 10) },
      status: "in-range",
      preset: draft.preset,
      equity: isV3 ? draft.positionSize : draft.perMarket * picked.length,
      earned: 0,
      netFees: 0,
      apr: isV3 ? (draft.mode === "simple" ? parseFloat(PRESETS[draft.preset].yr) + 4 : 16) : 9,
      spark: series(now.getTime() % 997, 7, 10, 0.02, 0.05),
      runtime: "Just started",
      started: `${now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`,
      price: range.price,
      min: isV3 ? range.min : 0,
      max: isV3 ? range.max : 0,
      positionSize: isV3 ? draft.positionSize : draft.perMarket,
      mine: true,
    };
    setTimeout(() => {
      addBot(bot);
      clear();
      router.push(`/bots/${id}?started=1`);
    }, 1400);
  };

  return (
    <SetupShell steps={CREATE_STEPS} current={2} exitLabel="Exit">
      <form
        className="flex w-[436px] flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <FlowHeading title="Start your bot" description="Check your setup, then enter your PIN to start." />
        <div className="flex flex-col rounded-sm border border-line bg-field">
          {isV3 ? (
            <>
              <SummaryRow
                icon={<BotAvatar avatar={avatar} size={32} />}
                title={`V3 Bot · ${draft.coin}-USD`}
                meta="Bot"
                status={presetLabel}
              />
              <SummaryRow icon={<ExchangeLogo id={account.exchange} size={32} />} title={account.name} meta="Account" status={EXCHANGES[account.exchange].name} />
              <SummaryRow
                title={`${priceFmt(range.min)} – ${priceFmt(range.max)}`}
                meta="Price range"
                status={draft.mode === "simple" ? `±${PRESETS[draft.preset].range}%` : `${range.lo}% / +${range.hi}%`}
              />
              <SummaryRow title={`$${money(draft.positionSize)}`} meta="Position size" status="USD" />
            </>
          ) : (
            <>
              <SummaryRow icon={<BotAvatar avatar={avatar} size={32} />} title={`PointBot · ${marketsLabel}`} meta="Bot" status={`${draft.leverage}x`} />
              <SummaryRow
                icon={
                  <span className="flex">
                    {picked.map((a, i) => (
                      <span key={a.id} className="border-2 border-screen" style={{ marginLeft: i ? -10 : 0 }}>
                        <ExchangeLogo id={a.exchange} size={28} />
                      </span>
                    ))}
                  </span>
                }
                title={picked.map((a) => a.name).join(" + ")}
                meta="Accounts"
                status={`${picked.length} exchanges`}
              />
              <SummaryRow title={`$${draft.perMarket}`} meta="Per market" status="USD" />
              <SummaryRow
                title={{ fee: "Fee Neutral", near: "Near Neutral", half: "Half Neutral", custom: "Custom" }[draft.spread]}
                meta="Spread mode"
                status={{ none: "No limit", slow: "~7 days", medium: "~3 days", fast: "~1 hour" }[draft.cloning]}
              />
            </>
          )}
        </div>
        <PinInput value={pin} onChange={setPin} />
        <Notice>Your PIN unlocks the account keys for this bot. The first orders are placed right after you start.</Notice>
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={pin.length < 6} iconLeft={starting ? <span className="spin size-4 rounded-full border-2 border-black/30 border-t-black" /> : undefined}>
            {starting ? "Starting your bot…" : "Start bot"}
          </Button>
          <Button variant="ghost" className="self-center" iconLeft={<Icon name="arrow-left" size={16} />} onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </form>
    </SetupShell>
  );
}
