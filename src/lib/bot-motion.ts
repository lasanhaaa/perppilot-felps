/**
 * Bot motion: one animation per moment, for the bot faces in lib/bot-avatar.ts.
 *
 * Reference: Grok Bot's face rig (x.ai). The face is not a flat sticker: the eyes sit on a head
 * sphere, so the head can turn to the side (the far eye narrows and hides), spin a full turn,
 * hop, lean, squash and stretch. Every state below is a pure function of time, so the same
 * state looks the same on every screen. Docs: docs/bot-motion.md and the page /bot-motion.
 *
 * Craft, so it reads like an animator's work and not like a formula:
 * - Every move has its own curve (cubic-bezier, the same curves as After Effects or CSS): moves
 *   into a pose ease out, wind-ups and falls ease in, holds are moving holds (breathing goes on).
 * - Anticipation before every big move: a crouch before a jump, a counter-turn before a spin.
 * - Overlapping action: the eyes get there first, the head follows, the tilt follows the head.
 * - Hops are ballistic (a parabola: slows to the top, speeds up on the way down), never a sine.
 * - Squash and stretch keep the area (sx × sy = 1). Contact squashes, speed stretches.
 * - The renderer (components/bot-motion/motion-avatar.tsx) adds follow-through: every channel goes
 *   through a damped spring, so stops overshoot a touch and settle, and squash recovers with a
 *   small jiggle. It also adds arcs (a head turn dips and leans into the turn), drag (the body
 *   leans against its own movement) and a blink on big head turns.
 */

export const TAU = Math.PI * 2;

export const clamp = (v: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const frac = (x: number) => x - Math.floor(x);

export type Curve = (x: number) => number;

/** CSS / After Effects style cubic-bezier(x1, y1, x2, y2) easing. Clamped to 0..1 outside. */
export function bezier(x1: number, y1: number, x2: number, y2: number): Curve {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

/** The curves. Named after what they are for, not after the math. */
export const EASE = {
  linear: ((x) => clamp(x, 0, 1)) as Curve,
  /** Default move between two poses: slow out of the first, slow into the second. */
  inOut: bezier(0.65, 0, 0.35, 1),
  /** Gentle in-out for sways and breathing. */
  soft: bezier(0.37, 0, 0.63, 1),
  /** Arrive: fast start, long settle (quint out). */
  out: bezier(0.22, 1, 0.36, 1),
  /** Leave or fall: slow start, fast end. */
  in: bezier(0.55, 0, 0.9, 0.4),
  /** Saccade or pop: almost instant, then a soft stop (expo out). */
  snap: bezier(0.16, 1, 0.3, 1),
  /** Spin: a long wind-up and a long brake. */
  spin: bezier(0.7, 0, 0.2, 1),
};

/** Keyframes: [time, value, curve into this key]. Held before the first and after the last. */
export type Key = readonly [number, number] | readonly [number, number, Curve];
export function kf(t: number, keys: readonly Key[]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t <= k[0]) {
      const p = keys[i - 1];
      const curve = k[2] ?? EASE.inOut;
      return lerp(p[1], k[1], curve((t - p[0]) / (k[0] - p[0])));
    }
  }
  return keys[keys.length - 1][1];
}

/** Stable 0..1 noise for (seed, n). */
export function hash(seed: number, n: number): number {
  let h = Math.imul((seed ^ 0x9e3779b9) >>> 0, 0x85ebca6b) ^ Math.imul((n + 0x632be5ab) >>> 0, 0xc2b2ae35);
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2f);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Everything the rig can do. Units: x/y in avatar units (the face is 56 wide), rot/tilt in
 * degrees, turn in quarter turns (1 = head turned 90°), spin in full turns, gaze −1..1.
 */
export type Pose = {
  /** Whole bot: move, lean (pivot at the feet). */
  x: number;
  y: number;
  rot: number;
  /** Free scale (used to grow out of the ground) and squash (+) / stretch (−) that keeps the area. */
  sx: number;
  sy: number;
  sq: number;
  /** Head tilt around the face center. */
  tilt: number;
  /** Head turn to the side (1 = 90°, the far eye disappears) and full spins. */
  turn: number;
  spin: number;
  /** Where the eyes look, inside the face. */
  gx: number;
  gy: number;
  /** Eye opening per eye (0 closed, 1 open) and eye size. */
  openL: number;
  openR: number;
  eye: number;
  alpha: number;
  /** Extras around the head. Visibility 0..1 unless noted. */
  dots: number;
  zzz: number;
  alert: number;
  notify: number;
  /** Progress 0..1 (0 = hidden). */
  burst: number;
  check: number;
  checkA: number;
  checkPop: number;
  ring: number;
  orbit: number;
  send: number;
  /** −1 sends to the left, 1 to the right. */
  sendDir: number;
  arrow: number;
  /** −1 = price above the range (arrow up), 1 = below (arrow down). */
  arrowDir: number;
};

