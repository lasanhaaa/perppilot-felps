import { cn } from "@/lib/cn";
import type { RangeSide } from "@/lib/mock-data";

/** Gains, in range, buys: earnings green. Losses, out of range, errors, sells: red. */
export const GREEN = "#4ADE80";
export const RED = "#FF3737";
/** Status colors (never brand mint): running = success, starting/stopping = amber. */
export const SUCCESS = "#2ABB78";
export const AMBER = "#FFB547";

export type GlyphStatus = "active" | "above" | "below" | "error" | "stopped";

/**
 * Bot status glyph (Figma: Bot glyph 1771:19943): the 1px box is the range, the mark is the bot.
 * Active = mark centered; out of range = the mark breaks out of the top or bottom edge (red);
 * Error = a cross; Stopped = a flat gray line.
 */
export function BotGlyph({ status, size = 16, className }: { status: GlyphStatus; size?: number; className?: string }) {
  const red = status !== "active" && status !== "stopped";
  const c = status === "active" ? GREEN : red ? RED : "#FFFFFF";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("shrink-0 overflow-visible", className)}
    >
      <rect
        x="0.5"
        y="0.5"
        width="15"
        height="15"
        fill={c}
        fillOpacity={status === "stopped" ? 0.04 : 0.08}
        stroke={c}
        strokeOpacity={status === "stopped" ? 0.22 : 0.55}
      />
      {status === "active" && <rect x="5.5" y="5.5" width="5.5" height="5.5" fill={c} />}
      {status === "above" && <rect x="5.25" y="-2.5" width="5.5" height="5.5" fill={c} />}
      {status === "below" && <rect x="5.25" y="13" width="5.5" height="5.5" fill={c} />}
      {status === "error" && <path d="M5 5l6 6M11 5l-6 6" stroke={c} strokeWidth="1.6" />}
      {status === "stopped" && <rect x="4" y="7.5" width="8" height="1" fill={c} fillOpacity="0.5" />}
    </svg>
  );
}

export function glyphFor(run: "running" | "starting" | "stopping" | "stopped" | "error", side: RangeSide): GlyphStatus {
  if (run === "error") return "error";
  if (run === "stopped" || run === "stopping") return "stopped";
  if (side === "above" || side === "below") return side;
  return "active";
}

/** Small status tag of the Bot Detail cards: 13px uppercase, tinted 10%. */
export function RangeTag({ side, size = 13 }: { side: RangeSide; size?: 13 | 14 }) {
  const tone =
    side === "in"
      ? "bg-[#4ADE80]/10 text-[#4ADE80]"
      : side === "none"
        ? "bg-white/10 text-white/60"
        : "bg-danger/10 text-danger";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-1.5 py-0.5 leading-[1.3] uppercase whitespace-nowrap",
        size === 14 ? "text-[14px] font-medium" : "text-[13px]",
        tone,
      )}
    >
      {side === "in" ? "In range" : side === "none" ? "No result" : "Out of range"}
    </span>
  );
}
