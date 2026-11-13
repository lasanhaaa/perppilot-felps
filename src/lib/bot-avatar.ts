/**
 * Generated bot avatars (Figma: page "New design 2026", section "Bot avatars · Generative system").
 *
 * Every bot gets a random 32-bit `avatarSeed` once, when it is created. The avatar is a pure
 * function of that seed: a 7×7 mirrored pixel robot built from parts (antenna, head, eyes,
 * mouth, base) in one color. Same family as the 5×5 user avatars on the leaderboard, but it
 * always reads as a face, and the background is tinted with the avatar color instead of white.
 *
 * Uniqueness is per account: store `signature` and keep (user_id, signature) UNIQUE, so a user
 * never sees two bots with the same robot. See docs/bot-avatars.md.
 */

export const BOT_AVATAR_GRID = 7;
export const BOT_AVATAR_VERSION = 1;

/**
 * One color per bot. Brand mint, success green, earnings green, red and amber are left out on
 * purpose: they mean status or money, and an avatar must never look like one. Gray was dropped
 * too: a gray robot reads as a skull.
 * Order matters: it is part of the signature.
 */
export const BOT_AVATAR_PALETTE = ["#2F9AFF", "#99FFE2", "#C8E58B", "#B79CFF"] as const;
/** Background = the avatar color at this opacity. */
export const BOT_AVATAR_BACKGROUND_OPACITY = 0.12;

type Cell = [col: number, row: number];
type Part = { name: string; cells: Cell[] };

