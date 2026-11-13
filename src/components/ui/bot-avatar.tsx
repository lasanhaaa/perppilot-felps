import type { CSSProperties } from "react";
import {
  botAvatarFromSeed,
  botAvatarParts,
  type BotAvatar as BotAvatarLook,
  type BotAvatarFace,
  type BotAvatarStyle,
} from "@/lib/bot-avatar";
import { cn } from "@/lib/cn";

/** How the face is drawn: the tech geometry with cut-out eyes or a visor, or the soft geometry. */
export type BotAvatarVariant = "tech" | "visor" | "soft";

export function variantToStyle(variant: BotAvatarVariant): {
  style: BotAvatarStyle;
  face: BotAvatarFace;
} {
  if (variant === "soft") return { style: "soft", face: "cutout" };
  return { style: "tech", face: variant === "visor" ? "visor" : "cutout" };
}

/**
 * A bot's face: body + Eye L + Eye R, drawn from its stored `avatarSeed` (or an explicit look).
 * Motion is driven by props and CSS only (see globals.css, "Bot avatar motion"):
 * - `blink`: bump the number to blink once (one order fill = one blink).
 * - `pose="closed"`: eyes close with a short transition (bot stopping or stopped).
 * - `scanning`: eyes sweep left and right while the bot is starting.
 * - `dimmed`: 45% opacity, used for stopped bots.
 * - Look: set `--look-x` / `--look-y` (px, ±3.5 / ±2) on any ancestor and the eyes follow.
 * Every animation is off when the user asks the system to reduce motion.
 */
export function BotAvatar({
  seed,
  avatar,
  variant = "tech",
  size = 56,
  pose = "open",
  blink = 0,
  scanning = false,
  dimmed = false,
  className,
  label,
}: {
  seed?: number;
  avatar?: BotAvatarLook;
  variant?: BotAvatarVariant;
  size?: number;
  pose?: "open" | "closed";
  blink?: number;
  scanning?: boolean;
  dimmed?: boolean;
  className?: string;
  /** Accessible name. Omit when the pair and bot type sit next to it. */
  label?: string;
}) {
  const look = avatar ?? botAvatarFromSeed(seed ?? 0);
  const { style, face } = variantToStyle(variant);
  const p = botAvatarParts(look, style, face);
  const eyeClass = cn(
    "bot-eye",
    blink > 0 && pose === "open" && "bot-eye-blink",
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-pose={pose}
      className={cn(
        "bot-avatar shrink-0 overflow-visible",
        dimmed && "opacity-45",
        className,
      )}
      style={{ "--closed": p.closedScale } as CSSProperties}
    >
      <path d={p.body} fill={p.color} />
      {p.visor && <path d={p.visor} fill="#0D1012" />}
      <g className="bot-avatar-look">
        <g className={cn(scanning && pose === "open" && "bot-avatar-scan")}>
          {/* Re-keyed on every blink so the CSS animation runs again. */}
          <g key={blink} fill={p.eyeColor}>
            <path className={eyeClass} d={p.eyes[0]} />
            <path className={eyeClass} d={p.eyes[1]} />
          </g>
        </g>
      </g>
    </svg>
  );
}
