"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type RefObject } from "react";

/**
 * Field lines behind the auth panel ("Auth / Shell · Lines", Figma 2247:4472).
 *
 * Hairlines run across the viewport and part around the panel, like a field bending around an
 * object. Drawn on a canvas every frame so they can:
 * - draw in from the panel outwards on first load,
 * - follow the panel when it changes size or scrolls,
 * - bend away from the mouse and light up around it,
 * - carry pulses: two mint loops, faint ambient ones, a burst on every screen change and a small
 *   ping on each keystroke,
 * - straighten out ("release") when the user leaves the auth flow.
 */

export type FieldHandle = {
  /** Pulses run out from the panel on every line. `strength` 0..1 is the share of lines. */
  burst: (strength?: number) => void;
  /** One small pulse from the panel, used for focus and typing. */
  ping: () => void;
  /** Lines straighten and brighten, used right before leaving the auth flow. */
  release: () => void;
};

type Rect = { x0: number; y0: number; x1: number; y1: number };
type Pulse = {
  line: number;
  x: number;
  dir: 1 | -1;
  speed: number;
  len: number;
  alpha: number;
  mint: boolean;
  delay: number;
  loop?: boolean;
};

const N = 9; // lines above and below the panel
const MINT_TOP = 6;
const MINT_BOTTOM = 5;
const MINT = "47,232,180";
const WHITE = "255,255,255";

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export const LinesField = forwardRef<FieldHandle, { panel: RefObject<HTMLElement | null>; reduced: boolean }>(function LinesField(
  { panel, reduced },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<FieldHandle>({ burst() {}, ping() {}, release() {} });
  useImperativeHandle(
    ref,
    () => ({
      burst: (s) => api.current.burst(s),
      ping: () => api.current.ping(),
      release: () => api.current.release(),
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let W = 0;
    let H = 0;
    let inset = 96;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      inset = parseFloat(getComputedStyle(canvas).getPropertyValue("--inset")) || 96;
    };
    resize();
    window.addEventListener("resize", resize);

    // Panel rect, eased so the lines glide when the panel changes size or scrolls.
    const read = (): Rect => {
      const r = panel.current?.getBoundingClientRect();
      if (!r || r.width === 0) return { x0: W / 2 - 258, x1: W / 2 + 258, y0: H / 2 - 300, y1: H / 2 + 300 };
      return { x0: r.left, x1: r.right, y0: r.top, y1: r.bottom };
    };
    let rect = read();

    // Mouse, only for fine pointers.
    const fine = window.matchMedia("(pointer: fine)").matches;
    const mouse = { x: -1e4, y: -1e4, inside: false };
    const cur = { x: -1e4, y: -1e4, infl: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!mouse.inside) {
        cur.x = mouse.x;
        cur.y = mouse.y;
      }
      mouse.inside = true;
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) mouse.inside = false;
    };
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("mouseout", onOut);
    }

    // Line geometry, recomputed every frame.
    const lines = Array.from({ length: N * 2 }, (_, i) => ({
      top: i < N,
      k: i % N,
      ys: new Float32Array(0),
      alpha: 0.045 + 0.055 * ((i % N) / (N - 1)),
      mint: (i < N && i % N === MINT_TOP) || (i >= N && i % N === MINT_BOTTOM),
    }));
    let xa = 0;
    let step = 6;
    let count = 0;
    const yAt = (li: number, x: number) => {
      const ys = lines[li].ys;
      const f = (x - xa) / step;
      const i = Math.max(0, Math.min(count - 2, Math.floor(f)));
      const t = Math.min(1, Math.max(0, f - i));
      return ys[i] + (ys[i + 1] - ys[i]) * t;
    };

    const start = performance.now();
    const REVEAL = reduced ? 0 : 1100;
    let rel = 0; // release progress
    let releasing = false;
    const pulses: Pulse[] = [];
    let ambientIn = rand(1.6, 3);

    const panelEdge = () => ({ cx: (rect.x0 + rect.x1) / 2, pw: (rect.x1 - rect.x0) / 2 + 40 });

    const loopPulse = (line: number, dir: 1 | -1, speed: number, delay: number): Pulse => ({
      line,
      x: 0,
      dir,
      speed,
      len: 150,
      alpha: 0.95,
      mint: true,
      delay,
      loop: true,
    });
    if (!reduced) {
      pulses.push(loopPulse(MINT_TOP, 1, 230, 1.5));
      pulses.push(loopPulse(N + MINT_BOTTOM, -1, 200, 2.4));
    }
    const placeAtStart = (p: Pulse) => {
      p.x = p.dir === 1 ? inset - p.len * 0.2 : W - inset + p.len * 0.2;
    };
    pulses.forEach(placeAtStart);

    api.current = {
      burst(strength = 1) {
        if (reduced) return;
        const { cx } = panelEdge();
        lines.forEach((l, li) => {
          if (Math.random() > strength) return;
          const delay = (N - 1 - l.k) * 0.035;
          for (const dir of [1, -1] as const)
            pulses.push({ line: li, x: cx, dir, speed: rand(620, 820), len: rand(110, 170), alpha: l.mint ? 1 : 0.75, mint: true, delay });
        });
      },
      ping() {
        if (reduced) return;
        const top = Math.random() < 0.5;
        const li = (top ? 0 : N) + N - 1 - Math.floor(Math.random() * 3);
        const { cx, pw } = panelEdge();
        const dir = Math.random() < 0.5 ? 1 : -1;
        pulses.push({ line: li, x: cx + dir * rand(0, pw * 0.8), dir, speed: rand(420, 520), len: 70, alpha: 0.75, mint: true, delay: 0 });
      },
      release() {
        releasing = true;
        api.current.burst(1);
      },
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ease = (k: number) => (reduced ? 1 : 1 - Math.pow(1 - k, dt * 60));

      // Ease panel rect and mouse.
      const tgt = read();
      const kr = ease(0.16);
      rect = {
        x0: rect.x0 + (tgt.x0 - rect.x0) * kr,
        x1: rect.x1 + (tgt.x1 - rect.x1) * kr,
        y0: rect.y0 + (tgt.y0 - rect.y0) * kr,
        y1: rect.y1 + (tgt.y1 - rect.y1) * kr,
      };
      const km = ease(0.22);
      cur.x += (mouse.x - cur.x) * km;
      cur.y += (mouse.y - cur.y) * km;
      cur.infl += ((mouse.inside && !reduced ? 1 : 0) - cur.infl) * ease(0.08);
      if (releasing) rel = Math.min(1, rel + dt / 0.9);

      // Geometry.
      xa = inset;
      const xb = W - inset;
      step = Math.max(4, (xb - xa) / 320);
      const nextCount = Math.floor((xb - xa) / step) + 1;
      if (nextCount !== count) {
        count = nextCount;
        lines.forEach((l) => (l.ys = new Float32Array(count)));
      }
      const cx = (rect.x0 + rect.x1) / 2;
      const cy = (rect.y0 + rect.y1) / 2;
      const pw = (rect.x1 - rect.x0) / 2 + 40;
      const room = Math.max(60, (Math.min(cx - inset, W - inset - cx) - pw) * 0.98);
      const span = N - 1;
      const topA = inset + 36;
      const topB = Math.max(topA + 8 * span, cy - 24);
      const nTopA = inset + 22;
      const nTopB = Math.max(nTopA + 3 * span, rect.y0 - 28);
      const botA = H - inset - 36;
      const botB = Math.min(botA - 8 * span, cy + 24);
      const nBotA = H - inset - 22;
      const nBotB = Math.min(nBotA - 3 * span, rect.y1 + 28);
      const flat = 1 - easeOut(rel);
      const A = 26 * cur.infl;
      const sig2 = 2 * 80 * 80;

      for (const l of lines) {
        const f = l.k / span;
        const y0 = l.top ? topA + (topB - topA) * f : botA + (botB - botA) * f;
        const near = l.top ? nTopA + (nTopB - nTopA) * f : nBotA + (nBotB - nBotA) * f;
        const d = (near - y0) * flat;
        const L = Math.min(240 + Math.abs(near - y0) * 0.9, room);
        for (let i = 0; i < count; i++) {
          const x = xa + i * step;
          const dx0 = Math.abs(x - cx);
          let g = 1;
          if (dx0 > pw) {
            const t = 1 - (dx0 - pw) / L;
            g = t <= 0 ? 0 : smoother(Math.min(1, t));
          }
          let y = y0 + d * g;
          if (A > 0.05) {
            const dx = x - cur.x;
            if (dx < 240 && dx > -240) {
              const dy = y - cur.y;
              y += A * Math.tanh(dy / 14) * Math.exp(-(dx * dx + dy * dy) / sig2);
            }
          }
          l.ys[i] = y;
        }
      }

      // Draw.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      const t = (now - start) / 1000;
      const halfMax = Math.max(cx - xa, xb - cx) + 4;
      const reveal = (li: number) => {
        if (!REVEAL) return halfMax;
        const delay = (N - 1 - lines[li].k) * 0.05;
        return easeOut(clamp01((t - delay) / (REVEAL / 1000))) * halfMax;
      };
      const glow = cur.infl > 0.02;

      lines.forEach((l, li) => {
        const rh = reveal(li);
        if (rh <= 0) return;
        const color = l.mint ? MINT : WHITE;
        const base = (l.mint ? 0.42 : l.alpha) + 0.12 * rel;
        if (glow) {
          const gr = ctx.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, 240);
          gr.addColorStop(0, `rgba(${color},${Math.min(1, base + (l.mint ? 0.4 : 0.2) * cur.infl)})`);
          gr.addColorStop(1, `rgba(${color},${base})`);
          ctx.strokeStyle = gr;
        } else ctx.strokeStyle = `rgba(${color},${base})`;
        ctx.beginPath();
        let open = false;
        for (let i = 0; i < count; i++) {
          const x = xa + i * step;
          if (Math.abs(x - cx) > rh) {
            open = false;
            continue;
          }
          if (!open) {
            ctx.moveTo(x, l.ys[i]);
            open = true;
          } else ctx.lineTo(x, l.ys[i]);
        }
        ctx.stroke();
      });

      // Pulses.
      if (!reduced) {
        ambientIn -= dt;
        if (ambientIn <= 0 && t > REVEAL / 1000) {
          ambientIn = rand(1.6, 3.2);
          const candidates = lines.map((_, i) => i).filter((i) => !lines[i].mint);
          const li = candidates[Math.floor(Math.random() * candidates.length)];
          const dir = Math.random() < 0.5 ? 1 : -1;
          const p: Pulse = { line: li, x: 0, dir, speed: rand(140, 240), len: 90, alpha: 0.4, mint: false, delay: 0 };
          placeAtStart(p);
          pulses.push(p);
        }
        const SEG = 8;
        for (let pi = pulses.length - 1; pi >= 0; pi--) {
          const p = pulses[pi];
          if (p.delay > 0) {
            p.delay -= dt;
            continue;
          }
          p.x += p.dir * p.speed * dt;
          const gone = p.dir === 1 ? p.x - p.len > xb : p.x + p.len < xa;
          if (gone) {
            if (p.loop) {
              p.delay = rand(0.6, 2.2);
              placeAtStart(p);
            } else pulses.splice(pi, 1);
            continue;
          }
          const rh = reveal(p.line);
          const color = p.mint ? MINT : WHITE;
          ctx.lineWidth = 1.5;
          ctx.lineCap = "round";
          for (let s = 0; s < SEG; s++) {
            const a = p.x - p.dir * p.len * (1 - s / SEG);
            const b = p.x - p.dir * p.len * (1 - (s + 1) / SEG);
            const lo = Math.max(xa, Math.min(a, b));
            const hi = Math.min(xb, Math.max(a, b));
            if (hi <= lo || Math.abs((lo + hi) / 2 - cx) > rh) continue;
            ctx.strokeStyle = `rgba(${color},${(p.alpha * (s + 1)) / SEG})`;
            ctx.beginPath();
            ctx.moveTo(lo, yAt(p.line, lo));
            for (let x = lo + step; x < hi; x += step) ctx.lineTo(x, yAt(p.line, x));
            ctx.lineTo(hi, yAt(p.line, hi));
            ctx.stroke();
          }
          if (p.x >= xa && p.x <= xb && Math.abs(p.x - cx) <= rh) {
            const hy = yAt(p.line, p.x);
            ctx.shadowColor = `rgba(${color},0.9)`;
            ctx.shadowBlur = p.mint ? 10 : 6;
            ctx.fillStyle = `rgba(${color},${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, hy, p.mint ? 2.5 : 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          ctx.lineWidth = 1;
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
    };
  }, [panel, reduced]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
});
