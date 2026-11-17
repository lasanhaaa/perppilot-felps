"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BOT_TYPE_LABEL, STATUS_LABEL, money, signedUsd, usd, type Bot, type BotStatus, type Coin } from "@/lib/mock";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { CoinIcon } from "@/components/ui/coin";
import { EXCHANGES, ExchangeGlyph, type ExchangeId } from "@/components/ui/exchange-logo";
import { Icon } from "@/components/ui/icons";
import { FluidSparkline, Sparkline } from "@/components/charts";

/* ---------- Status pill (no glyphs: status is the tag alone) ---------- */

const STATUS_TONE: Record<BotStatus, string> = {
  "in-range": "bg-gain/10 text-gain",
  "out-of-range": "bg-error/10 text-error",
  error: "bg-error/10 text-error",
  stopped: "bg-white/8 text-white/70",
};

export function StatusPill({ status, className }: { status: BotStatus; className?: string }) {
  return (
    <span className={cn("t-l12 inline-flex h-[19px] items-center px-1.5 leading-[15px] whitespace-nowrap", STATUS_TONE[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ---------- Exchange tag ("EXTENDED") ---------- */

export function ExchangeTag({ exchange, glyph, size = "sm", className }: { exchange: ExchangeId; glyph?: boolean; size?: "xs" | "sm" | "md"; className?: string }) {
  return (
    <span
      className={cn(
        "t-l12 inline-flex flex-none items-center gap-1.5 bg-white/5 whitespace-nowrap",
        size === "xs" && "h-[14px] px-[5px] text-[10px] leading-[12px] text-white/55",
        size === "sm" && "h-[17px] px-1.5 text-[11px] leading-[13px] text-white/55",
        size === "md" && "h-[22px] px-1.5 text-white/40",
        className,
      )}
    >
      {glyph && <ExchangeGlyph id={exchange} size={12} />}
      {EXCHANGES[exchange].name}
    </span>
  );
}

/* ---------- Pair line ("BTC-USD · V3 Bot") ---------- */

export function PairLine({ coin, type, size = "md", className }: { coin: Coin; type: Bot["type"]; size?: "sm" | "md" | "lg"; className?: string }) {
  const icon = size === "lg" ? 20 : size === "md" ? 16 : 14;
  return (
    <span className={cn("flex min-w-0 items-center", size === "sm" ? "gap-1.5" : "gap-2", className)}>
      <CoinIcon coin={coin} size={icon} />
      <span
        className={cn(
          "truncate",
          size === "lg" && "text-[18px] leading-[27px] text-white/80",
          size === "md" && "text-[14px] leading-[18px] font-medium tracking-[-0.02em] text-white",
          size === "sm" && "text-[12px] leading-[15px] font-medium text-white/50",
        )}
      >
        {coin}-USD <span className="opacity-60">·</span> {BOT_TYPE_LABEL[type]}
      </span>
    </span>
  );
}

/* ---------- Bot Card / Medium ---------- */

export function BotCard({ bot, href, onClick, className }: { bot: Bot; href?: string; onClick?: () => void; className?: string }) {
  const body = (
    <>
      <div className="flex h-[106px] items-center gap-4 border-b border-line px-5">
        <BotAvatar avatar={bot.avatar} size={54} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <PairLine coin={bot.coin} type={bot.type} size="lg" className="flex-1" />
            <StatusPill status={bot.status} className="h-[22px]" />
          </div>
          <div className="flex items-center gap-2">
            <ExchangeTag exchange={bot.exchange} glyph size="md" />
            {bot.name !== `${bot.coin}-USD` && <span className="t-b14 truncate text-white/40">{bot.name}</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 px-5 pt-7 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[24px] leading-[30px] font-semibold tracking-[-0.01em]">{signedUsd(bot.netFees)}</span>
            <span className="t-b14 uppercase opacity-40">Net fees</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {bot.runtime === "Just started" ? <span className="text-[24px] leading-[30px] text-white/40">—</span> : <span className={cn("text-[24px] leading-[30px]", bot.apr < 0 ? "text-error" : "text-gain")}>{fmtPct(bot.apr)}</span>}
            <span className="t-b14 uppercase opacity-40">APR</span>
          </div>
        </div>
        <FluidSparkline values={bot.spark} height={56} negative={bot.netFees < 0} />
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[18px] leading-[24px]">{usd(bot.equity)}</span>
            <span className="t-b14 uppercase opacity-40">Current equity</span>
          </div>
          <span className="flex items-center gap-2">
            <Icon name="clock" size={20} className="text-white/80" />
            <span className="t-b16">{bot.status === "stopped" ? "—" : bot.runtime}</span>
            <span className="t-b14 uppercase opacity-40">{bot.status === "stopped" ? "Stopped" : "Running"}</span>
          </span>
        </div>
      </div>
    </>
  );
  const cls = cn("flex flex-col rounded-sm border border-line bg-card text-left transition-colors hover:border-white/20 hover:bg-white/[0.035]", className);
  if (href)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/* ---------- Table ("Your bots") ---------- */

export const BOT_COLS = "grid grid-cols-[300px_260px_200px_150px_160px_130px_minmax(120px,1fr)] items-center px-5";

export function BotTableHeader() {
  return (
    <div className={cn(BOT_COLS, "t-l12 h-11 border-y border-line text-white/40")}>
      <span>Bot</span>
      <span>Exchange</span>
      <span>Status</span>
      <span className="text-right">Equity</span>
      <span className="text-right">Earned</span>
      <span className="text-right">APR</span>
      <span className="text-right">7D</span>
    </div>
  );
}

export function BotTableRow({ bot, last }: { bot: Bot; last?: boolean }) {
  return (
    <Link href={`/bots/${bot.id}`} className={cn(BOT_COLS, "h-16 transition-colors hover:bg-white/[0.03]", !last && "border-b border-white/6")}>
      <span className="flex items-center gap-3.5">
        <BotAvatar avatar={bot.avatar} size={32} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="t-b14 flex items-center gap-2 leading-[18px]">
            {bot.name}
            {bot.mine && <span className="t-l12 bg-white/8 px-1 text-[10px] leading-[14px] text-white/70">New</span>}
          </span>
          <PairLine coin={bot.coin} type={bot.type} size="sm" />
        </span>
      </span>
      <span>
        <ExchangeTag exchange={bot.exchange} />
      </span>
      <span>
        <StatusPill status={bot.status} />
      </span>
      <span className="t-b14 tnum text-right">{usd(bot.equity)}</span>
      <span className="t-b14 tnum text-right text-gain">{signedUsd(bot.earned)}</span>
      {bot.runtime === "Just started" ? <span className="t-b14 tnum text-right text-white/40">—</span> : <span className={cn("t-b14 tnum text-right", bot.apr < 0 ? "text-error" : "text-gain")}>{fmtPct(bot.apr)}</span>}
      <span className="flex justify-end">
        <Sparkline values={bot.spark} width={120} height={28} negative={bot.netFees < 0} />
      </span>
    </Link>
  );
}

/* ---------- Small helpers ---------- */

export function StatBlock({ label, value, sub, tone, className }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "gain"; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <span className="t-l12 text-white/50">{label}</span>
      <span className={cn("text-[24px] leading-[26px]", tone === "gain" && "text-gain")}>{value}</span>
      {sub && <span className="t-l12 text-white/50">{sub}</span>}
    </div>
  );
}

export function fmtPct(n: number) {
  return `${n >= 0 ? "+" : "-"}${money(Math.abs(n), 1)}%`;
}
