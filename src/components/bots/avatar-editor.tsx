"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";
import { BotAvatar, variantToStyle } from "@/components/ui/bot-avatar";
import { MotionFace } from "@/components/bot-motion/motion-face";
import {
  BOT_AVATAR_COLORS,
  BOT_AVATAR_PARTS,
  botAvatarFromSeed,
  botAvatarSignature,
  type BotAvatar as Look,
} from "@/lib/bot-avatar";
import { MOTION_BY_ID } from "@/lib/bot-motion";
import { lookOf, resetBotLook, saveBotLook, useBotFace, useBotLooks } from "@/lib/bot-look-store";
import { bots } from "@/lib/mock-data";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Bot } from "@/lib/types";

function DiceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <rect x="4.6" y="4.6" width="1.8" height="1.8" fill="currentColor" />
      <rect x="9.6" y="9.6" width="1.8" height="1.8" fill="currentColor" />
      <rect x="7.1" y="7.1" width="1.8" height="1.8" fill="currentColor" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 4.5V8h3.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.8 7.6A4.7 4.7 0 1 1 5 11.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

const same = (a: Look, b: Look) => a.shape === b.shape && a.eyes === b.eyes && a.color === b.color;

function Label({ children, count }: { children: string; count: number }) {
  return (
    <p className="flex items-center gap-2 text-[11px]">
      <span className="font-semibold tracking-[0.06em] text-white/60 uppercase">{children}</span>
      <span className="font-medium text-white/35 tabular">{count}</span>
    </p>
  );
}

