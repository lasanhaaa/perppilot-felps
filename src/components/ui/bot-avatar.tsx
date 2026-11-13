import { BOT_AVATAR_BACKGROUND_OPACITY, BOT_AVATAR_GRID, BOT_AVATAR_PALETTE, botAvatarCells, botAvatarFromSeed } from "@/lib/bot-avatar";
import { cn } from "@/lib/cn";

/**
 * Pixel robot drawn from the bot's stored `avatarSeed`. Square, no radius, background tinted
 * with the avatar color. Use multiples of 7 so pixels stay crisp: 28 (list row), 42, 56 (bot card), 112 (detail).
 */
export function BotAvatar({
  seed,
  size = 56,
  className,
  label,
}: {
  seed: number;
  size?: number;
  className?: string;
  /** Accessible name. Omit when the pair and bot type sit next to it. */
  label?: string;
}) {
  const avatar = botAvatarFromSeed(seed);
  const fill = BOT_AVATAR_PALETTE[avatar.color];
  const g = BOT_AVATAR_GRID;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${g} ${g}`}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", className)}
    >
      <rect width={g} height={g} fill={fill} fillOpacity={BOT_AVATAR_BACKGROUND_OPACITY} />
      <g fill={fill}>
        {botAvatarCells(avatar).map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
        ))}
      </g>
    </svg>
  );
}
