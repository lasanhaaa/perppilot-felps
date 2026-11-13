/**
 * Bot motion: one animation per moment, for the bot faces in lib/bot-avatar.ts.
 *
 * Reference: Grok Bot's face rig (x.ai). The face is not a flat sticker: the eyes sit on a head
 * sphere, so the head can turn to the side (the far eye narrows and hides), spin a full turn,
 * hop, lean, squash and stretch. Every state below is a pure function of time, so the same
 * state looks the same on every screen. Docs: docs/bot-motion.md and the page /bot-motion.
 */

export const TAU = Math.PI * 2;

export const clamp = (v: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Smoothstep: ease in and out. */
export const ease = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOut = (x: number) => 1 - (1 - clamp(x, 0, 1)) ** 3;
const frac = (x: number) => x - Math.floor(x);
/** Half sine bump: 0 → 1 → 0 between a and b. */
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));
/** Damped spring from 0 to 1 (overshoots once, then settles). */
const spring = (t: number, freq = 9, damp = 6) => (t <= 0 ? 0 : 1 - Math.exp(-damp * t) * Math.cos(freq * t));

/** Keyframes: [time, value] pairs, eased between, held before the first and after the last. */
export function kf(t: number, keys: readonly (readonly [number, number])[], curve = ease): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return lerp(v0, v1, curve((t - t0) / (t1 - t0)));
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
  /** Whole bot: move, lean (pivot at the feet), squash/stretch (pivot at the feet). */
  x: number;
  y: number;
  rot: number;
  sx: number;
  sy: number;
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
  x: 0, y: 0, rot: 0, sx: 1, sy: 1, tilt: 0, turn: 0, spin: 0, gx: 0, gy: 0,
  openL: 1, openR: 1, eye: 1, alpha: 1,
  dots: 0, zzz: 0, alert: 0, notify: 0, burst: 0, check: 0, checkA: 0, ring: 0, orbit: 0,
  send: 0, sendDir: 1, arrow: 0, arrowDir: -1,
};

/** Fields scaled by the intensity control (deviation from rest). Extras keep their size. */
export const MOTION_FIELDS = ["x", "y", "rot", "tilt", "turn", "gx", "gy"] as const;

export type MotionContext = {
  /** Per-bot noise, so two bots in the same state never move in sync. */
  seed: number;
  /** Smoothed direction to the pointer (−1..1), or null when there is none. */
  look: { x: number; y: number } | null;
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
  /** Time shown when motion is paused (reduced motion). */
  still: number;
  pose: (t: number, ctx: MotionContext) => Partial<Pose>;
};

const breath = (t: number, period = 3.2, amp = 1) => {
  const b = Math.sin((t * TAU) / period) * amp;
  return { sy: 1 + 0.018 * b, sx: 1 - 0.01 * b, y: -0.5 * b };
};

/** A calm front-facing pose with breathing, used as the tail of one-shots. */
const settle = (t: number): Partial<Pose> => breath(t);

/** Idle glances: eyes jump to a target, the head follows a beat later. */
function idleGaze(t: number, seed: number) {
  const seg = 2.8;
  const i = Math.floor(t / seg);
  const u = t - i * seg;
  const target = (n: number) => {
    const r = hash(seed, n);
    const a = hash(seed + 7, n) * 2 - 1;
    const b = hash(seed + 13, n) * 2 - 1;
    if (n <= 0 || r < 0.34) return { turn: 0, gx: 0, gy: 0, tilt: 0 };
    if (r < 0.62) return { turn: 0, gx: a * 0.9, gy: b * 0.5, tilt: 0 };
    if (r < 0.9) return { turn: a * 0.55, gx: a * 0.9, gy: b * 0.3, tilt: a * 3 };
    return { turn: a * 0.2, gx: a * 0.5, gy: -0.8, tilt: a * 7 };
  };
  const A = target(i - 1);
  const B = target(i);
  const eyes = ease(u / 0.14);
  const head = ease((u - 0.08) / 0.5);
  return {
    gx: lerp(A.gx, B.gx, eyes),
    gy: lerp(A.gy, B.gy, eyes),
    turn: lerp(A.turn, B.turn, head),
    tilt: lerp(A.tilt, B.tilt, head),
  };
}