export const REST: Pose = {
  x: 0, y: 0, rot: 0, sx: 1, sy: 1, sq: 0, tilt: 0, turn: 0, spin: 0, gx: 0, gy: 0,
  openL: 1, openR: 1, eye: 1, alpha: 1,
  dots: 0, zzz: 0, alert: 0, notify: 0, burst: 0, check: 0, checkA: 0, checkPop: 0, ring: 0, orbit: 0,
  send: 0, sendDir: 1, arrow: 0, arrowDir: -1,
};

/** Fields scaled by the intensity control (deviation from rest). Extras keep their size. */
export const MOTION_FIELDS = ["x", "y", "rot", "sq", "tilt", "turn", "gx", "gy"] as const;

export type MotionContext = {
  /** Per-bot noise, so two bots in the same state never move in sync. */
  seed: number;
  /** Smoothed direction to the pointer (−1..1), or null when there is none. */
  look: { x: number; y: number } | null;
  /** One-shots replay (gallery); they may then animate their own exit. */
  loop?: boolean;
};

export type MotionGroup = "Lifecycle" | "Working" | "Attention";

export type MotionStateId =
  | "spawning" | "waking" | "idle" | "stopping" | "sleeping"
  | "connecting" | "thinking" | "scanning" | "working" | "filled" | "done"
  | "looking" | "waiting" | "outOfRange" | "alert";

export type MotionState = {
  id: MotionStateId;
  name: string;
  group: MotionGroup;
  /** When the product plays it. */
  when: string;
  /** What the bot does. */
  motion: string;
  /** Where it may play. */
  where: string;
  kind: "loop" | "once";
  /** One-shots: length of the move, then how long it rests before replaying in the gallery. */
  duration?: number;
  rest?: number;
  /** Random blink interval in seconds, or null when the eyes are driven by the state. */
  blink: readonly [number, number] | null;
  /** Uses the pointer direction. */
  pointer?: boolean;
  /** "cut": starts from its own first frame instead of blending out of the previous state. */
  enter?: "cut";
  /** Time shown when motion is paused (reduced motion). */
  still: number;
  pose: (t: number, ctx: MotionContext) => Partial<Pose>;
};

// ── Building blocks ─────────────────────────────────────────────────────────────

/** Breathing: inhale (40%) a little quicker than exhale, as a stretch up. Never stops. */
function breathe(t: number, period = 3.4, amp = 1) {
  const b = kf(frac(t / period), [[0, 0], [0.4, 1, EASE.soft], [1, 0, EASE.soft]]);
  return { y: -0.35 * amp * b, sq: -0.016 * amp * b };
}

/** Sleeping breath: slower and deeper; the lean follows the breath a beat later (overlap). */
function sleepPose(t: number): Partial<Pose> {
  const curve: Key[] = [[0, 0], [0.45, 1, EASE.soft], [1, 0, EASE.soft]];
  const b = kf(frac(t / 4.2), curve);
  const lag = kf(frac((t - 0.4) / 4.2), curve);
  return {
    openL: 0,
    openR: 0,
    gy: 0.45,
    y: 3 - 0.55 * b,
    sq: 0.06 - 0.022 * b,
    rot: -3 + 0.9 * lag,
    tilt: -2 + 0.6 * lag,
    alpha: 0.62,
    eye: 0.95,
  };
}

/**
 * A chain of hops, each [start, air time, height]. The first one crouches first (anticipation);
 * each landing squashes on contact (harder after a higher fall) and that squash is the crouch
 * for the next hop; the last landing recovers. Air time is a parabola, so the bot hangs at the
 * top and falls faster, like a real jump.
 */
function hops(t: number, steps: readonly (readonly [number, number, number])[], crouch: number) {
  for (let k = 0; k < steps.length; k++) {
    const [s, air, height] = steps[k];
    const next = k + 1 < steps.length ? steps[k + 1][0] : Infinity;
    const pre = k === 0 ? 0.14 : 0;
    if (t < s - pre) return { y: 0, sq: 0 };
    if (t < s) return { y: 0, sq: crouch * EASE.inOut((t - (s - pre)) / pre) };
    if (t < s + air) {
      const p = (t - s) / air;
      return { y: -height * 4 * p * (1 - p), sq: 0 };
    }
    if (t < next) {
      const c = t - s - air;
      const land = crouch * clamp(height / 8, 0.35, 1);
      if (c < 0.07) return { y: 0, sq: land * EASE.snap(c / 0.07) };
      if (next !== Infinity) return { y: 0, sq: land };
      return { y: 0, sq: land * (1 - EASE.out((c - 0.07) / 0.22)) };
    }
  }
  return { y: 0, sq: 0 };
}

type Glance = { gx: number; gy: number; turn: number; tilt: number };

/**
 * Glances: at an irregular moment in each segment the eyes snap to a new target, run a touch
 * past it and come back as the head arrives (the eyes lead, the head follows), and the tilt
 * follows the head.
 */
