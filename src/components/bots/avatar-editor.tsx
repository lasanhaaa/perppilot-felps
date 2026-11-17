"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { BOT_AVATAR_COLORS, BOT_AVATAR_PARTS, botAvatarSignature, type BotAvatar as Look } from "@/lib/bot-avatar";
import { MOTION_BY_ID } from "@/lib/bot-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Bot } from "@/lib/mock";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { MotionFace } from "@/components/bot-motion/motion-face";
import { Modal } from "@/components/ui/primitives";
import { botSeed } from "./bot-motion-state";

const { shapes: SHAPES, eyes: EYES } = BOT_AVATAR_PARTS.glyph;
const same = (a: Look, b: Look) => a.shape === b.shape && a.eyes === b.eyes && a.color === b.color;

function DiceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <rect x="4.6" y="4.6" width="1.8" height="1.8" fill="currentColor" />
      <rect x="9.6" y="9.6" width="1.8" height="1.8" fill="currentColor" />
      <rect x="7.1" y="7.1" width="1.8" height="1.8" fill="currentColor" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 4.5V8h3.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.8 7.6A4.7 4.7 0 1 1 5 11.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Label({ children, count }: { children: string; count: number }) {
  return (
    <p className="flex items-center gap-2 text-[12px] leading-4">
      <span className="font-semibold tracking-[0.06em] text-white/60 uppercase">{children}</span>
      <span className="tnum text-white/35">{count}</span>
    </p>
  );
}

function Tile({ selected, onClick, label, className, children }: { selected: boolean; onClick: () => void; label: string; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid place-items-center rounded-sm border transition-colors",
        selected ? "border-white/60 bg-white/5" : "border-transparent bg-raised hover:bg-hover",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Bot avatar editor (Figma "Bot avatar editor" 1975:7814): shape, eyes and color with a live,
 * moving preview. Randomize plays a happy hop. Two bots of one user never share a look, so looks
 * already used by the user's other bots (`taken`, by signature) can't be saved.
 */
export function AvatarEditor({
  name,
  avatar,
  original,
  seed,
  taken,
  onSave,
  onClose,
}: {
  name: string;
  avatar: Look;
  /** The look the bot got at creation ("Reset to original"). */
  original: Look;
  seed: number;
  taken: Set<number>;
  onSave: (look: Look) => void;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const [draft, setDraft] = useState<Look>(avatar);
  const [react, setReact] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const isTaken = taken.has(botAvatarSignature(draft));

  const randomize = () => {
    let next = draft;
    for (let i = 0; i < 60; i++) {
      const pick = {
        shape: Math.floor(Math.random() * SHAPES.length),
        eyes: Math.floor(Math.random() * EYES.length),
        color: Math.floor(Math.random() * BOT_AVATAR_COLORS.length),
      };
      if (!same(pick, draft) && !taken.has(botAvatarSignature(pick))) {
        next = pick;
        break;
      }
    }
    setDraft(next);
    setReact((k) => k + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReact(0), (MOTION_BY_ID.filled.duration ?? 1.9) * 1000);
  };

  const save = () => {
    if (isTaken) return;
    if (!same(draft, avatar)) onSave(draft);
    onClose();
  };

  return (
    <Modal onClose={onClose} width={662}>
      <div className="flex">
        <div className="flex w-[240px] flex-none flex-col items-center gap-4 p-6">
          <div className="grid size-[192px] place-items-center rounded-sm bg-field">
            <MotionFace
              avatar={draft}
              state={react ? "filled" : "looking"}
              playKey={react}
              seed={seed}
              paused={reduced}
              size={112}
              label={`${name} avatar: ${SHAPES[draft.shape % SHAPES.length].name}, ${EYES[draft.eyes % EYES.length].name}, ${BOT_AVATAR_COLORS[draft.color].name}`}
            />
          </div>
          <p className="t-b16m">{name}</p>
          <button
            type="button"
            onClick={randomize}
            className="t-b14 flex h-9 w-[192px] items-center justify-center gap-2 rounded-sm text-white/50 transition-colors hover:bg-raised hover:text-white"
          >
            <DiceIcon />
            Randomize
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5 py-5 pr-5">
          <div className="flex flex-col gap-2">
            <Label count={SHAPES.length}>Shape</Label>
            <div role="radiogroup" aria-label="Shape" className="grid grid-cols-6 gap-1">
              {SHAPES.map((s, i) => (
                <Tile key={s.name} label={s.name} selected={draft.shape % SHAPES.length === i} onClick={() => setDraft({ ...draft, shape: i })} className="aspect-square">
                  <BotAvatar avatar={{ ...draft, shape: i }} size={36} />
                </Tile>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label count={EYES.length}>Eyes</Label>
            <div role="radiogroup" aria-label="Eyes" className="grid grid-cols-4 gap-1">
              {EYES.map((e, i) => (
                <Tile key={e.name} label={e.name} selected={draft.eyes % EYES.length === i} onClick={() => setDraft({ ...draft, eyes: i })} className="h-[60px]">
                  <BotAvatar avatar={{ ...draft, eyes: i }} size={36} />
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
                    className={cn("grid h-8 place-items-center rounded-sm border", selected ? "border-white" : "border-transparent")}
                  >
                    <span className={cn("rounded-[2px]", selected ? "h-6 w-[calc(100%-8px)]" : "h-[26px] w-[calc(100%-6px)]")} style={{ background: c.hex }} />
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className={cn("t-b14 min-h-5 text-warning", !isTaken && "invisible")}>
              Another of your bots already has this look
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
        <button
          type="button"
          onClick={() => setDraft(original)}
          disabled={same(draft, original)}
          className="t-b14 flex items-center gap-2 text-white/80 transition-colors hover:text-white disabled:opacity-40"
        >
          <ResetIcon />
          Reset to original
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="t-b16 h-11 rounded-sm px-4 text-white/80 transition-colors hover:bg-raised hover:text-white">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isTaken}
            className="t-b16m h-11 rounded-sm bg-white px-4 text-black transition-colors hover:bg-white/90 disabled:opacity-40"
          >
            Save avatar
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** The editor for a bot that exists: saves the look on the bot and keeps its original. */
export function BotAvatarEditor({ bot, onClose, onSaved }: { bot: Bot; onClose: () => void; onSaved?: () => void }) {
  const { allBots, updateBot } = useStore();
  const taken = useMemo(() => new Set(allBots.filter((b) => b.id !== bot.id).map((b) => botAvatarSignature(b.avatar))), [allBots, bot.id]);
  return (
    <AvatarEditor
      name={bot.type === "v3" ? `${bot.coin}-USD` : "PointBot"}
      avatar={bot.avatar}
      original={bot.avatarOriginal ?? bot.avatar}
      seed={botSeed(bot.id)}
      taken={taken}
      onClose={onClose}
      onSave={(look) => {
        updateBot(bot.id, { avatar: look, avatarOriginal: bot.avatarOriginal ?? bot.avatar });
        onSaved?.();
      }}
    />
  );
}
