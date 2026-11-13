"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { variantToStyle, type BotAvatarVariant } from "@/components/ui/bot-avatar";
import { BOT_AVATAR_DARK, botAvatarParts, type BotAvatar as BotAvatarLook } from "@/lib/bot-avatar";
import {
  BLINK,
  EASE,
  MOTION_BY_ID,
  REST,
  TAU,
  blinkOpen,
  clamp,
  evaluate,
  frac,
  hash,
  kf,
  wrapAngle,
  type MotionStateId,
  type Pose,
} from "@/lib/bot-motion";

/** Status colors for the extras that mean status: Error/Out of range red, Completed green. */
const RED = "#FF3737";
const SUCCESS = "#2ABB78";
/** Radius of the head sphere the eyes sit on, in face units (the face is 56 wide). */
const SPHERE = 22;
/** Seconds to blend from the last pose into a new state. */
const BLEND = 0.45;

/**
 * Follow-through: every channel follows its keyed value through a damped spring (frequency in
 * Hz, damping ratio). Under 1 the channel overshoots a touch and settles, like real mass.
 * The eyes are fast and nearly critical (they snap); the body is slower and looser (it drags and
 * jiggles); the height is critical so the bot never sinks into the floor.
 */
const SPRINGS = {
  x: { f: 5.5, z: 0.7 },
  y: { f: 12, z: 1 },
  rot: { f: 4.5, z: 0.5 },
  tilt: { f: 5, z: 0.55 },
  sx: { f: 7.5, z: 0.38 },
  sy: { f: 7.5, z: 0.38 },
  yaw: { f: 6, z: 0.72 },
  gx: { f: 16, z: 0.9 },
  gy: { f: 16, z: 0.9 },
  eye: { f: 10, z: 0.5 },
} as const;
type SpringKey = keyof typeof SPRINGS;
const SPRING_KEYS = Object.keys(SPRINGS) as SpringKey[];
type Springs = Record<SpringKey, { x: number; v: number }>;

function stepSprings(s: Springs, target: Record<SpringKey, number>, dt: number) {
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  for (const k of SPRING_KEYS) {
    const w = TAU * SPRINGS[k].f;
    const stiff = w * w;
    const damp = 2 * SPRINGS[k].z * w;
    const st = s[k];
    const goal = target[k];
    for (let i = 0; i < steps; i++) {
      st.v += (stiff * (goal - st.x) - damp * st.v) * h;
      st.x += st.v * h;
    }
  }
}

// ── One shared animation clock for every avatar on the page ────────────────────
type Tick = (dt: number) => void;
const ticks = new Set<Tick>();
let frame = 0;
let lastNow = 0;
function run(now: number) {
  const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0;
  lastNow = now;
  ticks.forEach((tick) => tick(dt));
  if (ticks.size) frame = requestAnimationFrame(run);
  else {
    frame = 0;
    lastNow = 0;
  }
}
function onFrame(tick: Tick) {
  ticks.add(tick);
  if (!frame) frame = requestAnimationFrame(run);
  return () => {
    ticks.delete(tick);
  };
}

// ── Pointer, shared ────────────────────────────────────────────────────────────
const pointer = { x: 0, y: 0, at: -1e9 };
let pointerBound = false;
function bindPointer() {
  if (pointerBound) return;
  pointerBound = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.at = performance.now();
    },
    { passive: true },
  );
}

const n = (v: number) => Math.round(v * 100) / 100;
const PROGRESS = new Set<keyof Pose>(["burst", "check", "ring", "sendDir", "arrowDir"]);

function mix(a: Pose, b: Pose, k: number): Pose {
  const out = { ...b };
  for (const key of Object.keys(b) as (keyof Pose)[]) {
    if (!PROGRESS.has(key)) out[key] = a[key] + (b[key] - a[key]) * k;
  }
  return out;
}

type Geometry = {
  cx: number;
  cy: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  eyes: { x: number; y: number }[];
};