function glances(t: number, seed: number, seg: number, pick: (n: number) => Glance): Glance {
  const at = (n: number) => 0.15 + hash(seed + 29, n) * 0.65;
  const i = Math.floor(t / seg);
  const u = t - i * seg;
  let a: Glance;
  let b: Glance;
  let m: number;
  if (u >= at(i)) {
    a = pick(i - 1);
    b = pick(i);
    m = u - at(i);
  } else {
    a = pick(i - 2);
    b = pick(i - 1);
    m = u + seg - at(i - 1);
  }
  const eyes = EASE.snap(m / 0.13);
  const head = EASE.inOut((m - 0.05) / 0.52);
  const tilt = EASE.inOut((m - 0.14) / 0.56);
  const lead = (b.gx - a.gx) * 0.22 * clamp(eyes - head, 0, 1);
  return {
    gx: lerp(a.gx, b.gx, eyes) + lead,
    gy: lerp(a.gy, b.gy, eyes),
    turn: lerp(a.turn, b.turn, head),
    tilt: lerp(a.tilt, b.tilt, tilt),
  };
}

function idlePick(seed: number, n: number): Glance {
  const r = hash(seed, n);
  const a = hash(seed + 7, n) * 2 - 1;
  const b = hash(seed + 13, n) * 2 - 1;
  if (n <= 0 || r < 0.34) return { turn: 0, gx: 0, gy: 0, tilt: 0 };
  if (r < 0.62) return { turn: 0, gx: a * 0.9, gy: b * 0.5, tilt: 0 };
  if (r < 0.9) return { turn: a * 0.55, gx: a * 0.9, gy: b * 0.3, tilt: a * 3 };
  return { turn: a * 0.2, gx: a * 0.5, gy: -0.8, tilt: a * 7 };
}

function lookAroundPick(seed: number, n: number): Glance {
  const a = hash(seed + 41, n) * 2 - 1;
  const b = hash(seed + 43, n) * 2 - 1;
  const x = Math.sign(a) * (0.35 + 0.6 * Math.abs(a));
  return { gx: x, gy: b * 0.6, turn: x * 0.62, tilt: -x * 3 + b * 2 };
}

/** A single hop. */
const hop = (t: number, start: number, air: number, height: number, crouch: number) =>
  hops(t, [[start, air, height]], crouch);

// ── States ──────────────────────────────────────────────────────────────────────

