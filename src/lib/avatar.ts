/**
 * Generated pixel avatars (Figma: section "Leaderboard", board "Avatar / Generative system").
 *
 * Every user gets a random 32-bit `avatarSeed` once, at sign-up. The avatar is a pure
 * function of that seed, so the same seed draws the same picture on every device, and
 * the server can guarantee that no two users share a picture by storing the avatar's
 * `signature` in a UNIQUE column. See docs/generated-avatars.md.
 *
 * Never derive the seed from the username (many users share the same first 4 letters)
 * or from the user id (it would make the avatar guessable).
 */

/** One color per avatar, from the PerpPilot styleguide. Order matters: it is part of the signature. */
export const AVATAR_PALETTE = ["#2FE8B4", "#2F9AFF", "#99FFE2", "#C8E58B", "#2ABB78", "#D6D4D6"] as const;
/** Cell background behind the pixels. */
export const AVATAR_BACKGROUND = "rgba(255, 255, 255, 0.06)";

/** 5×5 grid. Columns 1-3 are random, columns 4-5 mirror columns 2-1. */
export const AVATAR_GRID = 5;
const FREE_COLUMNS = 3;
const FREE_CELLS = AVATAR_GRID * FREE_COLUMNS; // 15
/** Patterns with fewer or more filled cells (out of the 15 free ones) look empty or like a block. */
const MIN_FILLED = 6;
const MAX_FILLED = 11;

/** Bumped if the grid, palette or rules ever change (for example a 7×7 v2). */
export const AVATAR_VERSION = 1;

export type Avatar = {
  /** 15 bits, bit `row * 3 + col` is the cell at (row, col) for col 0-2. */
  bits: number;
  /** Index into AVATAR_PALETTE. */
  color: number;
  /** Unique id of the picture: color * 2^15 + bits. Store it in a UNIQUE column. */
  signature: number;
};

/** mulberry32: tiny, fast, deterministic 32-bit PRNG. Same output in every JS engine. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function popcount(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>>= 1;
  }
  return count;
}

/** Pure: the avatar drawn by a seed. Re-rolls inside the same PRNG until 6-11 of the 15 cells are filled. */
export function avatarFromSeed(seed: number): Avatar {
  const random = mulberry32(seed >>> 0);
  let bits = 0;
  let filled = 0;
  do {
    bits = 0;
    for (let i = 0; i < FREE_CELLS; i++) if (random() < 0.5) bits |= 1 << i;
    filled = popcount(bits);
  } while (filled < MIN_FILLED || filled > MAX_FILLED);
  const color = Math.floor(random() * AVATAR_PALETTE.length);
  return { bits, color, signature: color * 2 ** FREE_CELLS + bits };
}

/** Filled cells of the full 5×5 grid as [column, row] pairs, mirror included. */
export function avatarCells(avatar: Avatar): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < AVATAR_GRID; row++) {
    for (let col = 0; col < FREE_COLUMNS; col++) {
      if (!(avatar.bits & (1 << (row * FREE_COLUMNS + col)))) continue;
      cells.push([col, row]);
      const mirror = AVATAR_GRID - 1 - col;
      if (mirror !== col) cells.push([mirror, row]);
    }
  }
  return cells;
}

/** Standalone SVG string (for emails, OG images, server rendering). Viewbox is 5×5, scale with `size`. */
export function avatarSvg(seed: number, size = 40): string {
  const avatar = avatarFromSeed(seed);
  const fill = AVATAR_PALETTE[avatar.color];
  const rects = avatarCells(avatar)
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1"/>`)
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 5 5" shape-rendering="crispEdges">` +
    `<rect width="5" height="5" fill="#FFFFFF" fill-opacity="0.06"/><g fill="${fill}">${rects}</g></svg>`
  );
}

/** Deterministic list of demo seeds (the Figma board uses seedSequence(20261109, 96)). */
export function seedSequence(start: number, count: number): number[] {
  const random = mulberry32(start);
  return Array.from({ length: count }, () => Math.floor(random() * 4294967296) >>> 0);
}

/** Seed as the 8-digit hex shown under each avatar in Figma, e.g. "91BD8E12". */
export function seedHex(seed: number): string {
  return (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

/** A fresh random seed (crypto-grade, works in the browser, Node 19+ and edge runtimes). */
export function newAvatarSeed(): number {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}

/** Total different pictures in v1: 27,248 valid patterns × 6 colors. */
export const AVATAR_CAPACITY = 163_488;

/**
 * Server side, at sign-up or in the backfill: draw seeds until the picture is free.
 * `isTaken(signature)` checks the UNIQUE column; the insert itself must still rely on the
 * constraint (and retry on a conflict) so two sign-ups at the same moment cannot collide.
 */
export async function assignUniqueAvatar(
  isTaken: (signature: number) => Promise<boolean>,
  maxAttempts = 50,
): Promise<{ seed: number; signature: number }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = newAvatarSeed();
    const { signature } = avatarFromSeed(seed);
    if (!(await isTaken(signature))) return { seed, signature };
  }
  throw new Error("No free avatar after " + maxAttempts + " attempts: time for the 7×7 v2 grid.");
}
