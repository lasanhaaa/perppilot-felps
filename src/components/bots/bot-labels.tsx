import { StatusPill } from "@/components/ui/tag";
import type { Bot } from "@/lib/types";

/** Range status tag used on Bot Detail (the Bots overview cards use their own CardPill). */
export function RangePill({ status }: { status: Bot["rangeStatus"] }) {
  if (status === "in-range")
    return <StatusPill tone="positive">In range</StatusPill>;
  if (status === "out-of-range")
    return <StatusPill tone="negative">Out of range</StatusPill>;
  return <StatusPill tone="neutral">No result</StatusPill>;
}

export function kindLabel(kind: Bot["kind"]) {
  return kind === "pointbot" ? "PointBot" : "V3 Bot";
}
