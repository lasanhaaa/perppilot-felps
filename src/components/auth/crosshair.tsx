"use client";

import { useEffect, useRef } from "react";

/**
 * "Cursor / Crosshair" (Figma 2247:4403), in the Nado style.
 *
 * - A small crosshair icon with a diamond replaces the mouse pointer on the auth screens. The
 *   icon, the hairlines and the coordinates are locked together on the mouse, no lag.
 * - Faint full-viewport hairlines stop short of it (they never meet at the cursor) and pass over
 *   everything, the panel included.
 * - The coordinates sit next to it as plain text, no box. Mint marks follow it on the rulers.
 * - Hovering a button, link or field: four small squares appear just inside its corners and
 *   expand outwards into brackets around it, as if selecting it. The hairlines and coordinates
 *   step aside, the pointer itself stays (felipe 2026-11-20: hiding it hurt usability). Pressing
 *   tightens the brackets and turns them mint. Leaving shrinks them back into small squares that
 *   fade where they were, and the hairlines come back.
 * - Inside a text field the normal I-beam comes back so typing feels normal.
 * Mouse and pen only.
 */
const GAP = 14; // px the hairlines stop short of the cursor
const PAD = 7; // px between a hovered element and its brackets

type Box = { x: number; y: number; w: number; h: number };

function targetOf(el: Element | null): Element | null {
  if (!el || el.closest("[data-cursor-auto]")) return null;
  const hit = el.closest("button, a, input, textarea, select, [role=button], [data-target]");
  if (!hit) return null;
  // A field's visible box is the bordered wrapper around the input.
  if (hit.matches("input, textarea, select")) return hit.parentElement ?? hit;
  return hit;
}

