"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { BotAvatarVariant } from "@/components/ui/bot-avatar";

/*
 * Prototype-only controls for the bot motion rules. Not part of the product: they let the team
 * switch the face style and trigger the moments that are rare in real use (fills, errors, range
 * exits, start and stop).
 */

/** Floating, foldable panel at the bottom left of the content. */
export function PrototypeDock({
  title,
  event,
  reducedMotion,
  children,
}: {
  title: string;
  event: string | null;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  // null = default: open from tablet up, folded on phones so it does not cover the content.
  const [open, setOpen] = useState<boolean | null>(null);
  const toggle = () => setOpen((o) => !(o ?? window.matchMedia("(min-width: 768px)").matches));
  const shown = open === null ? "hidden md:flex" : open ? "flex" : "hidden";

  return (
    <aside
      aria-label={title}
      className="fixed bottom-4 left-4 z-40 w-[min(320px,calc(100vw-32px))] rounded-[4px] border border-white/15 bg-[#11171b]/95 text-[14px] leading-[1.5] shadow-2xl shadow-black/60 backdrop-blur lg:left-[280px]"
    >
      <button type="button" onClick={toggle} aria-expanded={open ?? undefined} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex items-center gap-2 font-medium tracking-[0.04em] text-white/80 uppercase">
          <span aria-hidden className={cn("size-1.5 rounded-full", reducedMotion ? "bg-white/30" : "bg-info")} />
          {title}
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
      <div className={cn("max-h-[min(70dvh,560px)] flex-col gap-3.5 overflow-y-auto border-t border-line px-4 pt-3 pb-4", shown)}>
        {children}
        <p aria-live="polite" className="min-h-[42px] rounded-[4px] bg-fill-1 px-2.5 py-2 text-[13px] text-white/60">
          {event ?? "Pick an event to see how the bot reacts."}
        </p>
        {reducedMotion && <p className="text-[12px] text-white/60">Reduce motion is on in your system, so the faces hold still.</p>}
      </div>
    </aside>
  );
}

export function ProtoButton({
  onClick,
  disabled,
  pressed,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(
        "h-9 rounded-[4px] border text-[13px] font-medium uppercase transition-colors disabled:opacity-40",
        pressed ? "border-white bg-white text-black" : "border-line text-white/80 hover:bg-fill-2",
      )}
    >
      {children}
    </button>
  );
}

export function ProtoSegment<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-white/40 uppercase">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-1 rounded-[4px] bg-fill-2 p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-8 rounded-[3px] px-1 text-[12px] leading-tight transition-colors",
              value === o.value ? "bg-white text-black" : "text-white/60 hover:text-white",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const VARIANTS: { value: BotAvatarVariant; label: string }[] = [
  { value: "tech", label: "Tech" },
  { value: "visor", label: "Tech visor" },
  { value: "soft", label: "Soft" },
];

/** Bots grid controls: face style, fills on or off, and the rare events. */
export function MotionPanel({
  variant,
  onVariant,
  fills,
  onFills,
  onStop,
  onStart,
  onOutOfRange,
  onError,
  canStop,
  canStart,
  canEvent,
  lastEvent,
  reducedMotion,
}: {
  variant: BotAvatarVariant;
  onVariant: (v: BotAvatarVariant) => void;
  fills: boolean;
  onFills: (on: boolean) => void;
  onStop: () => void;
  onStart: () => void;
  onOutOfRange: () => void;
  onError: () => void;
  canStop: boolean;
  canStart: boolean;
  canEvent: boolean;
  lastEvent: string | null;
  reducedMotion: boolean;
}) {
  return (
    <PrototypeDock title="Motion prototype" event={lastEvent} reducedMotion={reducedMotion}>
      <ProtoSegment label="Face" value={variant} onChange={onVariant} options={VARIANTS} />
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-white/80">Simulate order fills</span>
        <button
          type="button"
          role="switch"
          aria-checked={fills}
          onClick={() => onFills(!fills)}
          className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", fills ? "bg-info" : "bg-white/20")}
        >
          <span className={cn("absolute top-0.5 size-4 rounded-full bg-white transition-[left]", fills ? "left-[18px]" : "left-0.5")} />
        </button>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <ProtoButton onClick={onStop} disabled={!canStop}>
          Stop a bot
        </ProtoButton>
        <ProtoButton onClick={onStart} disabled={!canStart}>
          Start a bot
        </ProtoButton>
        <ProtoButton onClick={onOutOfRange} disabled={!canEvent}>
          Leaves range
        </ProtoButton>
        <ProtoButton onClick={onError} disabled={!canEvent}>
          Error
        </ProtoButton>
      </div>
      <ul className="flex flex-col gap-1 text-[12px] leading-[1.45] text-white/40">
        <li>Order fill: hop, spin and burst. One bot at a time.</li>
        <li>Hover a card: that bot looks at you.</li>
        <li>Others hold still and blink. Stopped bots doze.</li>
      </ul>
    </PrototypeDock>
  );
}
