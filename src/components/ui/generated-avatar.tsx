import { AVATAR_GRID, AVATAR_PALETTE, avatarCells, avatarFromSeed } from "@/lib/avatar";
import { cn } from "@/lib/cn";

/**
 * Pixel avatar drawn from the user's stored `avatarSeed` (never from the username).
 * Square, no radius, crisp at any size. Sizes used in Figma: 24 (shown as), 28 (table row),
 * 48 / 56 (podium), 80 (profile).
 */
export function GeneratedAvatar({
  seed,
  size = 28,
  className,
  label,
}: {
  seed: number;
  size?: number;
  className?: string;
  /** Accessible name, e.g. the masked username "mart****". Omit when the name sits next to it. */
  label?: string;
}) {
  const avatar = avatarFromSeed(seed);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${AVATAR_GRID} ${AVATAR_GRID}`}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", className)}
    >
      <rect width={AVATAR_GRID} height={AVATAR_GRID} fill="#FFFFFF" fillOpacity={0.06} />
      <g fill={AVATAR_PALETTE[avatar.color]}>
        {avatarCells(avatar).map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
        ))}
      </g>
    </svg>
  );
}
