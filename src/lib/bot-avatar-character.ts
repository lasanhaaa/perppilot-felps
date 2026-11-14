/**
 * "Character" faces (2026-11-14): the V1 Tech heads, flat, with personality.
 *
 * felipe's brief: keep the V1 Tech silhouettes, no shadows, no engraved details, no colored eyes
 * or mouths; stay serious, geometric and tech, but give every bot a personality, the way
 * characterful bot avatars do. So each of the 8 faces is a small cast member built from the same
 * dark cut-outs as the V1 eyes: eyes, plus brows or lids, plus an optional small mouth.
 * Everything is a straight-edged polygon; nothing is curved.
 *
 * Offsets are face units around the eye center at k = 1 (the tech scale is 1.15).
 * Brows and mouth are separate paths, so the motion rig can move them on their own
 * (brows lift when the eyes widen, tilt on an alert, one brow rises while thinking).
 */

import type { BotAvatarEyes } from "./bot-avatar";

type Pt = [number, number];
const f = (n: number) => +n.toFixed(2);

/** Sharp rectangle at offset (dx, dy) from (x, y), sized w × h at k = 1. */
function rect(x: number, y: number, k: number, dx: number, dy: number, w: number, h: number): string {
  const cx = x + dx * k;
  const cy = y + dy * k;
  return `M${f(cx - (w * k) / 2)} ${f(cy - (h * k) / 2)}h${f(w * k)}v${f(h * k)}h${f(-w * k)}Z`;
}

/** Straight-edged polygon from offsets around (x, y). */
function shape(x: number, y: number, k: number, pts: Pt[]): string {
  return `${pts.map(([dx, dy], i) => `${i ? "L" : "M"}${f(x + dx * k)} ${f(y + dy * k)}`).join("")}Z`;
}

/** Same polygon on the other side of the face. */
const mirror = (pts: Pt[]): Pt[] => pts.map(([dx, dy]): Pt => [-dx, dy]).reverse();

/** A row of short vertical bars: the grille mouth. */
function grille(x: number, y: number, k: number, dy: number, at: number[], w: number, h: number): string {
  return at.map((dx) => rect(x, y, k, dx, dy, w, h)).join("");
}

const FOCUSED_L: Pt[] = [[-11, -3.6], [-4, -0.9], [-4, 4], [-11, 4]];
const CURIOUS_BROW_R: Pt[] = [[3.2, -6.2], [9.5, -8.6], [9.5, -11.1], [3.2, -8.7]];
const SLY_MOUTH: Pt[] = [[0, 9.8], [7, 8.2], [7, 10.4], [0, 12]];
const SHADES_L: Pt[] = [[-13.5, -3.2], [-1.8, -3.2], [-3, 3.6], [-11.5, 3.6]];

export const CHARACTER_FACES: BotAvatarEyes[] = [
  {
    // Calm and steady: square eyes under flat brows.
    name: "Stoic",
    h: 6.5,
    draw: (x, y, k) => [rect(x, y, k, -7.5, 0, 6.5, 6.5), rect(x, y, k, 7.5, 0, 6.5, 6.5)],
    brows: (x, y, k) => [rect(x, y, k, -7.5, -6.9, 9, 2.4), rect(x, y, k, 7.5, -6.9, 9, 2.4)],
  },
  {
    // Determined: the eye tops slope down toward the middle, a flat mouth.
    name: "Focused",
    h: 7.6,
    draw: (x, y, k) => [shape(x, y, k, FOCUSED_L), shape(x, y, k, mirror(FOCUSED_L))],
    mouth: (x, y, k) => rect(x, y, k, 0, 10, 7, 2.2),
  },
  {
    // Unimpressed: half-lidded eyes under heavy lids, a flat mouth off to one side.
    name: "Deadpan",
    h: 3.4,
    draw: (x, y, k) => [rect(x, y, k, -7.5, 1.4, 7, 3.4), rect(x, y, k, 7.5, 1.4, 7, 3.4)],
    brows: (x, y, k) => [rect(x, y, k, -7.5, -2.5, 9.5, 2.4), rect(x, y, k, 7.5, -2.5, 9.5, 2.4)],
    mouth: (x, y, k) => rect(x, y, k, 2.5, 9.4, 6, 1.9),
  },
  {
    // Asking: one big eye, one small, one brow raised, a small square mouth.
    name: "Curious",
    h: 7.5,
    draw: (x, y, k) => [rect(x, y, k, -7, 0, 7.5, 7.5), rect(x, y, k, 7.5, 0.9, 5, 5)],
    brows: (x, y, k) => [rect(x, y, k, -7, -7.4, 9, 2.3), shape(x, y, k, CURIOUS_BROW_R)],
    mouth: (x, y, k) => rect(x, y, k, 2, 9.8, 3.2, 3.2),
  },
  {
    // Watchful: one wide eye under one heavy brow, a grille mouth. The eye and the brow are two
    // halves that overlap by a hair, so the rig can still move each side.
    name: "Sentinel",
    h: 7.6,
    draw: (x, y, k) => [rect(x, y, k, -3.7, 0, 7.6, 7.6), rect(x, y, k, 3.7, 0, 7.6, 7.6)],
    brows: (x, y, k) => [rect(x, y, k, -4.2, -6.9, 8.6, 2.6), rect(x, y, k, 4.2, -6.9, 8.6, 2.6)],
    mouth: (x, y, k) => grille(x, y, k, 9.6, [-4.5, -1.5, 1.5, 4.5], 1.7, 3.4),
  },
  {
    // The talker: tall bar eyes over a speaker grille.
    name: "Talker",
    h: 10,
    draw: (x, y, k) => [rect(x, y, k, -6, -1.2, 4.6, 10), rect(x, y, k, 6, -1.2, 4.6, 10)],
    mouth: (x, y, k) => grille(x, y, k, 9.4, [-5.6, -2.8, 0, 2.8, 5.6], 1.9, 4),
  },
  {
    // Side-eye: both eyes glance to one side, a short slanted mouth.
    name: "Sly",
    h: 5.2,
    draw: (x, y, k) => [rect(x, y, k, -4.5, 0.4, 6, 5.2), rect(x, y, k, 9.5, 0.4, 6, 5.2)],
    mouth: (x, y, k) => shape(x, y, k, SLY_MOUTH),
  },
  {
    // Shades: two lenses joined by a bridge.
    name: "Shades",
    h: 6.8,
    draw: (x, y, k) => [shape(x, y, k, SHADES_L) + rect(x, y, k, 0, -2.4, 4.2, 1.6), shape(x, y, k, mirror(SHADES_L))],
  },
];
