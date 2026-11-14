import type { CSSProperties } from "react";
import {
  botAvatarFromSeed,
  botAvatarParts,
  type BotAvatar as BotAvatarLook,
  type BotAvatarFace,
  type BotAvatarLayer,
  type BotAvatarStyle,
  type BotAvatarTweak,
} from "@/lib/bot-avatar";
import { cn } from "@/lib/cn";

/**
 * How the face is drawn. v1 (the backup): the tech geometry with cut-out eyes or a visor, or the
 * soft geometry. Round 2: shard, sigil, matrix and halo (see src/lib/bot-avatar-geo.ts).
 */
export type BotAvatarVariant = "tech" | "visor" | "soft" | "shard" | "sigil" | "matrix" | "halo";

export const BOT_AVATAR_VARIANTS: readonly BotAvatarVariant[] = ["tech", "visor", "soft", "shard", "sigil", "matrix", "halo"];

export function variantToStyle(variant: BotAvatarVariant): {
  style: BotAvatarStyle;
  face: BotAvatarFace;
} {
  if (variant === "tech" || variant === "visor") return { style: "tech", face: variant === "visor" ? "visor" : "cutout" };
  return { style: variant, face: "cutout" };
}

/** One extra layer of a face (facet, line, ornament). */
export function AvatarLayer({ layer }: { layer: BotAvatarLayer }) {
  return (
    <path
      d={layer.d}
      fill={layer.fill ?? "none"}
      stroke={layer.stroke}
      strokeWidth={layer.width}
      strokeLinecap="square"
      vectorEffect={layer.screen ? "non-scaling-stroke" : undefined}
      opacity={layer.opacity}
    />
  );
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
  tweak,
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
  /** Playground dials for the round 2 treatments. */
  tweak?: BotAvatarTweak;
}) {
  const look = avatar ?? botAvatarFromSeed(seed ?? 0);
  const { style, face } = variantToStyle(variant);
  const p = botAvatarParts(look, style, face, tweak);
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
      <path d={p.body} fill={p.fill} />
      {p.details.map((l, i) => (
        <AvatarLayer key={i} layer={l} />
      ))}
      {p.stroke && (
        <path d={p.body} fill="none" stroke={p.stroke.color} strokeWidth={p.stroke.width} strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
      )}
      {p.ornaments.map((l, i) => (
        <AvatarLayer key={i} layer={l} />
      ))}
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
