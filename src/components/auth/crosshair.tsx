"use client";

import { useEffect, useRef } from "react";

/**
 * "Cursor / Crosshair" (Figma 2247:4403): full-viewport hairlines that follow the mouse, a ring,
 * a live X / Y tag and mint marks on the rulers. Sits under the panel, so it never crosses the
 * form. Mouse and pen only; touch screens don't get it.
 */
export function Crosshair({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const v = useRef<HTMLDivElement>(null);
  const h = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const markX = useRef<HTMLDivElement>(null);
  const markY = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const target = { x: 0, y: 0 };
    const line = { x: 0, y: 0 };
    const tagPos = { x: 0, y: 0 };
    let inside = false;
    let down = false;
    let scale = 1;
    let shown = "";

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      target.x = e.clientX;
      target.y = e.clientY;
      // Over the panel the lines already hide behind it; the ring and tag fade out too.
      const over = e.target instanceof Element && !!e.target.closest("[data-lines-panel]");
      el.classList.toggle("crosshair-over", over);
      if (!inside) {
        inside = true;
        line.x = tagPos.x = target.x;
        line.y = tagPos.y = target.y;
        el.style.opacity = "1";
      }
    };
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      inside = false;
      el.style.opacity = "0";
    };
    const onDown = () => {
      down = true;
      ring.current?.classList.add("is-down");
    };
    const onUp = () => {
      down = false;
      ring.current?.classList.remove("is-down");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ease = (k: number) => (reduced ? 1 : 1 - Math.pow(1 - k, dt * 60));
      const kl = ease(0.35);
      const kt = ease(0.2);
      line.x += (target.x - line.x) * kl;
      line.y += (target.y - line.y) * kl;
      tagPos.x += (target.x - tagPos.x) * kt;
      tagPos.y += (target.y - tagPos.y) * kt;
      scale += ((down ? 0.55 : 1) - scale) * ease(0.3);

      const x = Math.round(line.x);
      const y = Math.round(line.y);
      if (v.current) v.current.style.transform = `translate3d(${x}px,0,0)`;
      if (h.current) h.current.style.transform = `translate3d(0,${y}px,0)`;
      if (markX.current) markX.current.style.transform = `translate3d(${x}px,0,0)`;
      if (markY.current) markY.current.style.transform = `translate3d(0,${y}px,0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${line.x - 10}px,${line.y - 10}px,0) scale(${scale})`;

      const text = `X ${Math.round(target.x)} · Y ${Math.round(target.y)}`;
      if (text !== shown && label.current) {
        label.current.textContent = text;
        shown = text;
      }
      if (tag.current) {
        const tw = tag.current.offsetWidth;
        const th = tag.current.offsetHeight;
        let tx = tagPos.x + 22;
        let ty = tagPos.y + 28;
        if (tx + tw > window.innerWidth - 12) tx = tagPos.x - 22 - tw;
        if (ty + th > window.innerHeight - 12) ty = tagPos.y - 28 - th;
        tag.current.style.transform = `translate3d(${Math.round(tx)}px,${Math.round(ty)}px,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [reduced]);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-10 hidden opacity-0 transition-opacity duration-300 md:block"
    >
      <div ref={v} className="absolute inset-y-0 left-0 w-px bg-white/[0.14]" />
      <div ref={h} className="absolute inset-x-0 top-0 h-px bg-white/[0.14]" />
      <div ref={markX} className="absolute top-[calc(var(--inset)-12px)] left-0 h-3 w-px bg-brand" />
      <div ref={markY} className="absolute top-0 left-[calc(var(--inset)-12px)] h-px w-3 bg-brand" />
      <div ref={ring} className="crosshair-ring absolute top-0 left-0 size-5 rounded-full border border-white/30" />
      <div ref={tag} className="crosshair-tag t-l12 tnum absolute top-0 left-0 border border-white/15 bg-screen px-2 py-1 whitespace-nowrap text-white/60">
        <span ref={label}>X 0 · Y 0</span>
      </div>
    </div>
  );
}