function Tile({
  selected,
  onClick,
  label,
  className,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid place-items-center rounded-[4px] border transition-colors",
        selected ? "border-white/60 bg-white/5" : "border-transparent bg-fill-1 hover:bg-white/[0.05]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function EditorBody({ bot, onClose, onSaved }: { bot: Bot; onClose: () => void; onSaved: (changed: boolean) => void }) {
  const variant = useBotFace();
  const reduced = useReducedMotion();
  const edited = useBotLooks();
  const saved = lookOf(bot, edited);
  const original = useMemo(() => botAvatarFromSeed(bot.avatarSeed), [bot.avatarSeed]);
  const [draft, setDraft] = useState<Look>(saved);
  const [react, setReact] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const { style } = variantToStyle(variant);
  const { shapes, eyes } = BOT_AVATAR_PARTS[style];
  // Character faces are more than eyes (brows, lids, mouths).
  const faceLabel = style === "character" ? "Face" : "Eyes";

  // One look per bot inside the account: the backend keeps (user, signature) unique.
  const taken = useMemo(
    () => new Set(bots.filter((b) => b.id !== bot.id).map((b) => botAvatarSignature(lookOf(b, edited)))),
    [bot.id, edited],
  );
  const isTaken = taken.has(botAvatarSignature(draft));

  const randomize = () => {
    let next = draft;
    for (let i = 0; i < 60; i++) {
      const pick = {
        shape: Math.floor(Math.random() * shapes.length),
        eyes: Math.floor(Math.random() * eyes.length),
        color: Math.floor(Math.random() * BOT_AVATAR_COLORS.length),
      };
      if (!same(pick, draft) && !taken.has(botAvatarSignature(pick))) {
        next = pick;
        break;
      }
    }
    setDraft(next);
    // A little hop and spin for the new look, then back to watching the pointer.
    setReact((k) => k + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReact(0), (MOTION_BY_ID.filled.duration ?? 1.9) * 1000);
  };

  const save = () => {
    if (isTaken) return;
    const changed = !same(draft, saved);
    if (same(draft, original)) resetBotLook(bot.id);
    else saveBotLook(bot.id, draft);
    onSaved(changed);
  };

  const colorName = BOT_AVATAR_COLORS[draft.color].name;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row">
        <div className="flex flex-col items-center justify-center gap-4 p-6 sm:self-stretch">
          <div className="grid h-[160px] w-full place-items-center rounded-[4px] bg-white/[0.03] sm:size-[192px]">
            <MotionFace
              avatar={draft}
              variant={variant}
              state={react ? "filled" : "looking"}
              playKey={react}
              seed={bot.avatarSeed}
              paused={reduced}
              size={112}
              label={`${bot.pair} avatar: ${shapes[draft.shape % shapes.length].name}, ${eyes[draft.eyes % eyes.length].name}, ${colorName}`}
            />
          </div>
          <p className="text-[16px] font-medium">{bot.pair}</p>
          <button
            type="button"
            onClick={randomize}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-[4px] text-[13px] font-medium text-white/50 transition-colors hover:bg-fill-2 hover:text-white sm:w-[192px]"
          >
            <DiceIcon />
            Randomize
          </button>
        </div>

        <div className="flex w-full flex-col gap-5 px-5 pb-5 sm:w-[420px] sm:pt-5">
          <div className="flex flex-col gap-2">
            <Label count={shapes.length}>Shape</Label>
            <div role="radiogroup" aria-label="Shape" className="grid grid-cols-6 gap-1">
              {shapes.map((s, i) => (
                <Tile key={s.name} label={s.name} selected={draft.shape % shapes.length === i} onClick={() => setDraft({ ...draft, shape: i })} className="aspect-square">
                  <BotAvatar avatar={{ ...draft, shape: i }} variant={variant} size={36} className="size-[30px] sm:size-9" />
                </Tile>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label count={eyes.length}>{faceLabel}</Label>
            <div role="radiogroup" aria-label={faceLabel} className="grid grid-cols-4 gap-1">
              {eyes.map((e, i) => (
                <Tile key={e.name} label={e.name} selected={draft.eyes % eyes.length === i} onClick={() => setDraft({ ...draft, eyes: i })} className="h-[60px]">
                  <BotAvatar avatar={{ ...draft, eyes: i }} variant={variant} size={36} />
                </Tile>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label count={BOT_AVATAR_COLORS.length}>Color</Label>
            <div role="radiogroup" aria-label="Color" className="grid grid-cols-8 gap-1">
              {BOT_AVATAR_COLORS.map((c, i) => {
                const selected = draft.color === i;
                return (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => setDraft({ ...draft, color: i })}
                    className={cn("grid h-8 place-items-center rounded-[4px] border", selected ? "border-white" : "border-transparent")}
                  >
                    <span
                      className={cn("rounded-[2px]", selected ? "h-6 w-[calc(100%-8px)]" : "h-[26px] w-[calc(100%-6px)]")}
                      style={{ background: c.hex }}
                    />
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className={cn("min-h-[18px] text-[12px] text-[#FFB547]", !isTaken && "invisible")}>
              Used by another bot
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <button
          type="button"
          onClick={() => setDraft(original)}
          disabled={same(draft, original)}
          className="flex items-center gap-2 text-[13px] font-medium text-white/80 transition-colors hover:text-white disabled:opacity-40"
        >
          <ResetIcon />
          Reset to original
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="rounded-[4px] px-4 py-2.5 text-[13px] font-medium text-white/80 hover:bg-fill-2 hover:text-white">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isTaken}
            className="rounded-[4px] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0d1012] transition-colors hover:bg-white/90 disabled:opacity-40"
          >
            Save avatar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Bot avatar editor (Figma: Bot avatar editor / Tech 1975:7814): shape, eyes, color, randomize. */
export function AvatarEditor({
  open,
  bot,
  onClose,
  onSaved,
}: {
  open: boolean;
  bot: Bot;
  onClose: () => void;
  /** Called after Save; `changed` is false when the look stayed the same. */
  onSaved: (changed: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      tone="bots"
      bare
      label={`Edit ${bot.pair} avatar`}
      className="border border-line shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
    >
      <EditorBody key={bot.id} bot={bot} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
