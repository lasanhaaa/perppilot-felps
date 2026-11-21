/**
 * Bot type icon (Figma "Bot type icon" 2336:17170). Abstract icon for a bot TYPE, not a single bot:
 * single bots keep their Bot avatar.
 * V3 Bot: the brackets are the price range, the mint square is price earning inside it.
 * PointBot: two exchanges and the route between them, the mint square is the spread it captures.
 */
export type BotType = "v3" | "point";

export function BotTypeIcon({ type, size = 40, className }: { type: BotType; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      shapeRendering="crispEdges"
      aria-label={type === "v3" ? "V3 Bot" : "PointBot"}
      className={className}
    >
      <rect x="0.5" y="0.5" width="39" height="39" fill="var(--color-raised)" stroke="var(--color-line)" />
      {type === "v3" ? (
        <g fill="#fff">
          <rect x="10" y="10" width="2" height="20" />
          <rect x="10" y="10" width="5" height="2" />
          <rect x="10" y="28" width="5" height="2" />
          <rect x="28" y="10" width="2" height="20" />
          <rect x="25" y="10" width="5" height="2" />
          <rect x="25" y="28" width="5" height="2" />
          <rect x="16" y="16" width="8" height="8" fill="var(--color-brand)" />
        </g>
      ) : (
        <g fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="miter">
          <rect x="9" y="9" width="8" height="8" />
          <rect x="23" y="23" width="8" height="8" />
          <path d="M18 13 H27 V22" />
          <path d="M22 27 H13 V18" />
          <rect x="25" y="25" width="4" height="4" fill="var(--color-brand)" stroke="none" />
        </g>
      )}
    </svg>
  );
}