type Runtime = {
  state: MotionStateId;
  key: number;
  t: number;
  blendT: number;
  from: { pose: Pose; yaw: number } | null;
  last: { pose: Pose; yaw: number };
  blinkAt: number;
  blinkStart: number;
  blinkSeq: number;
  look: { x: number; y: number };
  lookActive: boolean;
  drawn: boolean;
  /** Continuous head yaw target (spins keep counting), and the springs that follow the targets. */
  yawT: number;
  springs: Springs | null;
};

type Config = {
  state: MotionStateId;
  playKey: number;
  intensity: number;
  speed: number;
  paused: boolean;
  followPointer: boolean;
  loop: boolean;
  seed: number;
};

/**
 * A bot face with a full motion rig: the head turns on a sphere (the far eye narrows and hides),
 * spins, hops, leans, squashes and stretches, blinks, and shows extras (thinking dots, z's, !,
 * notification dot, check, burst, radar ring, orbit, order squares, range arrow).
 * Driven by `state` (see lib/bot-motion.ts). Changing `state` blends from the current pose;
 * bumping `playKey` replays it from the start.
 */
export function MotionAvatar({
  avatar,
  variant = "tech",
  state,
  size = 160,
  intensity = 1,
  speed = 1,
  paused = false,
  followPointer = false,
  loop = true,
  seed = 0,
  playKey = 0,
  className,
  label,
}: {
  avatar: BotAvatarLook;
  variant?: BotAvatarVariant;
  state: MotionStateId;
  size?: number;
  intensity?: number;
  speed?: number;
  paused?: boolean;
  /** Idle bots look at the pointer when it moves. "Looks at you" always does. */
  followPointer?: boolean;
  /** One-shot states replay after their rest time. */
  loop?: boolean;
  seed?: number;
  playKey?: number;
  className?: string;
  label?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cfg = useRef<Config>({ state, playKey, intensity, speed, paused, followPointer, loop, seed });
  const rtRef = useRef<Runtime | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `bot-clip-${uid}`;

  const { style, face } = variantToStyle(variant);
  const parts = useMemo(() => botAvatarParts(avatar, style, face), [avatar, style, face]);

  useEffect(() => {
    cfg.current = { state, playKey, intensity, speed, paused, followPointer, loop, seed };
  }, [state, playKey, intensity, speed, paused, followPointer, loop, seed]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    bindPointer();
    const q = <T extends Element>(p: string) => svg.querySelector<T>(`[data-p="${p}"]`);
    const qa = <T extends Element>(p: string) => Array.from(svg.querySelectorAll<T>(`[data-p="${p}"]`));

    const body = q<SVGPathElement>("body")!;
    const eyeEls = [q<SVGGElement>("eye-l")!, q<SVGGElement>("eye-r")!];
    const bb = body.getBBox();
    const [cx, cy] = parts.center;
    const geo: Geometry = {
      cx,
      cy,
      top: bb.y,
      bottom: bb.y + bb.height,
      left: bb.x,
      right: bb.x + bb.width,
      eyes: eyeEls.map((el) => {
        const b = (el.firstElementChild as SVGPathElement).getBBox();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      }),
    };
    const el = {
      shadow: q<SVGEllipseElement>("shadow")!,
      rig: q<SVGGElement>("rig")!,
      tilt: q<SVGGElement>("tilt")!,
      shade: q<SVGPathElement>("shade")!,
      lit: q<SVGPathElement>("lit")!,
      back: q<SVGPathElement>("back")!,
      visor: q<SVGPathElement>("visor"),
      eyes: eyeEls,
      extras: qa<SVGGElement>("extras"),
      dots: qa<SVGRectElement>("dot"),
      zs: qa<SVGPathElement>("z"),
      alert: q<SVGGElement>("alert")!,
      notify: q<SVGGElement>("notify")!,
      notifyRing: q<SVGCircleElement>("notify-ring")!,
      check: q<SVGPathElement>("check")!,
      burst: qa<SVGRectElement>("burst"),
      ring: q<SVGCircleElement>("ring")!,
      orbitBack: qa<SVGRectElement>("orbit-back"),
      orbitFront: qa<SVGRectElement>("orbit-front"),
      send: qa<SVGRectElement>("send"),
      arrow: q<SVGGElement>("arrow")!,
      arrowParts: qa<SVGPathElement>("arrow-part"),
    };

    const blinkGap = (rt: Runtime, range: readonly [number, number]) => {
      const r = hash(cfg.current.seed + 91, rt.blinkSeq++);
      if (r < 0.18) return 0.42; // a double blink now and then
      return range[0] + (range[1] - range[0]) * hash(cfg.current.seed + 17, rt.blinkSeq++);
    };

    const reset = (rt: Runtime, c: Config, blend: boolean) => {
      const def = MOTION_BY_ID[c.state];
      const cut = def.enter === "cut";
      rt.from = blend && !c.paused && !cut ? rt.last : null;
      if (cut) rt.springs = null;
      rt.blendT = 0;
      rt.t = c.paused ? def.still : 0;
      rt.state = c.state;
      rt.key = c.playKey;
      rt.blinkStart = -10;
      rt.blinkAt = rt.t + (def.blink ? def.blink[0] * (0.4 + 0.6 * hash(c.seed, rt.blinkSeq++)) : 1e9);
      rt.drawn = false;
    };

    const fresh = !rtRef.current;
    if (!rtRef.current) {
      const c = cfg.current;
      const rt: Runtime = {
        state: c.state,
        key: c.playKey,
        t: 0,
        blendT: 0,
        from: null,
        last: { pose: { ...REST }, yaw: 0 },
        blinkAt: 0,
        blinkStart: -10,
        blinkSeq: 0,
        look: { x: 0, y: 0 },
        lookActive: false,
        drawn: false,
        yawT: 0,
        springs: null,
      };
      reset(rt, c, false);
      // Start loops at a different moment per bot so a grid never moves in sync.
      if (MOTION_BY_ID[c.state].kind === "loop" && !c.paused) rt.t = hash(c.seed, 5) * 6;
      rtRef.current = rt;
    } else {
      rtRef.current.drawn = false;
    }
    const rt = rtRef.current;

    const draw = (p: Pose, yawRaw: number, t: number) => {
      const { cx: fx, cy: fy, top, bottom, left, right } = geo;
      const yaw = wrapAngle(yawRaw);
      const sinY = Math.sin(yaw);
      const cosY = Math.cos(yaw);
      const sq = 1 - 0.06 * Math.abs(sinY);

      el.rig.setAttribute(
        "transform",
        `translate(${n(p.x)} ${n(p.y)}) translate(28 ${n(bottom)}) rotate(${n(p.rot)}) scale(${n(p.sx * sq)} ${n(p.sy)}) translate(-28 ${n(-bottom)})`,
      );
      el.rig.setAttribute("opacity", `${n(clamp(p.alpha, 0, 1))}`);
      el.tilt.setAttribute("transform", `rotate(${n(p.tilt)} ${fx} ${fy})`);

      // Side of the head: a dark crescent on the side the face turns away from.
      el.shade.setAttribute("opacity", `${n(0.36 * Math.abs(sinY))}`);
      el.lit.setAttribute("transform", `translate(${n(sinY * 9)} 0)`);
      el.back.setAttribute("opacity", `${n(0.32 * Math.max(0, -cosY))}`);

      // Eyes on the head sphere: longitude = eye offset, the turn rotates the sphere.
      geo.eyes.forEach((e, i) => {
        const lam = Math.asin(clamp((e.x - fx) / SPHERE, -0.97, 0.97));
        const phi = lam + yaw;
        const depth = Math.cos(phi);
        const px = fx + SPHERE * Math.sin(phi);
        const wf = Math.max(0, depth) / Math.cos(lam);
        const open = clamp(i === 0 ? p.openL : p.openR, 0, 1);
        const sy = parts.closedScale + (1 - parts.closedScale) * open;
        const k = p.eye;
        const ox = p.gx * 2.8 * Math.max(0.3, depth);
        const oy = p.gy * 2.4;
        el.eyes[i].setAttribute(
          "transform",
          `translate(${n(px + ox)} ${n(e.y + oy)}) scale(${n(Math.max(0.001, wf * k))} ${n(sy * k)}) translate(${n(-e.x)} ${n(-e.y)})`,
        );
        el.eyes[i].setAttribute("opacity", `${n(clamp(depth * 8, 0, 1))}`);
      });

      if (el.visor) {
        const lv = Math.asin(16 / SPHERE);
        const xl = Math.sin(clamp(-lv + yaw, -Math.PI / 2, Math.PI / 2));
        const xr = Math.sin(clamp(lv + yaw, -Math.PI / 2, Math.PI / 2));
        const w = (SPHERE * (xr - xl)) / 32;
        const mid = fx + (SPHERE * (xl + xr)) / 2;
        const behind = Math.abs(yaw) > Math.PI / 2 + lv;
        el.visor.setAttribute(
          "transform",
          `translate(${n(mid)} ${fy}) scale(${n(Math.max(0.001, w))} 1) translate(${-fx} ${-fy})`,
        );
        el.visor.setAttribute("opacity", behind ? "0" : `${n(clamp(w * 6, 0, 1))}`);
      }

      // Ground: a soft floor spot that shrinks while the bot is in the air.
      const lift = clamp(1 + p.y / 50, 0.35, 1.15);
      el.shadow.setAttribute("cx", `${n(28 + p.x)}`);
      el.shadow.setAttribute("cy", `${n(bottom + 3)}`);
      el.shadow.setAttribute("rx", `${n(17 * p.sx * lift)}`);
      el.shadow.setAttribute("opacity", `${n(0.1 * clamp(p.alpha, 0, 1) * lift)}`);

      for (const g of el.extras) g.setAttribute("transform", `translate(${n(p.x)} ${n(p.y)})`);

      // Thinking dots: each rises quickly (ease out) and drops back slower (ease in), in a cascade.
      el.dots.forEach((d, j) => {
        const ph = frac(t / 1.15 - j * 0.13);
        const rise = kf(ph, [[0, 0], [0.2, 1, EASE.out], [0.52, 0, EASE.in]]);
        d.setAttribute("x", `${n(fx - 1.8 + (j - 1) * 7)}`);
        d.setAttribute("y", `${n(top - 9 - 3 * rise)}`);
        d.setAttribute("opacity", `${n(p.dots * (0.3 + 0.7 * rise))}`);
      });

      // Sleeping z's: drift up and away decelerating, fade in fast and out slow, sway a little.
      el.zs.forEach((z, j) => {
        const ph = frac(t / 2.8 + j / 3);
        const rise = EASE.out(ph);
        const s = 0.7 + 0.9 * rise;
        const fade = kf(ph, [[0, 0], [0.14, 1, EASE.out], [0.5, 1], [1, 0, EASE.in]]);
        z.setAttribute(
          "transform",
          `translate(${n(fx + 12 + rise * 13 + Math.sin(ph * TAU) * 1.4)} ${n(top + 5 - rise * 22)}) rotate(${n(-12 + 22 * rise)}) scale(${n(s)})`,
        );
        z.setAttribute("opacity", `${n(p.zzz * fade)}`);
      });

      // Error mark: pops in with the state, then a heartbeat pulse (quick swell, slow release).
      const ab = frac(t / 1.4);
      const beat = kf(ab, [[0, 0], [0.12, 1, EASE.out], [0.55, 0, EASE.inOut]]);
      const alertScale = (0.55 + 0.45 * EASE.out(p.alert)) * (1 + 0.16 * beat);
      el.alert.setAttribute("transform", `translate(${fx} ${n(top - 5 - 1.2 * beat)}) scale(${n(alertScale)})`);
      el.alert.setAttribute("opacity", `${n(p.alert * (0.72 + 0.28 * beat))}`);

      // Notification dot: pops in, a ring ripples out (expo out) and fades (ease in).
      const np = frac(t / 1.4);
      el.notify.setAttribute(
        "transform",
        `translate(${n(right - 3)} ${n(top + 3)}) scale(${n((0.5 + 0.5 * EASE.out(p.notify)) * (1 + 0.1 * kf(np, [[0, 0], [0.1, 1, EASE.out], [0.4, 0, EASE.inOut]])))})`,
      );
      el.notify.setAttribute("opacity", `${n(p.notify)}`);
      el.notifyRing.setAttribute("r", `${n(4 + 8 * EASE.snap(np))}`);
      el.notifyRing.setAttribute("opacity", `${n(0.7 * (1 - EASE.out(np)))}`);

      // Check: draws with an ease out (from the pose), pops when complete.
      el.check.setAttribute("stroke-dashoffset", `${n(1 - clamp(p.check, 0, 1))}`);
      el.check.setAttribute("opacity", `${n(clamp(p.checkA, 0, 1))}`);
      el.check.setAttribute("transform", `translate(${fx} ${n(top - 9)}) scale(${n(1 + 0.22 * p.checkPop)})`);

      // Burst: squares fly out fast and brake (expo out), staggered, spin and shrink as they go,
      // with a little gravity.
      const bp = p.burst;
      el.burst.forEach((b, j) => {
        const delay = ((j * 5) % 8) / 8 * 0.14;
        const q = clamp((bp - delay) / (1 - 0.14), 0, 1);
        const a = (j * TAU) / 8 + 0.39;
        const r = 18 + 28 * EASE.snap(q);
        const s = 4.6 * (1 - EASE.in(q));
        const x = fx + Math.cos(a) * r;
        const y = fy + Math.sin(a) * r * 0.9 + 6 * q * q;
        b.setAttribute("x", `${n(-s / 2)}`);
        b.setAttribute("y", `${n(-s / 2)}`);
        b.setAttribute("width", `${n(Math.max(0, s))}`);
        b.setAttribute("height", `${n(Math.max(0, s))}`);
        b.setAttribute("transform", `translate(${n(x)} ${n(y)}) rotate(${n((j % 2 ? 1 : -1) * 120 * EASE.out(q))})`);
        b.setAttribute("opacity", bp > 0 && bp < 1 && q > 0 ? `${n(1 - EASE.in(q))}` : "0");
      });

      // Radar ring: expands fast and brakes, thins and fades.
      const rp = p.ring;
      el.ring.setAttribute("r", `${n(25 + 22 * EASE.snap(rp))}`);
      el.ring.setAttribute("stroke-width", `${n(0.3 + 1.5 * (1 - EASE.out(rp)))}`);
      el.ring.setAttribute("opacity", rp > 0 && rp < 1 ? `${n(0.55 * (1 - EASE.out(rp)))}` : "0");

      // Orbit: constant angular speed (that is how orbits move), behind the head on the far half.
      const tiltO = (-12 * Math.PI) / 180;
      for (let j = 0; j < 2; j++) {
        const a = (t * TAU) / 1.9 + j * Math.PI;
        const ox = Math.cos(a) * 34;
        const oy = Math.sin(a) * 8;
        const x = fx + ox * Math.cos(tiltO) - oy * Math.sin(tiltO);
        const y = fy + 6 + ox * Math.sin(tiltO) + oy * Math.cos(tiltO);
        const depth = Math.sin(a);
        const s = 3.6 * (1 + 0.22 * depth);
        for (const [rect, on] of [
          [el.orbitFront[j], depth > 0],
          [el.orbitBack[j], depth <= 0],
        ] as const) {
          rect.setAttribute("x", `${n(x - s / 2)}`);
          rect.setAttribute("y", `${n(y - s / 2)}`);
          rect.setAttribute("width", `${n(s)}`);
          rect.setAttribute("height", `${n(s)}`);
          rect.setAttribute("opacity", on ? `${n(p.orbit * (depth > 0 ? 1 : 0.5))}` : "0");
        }
      }

      // Orders going out: squares shoot off the working side and brake, fade as they slow.
      const dir = p.sendDir < 0 ? -1 : 1;
      el.send.forEach((s, j) => {
        const ph = frac(t * 1.7 + j / 3);
        const go = EASE.snap(ph);
        const size = 3.2 * (1 - 0.45 * EASE.in(ph));
        const x = (dir > 0 ? right : left) + dir * (2 + go * 22);
        const y = fy + 2 + (j - 1) * 5 - go * 2 * (j - 1);
        s.setAttribute("x", `${n(x - size / 2)}`);
        s.setAttribute("y", `${n(y - size / 2)}`);
        s.setAttribute("width", `${n(size)}`);
        s.setAttribute("height", `${n(size)}`);
        s.setAttribute("opacity", `${n(p.send * kf(ph, [[0, 0], [0.08, 1, EASE.out], [0.35, 1], [1, 0, EASE.in]]))}`);
      });

      // Range arrow: two chevrons flowing toward the price, each fading in and out so the loop
      // never jumps back.
      const ad = p.arrowDir < 0 ? -1 : 1;
      el.arrow.setAttribute("transform", `translate(${n(right + 12)} ${n(fy)}) scale(1 ${-ad})`);
      el.arrow.setAttribute("opacity", `${n(p.arrow)}`);
      el.arrowParts.forEach((a, j) => {
        const ph = frac(t / 1.3 + j * 0.5);
        a.setAttribute("transform", `translate(0 ${n(6 - 12 * EASE.inOut(ph))})`);
        a.setAttribute("opacity", `${n(kf(ph, [[0, 0], [0.3, 1, EASE.out], [0.6, 1], [1, 0, EASE.in]]))}`);
      });
    };

    const tick: Tick = (dt) => {
      const c = cfg.current;
      if (c.state !== rt.state || c.playKey !== rt.key) reset(rt, c, true);
      const def = MOTION_BY_ID[rt.state];

      // Pointer direction, relative to this avatar, smoothed.
      const wantsPointer = def.pointer || (c.followPointer && def.id === "idle");
      const active = wantsPointer && performance.now() - pointer.at < 2500;
      if (active) {
        const r = svg.getBoundingClientRect();
        const span = Math.max(220, r.width * 1.2);
        const tx = clamp((pointer.x - (r.left + r.width / 2)) / span);
        const ty = clamp((pointer.y - (r.top + r.height * 0.45)) / span);
        const k = 1 - Math.exp(-dt * 10);
        rt.look.x += (tx - rt.look.x) * k;
        rt.look.y += (ty - rt.look.y) * k;
      }
      let changed = !rt.drawn;
      if (active !== rt.lookActive) {
        if (!active) rt.look = { x: 0, y: 0 };
        rt.lookActive = active;
        if (!c.paused) {
          rt.from = rt.last;
          rt.blendT = 0;
        }
        changed = true;
      }

      const step = c.paused ? 0 : dt * c.speed;
      if (c.paused) {
        if (!changed) return;
      } else {
        rt.t += step;
        rt.blendT += step;
        if (def.kind === "once" && c.loop) {
          const period = (def.duration ?? 1) + (def.rest ?? 1);
          if (rt.t >= period) {
            rt.t -= period;
            rt.blinkAt -= period;
            rt.blinkStart -= period;
            if (def.enter === "cut") {
              rt.from = null;
              rt.springs = null;
            } else {
              rt.from = rt.last;
            }
            rt.blendT = 0;
          }
        }
        if (def.blink && rt.t >= rt.blinkAt) {
          rt.blinkStart = rt.blinkAt;
          rt.blinkAt = rt.blinkAt + blinkGap(rt, def.blink);
          if (rt.blinkAt < rt.t) rt.blinkAt = rt.t + def.blink[0];
        }
      }

      // 1. Keyed pose for this moment, blended out of the previous state.
      const ctx = { seed: c.seed, look: rt.lookActive ? rt.look : null, loop: c.loop };
      const out = evaluate(def, rt.t, ctx, c.intensity);
      let target = out.pose;
      let yaw = out.yaw;
      if (rt.from && rt.blendT < BLEND) {
        const k = EASE.inOut(rt.blendT / BLEND);
        target = mix(rt.from.pose, target, k);
        yaw = rt.from.yaw + wrapAngle(yaw - rt.from.yaw) * k;
      } else rt.from = null;
      rt.last = { pose: target, yaw: wrapAngle(yaw) };

      // Spins keep counting: follow the yaw target the short way, frame to frame.
      const prevYawT = rt.yawT;
      rt.yawT = rt.springs ? rt.yawT + wrapAngle(yaw - rt.yawT) : yaw;
      const yawSpeed = step > 0 ? Math.abs(rt.yawT - prevYawT) / step : 0;

      // A big, fast head turn gets a blink, the way animators hide a big eye move.
      if (def.blink && !c.paused && yawSpeed > 3.6 && rt.t - rt.blinkStart > 1.5) {
        rt.blinkStart = rt.t;
        if (rt.blinkAt - rt.t < 0.8) rt.blinkAt = rt.t + def.blink[0] * 0.6;
      }

      // 2. Follow-through: springs carry every channel toward its keyed value.
      const goal = {
        x: target.x, y: target.y, rot: target.rot, tilt: target.tilt, sx: target.sx, sy: target.sy,
        yaw: rt.yawT, gx: target.gx, gy: target.gy, eye: target.eye,
      };
      if (!rt.springs || c.paused) {
        rt.springs = Object.fromEntries(SPRING_KEYS.map((k) => [k, { x: goal[k], v: 0 }])) as Springs;
      } else stepSprings(rt.springs, goal, step);
      const sp = rt.springs;
      const pose: Pose = { ...target };
      for (const k of SPRING_KEYS) if (k !== "yaw") pose[k] = sp[k].x;

      // 3. Secondary motion from speed, so every move gets it for free.
      const k2 = c.intensity;
      // Drag: the body leans against its own sideways movement.
      pose.rot += clamp(-sp.x.v * 0.2, -5, 5) * k2;
      // Arcs: a head turn dips a little and leans into the turn.
      pose.tilt += clamp(sp.yaw.v * 1.3, -5, 5) * k2;
      pose.y += clamp(Math.abs(sp.yaw.v) * 0.3, 0, 1.4) * k2;
      // Speed stretches along the movement (area kept).
      const stretch = clamp(Math.abs(sp.y.v) * 0.0014, 0, 0.1) * k2;
      pose.sy *= 1 + stretch;
      pose.sx /= 1 + stretch;

      // Blink: crisp lids, and the head dips a hair while the eyes are shut.
      if (def.blink && !c.paused) {
        const b = blinkOpen((rt.t - rt.blinkStart) / BLINK);
        pose.openL *= b;
        pose.openR *= b;
        pose.y += 0.35 * (1 - b);
        pose.sy *= 1 - 0.012 * (1 - b);
      }

      draw(pose, sp.yaw.x, rt.t);
      rt.drawn = true;
    };

    // Only animate while on screen.
    let stop: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !stop) stop = onFrame(tick);
        else if (!entry.isIntersecting && stop) {
          stop();
          stop = null;
        }
      },
      { rootMargin: "80px" },
    );
    io.observe(svg);
    if (fresh) {
      // First frame: the state's still pose (what shows off screen or with motion reduced);
      // the animation then blends out of it.
      const c = cfg.current;
      const def = MOTION_BY_ID[rt.state];
      const still = evaluate(def, def.still, { seed: c.seed, look: null }, c.intensity);
      rt.last = { pose: still.pose, yaw: wrapAngle(still.yaw) };
      rt.yawT = rt.last.yaw;
      draw(still.pose, still.yaw, def.still);
      rt.drawn = true;
      if (!c.paused) {
        rt.from = rt.last;
        rt.blendT = 0;
      }
    } else tick(0);
    return () => {
      io.disconnect();
      stop?.();
    };
  }, [parts]);

  const dark = BOT_AVATAR_DARK;
  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="-22 -28 100 100"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={parts.body} />
        </clipPath>
      </defs>
      <ellipse data-p="shadow" cx={28} cy={57} rx={17} ry={2.6} fill="#FFFFFF" opacity={0.1} />
      <g data-p="extras">
        {[0, 1].map((j) => (
          <rect key={j} data-p="orbit-back" width={3.6} height={3.6} fill="#FFFFFF" opacity={0} />
        ))}
        <circle data-p="ring" cx={parts.center[0]} cy={parts.center[1]} r={25} fill="none" stroke="#FFFFFF" opacity={0} />
      </g>
      <g data-p="rig">
        <g data-p="tilt">
          <path data-p="body" d={parts.body} fill={parts.color} />
          <g clipPath={`url(#${clipId})`}>
            <path data-p="shade" d={parts.body} fill={dark} opacity={0} />
            <path data-p="lit" d={parts.body} fill={parts.color} />
            <path data-p="back" d={parts.body} fill={dark} opacity={0} />
            {parts.visor && <path data-p="visor" d={parts.visor} fill={dark} />}
            <g data-p="eye-l" fill={parts.eyeColor}>
              <path d={parts.eyes[0]} />
            </g>
            <g data-p="eye-r" fill={parts.eyeColor}>
              <path d={parts.eyes[1]} />
            </g>
          </g>
        </g>
      </g>
      <g data-p="extras">
        {[0, 1].map((j) => (
          <rect key={j} data-p="orbit-front" width={3.6} height={3.6} fill="#FFFFFF" opacity={0} />
        ))}
        {[0, 1, 2].map((j) => (
          <rect key={j} data-p="dot" width={3.6} height={3.6} fill="#FFFFFF" opacity={0} />
        ))}
        {[0, 1, 2].map((j) => (
          <path
            key={j}
            data-p="z"
            d="M-2 -2h4l-4 4h4"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.2}
            strokeLinecap="square"
            strokeLinejoin="miter"
            opacity={0}
          />
        ))}
        <g data-p="alert" fill={RED} opacity={0}>
          <rect x={-1.7} y={-13} width={3.4} height={8} />
          <rect x={-1.7} y={-3.4} width={3.4} height={3.4} />
        </g>
        <g data-p="notify" opacity={0}>
          <circle data-p="notify-ring" r={4} fill="none" stroke="#FFFFFF" strokeWidth={1.2} />
          <circle r={4} fill="#FFFFFF" stroke={dark} strokeWidth={1.8} paintOrder="stroke" />
        </g>
        <path
          data-p="check"
          d="M-8 -2l5.5 5.5l10.5 -10.5"
          fill="none"
          stroke={SUCCESS}
          strokeWidth={3.2}
          strokeLinecap="square"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1}
          opacity={0}
        />
        {Array.from({ length: 8 }, (_, j) => (
          <rect key={j} data-p="burst" width={4} height={4} fill={parts.color} opacity={0} />
        ))}
        {[0, 1, 2].map((j) => (
          <rect key={j} data-p="send" width={3.2} height={3.2} fill={parts.color} opacity={0} />
        ))}
        <g data-p="arrow" opacity={0} fill="none" stroke={RED} strokeWidth={2.2} strokeLinecap="square">
          <path data-p="arrow-part" d="M-5 2.5L0 -2.5L5 2.5" opacity={0} />
          <path data-p="arrow-part" d="M-5 2.5L0 -2.5L5 2.5" opacity={0} />
        </g>
      </g>
    </svg>
  );
}
