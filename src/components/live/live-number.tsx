"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Dir } from "@/lib/live-bots";

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A number that arrives and then lives:
 * - on page enter it counts up from `from` (0 by default) to the value, after `delay` ms;
 * - afterwards each new value rolls in over 450 ms;
 * - each time `k` changes it flashes green (up) or red (down): a background flash for money,
 *   or a text color flash for prices (`flash="text"`), plus a small bump when `bump` is set.
 * The flash class is restarted on the element itself, so nothing remounts.
 */
export function LiveNumber({
  value,
  format,
  render,
  from = 0,
  delay = 0,
  duration = 900,
  k,
  dir,
  flash = "bg",
  bump,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  render?: (n: number) => ReactNode;
  from?: number;
  delay?: number;
  duration?: number;
  k?: number;
  dir?: Dir;
  flash?: "bg" | "text" | false;
  bump?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : from);
  const phase = useRef<"intro" | "live">(reduced ? "live" : "intro");
  const cur = useRef(reduced ? value : from);
  const target = useRef(value);
  const raf = useRef(0);
  const el = useRef<HTMLSpanElement>(null);

  // Arrival: count from `from` to the value once.
  useEffect(() => {
    if (reduced) {
      phase.current = "live";
      cur.current = target.current;
      setShown(target.current);
      return;
    }
    let t0 = 0;
    const timeout = window.setTimeout(() => {
      const step = (now: number) => {
        if (!t0) t0 = now;
        const t = Math.min(1, (now - t0) / duration);
        const v = from + (target.current - from) * easeOutExpo(t);
        cur.current = v;
        setShown(v);
        if (t < 1) raf.current = requestAnimationFrame(step);
        else phase.current = "live";
      };
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf.current);
      phase.current = "live";
    };
    // Only on mount: every page enter counts up again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live: roll to each new value.
  useEffect(() => {
    target.current = value;
    if (phase.current !== "live") return;
    if (reduced) {
      cur.current = value;
      setShown(value);
      return;
    }
    const start = cur.current;
    if (start === value) return;
    let t0 = 0;
    cancelAnimationFrame(raf.current);
    const step = (now: number) => {
      if (!t0) t0 = now;
      const t = Math.min(1, (now - t0) / 450);
      const v = start + (value - start) * easeOutCubic(t);
      cur.current = v;
      setShown(v);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [value, reduced]);

  // Flash on each new fill / tick.
  const seenK = useRef(k);
  useEffect(() => {
    const node = el.current;
    if (!node || k === undefined || k === seenK.current || !dir || !flash) return;
    seenK.current = k;
    const cls = flash === "text" ? ["live-text-up", "live-text-down"] : ["el-flash-up", "el-flash-down"];
    node.classList.remove(...cls, "live-bump");
    void node.offsetWidth; // restart the animation
    node.classList.add(dir === "up" ? cls[0] : cls[1]);
    if (bump && dir === "up") node.classList.add("live-bump");
  }, [k, dir, flash, bump]);

  return (
    <span ref={el} className={cn("tnum inline-block", flash === "bg" && "-mx-1 px-1", className)}>
      {render ? render(shown) : format ? format(shown) : String(Math.round(shown))}
    </span>
  );
}

/** "$2,480" with the cents after it, quieter: "$2,480.31". */
export function Cents({ n, signed, className }: { n: number; signed?: boolean; className?: string }) {
  const abs = Math.abs(n);
  const whole = Math.floor(abs + 1e-9);
  let cents = Math.round((abs - whole) * 100);
  let w = whole;
  if (cents === 100) {
    cents = 0;
    w += 1;
  }
  const sign = n < 0 ? "-" : signed ? "+" : "";
  return (
    <span className={className}>
      {sign}${w.toLocaleString("en-US")}
      <span className="opacity-50">.{String(cents).padStart(2, "0")}</span>
    </span>
  );
}

/** Status dot with a ring that keeps growing out of it: the bot is working. */
export function LiveDot({ on = true, className, square }: { on?: boolean; className?: string; square?: boolean }) {
  return (
    <span className={cn("relative inline-flex size-1.5 flex-none", className)} aria-hidden>
      {on && <span className={cn("live-ping absolute inset-0 bg-current", !square && "rounded-full")} />}
      <span className={cn("relative size-1.5 bg-current", !square && "rounded-full")} />
    </span>
  );
}