export const MOTION_STATES: readonly MotionState[] = [
  // ── Lifecycle ───────────────────────────────────────────────────────────────
  {
    id: "spawning",
    name: "New bot",
    group: "Lifecycle",
    when: "The bot was just created, at the end of the Adding Bots flow.",
    motion: "Grows out of the ground tall and thin, squashes as it lands, the face spins into place, a burst, then a wink.",
    where: "Adding Bots success step, first visit of Bot Detail. Once per bot, never again.",
    kind: "once",
    duration: 1.8,
    rest: 1.6,
    blink: [3, 6],
    enter: "cut",
    still: 2.8,
    pose: (t, ctx) => {
      const br = t > 1.7 ? breathe(t) : { y: 0, sq: 0 };
      // When it replays, it first sinks back into the ground (ease in), so the loop never jumps.
      if (ctx.loop && t > 3.05) {
        const k = EASE.in((t - 3.05) / 0.3);
        return { sy: 1 - 0.98 * k, sx: 1 + 0.15 * k, alpha: 1 - EASE.in((t - 3.2) / 0.15) };
      }
      return {
        alpha: kf(t, [[0.1, 0], [0.16, 1, EASE.out]]),
        // Out of the ground stretched, overshoots into a squash, settles (area grows, then is kept).
        sy: kf(t, [[0.1, 0.02], [0.3, 1.16, EASE.out], [0.47, 0.9, EASE.inOut], [0.66, 1.03, EASE.inOut], [0.86, 1, EASE.inOut]]),
        sx: kf(t, [[0.1, 0.02], [0.3, 0.84, EASE.out], [0.47, 1.1, EASE.inOut], [0.66, 0.98, EASE.inOut], [0.86, 1, EASE.inOut]]),
        y: kf(t, [[0.22, 0], [0.37, -4, EASE.out], [0.5, 0, EASE.in]]) + br.y,
        sq: br.sq,
        spin: kf(t, [[0.12, -1], [0.98, 0, EASE.out]]),
        burst: t > 0.32 && t < 1.12 ? (t - 0.32) / 0.8 : 0,
        // Wink: a fast close, a beat held, a slower open; the head tilts into it and back.
        openR: kf(t, [[1.12, 1], [1.2, 0.06, EASE.in], [1.32, 0.06], [1.5, 1, EASE.out]]),
        tilt: kf(t, [[1.06, 0], [1.24, 8, EASE.out], [1.7, 0, EASE.inOut]]),
        gy: kf(t, [[1.06, 0], [1.16, -0.3, EASE.snap], [1.66, 0, EASE.inOut]]),
        eye: kf(t, [[0.46, 1], [0.6, 1.14, EASE.out], [0.98, 1, EASE.inOut]]),
      };
    },
  },
  {
    id: "waking",
    name: "Starting",
    group: "Lifecycle",
    when: "The user presses Start and the bot boots and connects.",
    motion: "Eyes flutter open, a long stretch with squeezed eyes, looks left, looks right, then a small hop: ready.",
    where: "Bot card and Bot Detail header while the status is Starting.",
    kind: "once",
    duration: 3.3,
    rest: 1.3,
    blink: null,
    still: 3.8,
    pose: (t) => {
      const open = kf(t, [[0.38, 0], [0.48, 0.42, EASE.out], [0.6, 0.06, EASE.in], [0.78, 0.72, EASE.out], [0.88, 0.4, EASE.inOut], [1.04, 1, EASE.out]]);
      const squeeze = kf(t, [[1.02, 1], [1.18, 0.35, EASE.inOut], [1.46, 0.35], [1.64, 1, EASE.out]]);
      const stretch = kf(t, [[0.96, 0], [1.06, 0.05, EASE.inOut], [1.3, -0.13, EASE.out], [1.46, -0.12], [1.64, 0, EASE.inOut]]);
      const rise = kf(t, [[1.06, 0], [1.3, -2.5, EASE.out], [1.64, 0, EASE.inOut]]);
      // Look left, look right: the eyes go first, the head follows.
      const eyes = kf(t, [[1.64, 0], [1.74, -1, EASE.snap], [2.04, -1], [2.12, 1, EASE.snap], [2.42, 1], [2.5, 0, EASE.snap]]);
      const head = kf(t, [[1.68, 0], [1.96, -0.6, EASE.inOut], [2.08, -0.6], [2.4, 0.6, EASE.inOut], [2.46, 0.6], [2.7, 0, EASE.inOut]]);
      const h = hop(t, 2.84, 0.3, 5, 0.1);
      const br = t > 3.2 ? breathe(t) : { y: 0, sq: 0 };
      return {
        alpha: kf(t, [[0.2, 0.62], [0.9, 1, EASE.inOut]]),
        openL: open * squeeze,
        openR: open * squeeze,
        y: kf(t, [[0, 3], [0.95, 0, EASE.inOut]]) + rise + h.y + br.y,
        sq: kf(t, [[0, 0.06], [0.95, 0, EASE.inOut]]) + stretch + h.sq + br.sq,
        gy: kf(t, [[0, 0.5], [0.9, 0, EASE.inOut], [1.1, -0.7, EASE.out], [1.6, 0, EASE.inOut]]),
        eye: kf(t, [[1.62, 1], [1.72, 1.06, EASE.out], [2.6, 1]]),
        gx: eyes * 0.95,
        turn: head,
        tilt: kf(t, [[1.7, 0], [2.0, -3, EASE.inOut], [2.44, 3, EASE.inOut], [2.74, 0, EASE.inOut]]),
        rot: kf(t, [[0, -3], [0.95, 0, EASE.inOut]]),
      };
    },
  },
  {
    id: "idle",
    name: "Running",
    group: "Lifecycle",
    when: "The bot is active and in range, nothing to report.",
    motion: "Breathes, blinks, glances around: the eyes dart first, the head follows and it shifts its weight. Looks at the pointer when it is near.",
    where: "Bot Detail header only (one bot on screen). On the Bots grid the face stays still and only blinks.",
    kind: "loop",
    blink: [3.2, 6.5],
    still: 0,
    pose: (t, ctx) => {
      const g = ctx.look
        ? { gx: ctx.look.x, gy: ctx.look.y, turn: ctx.look.x * 0.45, tilt: ctx.look.x * -2 }
        : glances(t, ctx.seed, 2.9, (n) => idlePick(ctx.seed, n));
      // It shifts its weight toward where it looks; the renderer adds the drag lean.
      return { ...breathe(t + (ctx.seed % 3)), ...g, x: g.turn * 5 };
    },
  },
  {
    id: "stopping",
    name: "Stopping",
    group: "Lifecycle",
    when: "The user stops the bot and it closes its orders.",
    motion: "Looks at you, two heavy slow blinks, the eyes shut as the head drops, it sinks and dims.",
    where: "Bot card and Bot Detail header while the status is Stopping.",
    kind: "once",
    duration: 2.5,
    rest: 1.2,
    blink: null,
    still: 3.2,
    pose: (t) => {
      // Heavy lids: slow to close (ease in), slower to open, never fully open again.
      const open = kf(t, [[0.3, 1], [0.66, 0.1, EASE.in], [0.76, 0.1], [1.06, 0.82, EASE.out], [1.22, 0.82], [1.56, 0, EASE.in], [1.68, 0], [1.88, 0.36, EASE.out], [2.3, 0, EASE.inOut]]);
      const sink = kf(t, [[1.55, 0], [2.4, 1, EASE.inOut]]);
      const drop = kf(t, [[1.46, 0], [1.62, 1, EASE.out], [1.95, 0, EASE.inOut]]);
      if (t > 2.4) return sleepPose(t - 2.4);
      return {
        openL: open,
        openR: open,
        gy: 0.45 * sink + 0.3 * drop,
        y: 3 * sink + 0.9 * drop,
        sq: 0.06 * sink,
        rot: -3 * sink,
        tilt: -2 * sink - 1.5 * drop,
        alpha: 1 - 0.38 * sink,
        eye: 1 - 0.05 * sink,
      };
    },
  },
  {
    id: "sleeping",
    name: "Stopped",
    group: "Lifecycle",
    when: "The bot is stopped.",
    motion: "Eyes closed, slow deep breathing with the lean following a beat later, z's drifting up.",
    where: "Bot Detail header. On the Bots grid: closed eyes and dimmed, no z's.",
    kind: "loop",
    blink: null,
    still: 1,
    pose: (t) => ({ ...sleepPose(t), zzz: 1 }),
  },

  // ── Working ─────────────────────────────────────────────────────────────────
  {
    id: "connecting",
    name: "Connecting exchange",
    group: "Working",
    when: "The platform checks the API keys and connects the bot to its exchange.",
    motion: "A small counter-turn, then the head spins a full turn on a little hop, brakes facing you and pauses. Two squares orbit around it.",
    where: "Add exchange step and the first seconds of Starting. Stops the moment the connection answers.",
    kind: "loop",
    blink: [2.5, 4],
    still: 1.9,
    pose: (t) => {
      const period = 2.4;
      const i = Math.floor(t / period);
      const u = t - i * period;
      const turn = kf(u, [[0, 0], [0.2, -0.06, EASE.inOut], [1.06, 1, EASE.spin]]);
      const h = hop(u, 0.34, 0.56, 3.5, 0.07);
      const br = breathe(t, 3, 0.5);
      return {
        spin: i + turn,
        y: h.y + br.y,
        sq: h.sq + br.sq,
        openL: 0.85,
        openR: 0.85,
        orbit: 1,
      };
    },
  },
  {
    id: "thinking",
    name: "Thinking",
    group: "Working",
    when: "The platform computes something for this bot: suggesting a range, a backtest, saving settings.",
    motion: "Looks up to one side, the head turns after the eyes and tilts last, eyes half closed and darting, then switches sides. Three dots pulse above it.",
    where: "Adding Bots range step, Bot settings while saving. Never for more than a few seconds.",
    kind: "loop",
    blink: [2.5, 5],
    still: 1.5,
    pose: (t, ctx) => {
      const seg = 3.4;
      const i = Math.floor(t / seg);
      const u = t - i * seg;
      const side = (n: number) => (n % 2 === 0 ? 1 : -1) * (hash(ctx.seed, n) < 0.2 ? -1 : 1);
      const a = side(i - 1);
      const b = side(i);
      const eyes = lerp(a, b, EASE.snap(u / 0.16));
      const head = lerp(a, b, EASE.inOut((u - 0.06) / 0.6));
      const tilt = lerp(a, b, EASE.inOut((u - 0.16) / 0.64));
      // Small saccades while it thinks, each one held.
      const d = Math.floor(t / 0.9);
      const dm = t - d * 0.9;
      const dart = (n: number) => (hash(ctx.seed + 3, n) - 0.5) * 0.3;
      const dy = (n: number) => (hash(ctx.seed + 5, n) - 0.5) * 0.2;
      const k = EASE.snap(dm / 0.1);
      const br = breathe(t, 3.8);
      return {
        ...br,
        x: 2.5 * head,
        turn: 0.34 * head,
        gx: 0.75 * eyes + lerp(dart(d - 1), dart(d), k),
        gy: -0.85 + lerp(dy(d - 1), dy(d), k),
        tilt: 7 * tilt + 1.2 * Math.sin(t * 1.3),
        openL: 0.78,
        openR: 0.78,
        dots: 1,
      };
    },
  },
  {
    id: "scanning",
    name: "Watching the market",
    group: "Working",
    when: "The bot is active and waiting for its entry: no open orders yet.",
    motion: "The head sweeps from side to side like a radar, the eyes a beat ahead, braking into each end with a pause. A ring pings at the turn.",
    where: "Bot Detail header, while the bot has no open position.",
    kind: "loop",
    blink: [4, 7],
    still: 0.4,
    pose: (t) => {
      const p = 3.6;
      const u = t % p;
      const sweep: Key[] = [[0, -1], [0.4, -1], [1.75, 1, EASE.inOut], [2.2, 1], [3.55, -1, EASE.inOut]];
      const head = kf(u, sweep);
      const eyes = kf((u + 0.2) % p, sweep);
      const ping = u >= 1.72 && u < 2.62 ? (u - 1.72) / 0.9 : u >= 3.52 ? (u - 3.52) / 0.9 : u < 0.82 ? (u + 0.08) / 0.9 : 0;
      return {
        ...breathe(t, 3.6, 0.6),
        turn: 0.7 * head,
        gx: 0.85 * eyes,
        gy: -0.1,
        tilt: -2 * head,
        openL: 0.5,
        openR: 0.5,
        ring: ping,
      };
    },
  },
  {
    id: "working",
    name: "Placing orders",
    group: "Working",
    when: "The bot is opening or closing positions, or rebalancing its range.",
    motion: "Three quick busy hops while it looks down at the work and sends squares out, then the eyes and the head turn to you for a beat, and again.",
    where: "Bot Detail header while orders are pending.",
    kind: "loop",
    blink: [2.5, 5],
    still: 0.4,
    pose: (t, ctx) => {
      const cycle = 2.5;
      const u = t % cycle;
      const dir = hash(ctx.seed, 1) < 0.5 ? -1 : 1;
      const h = hops(u, [[0.16, 0.32, 5.5], [0.6, 0.32, 5.5], [1.04, 0.32, 5.5]], 0.11);
      const eyes = kf(u, [[1.56, 0], [1.66, 1, EASE.snap], [2.2, 1], [2.28, 0, EASE.snap]]);
      const head = kf(u, [[1.6, 0], [1.9, 1, EASE.inOut], [2.2, 1], [2.46, 0, EASE.inOut]]);
      return {
        y: h.y,
        sq: h.sq,
        turn: dir * 0.42 * (1 - head),
        gx: dir * 0.75 * (1 - eyes),
        gy: 0.45 * (1 - eyes) - 0.1 * eyes,
        tilt: dir * 4 * (1 - head),
        openL: 0.72 + 0.28 * eyes,
        openR: 0.72 + 0.28 * eyes,
        send: kf(u, [[0, 1], [1.46, 1], [1.6, 0, EASE.out], [2.4, 0], [2.5, 1, EASE.out]]),
        sendDir: dir,
      };
    },
  },
  {
    id: "filled",
    name: "Order filled",
    group: "Working",
    when: "A fill arrives: a new line in Recent trades.",
    motion: "Crouches to wind up, jumps, the face spins a full turn while it hangs in the air, lands in a squash with a burst, a small rebound, happy eyes.",
    where: "Bots grid (one bot at a time, at most one every few seconds) and Bot Detail.",
    kind: "once",
    duration: 1.9,
    rest: 1.5,
    blink: [3, 6],
    still: 2.6,
    pose: (t) => {
      // Wind-up crouch, a big jump, then a small rebound off the landing squash.
      const jump = hops(t, [[0.26, 0.6, 17], [0.98, 0.2, 2.6]], 0.17);
      const happy = kf(t, [[0.88, 0], [1.04, 1, EASE.out], [1.62, 1], [1.88, 0, EASE.inOut]]);
      const wind = kf(t, [[0, 0], [0.24, 1, EASE.inOut], [0.3, 0, EASE.snap]]);
      const br = t > 1.8 ? breathe(t) : { y: 0, sq: 0 };
      return {
        y: jump.y + br.y,
        sq: jump.sq + br.sq,
        spin: kf(t, [[0.3, 0], [0.82, 1, EASE.spin]]),
        rot: kf(t, [[0.24, 0], [0.42, -4, EASE.out], [0.78, 3, EASE.inOut], [1.02, 0, EASE.inOut]]),
        gy: 0.35 * wind - 0.35 * happy,
        openL: 1 - 0.3 * wind - 0.55 * happy,
        openR: 1 - 0.3 * wind - 0.55 * happy,
        eye: 1 + 0.08 * happy,
        burst: t > 0.86 && t < 1.66 ? (t - 0.86) / 0.8 : 0,
      };
    },
  },
  {
    id: "done",
    name: "Done",
    group: "Working",
    when: "A task the user asked for is finished: bot created and funded, settings saved, rebalance complete. Never tied to profit.",
    motion: "Two nods (quick down, slower up, the second smaller), content half-closed eyes, a check draws and pops above the head, a small tilt.",
    where: "Confirmation steps and toasts, Adding Bots final step.",
    kind: "once",
    duration: 2.6,
    rest: 1.2,
    blink: [3, 6],
    still: 1.8,
    pose: (t) => {
      const nod = kf(t, [[0.16, 0], [0.28, 1, EASE.out], [0.5, 0, EASE.inOut], [0.6, 0.7, EASE.out], [0.84, 0, EASE.inOut]]);
      const body = kf(t, [[0.2, 0], [0.33, 1, EASE.out], [0.56, 0, EASE.inOut], [0.66, 0.7, EASE.out], [0.92, 0, EASE.inOut]]);
      const content = kf(t, [[0.1, 0], [0.4, 1, EASE.inOut], [2.1, 1], [2.5, 0, EASE.inOut]]);
      const br = breathe(t, 3.6, 0.5);
      return {
        y: 2.4 * nod + br.y,
        sq: 0.045 * body + br.sq,
        gy: 0.55 * nod - 0.25 * content * (1 - nod),
        openL: 1 - 0.55 * content,
        openR: 1 - 0.55 * content,
        tilt: kf(t, [[1.16, 0], [1.46, 6, EASE.inOut], [2.1, 6], [2.46, 0, EASE.inOut]]),
        check: EASE.out((t - 0.8) / 0.38),
        checkA: kf(t, [[0.78, 0], [0.84, 1, EASE.out], [2.16, 1], [2.46, 0, EASE.in]]),
        checkPop: kf(t, [[1.1, 0], [1.2, 1, EASE.out], [1.46, 0, EASE.inOut]]),
      };
    },
  },

  // ── Attention ───────────────────────────────────────────────────────────────
  {
    id: "looking",
    name: "Looks at you",
    group: "Attention",
    when: "The user hovers or edits the avatar.",
    motion: "Head and eyes follow the pointer: it turns to the side, looks up and down, tilts with you. Without a pointer it looks around in quick glances.",
    where: "Avatar editor preview, Bot Detail header on hover.",
    kind: "loop",
    blink: [2.5, 5],
    pointer: true,
    still: 0.8,
    pose: (t, ctx) => {
      const g = ctx.look
        ? { gx: ctx.look.x, gy: ctx.look.y, turn: ctx.look.x * 0.62, tilt: -ctx.look.x * 3 + ctx.look.y * 2 }
        : glances(t, ctx.seed, 1.4, (n) => lookAroundPick(ctx.seed, n));
      return { ...breathe(t, 3.2, 0.5), ...g, x: g.gx * 4, y: g.gy * 1.2 };
    },
  },
  {
    id: "waiting",
    name: "Waiting for you",
    group: "Attention",
    when: "The bot needs a user action but nothing is broken: fund the account, confirm a change, renew keys.",
    motion: "Faces you with wide eyes, a double hop to get your attention, then curious head tilts with the eyes leading. A dot pulses on its corner.",
    where: "Bot card and Bot Detail, next to the notice that says what to do.",
    kind: "loop",
    blink: [2.2, 4.5],
    still: 1.3,
    pose: (t) => {
      const cycle = 3.4;
      const u = t % cycle;
      const h = hops(u, [[0.16, 0.24, 4], [0.5, 0.24, 4]], 0.08);
      const eyes = kf(u, [[0.92, 0], [1.0, 1, EASE.snap], [2.16, 1], [2.24, -0.8, EASE.snap], [3.16, -0.8], [3.24, 0, EASE.snap]]);
      const tilt = kf(u, [[0.96, 0], [1.26, 8, EASE.out], [1.96, 8], [2.32, -6, EASE.inOut], [2.96, -6], [3.32, 0, EASE.inOut]]);
      return {
        y: h.y,
        sq: h.sq,
        tilt,
        gx: 0.22 * eyes,
        gy: -0.25,
        eye: kf(u, [[0.3, 1.12], [0.4, 1.2, EASE.out], [0.76, 1.12, EASE.inOut]]),
        notify: 1,
      };
    },
  },
  {
    id: "outOfRange",
    name: "Out of range",
    group: "Attention",
    when: "The price left the bot's range (status Out of range).",
    motion: "A double take: a glance, back to you with wide eyes and a jolt, then it turns and leans toward where the price went (up above the range, down below). An arrow points the way.",
    where: "Bot Detail header. On the Bots grid: one double take when it happens, then the status glyph does the work.",
    kind: "loop",
    blink: [2.5, 5],
    still: 1.8,
    pose: (t) => {
      const half = 4.6;
      const i = Math.floor(t / half);
      const u = t - i * half;
      const dir = i % 2 === 0 ? -1 : 1;
      const eyes = kf(u, [[0, 0], [0.1, 1, EASE.snap], [0.42, 1], [0.5, 0, EASE.snap], [0.88, 0], [0.98, 1, EASE.snap], [4.1, 1], [4.3, 0, EASE.inOut]]);
      const head = kf(u, [[0.04, 0], [0.3, 0.3, EASE.inOut], [0.44, 0.3], [0.56, 0, EASE.out], [0.92, 0], [1.38, 1, EASE.inOut], [4.06, 1], [4.5, 0, EASE.inOut]]);
      const surprise = kf(u, [[0.48, 0], [0.58, 1, EASE.out], [0.98, 0, EASE.inOut]]);
      const jolt = hop(u, 0.5, 0.22, 2.2, 0.04);
      const br = breathe(t, 3, 0.5);
      return {
        turn: 0.5 * head,
        gx: 0.95 * eyes,
        gy: dir * 0.95 * eyes + Math.sin(u * 2.2) * 0.06 * head,
        rot: 5 * head,
        tilt: -dir * 5 * head,
        y: dir * 2 * head + jolt.y + br.y,
        sq: (dir < 0 ? -0.04 : 0.04) * head + jolt.sq + br.sq,
        eye: 1 + 0.2 * surprise + 0.06 * head,
        arrow: kf(u, [[0.9, 0], [1.2, 1, EASE.out], [4.1, 1], [4.5, 0, EASE.inOut]]),
        arrowDir: dir,
      };
    },
  },
  {
    id: "alert",
    name: "Needs help",
    group: "Attention",
    when: "Status Error: invalid API keys, exchange down, order rejected.",
    motion: "Shakes its head (the tilt trails the turn), droops heavily and looks down, then the eyes and then the head lift to you as if asking for help. A red ! pulses above it.",
    where: "Bot card (plays once) and Bot Detail (loops) until the error is fixed.",
    kind: "loop",
    blink: [3, 6],
    still: 2.7,
    pose: (t) => {
      const cycle = 3.8;
      const u = t % cycle;
      // Decaying shake; the envelope eases out so the last swings fade instead of stopping.
      const shake = (x: number) => (x < 0 || x > 1.1 ? 0 : Math.sin(x * TAU * 2.7) * (1 - EASE.soft(x / 1.1)));
      const droop = kf(u, [[0.95, 0], [1.36, 1, EASE.in], [3.36, 1], [3.8, 0, EASE.inOut]]);
      const askEyes = kf(u, [[2.28, 0], [2.38, 1, EASE.snap], [3.0, 1], [3.16, 0, EASE.inOut]]);
      const askHead = kf(u, [[2.34, 0], [2.62, 1, EASE.inOut], [3.0, 1], [3.3, 0, EASE.inOut]]);
      const br = breathe(t, 3.2, 0.4);
      return {
        turn: 0.5 * shake(u),
        gx: 0.65 * shake(u + 0.04),
        tilt: 4 * shake(u - 0.08) - 5 * droop * (1 - askHead),
        rot: -3 * droop,
        y: 2.6 * droop * (1 - 0.6 * askHead) + br.y,
        sq: 0.05 * droop + br.sq,
        gy: 0.85 * droop * (1 - askEyes) - 0.45 * askEyes,
        openL: 1 - 0.3 * droop * (1 - askEyes) - 0.25 * Math.abs(shake(u)),
        openR: 1 - 0.3 * droop * (1 - askEyes) - 0.25 * Math.abs(shake(u)),
        eye: 1 + 0.08 * askEyes,
        alert: 1,
      };
    },
  },
];