/** Cells of the left half only (columns 0-3, column 3 is the center); the right half is mirrored. */
const rect = (c0: number, c1: number, r0: number, r1: number): Cell[] => {
  const out: Cell[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push([c, r]);
  return out;
};

/** Row 0. */
export const ANTENNAS: Part[] = [
  { name: "None", cells: [] },
  { name: "Mast", cells: [[3, 0]] },
  { name: "Twin", cells: [[1, 0]] },
  { name: "Crown", cells: [[2, 0], [3, 0]] },
  { name: "Horns", cells: [[0, 0]] },
];
/** Rows 1-5. */
export const HEADS: Part[] = [
  { name: "Box", cells: rect(1, 3, 1, 5) },
  { name: "Round", cells: rect(1, 3, 1, 5).filter(([c, r]) => !(c === 1 && (r === 1 || r === 5))) },
  { name: "Wide", cells: [...rect(0, 3, 2, 4), ...rect(1, 3, 1, 1), ...rect(1, 3, 5, 5)] },
  { name: "Ears", cells: [...rect(1, 3, 1, 5), [0, 3]] },
  { name: "Helmet", cells: [...rect(1, 3, 1, 5), [0, 1]] },
  { name: "Jaw", cells: [...rect(1, 3, 1, 4), ...rect(2, 3, 5, 5)] },
];
/** Cut out of the head. */
export const EYES: Part[] = [
  { name: "Dots", cells: [[2, 2]] },
  { name: "Tall", cells: [[2, 2], [2, 3]] },
  { name: "Cyclops", cells: [[3, 2]] },
  { name: "Visor", cells: [[2, 2], [3, 2]] },
  { name: "Sleepy", cells: [[2, 3]] },
];
/** Cut out of the head, row 4. (A "grill" mouth was dropped: it read as teeth, a skull.) */
export const MOUTHS: Part[] = [
  { name: "None", cells: [] },
  { name: "Dot", cells: [[3, 4]] },
  { name: "Line", cells: [[2, 4], [3, 4]] },
];
/** Row 6. */
export const BASES: Part[] = [
  { name: "None", cells: [] },
  { name: "Neck", cells: [[3, 6]] },
  { name: "Shoulders", cells: [[1, 6], [2, 6], [3, 6]] },
  { name: "Legs", cells: [[2, 6]] },
];

export type BotAvatar = {
  antenna: number;
  head: number;
  eyes: number;
  mouth: number;
  base: number;
  /** Index into BOT_AVATAR_PALETTE. */
  color: number;
  /** Unique id of the picture inside BOT_AVATAR_CAPACITY. Store it; (user_id, signature) is UNIQUE. */
  signature: number;
};

/** 5 × 6 × 5 × 3 × 4 × 4 = 7,200 different robots. */
export const BOT_AVATAR_CAPACITY =
  ANTENNAS.length * HEADS.length * EYES.length * MOUTHS.length * BASES.length * BOT_AVATAR_PALETTE.length;

/** mulberry32: tiny deterministic 32-bit PRNG, same output in every JS engine. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pure: the robot drawn by a seed. Picks antenna, head, eyes, mouth, base, color, in that order. */
export function botAvatarFromSeed(seed: number): BotAvatar {
  const random = mulberry32(seed >>> 0);
  const pick = (n: number) => Math.floor(random() * n);
  const antenna = pick(ANTENNAS.length);
  const head = pick(HEADS.length);
  const eyes = pick(EYES.length);
  const mouth = pick(MOUTHS.length);
  const base = pick(BASES.length);
  const color = pick(BOT_AVATAR_PALETTE.length);
  let signature = antenna;
  signature = signature * HEADS.length + head;
  signature = signature * EYES.length + eyes;
  signature = signature * MOUTHS.length + mouth;
  signature = signature * BASES.length + base;
  signature = signature * BOT_AVATAR_PALETTE.length + color;
  return { antenna, head, eyes, mouth, base, color, signature };
}

/** Filled cells of the full 7×7 grid as [column, row] pairs, mirror included, eyes and mouth cut out. */
export function botAvatarCells(avatar: BotAvatar): Cell[] {
  const filled = new Set<number>();
  const key = (c: number, r: number) => r * BOT_AVATAR_GRID + c;
  const both = (fn: (k: number) => void) => ([c, r]: Cell) => {
    fn(key(c, r));
    fn(key(BOT_AVATAR_GRID - 1 - c, r));
  };
  const add = both((k) => filled.add(k));
  const cut = both((k) => filled.delete(k));
  [ANTENNAS[avatar.antenna], HEADS[avatar.head], BASES[avatar.base]].forEach((p) => p.cells.forEach(add));
  [EYES[avatar.eyes], MOUTHS[avatar.mouth]].forEach((p) => p.cells.forEach(cut));
  return [...filled].sort((a, b) => a - b).map((k) => [k % BOT_AVATAR_GRID, Math.floor(k / BOT_AVATAR_GRID)]);
}

/** Standalone SVG string (emails, OG images, server rendering). */
export function botAvatarSvg(seed: number, size = 56): string {
  const avatar = botAvatarFromSeed(seed);
  const fill = BOT_AVATAR_PALETTE[avatar.color];
  const g = BOT_AVATAR_GRID;
  const rects = botAvatarCells(avatar)
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1"/>`)
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${g} ${g}" shape-rendering="crispEdges">` +
    `<rect width="${g}" height="${g}" fill="${fill}" fill-opacity="${BOT_AVATAR_BACKGROUND_OPACITY}"/><g fill="${fill}">${rects}</g></svg>`
  );
}

/** Deterministic list of demo seeds (the Figma board uses botSeedSequence(20261113, 48)). */
export function botSeedSequence(start: number, count: number): number[] {
  const random = mulberry32(start);
  return Array.from({ length: count }, () => Math.floor(random() * 4294967296) >>> 0);
}

/** Seed as the 8-digit hex shown under each avatar in Figma, e.g. "2B7D9FE6". */
export function botSeedHex(seed: number): string {
  return (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

/** A fresh random seed (crypto-grade; browser, Node 19+ and edge runtimes). */
export function newBotAvatarSeed(): number {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}

/**
 * Server side, when a bot is created (or in the backfill): draw seeds until the robot is free
 * inside this user's bots. `isTakenForUser(signature)` checks the (user_id, signature) UNIQUE
 * index; the insert must still rely on the constraint and retry on a conflict.
 */
export async function assignBotAvatar(
  isTakenForUser: (signature: number) => Promise<boolean>,
  maxAttempts = 50,
): Promise<{ seed: number; signature: number }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = newBotAvatarSeed();
    const { signature } = botAvatarFromSeed(seed);
    if (!(await isTakenForUser(signature))) return { seed, signature };
  }
  throw new Error(`No free bot avatar after ${maxAttempts} attempts.`);
}
