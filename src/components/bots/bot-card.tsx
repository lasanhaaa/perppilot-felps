import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { EXCHANGES, ExchangeGlyph } from "@/components/brand";
import { Chip, StatusPill, ValueBox } from "@/components/ui/tag";
import { formatDate, formatDuration, formatK, formatPct, formatUsd, toneOf } from "@/lib/format";
import { usePlatformData } from "@/lib/platform-data";
import { sparkline } from "@/lib/series";
import type { Bot } from "@/lib/types";
import { Sparkline } from "./sparkline";

const valueColor = { positive: "text-brand", negative: "text-danger", neutral: "text-white/60" };

export function RangePill({ status }: { status: Bot["rangeStatus"] }) {
  if (status === "in-range") return <StatusPill tone="positive">In range</StatusPill>;
  if (status === "out-of-range") return <StatusPill tone="negative">Out of range</StatusPill>;
  return <StatusPill tone="neutral">No result</StatusPill>;
}

export function kindLabel(kind: Bot["kind"]) {
  return kind === "pointbot" ? "PointBot" : "V3 Bot";
}

export function BotCard({ bot }: { bot: Bot }) {
  const { getAccount } = usePlatformData();
  const account = getAccount(bot.accountId);
  const noResult = bot.rangeStatus === "no-result";
  const tone = noResult ? "neutral" : toneOf(bot.netFees);
  const trend = noResult ? "flat" : bot.netFees >= 0 ? "up" : "down";
  const dim = noResult ? "opacity-60" : "opacity-80";

  return (
    <Link
      href={`/bots/${bot.id}`}
      className="group flex flex-col bg-fill-2 p-5 transition-colors hover:bg-fill-3 focus-visible:bg-fill-3"
    >
      <div className="flex flex-col gap-1 border-b border-line pb-4">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-1.5 font-display text-[18px] leading-[1.5] text-white/80">
            {bot.pair}
            <span aria-hidden className="size-1 rounded-full bg-white/60" />
            {kindLabel(bot.kind)}
          </p>
          <RangePill status={bot.rangeStatus} />
        </div>
        <div className="flex items-center justify-between gap-3 text-[14px] font-medium uppercase text-white/40">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate">{account?.name ?? "Account"}</span>
            {account && (
              <Chip>
                <ExchangeGlyph id={account.exchange} size={20} className="opacity-60" />
                {EXCHANGES[account.exchange].name}
              </Chip>
            )}
          </span>
          <span className="shrink-0 whitespace-nowrap tabular">
            [ {formatK(bot.rangeLow)} - {formatK(bot.rangeHigh).slice(1)} ]
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between py-4">
        <div>
          <p className={cn("font-display text-[24px] leading-[1.5] tracking-[0.04em] tabular", valueColor[tone])}>
            {noResult ? "00.00" : formatUsd(bot.netFees, { signed: true })}
          </p>
          <p className="flex items-center gap-[7px] text-[14px] font-medium uppercase text-white/40">
            Net fees
            <ValueBox className={noResult ? "text-white/60" : undefined}>{formatPct(bot.netFeesPctOfPool, { decimals: noResult ? 1 : 2 })}</ValueBox>
            of pool
          </p>
        </div>
        <div className="text-right">
          <p className={cn("font-display text-[24px] leading-[1.5] tracking-[0.04em] tabular", valueColor[tone])}>
            {noResult ? "0%" : formatPct(bot.apr, { decimals: 1, signed: true })}
          </p>
          <p className="text-[14px] font-medium uppercase text-white/40">APR</p>
        </div>
      </div>

      <Sparkline values={sparkline(bot.seed, trend)} tone={tone} />

      <div className="flex items-start justify-between gap-2 py-6 leading-[1.5] whitespace-nowrap">
        <div className="flex-1">
          <p className={cn("font-display text-[18px] tabular", dim)}>{bot.equity === null ? "$--" : formatUsd(bot.equity, { decimals: 0 })}</p>
          <p className="text-[13px] uppercase text-white/40 sm:text-[14px]">Current equity</p>
        </div>
        <div className="text-center">
          <p className={cn("font-display text-[18px] tabular", dim)}>{formatPct(bot.feeRate)}</p>
          <p className="text-[13px] uppercase text-white/40 sm:text-[14px]">Fee</p>
        </div>
        <div className="flex-1 text-right">
          <p className={cn("font-display text-[18px] tabular", dim)}>${bot.poolSize.toFixed(3)}</p>
          <p className="text-[13px] uppercase text-white/40 sm:text-[14px]">Pool size</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-dashed border-line pt-5">
        <p className="text-[14px] font-medium uppercase text-white/40">{formatDate(bot.startedAt)}</p>
        <p className="flex items-center gap-2">
          <Icon name="clock" size={24} className="text-white/80" />
          <span className="font-display text-[16px] text-white/80">{formatDuration(bot.runningMinutes)}</span>
          <span className="text-[14px] uppercase text-white/40">{bot.runState === "stopped" ? "Stopped" : bot.runState === "error" ? "Error" : "Running"}</span>
        </p>
      </div>
    </Link>
  );
}
