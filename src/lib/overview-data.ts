/** Demo time series for the Overview (deterministic, ends "today" = Nov 3, 2026). */

const END = new Date(Date.UTC(2026, 10, 3));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayLabel(daysBeforeEnd: number) {
  const d = new Date(END.getTime() - daysBeforeEnd * 86400000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
export function dayLong(daysBeforeEnd: number) {
  return `${dayLabel(daysBeforeEnd)}, 2026`;
}

/** Last 31 days of portfolio equity (Oct 4 → Nov 3), hand-shaped to match the Figma chart. */
const EQUITY_30 = [
  11980, 11968, 11992, 12011, 12049, 12082, 12101, 12126, 12185.07, 12224.77, 12268, 12309, 12338, 12372, 12391, 12402, 12441, 12452, 12449, 12398, 12331,
  12352, 12391, 12404, 12381, 12422, 12458, 12469, 12471, 12462, 12480.36,
];

function extendBack(series: number[], days: number, start: number) {
  const out: number[] = [];
  const first = series[0];
  let a = 7;
  for (let i = 0; i < days; i++) {
    a = (a * 9301 + 49297) % 233280;
    const t = i / days;
    out.push(start + (first - start) * t + (a / 233280 - 0.5) * 60);
  }
  return [...out, ...series];
}

const EQUITY_ALL = extendBack(EQUITY_30, 90, 10620);

export type Period = "7D" | "30D" | "90D" | "All";
export const PERIOD_DAYS: Record<Period, number> = { "7D": 7, "30D": 30, "90D": 90, All: 120 };

export const PERIOD_CHANGE: Record<Period, { usd: number; pct: number }> = {
  "7D": { usd: 96.4, pct: 0.8 },
  "30D": { usd: 412.18, pct: 3.4 },
  "90D": { usd: 1604.1, pct: 14.7 },
  All: { usd: 1846.2, pct: 17.4 },
};

export type Metric = "equity" | "earnings" | "fees";

export function metricSeries(metric: Metric, period: Period) {
  const n = Math.min(PERIOD_DAYS[period], EQUITY_ALL.length - 1) + 1;
  const eq = EQUITY_ALL.slice(-n);
  if (metric === "equity") return eq;
  // Cumulative earnings and fees follow the same curve, scaled.
  const last = eq[eq.length - 1];
  if (metric === "earnings") return eq.map((v) => 1846.2 - (last - v) * 0.82);
  return eq.map((v) => 402.6 - (last - v) * 0.21);
}

export function niceTicks(values: number[], count = 5) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const raw = (hi - lo) / (count - 1.4);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(lo / step) * step;
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) ticks.push(start + i * step);
  while (ticks[ticks.length - 1] < hi) ticks.push(ticks[ticks.length - 1] + step), ticks.shift();
  return ticks;
}

export function kFmt(v: number) {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}

/** Daily earnings, Oct 5 → Nov 3 (30 bars). */
export const DAILY = [
  10.2, 21.4, 13.1, 13.2, 11.4, 12.1, 20.3, 21.2, 17.4, 20.16, 14.1, 11.3, 12.2, 13.4, 17.1, 12.4, 20.2, -3.1, -1.6, 9.3, 13.1, 20.4, 12.2, 31.2, 10.4,
  11.1, 9.2, 10.94, 13.1, 14.8,
];
export const DAILY_TRADES = [24, 41, 22, 28, 25, 19, 38, 40, 33, 32, 29, 24, 20, 27, 31, 21, 37, 12, 10, 22, 26, 39, 20, 52, 23, 21, 18, 22, 27, 30];
