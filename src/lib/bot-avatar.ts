/**
 * Bot avatars: flat faces (Figma: page "New design 2026", sections "Bot avatars v3 · Faces",
 * "Bot avatars v3 · Tech" and "Bot avatar editor").
 *
 * A bot's look is three independent choices: body shape, eye style and color
 * (12 × 8 × 8 = 768 per style). The body and each eye are separate paths, so one eye animation
 * (blink, look, scan, open, close) works on every shape. Two geometries share the same choices:
 * "soft" (round corners) and "tech" (45° chamfers, square eyes). Tech has two faces: dark
 * cut-out eyes, or body-colored eyes on a dark visor.
 *
 * Every bot gets a random 32-bit `avatarSeed` once, when it is created; until the user edits the
 * avatar, shape, eyes and color are a pure function of that seed. See docs/bot-avatars.md.
 */

import {
  GEO_EYES,
  GEO_SHAPE_LIST,
  GEO_STYLES,
  GEO_TWEAK,
  MATRIX_EYES,
  geoParts,
  type GeoLayer,
  type GeoStyle,
  type GeoTweak,
} from "./bot-avatar-geo";
import { CHARACTER_FACES } from "./bot-avatar-character";

/**
 * "character": the V1 Tech heads, flat, with personality (bot-avatar-character). v1 faces
 * ("soft", "tech", kept as the backup) and the round 2 treatments (see bot-avatar-geo).
 */
export type BotAvatarStyle = "character" | "soft" | "tech" | GeoStyle;
export type BotAvatarFace = "cutout" | "visor";
export type { GeoLayer as BotAvatarLayer, GeoTweak as BotAvatarTweak };
export { GEO_TWEAK as BOT_AVATAR_TWEAK };

/** Dark cut-out used for the eyes and the visor. */
export const BOT_AVATAR_DARK = "#0D1012";

/**
 * One color per bot. Brand mint, success green, earnings green, red and amber are left out on
 * purpose: they mean status or money, and an avatar must never look like one.
 * Order matters: the index is what gets stored.
 */
export const BOT_AVATAR_COLORS = [
  { name: "Blue", hex: "#2F9AFF" },
  { name: "Mint", hex: "#99FFE2" },
  { name: "Lime", hex: "#C8E58B" },
  { name: "Lilac", hex: "#B79CFF" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Pink", hex: "#FF8FC7" },
  { name: "Violet", hex: "#7A5CFF" },
  { name: "Sand", hex: "#E5D0B1" },
] as const;

type Pt = [number, number];
const f = (n: number) => +n.toFixed(2);

/** Closed polygon with every corner rounded by `r` (quadratic corners); `r` = 0 keeps them sharp. */
function poly(pts: Pt[], r: number): string {
  if (r <= 0) return `${pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join("")}Z`;
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const v = pts[i];
    const toward = (p: Pt): Pt => {
      const dx = p[0] - v[0];
      const dy = p[1] - v[1];
      const l = Math.hypot(dx, dy);
      return [v[0] + (dx / l) * r, v[1] + (dy / l) * r];
    };
    const a = toward(pts[(i - 1 + n) % n]);
    const b = toward(pts[(i + 1) % n]);
    d += `${i ? "L" : "M"}${f(a[0])} ${f(a[1])}Q${v[0]} ${v[1]} ${f(b[0])} ${f(b[1])}`;
  }
  return `${d}Z`;
}

