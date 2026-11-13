"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { BotAvatarVariant } from "@/components/ui/bot-avatar";

const VARIANTS: { value: BotAvatarVariant; label: string }[] = [
  { value: "tech", label: "Tech" },
  { value: "visor", label: "Tech visor" },
  { value: "soft", label: "Soft" },
];

/**
 * Prototype-only controls for the avatar motion rules. Not part of the product: it lets the team
 * switch the face style and trigger the moments that are rare in real use (start, stop).
 */
export function MotionPanel({
  variant,
  onVariant,
  fills,
  onFills,
  onStop,
  onStart,
  canStop,
  canStart,
  lastEvent,
  reducedMotion,
}: {
  variant: BotAvatarVariant;
  onVariant: (v: BotAvatarVariant) => void;
  fills: boolean;
  onFills: (on: boolean) => void;
  onStop: () => void;
  onStart: () => void;
  canStop: boolean;
  canStart: boolean;
  lastEvent: string | null;
  reducedMotion: boolean;
}) {
  // null = default: open from tablet up, folded on phones so it does not cover the cards.
  const [open, setOpen] = useState<boolean | null>(null);
  const toggle = () =>
    setOpen((o) => !(o ?? window.matchMedia("(min-width: 768px)").matches));
  const shown = open === null ? "hidden md:flex" : open ? "flex" : "hidden";

  return (
    <aside
      aria-label="Motion prototype"
      className="fixed bottom-4 left-4 z-40 w-[min(320px,calc(100vw-32px))] lg:left-[280px] rounded-[4px] border border-white/15 bg-[#121615]/95 text-[14px] leading-[1.5] shadow-2xl shadow-black/60 backdrop-blur"
    >
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 font-medium uppercase tracking-[0.04em] text-white/80">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              reducedMotion ? "bg-white/30" : "bg-info",
            )}
          />
          Motion prototype
        </span>
        <span className="text-white/40">
          {open === null ? (
            <>
              <span className="md:hidden">Show</span>
              <span className="hidden md:inline">Hide</span>
            </>
          ) : open ? (
            "Hide"
          ) : (
            "Show"
          )}
        </span>
      </button>

      <div
        className={cn(
          "flex-col gap-4 border-t border-line px-4 pt-3 pb-4",
          shown,
        )}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium uppercase text-white/40">
            Face
          </span>
          <div
            role="radiogroup"
            aria-label="Face"
            className="grid grid-cols-3 gap-1 rounded-[4px] bg-fill-2 p-1"
          >
            {VARIANTS.map((v) => (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={variant === v.value}
                onClick={() => onVariant(v.value)}
                className={cn(
                  "h-8 rounded-[3px] text-[13px] transition-colors",
                  variant === v.value
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-white/80">Simulate order fills</span>
          <button
            type="button"
            role="switch"
            aria-checked={fills}
            onClick={() => onFills(!fills)}
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              fills ? "bg-info" : "bg-white/20",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-white transition-[left]",
                fills ? "left-[18px]" : "left-0.5",
              )}
            />
          </button>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onStop}
            disabled={!canStop}
            className="h-9 rounded-[4px] border border-line text-[13px] font-medium uppercase text-white/80 transition-colors hover:bg-fill-2 disabled:opacity-40"
          >
            Stop a bot
          </button>
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="h-9 rounded-[4px] border border-line text-[13px] font-medium uppercase text-white/80 transition-colors hover:bg-fill-2 disabled:opacity-40"
          >
            Start a bot
          </button>
        </div>

        <p
          aria-live="polite"
          className="min-h-[42px] rounded-[4px] bg-fill-1 px-2.5 py-2 text-[13px] text-white/60"
        >
          {lastEvent ?? "Waiting for the first order fill…"}
        </p>

        <ul className="flex flex-col gap-1 text-[12px] leading-[1.45] text-white/40">
          <li>Order fill: that bot blinks once. Never two at a time.</li>
          <li>Hover a card: the eyes follow the pointer.</li>
          <li>Out of range and error never animate.</li>
          {reducedMotion && (
            <li className="text-white/60">
              Reduce motion is on in your system, so nothing moves.
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
