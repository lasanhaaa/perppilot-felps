import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MEDAL, type UserAvatarLook } from "@/lib/leaderboard";

/** Generated pixel avatar of a trader: 5×5 grid on a 6% white cell, one color. */
export function UserAvatar({ avatar, size = 28, hidden }: { avatar: UserAvatarLook; size?: number; hidden?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 5 5" shapeRendering="crispEdges" aria-hidden style={{ flex: "none" }}>
      <rect width="5" height="5" fill="#fff" fillOpacity="0.06" />
      {!hidden && (
        <g fill={avatar.color} fillOpacity="0.9">
          {avatar.cells.map((c) => (
            <rect key={c} x={c % 5} y={Math.floor(c / 5)} width="1" height="1" />
          ))}
        </g>
      )}
    </svg>
  );
}

/** Leaderboard / Rank badge (2309:17062): medal background, black label. */
export function RankBadge({ rank }: { rank: 1 | 2 | 3 }) {
  return (
    <span className="t-l12 inline-flex h-[22px] items-center px-[7px] text-black tnum" style={{ background: MEDAL[rank - 1] }}>
      #{rank}
    </span>
  );
}

/** Leaderboard / Rank change (2309:17073): places moved in 7 days. */
export function RankChange({ value }: { value: number }) {
  if (!value) return <span className="t-l12 text-white/30">–</span>;
  const up = value > 0;
  return (
    <span className={cn("t-l12 inline-flex items-center gap-[3px] tnum", up ? "text-gain" : "text-error")}>
      <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden className={cn(!up && "rotate-180")}>
        <path d="M3 0.5L6 5.5H0L3 0.5Z" fill="currentColor" />
      </svg>
      {Math.abs(value)}
    </span>
  );
}

/** Grey tag for "V3 BOT · 4", "ALL TIME" and similar. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("t-l12 inline-flex h-[22px] items-center bg-white/5 px-1.5 whitespace-nowrap text-white/60", className)}>{children}</span>;
}

export function YouTag() {
  return <span className="t-l12 inline-flex h-[22px] items-center bg-white px-1.5 text-black">You</span>;
}

export function ComingSoon() {
  return <span className="t-l12 bg-coming px-1 tracking-normal text-black">Coming soon</span>;
}

/** Label above a number (t-l12 at 40%). */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("t-l12 text-white/40", className)}>{children}</span>;
}

/** Thin white progress bar on a 10% track. */
export function Track({ value, height = 4 }: { value: number; height?: number }) {
  return (
    <div className="w-full bg-white/10" style={{ height }}>
      <div className="h-full bg-white transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

/** Card shell shared by the three hero cards and the rankings. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-sm border border-line bg-card", className)}>{children}</section>;
}