/** Rectangle centered on (cx, cy), optionally with rounded corners. */
function box(cx: number, cy: number, w: number, h: number, r = 0): string {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const q = f(Math.min(r, w / 2, h / 2));
  if (q <= 0) return `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
  return (
    `M${f(x + q)} ${f(y)}h${f(w - 2 * q)}a${q} ${q} 0 0 1 ${q} ${q}v${f(h - 2 * q)}a${q} ${q} 0 0 1 ${-q} ${q}` +
    `h${f(-(w - 2 * q))}a${q} ${q} 0 0 1 ${-q} ${-q}v${f(-(h - 2 * q))}a${q} ${q} 0 0 1 ${q} ${-q}Z`
  );
}

/** Body outline in a 56 × 56 box, plus the point the eyes are centered on. */
export type BotAvatarShape = { name: string; d: string; eye: Pt };
/** Left and right eye paths for an eye center and a scale `k`; `h` = eye height at k = 1. */
export type BotAvatarEyes = {
  name: string;
  h: number;
  draw: (cx: number, cy: number, k: number) => [string, string];
  /** Character faces: left and right brow (or lid), drawn dark like the eyes. */
  brows?: (cx: number, cy: number, k: number) => [string, string];
  /** Character faces: a small dark mouth. */
  mouth?: (cx: number, cy: number, k: number) => string;
};

const PLUS: Pt[] = [[16, 2], [40, 2], [40, 16], [54, 16], [54, 40], [40, 40], [40, 54], [16, 54], [16, 40], [2, 40], [2, 16], [16, 16]];
const HEX: Pt[] = [[15, 4], [41, 4], [54, 28], [41, 52], [15, 52], [2, 28]];
const DIAMOND: Pt[] = [[28, 1], [55, 28], [28, 55], [1, 28]];
const TAB: Pt[] = [[3, 3], [37, 3], [53, 19], [53, 53], [3, 53]];

const SOFT_SHAPES: BotAvatarShape[] = [
  { name: "Circle", d: "M28 2A26 26 0 0 1 28 54A26 26 0 0 1 28 2Z", eye: [28, 28] },
  { name: "Square", d: poly([[3, 3], [53, 3], [53, 53], [3, 53]], 11), eye: [28, 28] },
  { name: "Hexagon", d: poly(HEX, 7), eye: [28, 28] },
  { name: "Triangle", d: poly([[28, 3], [54, 51], [2, 51]], 9), eye: [28, 37] },
  { name: "Diamond", d: poly(DIAMOND, 8), eye: [28, 28] },
  { name: "Plus", d: poly(PLUS, 7), eye: [28, 28] },
  { name: "Arch", d: "M4 46V28A24 24 0 0 1 52 28V46A6 6 0 0 1 46 52H10A6 6 0 0 1 4 46Z", eye: [28, 31] },
  { name: "Leaf", d: "M3 29A26 26 0 0 1 29 3H47A6 6 0 0 1 53 9V27A26 26 0 0 1 27 53H9A6 6 0 0 1 3 47Z", eye: [28, 28] },
  { name: "Pill", d: "M19 10H37A18 18 0 0 1 37 46H19A18 18 0 0 1 19 10Z", eye: [28, 28] },
  { name: "Pentagon", d: poly([[28, 2], [54, 21], [44, 52], [12, 52], [2, 21]], 8), eye: [28, 30] },
  { name: "Tab", d: poly(TAB, 7), eye: [27, 31] },
  { name: "Cloud", d: "M14 50A11.5 11.5 0 0 1 8 29A12.5 12.5 0 0 1 26 13A12.5 12.5 0 0 1 47 24A13.5 13.5 0 0 1 42 50Z", eye: [28, 33] },
];

const smile = (x: number, y: number, k: number) =>
  `M${f(x - 5.5 * k)} ${f(y + 3 * k)}a${f(5.5 * k)} ${f(5.5 * k)} 0 0 1 ${f(11 * k)} 0h${f(-4 * k)}a${f(1.5 * k)} ${f(1.5 * k)} 0 0 0 ${f(-3 * k)} 0z`;

const SOFT_EYES: BotAvatarEyes[] = [
  { name: "Bars", h: 14, draw: (x, y, k) => [box(x - 6.5 * k, y, 6 * k, 14 * k, 3 * k), box(x + 6.5 * k, y, 6 * k, 14 * k, 3 * k)] },
  { name: "Dots", h: 8, draw: (x, y, k) => [box(x - 7.5 * k, y, 8 * k, 8 * k, 4 * k), box(x + 7.5 * k, y, 8 * k, 8 * k, 4 * k)] },
  { name: "Look", h: 14, draw: (x, y, k) => [box(x - 2 * k, y - k, 6 * k, 14 * k, 3 * k), box(x + 11 * k, y - k, 6 * k, 14 * k, 3 * k)] },
  { name: "Smile", h: 5.5, draw: (x, y, k) => [smile(x - 8 * k, y, k), smile(x + 8 * k, y, k)] },
  { name: "Blink", h: 4, draw: (x, y, k) => [box(x - 8 * k, y + 2 * k, 10 * k, 4 * k, 2 * k), box(x + 8 * k, y + 2 * k, 10 * k, 4 * k, 2 * k)] },
  { name: "Wink", h: 14, draw: (x, y, k) => [box(x - 6.5 * k, y, 6 * k, 14 * k, 3 * k), box(x + 8 * k, y + 2 * k, 10 * k, 4 * k, 2 * k)] },
  { name: "Square", h: 7, draw: (x, y, k) => [box(x - 7 * k, y, 7 * k, 7 * k, k), box(x + 7 * k, y, 7 * k, 7 * k, k)] },
  { name: "Tall", h: 18, draw: (x, y, k) => [box(x - 5 * k, y, 5 * k, 18 * k, 2.5 * k), box(x + 5 * k, y, 5 * k, 18 * k, 2.5 * k)] },
];

/** V1 Tech outlines as points, so the character style can redraw them with sharp corners. */
const TECH_OUTLINES: { name: string; pts: Pt[]; r: number; eye: Pt }[] = [
  { name: "Octagon", pts: [[14, 3], [42, 3], [53, 14], [53, 42], [42, 53], [14, 53], [3, 42], [3, 14]], r: 1.5, eye: [28, 28] },
  { name: "Block", pts: [[3, 3], [53, 3], [53, 53], [3, 53]], r: 2, eye: [28, 28] },
  { name: "Hexagon", pts: HEX, r: 1.5, eye: [28, 28] },
  { name: "Shield", pts: [[4, 4], [52, 4], [52, 32], [28, 54], [4, 32]], r: 1.5, eye: [28, 22] },
  { name: "Diamond", pts: DIAMOND, r: 1.5, eye: [28, 28] },
  { name: "Cut", pts: TAB, r: 1.5, eye: [27, 31] },
  { name: "Twin cut", pts: [[17, 3], [53, 3], [53, 39], [39, 53], [3, 53], [3, 17]], r: 1.5, eye: [28, 28] },
  { name: "Chip", pts: [[3, 3], [53, 3], [53, 21], [48, 21], [48, 35], [53, 35], [53, 53], [3, 53], [3, 35], [8, 35], [8, 21], [3, 21]], r: 1, eye: [28, 28] },
  { name: "Trapezoid", pts: [[13, 5], [43, 5], [54, 51], [2, 51]], r: 1.5, eye: [28, 33] },
  { name: "Slab", pts: [[10, 11], [46, 11], [54, 19], [54, 37], [46, 45], [10, 45], [2, 37], [2, 19]], r: 1.5, eye: [28, 28] },
  { name: "Step", pts: [[19, 3], [53, 3], [53, 53], [3, 53], [3, 19], [19, 19]], r: 1.5, eye: [28, 35] },
  { name: "Cross", pts: PLUS, r: 1.5, eye: [28, 28] },
];

const TECH_SHAPES: BotAvatarShape[] = TECH_OUTLINES.map((o) => ({ name: o.name, d: poly(o.pts, o.r), eye: o.eye }));

/** The character heads: the same V1 Tech outlines, with corners rounded by `corner` (0 = sharp). */
const characterShapes = (corner: number): BotAvatarShape[] =>
  TECH_OUTLINES.map((o) => ({ name: o.name, d: poly(o.pts, Math.min(corner, o.r * 2)), eye: o.eye }));
const CHARACTER_SHAPES = characterShapes(GEO_TWEAK.corner);

const bracket = (cx: number, y: number, side: 1 | -1, k: number) => {
  const w = 6 * k;
  const h = 14 * k;
  const t = 2.2 * k;
  const x0 = cx - (side * w) / 2;
  return `M${f(x0)} ${f(y - h / 2)}h${f(side * w)}v${f(t)}h${f(-side * (w - t))}v${f(h - 2 * t)}h${f(side * (w - t))}v${f(t)}h${f(-side * w)}z`;
};
const segments = (cx: number, y: number, k: number) => box(cx, y - 4 * k, 6 * k, 6 * k) + box(cx, y + 4 * k, 6 * k, 6 * k);

const TECH_EYES: BotAvatarEyes[] = [
  { name: "Bars", h: 14, draw: (x, y, k) => [box(x - 6.5 * k, y, 5 * k, 14 * k, 0.5), box(x + 6.5 * k, y, 5 * k, 14 * k, 0.5)] },
  { name: "Pixels", h: 7, draw: (x, y, k) => [box(x - 7.5 * k, y, 7 * k, 7 * k), box(x + 7.5 * k, y, 7 * k, 7 * k)] },
  { name: "Look", h: 14, draw: (x, y, k) => [box(x - 2 * k, y - k, 5 * k, 14 * k, 0.5), box(x + 11 * k, y - k, 5 * k, 14 * k, 0.5)] },
  { name: "Slits", h: 3, draw: (x, y, k) => [box(x - 8 * k, y, 10 * k, 3 * k), box(x + 8 * k, y, 10 * k, 3 * k)] },
  { name: "Wink", h: 14, draw: (x, y, k) => [box(x - 6.5 * k, y, 5 * k, 14 * k, 0.5), box(x + 8 * k, y + 5.5 * k, 10 * k, 3 * k)] },
  { name: "Tall", h: 18, draw: (x, y, k) => [box(x - 5 * k, y, 4 * k, 18 * k, 0.5), box(x + 5 * k, y, 4 * k, 18 * k, 0.5)] },
  { name: "Brackets", h: 14, draw: (x, y, k) => [bracket(x - 7 * k, y, 1, k), bracket(x + 7 * k, y, -1, k)] },
  { name: "Segments", h: 14, draw: (x, y, k) => [segments(x - 6.5 * k, y, k), segments(x + 6.5 * k, y, k)] },
];

export const BOT_AVATAR_PARTS: Record<BotAvatarStyle, { shapes: BotAvatarShape[]; eyes: BotAvatarEyes[] }> = {
  character: { shapes: CHARACTER_SHAPES, eyes: CHARACTER_FACES },
  soft: { shapes: SOFT_SHAPES, eyes: SOFT_EYES },
  tech: { shapes: TECH_SHAPES, eyes: TECH_EYES },
  shard: { shapes: GEO_SHAPE_LIST, eyes: GEO_EYES },
  sigil: { shapes: GEO_SHAPE_LIST, eyes: GEO_EYES },
  matrix: { shapes: GEO_SHAPE_LIST, eyes: MATRIX_EYES },
  halo: { shapes: GEO_SHAPE_LIST, eyes: GEO_EYES },
};

/** Looks per style: shapes × eyes × colors. */
export const BOT_AVATAR_CAPACITY = SOFT_SHAPES.length * SOFT_EYES.length * BOT_AVATAR_COLORS.length;

/** What is stored for a bot: three indices. The same indices work in both styles. */
export type BotAvatar = { shape: number; eyes: number; color: number };

/** One number per look, for the per-account uniqueness check: shape × 64 + eyes × 8 + color. */
export function botAvatarSignature(a: BotAvatar): number {
  return a.shape * 64 + a.eyes * 8 + a.color;
}

/** Deterministic PRNG (mulberry32). Same seed, same avatar, on any platform. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The avatar a new bot starts with. Order of the picks is part of the contract: shape, eyes, color. */
export function botAvatarFromSeed(seed: number): BotAvatar {
  const rnd = mulberry32(seed);
  const pick = (n: number) => Math.floor(rnd() * n);
  return { shape: pick(SOFT_SHAPES.length), eyes: pick(SOFT_EYES.length), color: pick(BOT_AVATAR_COLORS.length) };
}

/**
 * Eye scale per style and face: tech cut-outs are 15% larger, visor eyes sit smaller inside the
 * visor, character faces are 25% larger so brows and mouths still read at 24 px.
 */
const EYE_SCALE: Record<"soft" | "tech" | "visor" | "character", number> = { soft: 1, tech: 1.15, visor: 0.78, character: 1.25 };

const isGeo = (style: BotAvatarStyle): style is GeoStyle => (GEO_STYLES as readonly string[]).includes(style);

/** Vertical scale that turns eyes of height `h` into a thin closed line (≈2.6 units tall). */
const closedFor = (h: number) => f(Math.min(1, Math.max(0.15, 2.6 / h)));

/** Paths ready to draw in a `0 0 56 56` viewBox. */
export function botAvatarParts(
  avatar: BotAvatar,
  style: BotAvatarStyle = "tech",
  face: BotAvatarFace = "cutout",
  tweak: GeoTweak = GEO_TWEAK,
) {
  const color = BOT_AVATAR_COLORS[avatar.color % BOT_AVATAR_COLORS.length];
  if (isGeo(style)) {
    const g = geoParts(style, avatar, color.hex, BOT_AVATAR_DARK, tweak);
    return {
      body: g.body,
      center: g.center,
      color: color.hex,
      /** Body fill: the bot color, or a dark tint of it for outlined heads. */
      fill: g.fill,
      /** Outline in screen px, for the outlined treatment. */
      stroke: g.stroke,
      /** Drawn inside the body, over the fill: facets, construction lines, marks. */
      details: g.details,
      /** Drawn around the head and moving with it: halos, antennas, horns. */
      ornaments: g.ornaments,
      visor: null as string | null,
      eyeColor: g.eyeColor,
      eyes: g.eyes,
      /** Character faces only: brows (or lids) and mouth, dark like the eyes. */
      brows: null as readonly [string, string] | null,
      mouth: null as string | null,
      grid: g.grid,
      /** No floor shadow and no dark side on turns. */
      flat: g.flat,
      closedScale: closedFor(g.eyeH),
      label: `${g.shapeName}, ${g.eyeName}, ${color.name}`,
    };
  }
  const { shapes, eyes } = BOT_AVATAR_PARTS[style];
  const character = style === "character";
  const shapeList = character && tweak.corner !== GEO_TWEAK.corner ? characterShapes(tweak.corner) : shapes;
  const shape = shapeList[avatar.shape % shapeList.length];
  const eyeDef = eyes[avatar.eyes % eyes.length];
  const visor = style === "tech" && face === "visor";
  const k = visor ? EYE_SCALE.visor : character ? EYE_SCALE.character * tweak.eye : EYE_SCALE[style];
  const [cx, cy] = shape.eye;
  const [left, right] = eyeDef.draw(cx, cy, k);
  return {
    body: shape.d,
    /** Point the eyes are centered on: the face center, used for head turns. */
    center: shape.eye,
    color: color.hex,
    fill: color.hex,
    stroke: null as { color: string; width: number } | null,
    details: [] as GeoLayer[],
    ornaments: [] as GeoLayer[],
    visor: visor ? box(cx, cy, 32, 18, 1) : null,
    eyeColor: visor ? color.hex : BOT_AVATAR_DARK,
    eyes: [left, right] as const,
    brows: (eyeDef.brows?.(cx, cy, k) ?? null) as readonly [string, string] | null,
    mouth: eyeDef.mouth?.(cx, cy, k) ?? null,
    grid: null as number | null,
    /** The character heads are flat: no floor shadow, no dark side on turns. */
    flat: character,
    closedScale: closedFor(eyeDef.h * k),
    label: `${shape.name}, ${eyeDef.name}, ${color.name}`,
  };
}

export type BotAvatarParts = ReturnType<typeof botAvatarParts>;

/** Deterministic list of demo seeds. */
export function botSeedSequence(start: number, count: number): number[] {
  const random = mulberry32(start);
  return Array.from({ length: count }, () => Math.floor(random() * 4294967296) >>> 0);
}

/**
 * Demo seeds whose looks never repeat, so the preview shows what the backend guarantees:
 * no two bots of one account share a face.
 */
export function uniqueBotSeeds(start: number, count: number): number[] {
  const random = mulberry32(start);
  const seen = new Set<number>();
  const out: number[] = [];
  while (out.length < count) {
    const seed = Math.floor(random() * 4294967296) >>> 0;
    const sig = botAvatarSignature(botAvatarFromSeed(seed));
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(seed);
  }
  return out;
}

/** A fresh random seed (crypto-grade; browser, Node 19+ and edge runtimes). */
export function newBotAvatarSeed(): number {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}

/**
 * Server side, when a bot is created (or in the backfill): draw seeds until the look is free
 * inside this user's bots. `isTakenForUser(signature)` checks the (user_id, avatar_signature)
 * UNIQUE index; the insert must still rely on the constraint and retry on a conflict.
 */
export async function assignBotAvatar(
  isTakenForUser: (signature: number) => Promise<boolean>,
  maxAttempts = 50,
): Promise<{ seed: number; signature: number }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = newBotAvatarSeed();
    const signature = botAvatarSignature(botAvatarFromSeed(seed));
    if (!(await isTakenForUser(signature))) return { seed, signature };
  }
  throw new Error(`No free bot avatar after ${maxAttempts} attempts.`);
}