export const MOTION_BY_ID = Object.fromEntries(MOTION_STATES.map((s) => [s.id, s])) as Record<
  MotionStateId,
  MotionState
>;

export const MOTION_GROUPS: readonly { group: MotionGroup; hint: string }[] = [
  { group: "Lifecycle", hint: "Created, starting, running, stopping, stopped" },
  { group: "Working", hint: "The bot is doing something" },
  { group: "Attention", hint: "The bot needs you to look" },
];

/** Hero "Play the story": a bot's day, each step with how long it stays. */
export const MOTION_STORY: readonly { id: MotionStateId; hold: number }[] = [
  { id: "spawning", hold: 2.4 },
  { id: "connecting", hold: 2.4 },
  { id: "idle", hold: 4 },
  { id: "looking", hold: 3.2 },
  { id: "thinking", hold: 3.6 },
  { id: "working", hold: 2.5 },
  { id: "filled", hold: 2.3 },
  { id: "scanning", hold: 3.6 },
  { id: "outOfRange", hold: 4.6 },
  { id: "alert", hold: 3.8 },
  { id: "waiting", hold: 3.4 },
  { id: "done", hold: 2.8 },
  { id: "stopping", hold: 2.9 },
  { id: "sleeping", hold: 4.2 },
  { id: "waking", hold: 3.6 },
  { id: "idle", hold: 3 },
];