export function Crosshair({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const vTop = useRef<HTMLDivElement>(null);
  const vBottom = useRef<HTMLDivElement>(null);
  const hLeft = useRef<HTMLDivElement>(null);
  const hRight = useRef<HTMLDivElement>(null);
  const icon = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const markX = useRef<HTMLDivElement>(null);
  const markY = useRef<HTMLDivElement>(null);
  const brackets = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("lines-cursor");
    const mouse = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 }; // icon
    const line = { x: 0, y: 0 }; // hairlines, same spot as the icon
    let target: Element | null = null;
    let typing = false;
    let inside = false;
    let down = false;
    let scale = 1;
    let shown = "";
    const box: Box = { x: 0, y: 0, w: 0, h: 0 };
    let boxOpacity = 0;
    let wasLive = false;
    let squareFrames = 0; // frames the corners stay squares after locking on, before they open

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const t = e.target instanceof Element ? e.target : null;
      target = targetOf(t);
      typing = !!t?.closest("input, textarea, select");
      el.classList.toggle("crosshair-typing", typing);
      el.classList.toggle("crosshair-target", !!target);
      el.classList.toggle("crosshair-hidden", !!t?.closest("[data-cursor-auto]"));
      if (!inside) {
        inside = true;
        pos.x = line.x = box.x = mouse.x;
        pos.y = line.y = box.y = mouse.y;
        el.style.opacity = "1";
      }
    };
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      inside = false;
      target = null;
      el.style.opacity = "0";
    };
    const onDown = () => {
      down = true;
      el.classList.add("crosshair-down");
    };
    const onUp = () => {
      down = false;
      el.classList.remove("crosshair-down");
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
      // Icon, hairlines and coordinates sit exactly on the mouse, together.
      pos.x = line.x = mouse.x;
      pos.y = line.y = mouse.y;
      scale += ((down ? 0.7 : 1) - scale) * ease(0.3);
      const W = window.innerWidth;
      const H = window.innerHeight;

      // Hairlines with a gap around the cursor.
      const lx = Math.round(line.x);
      const ly = Math.round(line.y);
      if (vTop.current) {
        vTop.current.style.transform = `translate3d(${lx}px,0,0)`;
        vTop.current.style.height = `${Math.max(0, ly - GAP)}px`;
      }
      if (vBottom.current) {
        vBottom.current.style.transform = `translate3d(${lx}px,${ly + GAP}px,0)`;
        vBottom.current.style.height = `${Math.max(0, H - ly - GAP)}px`;
      }
      if (hLeft.current) {
        hLeft.current.style.transform = `translate3d(0,${ly}px,0)`;
        hLeft.current.style.width = `${Math.max(0, lx - GAP)}px`;
      }
      if (hRight.current) {
        hRight.current.style.transform = `translate3d(${lx + GAP}px,${ly}px,0)`;
        hRight.current.style.width = `${Math.max(0, W - lx - GAP)}px`;
      }
      if (markX.current) markX.current.style.transform = `translate3d(${lx}px,0,0)`;
      if (markY.current) markY.current.style.transform = `translate3d(0,${ly}px,0)`;
      if (icon.current) icon.current.style.transform = `translate3d(${pos.x - 10.5}px,${pos.y - 10.5}px,0) scale(${scale})`;

      // Coordinates next to the icon, flipped near the edges.
      const text = `x:${Math.round(mouse.x)}, y:${Math.round(mouse.y)}`;
      if (label.current) {
        if (text !== shown) {
          label.current.textContent = text;
          shown = text;
        }
        const tw = label.current.offsetWidth;
        let tx = pos.x + 12;
        let ty = pos.y + 8;
        if (tx + tw > W - 12) tx = pos.x - 12 - tw;
        if (ty + 18 > H - 12) ty = pos.y - 26;
        label.current.style.transform = `translate3d(${Math.round(tx)}px,${Math.round(ty)}px,0)`;
      }

      // Brackets fly out of the pointer and lock onto the hovered element; on leave they shrink
      // into small squares and fade where they are.
      const live = target && target.isConnected ? target.getBoundingClientRect() : null;
      if (live) {
        if (!wasLive) {
          // Start as squares just inside the element's corners, then grow out.
          const inner = Math.min(8, live.width / 4, live.height / 4);
          box.x = live.left + inner;
          box.y = live.top + inner;
          box.w = live.width - inner * 2;
          box.h = live.height - inner * 2;
          boxOpacity = 0.35;
          brackets.current?.classList.add("is-released");
          squareFrames = reduced ? 0 : 3;
        }
        if (squareFrames > 0 && --squareFrames === 0) brackets.current?.classList.remove("is-released");
        if (reduced) brackets.current?.classList.remove("is-released");
        const pad = down ? 3 : PAD;
        const kb = ease(0.2);
        box.x += (live.left - pad - box.x) * kb;
        box.y += (live.top - pad - box.y) * kb;
        box.w += (live.width + pad * 2 - box.w) * kb;
        box.h += (live.height + pad * 2 - box.h) * kb;
      } else if (wasLive) {
        brackets.current?.classList.add("is-released");
      }
      wasLive = !!live;
      boxOpacity += ((live ? 1 : 0) - boxOpacity) * ease(live ? 0.25 : 0.1);
      if (brackets.current) {
        const b = brackets.current.style;
        b.transform = `translate3d(${box.x}px,${box.y}px,0)`;
        b.width = `${Math.max(0, box.w)}px`;
        b.height = `${Math.max(0, box.h)}px`;
        b.opacity = boxOpacity.toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("lines-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [reduced]);

  const hair = "absolute top-0 left-0 bg-white/[0.08]";
  const corner = "absolute size-2 border-current";
  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 hidden overflow-hidden opacity-0 transition-opacity duration-300 md:block"
    >
      <div className="crosshair-hairlines">
        <div ref={vTop} className={`${hair} w-px`} />
        <div ref={vBottom} className={`${hair} w-px`} />
        <div ref={hLeft} className={`${hair} h-px`} />
        <div ref={hRight} className={`${hair} h-px`} />
      </div>
      <div ref={markX} className="absolute top-[calc(var(--inset)-12px)] left-0 h-3 w-px bg-brand" />
      <div ref={markY} className="absolute top-0 left-[calc(var(--inset)-12px)] h-px w-3 bg-brand" />
      <div ref={brackets} className="crosshair-brackets absolute top-0 left-0 opacity-0">
        <span className={`${corner} top-0 left-0 border-t border-l`} />
        <span className={`${corner} top-0 right-0 border-t border-r`} />
        <span className={`${corner} bottom-0 left-0 border-b border-l`} />
        <span className={`${corner} right-0 bottom-0 border-r border-b`} />
      </div>
      <div ref={icon} className="crosshair-icon absolute top-0 left-0 size-[21px]">
        <svg width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden>
          <path d="M10.5 0.5V7M10.5 14V20.5M0.5 10.5H7M14 10.5H20.5" stroke="currentColor" strokeWidth="1" />
          <path d="M10.5 8L13 10.5L10.5 13L8 10.5Z" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <span ref={label} className="crosshair-label tnum absolute top-0 left-0 text-[12px] leading-[18px] font-medium tracking-[0.04em] whitespace-nowrap text-white/60 uppercase">
        x:0, y:0
      </span>
    </div>
  );
}
