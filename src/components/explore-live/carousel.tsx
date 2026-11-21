"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HIGHLIGHTS } from "./data";
import { easeInOutCubic, easeOutCubic, useInterval } from "./motion";
import { GridSquare } from "./parts";
import { HighlightTile } from "./tiles";

/*
 * Highlights band, after the reference tool: an endless wheel that drifts to the left. Tiles come in
 * small on the right, reach full size in the middle and shrink and fade out on the left (no blur in
 * PerpPilot). Hover stops it and turns the hovered tile into the middle; drag or a horizontal wheel
 * spins it, with a fling. It always runs, also with "reduce motion" on: the tiles are meant to move.
 */

const W = 360;
const GAP = 48;
const P = W + GAP;
const SPEED = 128; // px per second (8 rem)
const LANE_H = 540;

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function HighlightsBand({ onOpen }: { onOpen: (id: string) => void }) {
  const n = HIGHLIGHTS.length;
  const L = n * P;
  const band = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const [copies, setCopies] = useState(3);
  const [earned, setEarned] = useState<Record<string, { n: number; k: number }>>(() => Object.fromEntries(HIGHLIGHTS.map((h) => [h.id, { n: h.earned, k: 0 }])));

  // Earnings tick up on a random highlight, so something in the band is always moving.
  useInterval(() => {
    const h = HIGHLIGHTS[Math.floor(Math.random() * n)];
    setEarned((e) => ({ ...e, [h.id]: { n: e[h.id].n + 0.4 + Math.random() * 3.6, k: e[h.id].k + 1 } }));
  }, 1100);

  const st = useRef({
    off: 0,
    vNow: SPEED,
    vTarget: SPEED,
    B: 1200,
    H: 500,
    k: 3,
    hover: false,
    drag: null as null | { id: number; x0: number; y0: number; x: number; active: boolean },
    samples: [] as { t: number; x: number }[],
    fling: 0,
    glide: null as null | { from: number; to: number; t0: number; dur: number; curve: (t: number) => number },
    hoverEl: -1,
    mouse: { x: NaN, y: NaN },
    dragged: false,
    restart: 0 as unknown as ReturnType<typeof setTimeout>,
    leave: 0 as unknown as ReturnType<typeof setTimeout>,
  });

  const draw = useCallback(() => {
    const s = st.current;
    const kL = s.k * L;
    const half = s.B / 2;
    const Hy = Math.round((LANE_H - s.H) / 2);
    tiles.current.forEach((el, j) => {
      if (!el) return;
      const x = mod(j * P + s.off, kL) - P;
      const d = clamp((x + W / 2 - half) / half, -1, 1);
      const c = smoothstep(0, 1, (1 + Math.cos(Math.PI * d)) / 2);
      let sc: number;
      let op: number;
      if (d >= 0) {
        sc = 0.56 + 0.44 * c;
        op = 0.45 + 0.55 * c;
      } else {
        const u = smoothstep(0, 1, -d);
        sc = 1 - 0.53 * u;
        op = 1 - u;
      }
      let xs = x.toFixed(1);
      if (Math.abs(d) < 0.03) {
        sc = 1;
        xs = String(Math.round(x));
      }
      el.style.transform = `translate3d(${xs}px,${Hy}px,0) scale(${sc.toFixed(4)})`;
      el.style.opacity = op.toFixed(3);
      el.style.setProperty("--glow", smoothstep(0.55, 1, c).toFixed(3));
      el.style.zIndex = String(Math.round(c * 10));
    });
  }, [L]);

  const measure = useCallback(() => {
    const s = st.current;
    if (!band.current) return;
    s.B = band.current.clientWidth;
    const t = tiles.current.find(Boolean);
    if (t) s.H = t.offsetHeight;
    const k = Math.ceil((s.B + P) / L) + 1;
    if (k !== s.k) {
      s.k = k;
      setCopies(k);
    }
  }, [L]);

  const centerOn = useCallback(
    (j: number) => {
      const s = st.current;
      const x = mod(j * P + s.off, s.k * L) - P;
      const way = s.B / 2 - (x + W / 2);
      s.vNow = 0;
      s.fling = 0;
      s.glide = { from: s.off, to: s.off + way, t0: performance.now(), dur: clamp(300 + (Math.abs(way) / P) * 260, 300, 700), curve: easeInOutCubic };
    },
    [L],
  );

  const snap = useCallback(() => {
    const s = st.current;
    let best = 0;
    let bd = Infinity;
    tiles.current.forEach((el, j) => {
      const x = mod(j * P + s.off, s.k * L) - P;
      const dd = Math.abs(s.B / 2 - (x + W / 2));
      if (dd < bd) {
        bd = dd;
        best = j;
      }
    });
    const x = mod(best * P + s.off, s.k * L) - P;
    const way = s.B / 2 - (x + W / 2);
    s.glide = { from: s.off, to: s.off + way, t0: performance.now(), dur: 280, curve: easeOutCubic };
    clearTimeout(s.restart);
    s.restart = setTimeout(() => {
      if (!s.hover && !s.drag) s.vTarget = SPEED;
    }, 2500);
  }, [L]);

  useLayoutEffect(() => {
    measure();
    const s = st.current;
    // Start with the first tile in the middle.
    s.off = s.B / 2 - W / 2 + P;
    draw();
  }, [measure, draw]);

  useEffect(() => {
    draw();
  }, [copies, draw]);

  useEffect(() => {
    const s = st.current;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const loop = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      if (s.glide) {
        const t = clamp((now - s.glide.t0) / s.glide.dur, 0, 1);
        s.off = s.glide.from + (s.glide.to - s.glide.from) * s.glide.curve(t);
        if (t >= 1) s.glide = null;
      } else if (s.drag) {
        /* position comes from pointermove */
      } else if (Math.abs(s.fling) > 0) {
        s.off += (s.fling * dt) / 1000;
        s.fling *= Math.pow(0.92, dt / 16);
        if (Math.abs(s.fling) < 8) {
          s.fling = 0;
          snap();
        }
      } else {
        s.vNow += (s.vTarget - s.vNow) * (1 - Math.exp(-dt / 180));
        s.off -= (s.vNow * dt) / 1000;
      }
      s.off = mod(s.off, s.k * L);
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    start();
    const io = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) start();
      else stop();
    });
    if (band.current) io.observe(band.current);
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", vis);
    const ro = new ResizeObserver(() => {
      measure();
      draw();
    });
    if (band.current) ro.observe(band.current);
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [L, draw, measure, snap]);

  const s = st.current;
  const total = n * copies;

  return (
    <section aria-roledescription="carousel" aria-label="Highlights, pauses on hover" className="relative">
      <div
        ref={band}
        className="relative w-full touch-pan-y overflow-hidden select-none"
        style={{ height: LANE_H }}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          clearTimeout(s.leave);
          s.hover = true;
          s.vTarget = 0;
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return;
          s.hoverEl = -1;
          clearTimeout(s.leave);
          s.leave = setTimeout(() => {
            s.hover = false;
            if (!s.drag) s.vTarget = SPEED;
          }, 300);
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          s.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, active: false };
          s.samples = [{ t: performance.now(), x: e.clientX }];
          s.vTarget = 0;
          s.glide = null;
          s.fling = 0;
        }}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") s.mouse = { x: e.clientX, y: e.clientY };
          const d = s.drag;
          if (!d || e.pointerId !== d.id) return;
          const dx = e.clientX - d.x0;
          const dy = e.clientY - d.y0;
          if (!d.active) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
              d.active = true;
              s.dragged = true;
              band.current?.setPointerCapture(e.pointerId);
            } else return;
          }
          s.off += e.clientX - d.x;
          d.x = e.clientX;
          const now = performance.now();
          s.samples.push({ t: now, x: e.clientX });
          s.samples = s.samples.filter((p) => now - p.t <= 80);
        }}
        onPointerUp={(e) => {
          const d = s.drag;
          if (!d || e.pointerId !== d.id) return;
          s.drag = null;
          if (d.active) {
            const a = s.samples[0];
            const b = s.samples[s.samples.length - 1];
            s.fling = b && a && b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0;
            if (Math.abs(s.fling) < 8) {
              s.fling = 0;
              snap();
            }
            setTimeout(() => (s.dragged = false), 50);
          } else if (!s.hover) s.vTarget = SPEED;
        }}
        onPointerCancel={() => {
          s.drag = null;
          snap();
        }}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
          s.glide = null;
          s.off -= e.deltaX;
          s.vTarget = 0;
          clearTimeout(s.restart);
          s.restart = setTimeout(snap, 400);
        }}
      >
        {Array.from({ length: total }, (_, j) => {
          const h = HIGHLIGHTS[j % n];
          return (
            <div
              key={j}
              ref={(el) => {
                tiles.current[j] = el;
              }}
              className="group absolute top-0 left-0 cursor-pointer will-change-transform"
              aria-hidden={j >= n}
              onPointerOver={(e) => {
                if (e.pointerType !== "mouse" || s.drag || s.hoverEl === j) return;
                // Only a real mouse move counts: while turning, tiles slide under a still mouse.
                if (e.clientX === s.mouse.x && e.clientY === s.mouse.y) return;
                s.hoverEl = j;
                s.hover = true;
                s.vTarget = 0;
                centerOn(j);
              }}
              onClick={() => {
                if (s.dragged) return;
                onOpen(h.id);
              }}
            >
              <HighlightTile h={h} earned={earned[h.id]} />
            </div>
          );
        })}
      </div>
      {/* Solid rule under the band, with squares on the grid of the key figures. */}
      <div className="relative h-px w-full bg-line">
        {[0, 20, 40, 60, 80, 100].map((x) => (
          <GridSquare key={x} className="-top-[2.5px]" style={{ left: `calc(${x}% - 3px)` }} />
        ))}
      </div>
    </section>
  );
}