/** Blink length in seconds. */
export const BLINK = 0.3;

/**
 * Blink over 0..1: the lids accelerate shut (32%), stay shut a beat (10%), then open with a
 * long ease out (58%). Returns how open the eyes are.
 */
export function blinkOpen(u: number): number {
  if (u <= 0 || u >= 1) return 1;
  if (u < 0.32) return 1 - EASE.in(u / 0.32);
  if (u < 0.42) return 0;
  return EASE.out((u - 0.42) / 0.58);
}

/** The pose a state gives at time t, with intensity applied and the head yaw in radians. */
export function evaluate(state: MotionState, t: number, ctx: MotionContext, intensity: number) {
  const p: Pose = { ...REST, ...state.pose(t, ctx) };
  for (const k of MOTION_FIELDS) p[k] *= intensity;
  // Spawning grows from 0: keep that whole whatever the intensity.
  if (state.id !== "spawning") {
    p.sx = 1 + (p.sx - 1) * intensity;
    p.sy = 1 + (p.sy - 1) * intensity;
  }
  // Squash and stretch keep the area.
  const sq = clamp(p.sq, -0.35, 0.35);
  p.sy *= 1 - sq;
  p.sx /= 1 - sq;
  p.sq = 0;
  return { pose: p, yaw: p.turn * (Math.PI / 2) + p.spin * TAU };
}

/** Wrap an angle to (−π, π]. */
export const wrapAngle = (a: number) => a - TAU * Math.floor((a + Math.PI) / TAU);
