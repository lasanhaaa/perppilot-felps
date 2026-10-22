import { useId } from "react";

const COLORS = { positive: "#2fe8b4", negative: "#ff3737", neutral: "rgba(255,255,255,0.4)" };

/** Bot card performance line (Figma: Bot Card / Performance Chart). Values are 0..1, top is 1. */
export function Sparkline({ values, tone, height = 56 }: { values: number[]; tone: keyof typeof COLORS; height?: number }) {
  const id = useId();
  const color = COLORS[tone];
  const step = 100 / (values.length - 1);
  const pts = values.map((v, i) => [i * step, (1 - v) * height] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L100,${height} L0,${height} Z`;
  const first = pts[0];
  const last = pts[pts.length - 1];

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={tone === "neutral" ? 0 : 0.18} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {tone !== "neutral" && <path d={area} fill={`url(#${id})`} />}
        <path d={line} fill="none" stroke={color} strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
      </svg>
      {[first, last].map(([x, y], i) => (
        <span
          key={i}
          aria-hidden
          className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: y, background: color }}
        />
      ))}
    </div>
  );
}
