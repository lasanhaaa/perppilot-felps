const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatUsd(value: number, { decimals = 2, signed = false } = {}) {
  const fmt = decimals === 0 ? usd0 : usd2;
  const text = fmt.format(Math.abs(value));
  if (!signed) return value < 0 ? `-${text}` : text;
  return `${value >= 0 ? "+" : "-"}${text}`;
}

export function formatPct(value: number, { decimals = 2, signed = false } = {}) {
  const text = `${Math.abs(value).toFixed(decimals)}%`;
  if (!signed) return value < 0 ? `-${text}` : text;
  return `${value >= 0 ? "+" : "-"}${text}`;
}

/** "$63k" style compact numbers used for ranges. */
export function formatK(value: number) {
  return `$${Math.round(value / 1000)}k`;
}

/** 27 JUN 2026 */
export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

/** 19d 6h */
export function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function toneOf(value: number) {
  if (value > 0) return "positive" as const;
  if (value < 0) return "negative" as const;
  return "neutral" as const;
}
