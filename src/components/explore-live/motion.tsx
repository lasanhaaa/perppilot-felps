"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { SETUPS } from "./data";

/*
 * Motion of Explore Liquidity: numbers count up the first time they are seen (700 ms, ease-out expo,
 * like the reference tool), live values tick and flash green or red, and everything else follows the
 * system "reduce motion" setting. The highlights band always runs (see carousel.tsx).
 */

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function useInterval(cb: () => void, ms: number, enabled = true) {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  }, [cb]);
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => ref.current(), ms);
    return () => clearInterval(t);
  }, [ms, enabled]);
}

/** True once the element has been on screen (stays true). */
export function useSeen<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

/** Counts from 0 to the value once it is seen; afterwards it follows the value directly. */
export function CountUp({ value, format, className, duration = 700 }: { value: number; format: (n: number) => string; className?: string; duration?: number }) {
  const reduced = useReducedMotion();
  const [ref, seen] = useSeen<HTMLSpanElement>();
  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle");
  const [shown, setShown] = useState(0);
  const target = useRef(value);
  useEffect(() => {
    target.current = value;
  }, [value]);
  useEffect(() => {
    if (!seen) return;
    if (reduced) {
      setPhase("done");
      return;
    }
    setPhase("run");
    const to = target.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setShown(to * easeOutExpo(t));
      if (t < 1) raf = requestAnimationFrame(step);
      else setPhase("done");
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      setPhase("done");
    };
  }, [seen, reduced, duration]);
  const n = phase === "done" ? value : phase === "run" ? shown : 0;
  return (
    <span ref={ref} className={className}>
      {format(n)}
    </span>
  );
}

/**
 * Flashes green (up) or red (down) each time `k` changes. The class is restarted on the element
 * itself, so the children (a CountUp, say) are not remounted and do not count up again.
 */
export function Flash({ k, dir, children, className, as = "span" }: { k: number; dir: "up" | "down" | null; children: ReactNode; className?: string; as?: "span" | "div" }) {
  const ref = useRef<HTMLElement>(null);
  const seenK = useRef(k);
  useEffect(() => {
    const el = ref.current;
    if (!el || k === seenK.current || !dir) return;
    seenK.current = k;
    el.classList.remove("el-flash-up", "el-flash-down");
    void el.offsetWidth; // restart the animation
    el.classList.add(dir === "up" ? "el-flash-up" : "el-flash-down");
  }, [k, dir]);
  return createElement(as, { ref, className }, children);
}

/* ---------- Live APR: one shared engine nudges a random setup every 1.4 s ---------- */

type Pulse = { k: number; dir: "up" | "down" };
type LiveCtx = { apr: (id: string) => number; pulse: (id: string) => Pulse | null; scale: number };
const Ctx = createContext<LiveCtx>({ apr: (id) => SETUPS[id]?.apr ?? 0, pulse: () => null, scale: 1 });

export function LiveProvider({ children, scale = 1 }: { children: ReactNode; scale?: number }) {
  const reduced = useReducedMotion();
  const [delta, setDelta] = useState<Record<string, number>>({});
  const [pulses, setPulses] = useState<Record<string, Pulse>>({});
  const ids = useMemo(() => Object.keys(SETUPS), []);
  const tick = useCallback(() => {
    const id = ids[Math.floor(Math.random() * ids.length)];
    // Mostly up: the band should feel like it is earning.
    const up = Math.random() < 0.72;
    const step = +(0.1 + Math.random() * 0.6).toFixed(1) * (up ? 1 : -1);
    setDelta((d) => ({ ...d, [id]: +((d[id] ?? 0) + step).toFixed(1) }));
    setPulses((p) => ({ ...p, [id]: { k: (p[id]?.k ?? 0) + 1, dir: up ? "up" : "down" } }));
  }, [ids]);
  useInterval(tick, 1400, !reduced);
  const value = useMemo<LiveCtx>(
    () => ({
      apr: (id) => +(((SETUPS[id]?.apr ?? 0) + (delta[id] ?? 0)) * scale).toFixed(1),
      pulse: (id) => pulses[id] ?? null,
      scale,
    }),
    [delta, pulses, scale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLive = () => useContext(Ctx);

/** A number that ticks up on its own (earnings, volume). Returns the value and a flash key. */
export function useTicking(start: number, { every, min, max, enabled = true }: { every: number; min: number; max: number; enabled?: boolean }) {
  const [v, setV] = useState({ n: start, k: 0 });
  useInterval(
    () => setV((s) => ({ n: s.n + min + Math.random() * (max - min), k: s.k + 1 })),
    every,
    enabled,
  );
  return v;
}
