"use client";

import type { BotAvatarVariant } from "@/components/ui/bot-avatar";
import type { BotAvatar } from "@/lib/bot-avatar";
import type { MotionStateId } from "@/lib/bot-motion";
import { cn } from "@/lib/cn";
import { MotionAvatar } from "./motion-avatar";

/** The face takes 56 of the rig's 100 units; the rest is room for hops, extras and the floor. */
const FACE = 0.56;

/**
 * A MotionAvatar laid out by its face: the box is `size` px (like a static avatar; a class with
 * `!` can override it), and the rig around it (hops, z's, !, burst) overflows the box without
 * pushing the layout.
 */
export function MotionFace({
  avatar,
  variant = "tech",
  state,
  size,
  playKey,
  seed,
  paused,
  followPointer,
  loop = false,
  dir,
  className,
  label,
}: {
  avatar: BotAvatar;
  variant?: BotAvatarVariant;
  state: MotionStateId;
  /** Face size in px. */
  size: number;
  playKey?: number;
  seed?: number;
  paused?: boolean;
  followPointer?: boolean;
  loop?: boolean;
  dir?: -1 | 1;
  className?: string;
  label?: string;
}) {
  const rig = Math.round(size / FACE);
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* The rig is sized in % of the box, so a class can resize the face (e.g. on phones). */}
      <MotionAvatar
        avatar={avatar}
        variant={variant}
        state={state}
        size={rig}
        playKey={playKey}
        seed={seed}
        paused={paused}
        followPointer={followPointer}
        loop={loop}
        dir={dir}
        className="pointer-events-none absolute"
        style={{ left: "-39.2857%", top: "-50%", width: `${100 / FACE}%`, height: `${100 / FACE}%` }}
      />
    </span>
  );
}