/** A hop: rise on a half sine, squash before takeoff and on landing. */
function hop(t: number, start: number, length: number, height: number) {
  const u = (t - start) / length;
  if (u < -0.25 || u > 1.3) return { y: 0, sx: 1, sy: 1 };
  const air = u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
  const crouch = bump(u, -0.25, 0.02) + bump(u, 0.98, 1.3);
  const stretch = bump(u, 0, 0.5) * 0.06;
  return { y: -height * air, sy: 1 - 0.12 * crouch + stretch, sx: 1 + 0.09 * crouch - stretch * 0.7 };
}

export const MOTION_STATES: readonly MotionState[] = [
  // ── Lifecycle ───────────────────────────────────────────────────────────────
  {
    id: "spawning",
    name: "New bot",
    group: "Lifecycle",
    when: "The bot was just created, at the end of the Adding Bots flow.",
    motion: "Pops out of the ground with an overshoot, the face spins into place, a burst, then a wink.",
    where: "Adding Bots success step, first visit of Bot Detail. Once per bot, never again.",
    kind: "once",
    duration: 1.7,
    rest: 1.6,
    blink: [3, 6],
    still: 2.6,
    pose: (t) => {
      const u = t - 0.12;
      const s = spring(u, 10, 5.5);
      const wink = bump(t, 1.15, 1.5);
      return {
        ...(t > 1.7 ? settle(t) : {}),
        alpha: t < 0.1 ? 0 : 1,
        sx: u <= 0 ? 0.01 : s * (1 + 0.06 * bump(u, 0, 0.3)),
        sy: u <= 0 ? 0.01 : s,
        y: u <= 0 ? 6 : 6 * (1 - easeOut(u / 0.35)),
        spin: -1 + easeOut((t - 0.12) / 0.85),
        burst: t > 0.45 && t < 1.15 ? (t - 0.45) / 0.7 : 0,
        openR: 1 - 0.92 * wink,
        tilt: 7 * wink,
        gy: -0.2 * wink,
        eye: 1 + 0.1 * bump(t, 0.6, 1.1),
      };
    },
  },
  {
    id: "waking",
    name: "Starting",
    group: "Lifecycle",
    when: "The user presses Start and the bot boots and connects.",
    motion: "Eyes flutter open, a long stretch, looks left, looks right, then a small hop: ready.",
    where: "Bot card and Bot Detail header while the status is Starting.",
    kind: "once",
    duration: 2.8,
    rest: 1.4,
    blink: null,
    still: 3.2,
    pose: (t) => {
      const open = kf(t, [[0.4, 0], [0.5, 0.35], [0.6, 0.05], [0.78, 0.65], [0.9, 0.3], [1.05, 1]]);
      const stretch = bump(t, 1.0, 1.55);
      const look = kf(t, [[1.5, 0], [1.75, -1], [2.0, -1], [2.25, 1], [2.45, 1], [2.6, 0]]);
      const h = hop(t, 2.55, 0.32, 5);
      return {
        ...(t > 2.95 ? settle(t) : {}),
        alpha: kf(t, [[0.2, 0.62], [0.9, 1]]),
        openL: open,
        openR: open,
        y: kf(t, [[0, 2.5], [0.9, 0]]) - 3 * stretch + h.y,
        sy: (t < 1 ? kf(t, [[0, 0.95], [0.9, 1]]) : 1) + 0.12 * stretch + (h.sy - 1),
        sx: 1 - 0.08 * stretch + (h.sx - 1),
        gy: kf(t, [[0, 0.5], [0.9, 0], [1.1, -0.6], [1.5, 0]]),
        eye: 1 + 0.12 * stretch,
        turn: look * 0.6,
        gx: look * 0.9,
        rot: kf(t, [[0, -3], [0.9, 0]]),
        tilt: look * -3,
      };
    },
  },
  {
    id: "idle",
    name: "Running",
    group: "Lifecycle",
    when: "The bot is active and in range, nothing to report.",
    motion: "Breathes, blinks every few seconds, glances around and now and then turns its head. Looks at the pointer when it is near.",
    where: "Bot Detail header only (one bot on screen). On the Bots grid the face stays still and only blinks.",
    kind: "loop",
    blink: [3.2, 6.5],
    still: 0,
    pose: (t, ctx) => {
      const g = idleGaze(t, ctx.seed);
      if (ctx.look) {
        g.gx = ctx.look.x;
        g.gy = ctx.look.y;
        g.turn = ctx.look.x * 0.45;
        g.tilt = ctx.look.x * -2;
      }
      // It shifts its weight toward where it looks.
      return { ...breath(t + (ctx.seed % 3)), ...g, x: g.turn * 5, rot: g.turn * 2 };
    },
  },
  {
    id: "stopping",
    name: "Stopping",
    group: "Lifecycle",
    when: "The user stops the bot and it closes its orders.",
    motion: "Looks at you, two heavy slow blinks, the eyes close, it sinks a little and dims.",
    where: "Bot card and Bot Detail header while the status is Stopping.",
    kind: "once",
    duration: 2.4,
    rest: 1.2,
    blink: null,
    still: 3,
    pose: (t) => {
      const open = kf(t, [[0.3, 1], [0.6, 0.15], [0.95, 0.85], [1.15, 0.85], [1.45, 0], [1.75, 0.45], [2.25, 0]]);
      const sink = ease((t - 1.6) / 0.7);
      const b = Math.sin(((t - 2.4) * TAU) / 4.2);
      return {
        openL: open,
        openR: open,
        gy: lerp(0, 0.45, sink),
        y: 3 * sink + (t > 2.4 ? 0.4 * b : 0),
        sy: 1 - 0.06 * sink + (t > 2.4 ? 0.012 * b : 0),
        sx: 1 + 0.02 * sink,
        rot: -3 * sink,
        tilt: -2 * sink,
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
    motion: "Eyes closed, slow deep breathing, leaning a little to one side, z's rising from the head.",
    where: "Bot Detail header. On the Bots grid: closed eyes and dimmed, no z's.",
    kind: "loop",
    blink: null,
    still: 1,
    pose: (t) => {
      const b = Math.sin((t * TAU) / 4.2);
      return {
        openL: 0,
        openR: 0,
        gy: 0.45,
        y: 3 + 0.5 * b,
        sy: 0.94 + 0.015 * b,
        sx: 1.02 - 0.006 * b,
        rot: -3 + 0.8 * b,
        tilt: -2,
        alpha: 0.62,
        eye: 0.95,
        zzz: 1,
      };
    },
  },

  // ── Working ─────────────────────────────────────────────────────────────────
  {
    id: "connecting",
    name: "Connecting exchange",
    group: "Working",
    when: "The platform checks the API keys and connects the bot to its exchange.",
    motion: "The head spins a full turn, lands facing you, pauses, spins again. Two squares orbit around it.",
    where: "Add exchange step and the first seconds of Starting. Stops the moment the connection answers.",
    kind: "loop",
    blink: [2.5, 4],
    still: 1.8,
    pose: (t) => {
      const period = 2.4;
      const i = Math.floor(t / period);
      const u = t - i * period;
      const s = ease(u / 1.05);
      return {
        spin: i + s,
        y: -3 * bump(u, 0, 1.05),
        sy: 1 + 0.04 * bump(u, 0.2, 0.9) - 0.06 * bump(u, 1.0, 1.3),
        sx: 1 + 0.05 * bump(u, 1.0, 1.3),
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
    motion: "Turns its head away and looks up to one side, tilts, eyes half closed, then switches sides. Three dots pulse above it.",
    where: "Adding Bots range step, Bot settings while saving. Never for more than a few seconds.",
    kind: "loop",
    blink: [2.5, 5],
    still: 1.4,
    pose: (t, ctx) => {
      const seg = 3.4;
      const i = Math.floor(t / seg);
      const u = t - i * seg;
      const side = (n: number) => (n % 2 === 0 ? 1 : -1) * (hash(ctx.seed, n) < 0.2 ? -1 : 1);
      const k = ease(u / 0.55);
      const s = lerp(side(i - 1), side(i), k);
      const dart = (hash(ctx.seed + 3, Math.floor(t / 0.9)) - 0.5) * 0.25;
      return {
        ...breath(t, 3.8),
        turn: 0.34 * s,
        x: 2.5 * s,
        gx: 0.75 * s + dart,
        gy: -0.85,
        tilt: 7 * s + 1.5 * Math.sin(t * 1.7),
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
    motion: "The head sweeps from side to side like a radar, eyes narrowed, pausing at each end. A ring pings at the turn.",
    where: "Bot Detail header, while the bot has no open position.",
    kind: "loop",
    blink: [4, 7],
    still: 0.4,
    pose: (t) => {
      const p = 3.6;
      const u = t % p;
      const sweep = kf(u, [[0, -1], [0.45, -1], [1.8, 1], [2.25, 1], [3.6, -1]]);
      const eyesLead = kf((u + 0.18) % p, [[0, -1], [0.45, -1], [1.8, 1], [2.25, 1], [3.6, -1]]);
      const ping = u >= 1.8 && u < 2.7 ? (u - 1.8) / 0.9 : u < 0.9 ? u / 0.9 : 0;
      return {
        ...breath(t, 3.6, 0.6),
        turn: 0.8 * sweep,
        gx: 0.85 * eyesLead,
        gy: -0.1,
        tilt: -2 * sweep,
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
    motion: "Three quick busy hops while it looks down at the work and sends squares out, then a glance at you, and again.",
    where: "Bot Detail header while orders are pending.",
    kind: "loop",
    blink: [2.5, 5],
    still: 0.35,
    pose: (t, ctx) => {
      const cycle = 2.5;
      const u = t % cycle;
      const dir = hash(ctx.seed, 1) < 0.5 ? -1 : 1;
      let y = 0;
      let sx = 1;
      let sy = 1;
      for (let i = 0; i < 3; i++) {
        const h = hop(u, 0.12 + i * 0.5, 0.36, 5.5);
        y += h.y;
        sx += h.sx - 1;
        sy += h.sy - 1;
      }
      const glance = bump(u, 1.65, 2.45);
      const busy = 1 - ease((u - 1.55) / 0.15) + ease((u - 2.4) / 0.1);
      return {
        y,
        sx,
        sy,
        turn: dir * 0.42 * (1 - glance),
        gx: dir * 0.75 * (1 - glance),
        gy: 0.45 * (1 - glance) - 0.1 * glance,
        tilt: dir * 4 * (1 - glance),
        openL: 0.72 + 0.28 * glance,
        openR: 0.72 + 0.28 * glance,
        send: clamp(busy, 0, 1),
        sendDir: dir,
      };
    },
  },
  {
    id: "filled",
    name: "Order filled",
    group: "Working",
    when: "A fill arrives: a new line in Recent trades.",
    motion: "Crouches, jumps, the face spins a full turn in the air, lands with a squash and a burst, happy eyes.",
    where: "Bots grid (one bot at a time, at most one every few seconds) and Bot Detail.",
    kind: "once",
    duration: 1.6,
    rest: 1.6,
    blink: [3, 6],
    still: 2.4,
    pose: (t) => {
      const crouch = bump(t, 0, 0.26);
      const air = t > 0.22 && t < 0.78 ? Math.sin((Math.PI * (t - 0.22)) / 0.56) : 0;
      const take = bump(t, 0.2, 0.42);
      const land = bump(t, 0.76, 1.02) - 0.25 * bump(t, 1.02, 1.25);
      const happy = bump(t, 0.85, 1.6);
      return {
        ...(t > 1.6 ? settle(t) : {}),
        y: 1.5 * crouch - 16 * air + 1.2 * Math.max(0, land),
        sy: 1 - 0.16 * crouch + 0.12 * take - 0.14 * land,
        sx: 1 + 0.12 * crouch - 0.08 * take + 0.11 * land,
        spin: ease((t - 0.24) / 0.52),
        rot: 3 * Math.sin(Math.PI * clamp((t - 0.22) / 0.56, 0, 1)),
        burst: t > 0.74 && t < 1.44 ? (t - 0.74) / 0.7 : 0,
        openL: 1 - 0.55 * happy - 0.3 * crouch,
        openR: 1 - 0.55 * happy - 0.3 * crouch,
        gy: -0.35 * happy,
        eye: 1 + 0.08 * happy,
      };
    },
  },
  {
    id: "done",
    name: "Done",
    group: "Working",
    when: "A task the user asked for is finished: bot created and funded, settings saved, rebalance complete. Never tied to profit.",
    motion: "Two firm nods, content half-closed eyes, a check mark draws above the head, a small tilt.",
    where: "Confirmation steps and toasts, Adding Bots final step.",
    kind: "once",
    duration: 2.6,
    rest: 1.2,
    blink: [3, 6],
    still: 1.7,
    pose: (t) => {
      const nod = bump(t, 0.15, 0.5) + bump(t, 0.55, 0.9);
      const content = kf(t, [[0.1, 0], [0.35, 1], [2.1, 1], [2.5, 0]]);
      const check = clamp((t - 0.75) / 0.45, 0, 1);
      return {
        ...(t > 2.6 ? settle(t) : breath(t, 3.6, 0.5)),
        y: 2.6 * nod,
        gy: 0.55 * nod - 0.25 * content * (1 - nod),
        sy: 1 - 0.04 * nod,
        openL: 1 - 0.55 * content,
        openR: 1 - 0.55 * content,
        tilt: 6 * bump(t, 1.2, 2.4),
        check,
        checkA: t < 0.75 ? 0 : 1 - ease((t - 2.2) / 0.35),
      };
    },
  },

  // ── Attention ───────────────────────────────────────────────────────────────
  {
    id: "looking",
    name: "Looks at you",
    group: "Attention",
    when: "The user hovers or edits the avatar.",
    motion: "Head and eyes follow the pointer: it turns to the side, looks up and down, tilts with you. Without a pointer it looks around in a figure eight.",
    where: "Avatar editor preview, Bot Detail header on hover.",
    kind: "loop",
    blink: [2.5, 5],
    pointer: true,
    still: 0.8,
    pose: (t, ctx) => {
      const l = ctx.look ?? { x: Math.sin(t * 0.9) * 0.95, y: Math.sin(t * 1.8) * 0.6 };
      return {
        ...breath(t, 3.2, 0.5),
        turn: l.x * 0.62,
        gx: l.x,
        gy: l.y,
        tilt: -l.x * 3 + l.y * 2,
        x: l.x * 4,
        y: l.y * 1.2,
        rot: l.x * 3,
      };
    },
  },
  {
    id: "waiting",
    name: "Waiting for you",
    group: "Attention",
    when: "The bot needs a user action but nothing is broken: fund the account, confirm a change, renew keys.",
    motion: "Faces you with wide eyes, a double hop to get your attention, curious head tilts. A dot pulses on its corner.",
    where: "Bot card and Bot Detail, next to the notice that says what to do.",
    kind: "loop",
    blink: [2.2, 4.5],
    still: 1.2,
    pose: (t) => {
      const cycle = 3.4;
      const u = t % cycle;
      const h1 = hop(u, 0.1, 0.26, 4);
      const h2 = hop(u, 0.46, 0.26, 4);
      const tilt = kf(u, [[0.9, 0], [1.2, 8], [2.0, 8], [2.3, -6], [3.0, -6], [3.3, 0]]);
      return {
        y: h1.y + h2.y,
        sy: h1.sy + h2.sy - 1,
        sx: h1.sx + h2.sx - 1,
        tilt,
        gy: -0.25,
        gx: tilt / 40,
        eye: 1.12,
        notify: 1,
      };
    },
  },
  {
    id: "outOfRange",
    name: "Out of range",
    group: "Attention",
    when: "The price left the bot's range (status Out of range).",
    motion: "A double take, then turns and leans toward where the price went: up when it is above the range, down when below. An arrow points the way.",
    where: "Bot Detail header. On the Bots grid: one double take when it happens, then the status glyph does the work.",
    kind: "loop",
    blink: [2.5, 5],
    still: 1.6,
    pose: (t) => {
      const half = 4.6;
      const i = Math.floor(t / half);
      const u = t - i * half;
      const dir = i % 2 === 0 ? -1 : 1;
      const take = kf(u, [[0, 0], [0.22, 1], [0.42, 1], [0.6, 0], [0.82, 0], [1.1, 1], [4.1, 1], [4.6, 0]]);
      const surprise = bump(u, 0.5, 1.1);
      const sway = Math.sin(u * 2.2) * 0.06;
      return {
        ...breath(t, 3, 0.5),
        turn: 0.5 * take,
        gx: 0.95 * take,
        gy: dir * (0.95 * take) + sway,
        rot: 5 * take,
        tilt: -dir * 5 * take,
        y: dir * 2 * take - 2 * surprise,
        sy: 1 + (dir < 0 ? 0.04 : -0.04) * take + 0.05 * surprise,
        eye: 1 + 0.18 * surprise + 0.06 * take,
        arrow: kf(u, [[0.8, 0], [1.1, 1], [4.2, 1], [4.6, 0]]),
        arrowDir: dir,
      };
    },
  },
  {
    id: "alert",
    name: "Needs help",
    group: "Attention",
    when: "Status Error: invalid API keys, exchange down, order rejected.",
    motion: "Shakes its head, then droops and looks down, then looks up at you as if asking for help. A red ! blinks above it.",
    where: "Bot card (plays once) and Bot Detail (loops) until the error is fixed.",
    kind: "loop",
    blink: [3, 6],
    still: 2.6,
    pose: (t) => {
      const cycle = 3.8;
      const u = t % cycle;
      const shake = u < 1.05 ? Math.sin(u * TAU * 2.9) * (1 - u / 1.05) : 0;
      const droop = kf(u, [[0.9, 0], [1.3, 1], [3.4, 1], [3.8, 0]]);
      const ask = bump(u, 2.3, 3.2);
      return {
        ...breath(t, 3.2, 0.4),
        turn: 0.5 * shake,
        gx: 0.6 * shake,
        tilt: 4 * shake - 5 * droop * (1 - ask),
        rot: -3 * droop,
        y: 2.6 * droop * (1 - 0.6 * ask),
        sy: 1 - 0.05 * droop,
        gy: 0.85 * droop * (1 - ask) - 0.45 * ask,
        openL: 1 - 0.3 * droop * (1 - ask) - 0.25 * Math.abs(shake),
        openR: 1 - 0.3 * droop * (1 - ask) - 0.25 * Math.abs(shake),
        eye: 1 + 0.08 * ask,
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
  { id: "filled", hold: 2.2 },
  { id: "scanning", hold: 3.6 },
  { id: "outOfRange", hold: 4.6 },
  { id: "alert", hold: 3.8 },
  { id: "waiting", hold: 3.4 },
  { id: "done", hold: 2.8 },
  { id: "stopping", hold: 2.8 },
  { id: "sleeping", hold: 4.2 },
  { id: "waking", hold: 3.2 },
  { id: "idle", hold: 3 },
];

/** Blink curve over 0..1 (320 ms): closes in the first 42%, opens in the rest. Returns openness. */
export function blinkOpen(u: number): number {
  if (u <= 0 || u >= 1) return 1;
  if (u < 0.42) return 1 - ease(u / 0.42);
  return ease((u - 0.42) / 0.58);
}

/** The pose a state gives at time t, with intensity applied and the head yaw in radians. */
export function evaluate(state: MotionState, t: number, ctx: MotionContext, intensity: number) {
  const p: Pose = { ...REST, ...state.pose(t, ctx) };
  for (const k of MOTION_FIELDS) p[k] *= intensity;
  p.sx = 1 + (p.sx - 1) * intensity;
  p.sy = 1 + (p.sy - 1) * intensity;
  // Spawning scales from 0: keep that whole whatever the intensity.
  if (state.id === "spawning" && t < 0.6) {
    const raw = state.pose(t, ctx);
    p.sx = raw.sx ?? 1;
    p.sy = raw.sy ?? 1;
  }
  return { pose: p, yaw: p.turn * (Math.PI / 2) + p.spin * TAU };
}

/** Wrap an angle to (−π, π]. */
export const wrapAngle = (a: number) => a - TAU * Math.floor((a + Math.PI) / TAU);

export { frac };
