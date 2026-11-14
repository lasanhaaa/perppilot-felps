"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { CoinIcon, EXCHANGES, ExchangeGlyph } from "@/components/brand";
import type { BotAvatarVariant } from "@/components/ui/bot-avatar";
import { MotionFace } from "@/components/bot-motion/motion-face";
import type { BotAvatar } from "@/lib/bot-avatar";
import type { MotionStateId } from "@/lib/bot-motion";
import { formatDuration, formatPct, formatUsd, toneOf } from "@/lib/format";
import { getAccount } from "@/lib/mock-data";
import { sparkline } from "@/lib/series";
import type { Bot } from "@/lib/types";
import { kindLabel } from "./bot-labels";
import { Sparkline } from "./sparkline";

/** Lifecycle moments the overview shows on a card's status (see docs/bot-motion.md). */
export type BotPhase = "starting" | "stopping";

/** Gains in earnings green, losses in red (never brand mint). */
const valueColor = {
  positive: "text-[#4ADE80]",
  negative: "text-danger",
  neutral: "text-white/60",
};

type PillTone = "positive" | "negative" | "neutral" | "pending";
const pillTone: Record<PillTone, string> = {
  positive: "bg-[#4ADE80]/10 text-[#4ADE80]",
  negative: "bg-danger/10 text-danger",
  neutral: "bg-white/10 text-white/60",
  /** Starting / stopping: in progress = amber, never brand mint. */
  pending: "bg-[#FFB547]/10 text-[#FFB547]",
};

/** Status tag of the new Bots style: no dot, 4px radius. */
function CardPill({
  tone,
  children,
}: {
  tone: PillTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[14px] leading-[1.5] font-medium uppercase whitespace-nowrap",
        pillTone[tone],
      )}
    >
      {children}
    </span>
  );
}

function CardRangePill({ status }: { status: Bot["rangeStatus"] }) {
  if (status === "in-range")
    return <CardPill tone="positive">In range</CardPill>;
  if (status === "out-of-range")
    return <CardPill tone="negative">Out of range</CardPill>;
  return <CardPill tone="neutral">No result</CardPill>;
}

export function BotCard({
  bot,
  look,
  variant = "tech",
  motion,
  playKey = 0,
  phase,
  paused = false,
}: {
  bot: Bot;
  look: BotAvatar;
  variant?: BotAvatarVariant;
  /** What the face does now; set by the overview (fills, stop, start, range exits). */
  motion: MotionStateId;
  playKey?: number;
  phase?: BotPhase;
  /** The user asked the system to reduce motion. */
  paused?: boolean;
}) {
  const account = getAccount(bot.accountId);
  const [hovered, setHovered] = useState(false);

  const noResult = bot.rangeStatus === "no-result";
  const tone = noResult ? "neutral" : toneOf(bot.netFees);
  const trend = noResult ? "flat" : bot.netFees >= 0 ? "up" : "down";
  // Hovering a quiet card: that bot looks at you (one bot at a time, so the grid stays calm).
  const state: MotionStateId = hovered && motion === "still" ? "looking" : motion;

  const status =
    phase === "stopping"
      ? "Stopping"
      : phase
        ? "Starting"
        : bot.runState === "stopped"
          ? "Stopped"
          : bot.runState === "error"
            ? "Error"
            : "Running";

  return (
    <Link
      href={`/bots/${bot.id}`}
      data-bot-id={bot.id}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(
        "group flex min-w-0 flex-col rounded-[4px] border border-line bg-fill-1 transition-[background-color,opacity] duration-300 hover:bg-fill-2 focus-visible:bg-fill-2",
        phase === "stopping" && "opacity-70",
      )}
    >
      <div className="border-b border-line py-6">
        <div className="flex items-center gap-4 px-5 2xl:gap-[21px]">
          <MotionFace
            avatar={look}
            variant={variant}
            state={state}
            playKey={playKey}
            seed={bot.avatarSeed}
            paused={paused}
            size={54}
            dir={bot.seed % 2 ? -1 : 1}
            className="max-sm:size-11!"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-3">
              <p className="flex min-w-0 items-center gap-1.5 text-[18px] leading-[1.5] whitespace-nowrap text-white/80">
                <CoinIcon pair={bot.pair} />
                <span className="shrink-0">{bot.pair}</span>
                <span
                  aria-hidden
                  className="size-1 shrink-0 rounded-full bg-white/40"
                />
                <span className="truncate">{kindLabel(bot.kind)}</span>
              </p>
              <span className="shrink-0">
                {phase ? (
                  <CardPill tone="pending">{status}</CardPill>
                ) : (
                  <CardRangePill status={bot.rangeStatus} />
                )}
              </span>
            </div>
            {account && (
              <span className="flex">
                <span className="inline-flex items-center gap-0.5 bg-fill-2 px-1 text-[14px] leading-[1.5] font-medium uppercase text-white/40">
                  <span className="grid size-6 place-items-center opacity-60">
                    <ExchangeGlyph id={account.exchange} size={16} />
                  </span>
                  {EXCHANGES[account.exchange].name}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col px-5 py-6">
        <div className="flex items-end justify-between gap-3 pb-4">
          <div>
            <p className="text-[24px] leading-[1.5] font-semibold tracking-[0.04em] text-white tabular">
              {noResult ? "$0.00" : formatUsd(bot.netFees, { signed: true })}
            </p>
            <p className="text-[14px] leading-[1.5] font-medium uppercase text-white/40">
              Net fees
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-[24px] leading-[1.5] font-medium tracking-[0.04em] tabular",
                valueColor[tone],
              )}
            >
              {noResult
                ? "0%"
                : formatPct(bot.apr, { decimals: 1, signed: true })}
            </p>
            <p className="text-[14px] leading-[1.5] font-medium uppercase text-white/40">
              APR
            </p>
          </div>
        </div>

        <Sparkline values={sparkline(bot.seed, trend)} tone={tone} />

        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-6 whitespace-nowrap">
          <div>
            <p className="text-[18px] leading-[1.5] font-medium text-white/80 tabular">
              {bot.equity === null
                ? "$--"
                : formatUsd(bot.equity, { decimals: 0 })}
            </p>
            <p className="text-[14px] leading-[1.5] uppercase text-white/40">
              Current equity
            </p>
          </div>
          <p className="flex items-center gap-2">
            <Icon name="clock" size={24} className="text-white/80" />
            <span className="text-[16px] leading-[1.5] text-white/80 tabular">
              {formatDuration(bot.runningMinutes)}
            </span>
            <span className="text-[14px] leading-[1.5] uppercase text-white/40">
              {status}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
