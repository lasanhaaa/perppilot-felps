/**
 * "Glyph" heads and small eyes (2026-11-14, exploration).
 *
 * felipe: some heads are too basic (square, hexagon, diamond), some do not work (the slim round 2
 * set), and the eyes are too big. Reference: an agent mascot drawn as one flat silhouette with
 * notches, ears, legs and bites, and two small square eyes set close together.
 *
 * Every head is built from one grammar so the set reads as a family: a core block, a corner
 * treatment per corner (square, cut, inner notch, scoop) and features on each edge (V notch or
 * point, slot or tab, trapezoid tab, concave bite, convex bump). Corners stay sharp; the only
 * curves are the bites and bumps.
 */

import type { BotAvatarEyes, BotAvatarShape } from "./bot-avatar";

type V = [number, number];
const f = (n: number) => +n.toFixed(2);
const pt = (p: V) => `${f(p[0])} ${f(p[1])}`;

/** Corner treatment, with its size in face units. */
type Corner = "sq" | ["cut" | "notch" | "scoop", number];
/**
 * Edge feature, centered at `at` (0..1 along the edge, default the middle).
 * v: notch of width w and depth d (negative d points out). slot: rectangular cut (negative d is a
 * tab). trap: trapezoid tab, base w, top t, height h. bite / bump: half circle of radius r.
 */
type Feature =
  | { k: "v" | "slot"; w: number; d: number; at?: number }
  | { k: "trap"; w: number; t: number; h: number; at?: number }
  | { k: "bite" | "bump"; r: number; at?: number };

type Glyph = {
  name: string;
  /** Core block: x0, y0, x1, y1. */
  core: [number, number, number, number];
  /** Top left, top right, bottom right, bottom left. */
  corners?: [Corner, Corner, Corner, Corner];
  /** Top, right, bottom, left (each traced clockwise). */
  edges?: [Feature[]?, Feature[]?, Feature[]?, Feature[]?];
  eye: V;
};

const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k];

function glyphPath(g: Glyph): string {
  const [x0, y0, x1, y1] = g.core;
  const C: V[] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const corners = g.corners ?? ["sq", "sq", "sq", "sq"];
  const edges = g.edges ?? [];
  const U: V[] = C.map((c, i) => {
    const d = C[(i + 1) % 4];
    const l = Math.hypot(d[0] - c[0], d[1] - c[1]);
    return [(d[0] - c[0]) / l, (d[1] - c[1]) / l];
  });
  const off = (c: Corner) => (c === "sq" ? 0 : c[1]);

  let d = `M${pt(add(C[0], U[0], off(corners[0])))}`;
  for (let i = 0; i < 4; i++) {
    const u = U[i];
    const n: V = [u[1], -u[0]]; // outward normal
    const L = Math.hypot(C[(i + 1) % 4][0] - C[i][0], C[(i + 1) % 4][1] - C[i][1]);
    const P = (t: number, h: number): V => add(add(C[i], u, t), n, h);
    const feats = [...(edges[i] ?? [])].sort((a, b) => (a.at ?? 0.5) - (b.at ?? 0.5));
    for (const ft of feats) {
      const m = (ft.at ?? 0.5) * L;
      if (ft.k === "v") d += `L${pt(P(m - ft.w / 2, 0))}L${pt(P(m, -ft.d))}L${pt(P(m + ft.w / 2, 0))}`;
      else if (ft.k === "slot")
        d += `L${pt(P(m - ft.w / 2, 0))}L${pt(P(m - ft.w / 2, -ft.d))}L${pt(P(m + ft.w / 2, -ft.d))}L${pt(P(m + ft.w / 2, 0))}`;
      else if (ft.k === "trap")
        d += `L${pt(P(m - ft.w / 2, 0))}L${pt(P(m - ft.t / 2, ft.h))}L${pt(P(m + ft.t / 2, ft.h))}L${pt(P(m + ft.w / 2, 0))}`;
      else if (ft.k === "bite" || ft.k === "bump") {
        const sweep = ft.k === "bump" ? 1 : 0;
        d += `L${pt(P(m - ft.r, 0))}A${ft.r} ${ft.r} 0 0 ${sweep} ${pt(P(m + ft.r, 0))}`;
      }
    }
    // The corner at the end of this edge.
    const j = (i + 1) % 4;
    const c = corners[j];
    const Cj = C[j];
    const uo = U[j];
    if (c === "sq") {
      d += `L${pt(Cj)}`;
      continue;
    }
    const [kind, s] = c;
    const A = add(Cj, u, -s);
    const B = add(Cj, uo, s);
    d += `L${pt(A)}`;
    if (kind === "cut") d += `L${pt(B)}`;
    else if (kind === "notch") d += `L${pt(add(A, uo, s))}L${pt(B)}`;
    else d += `A${s} ${s} 0 0 0 ${pt(B)}`;
  }
  return `${d}Z`;
}

const third = 40 / 3;

const GLYPHS: Glyph[] = [
  {
    name: "Moth",
    core: [8, 8, 48, 48],
    edges: [[{ k: "v", w: 14, d: 7 }], [{ k: "bite", r: 6 }], [{ k: "v", w: 14, d: 8 }], [{ k: "bite", r: 6 }]],
    eye: [28, 25],
  },
  {
    name: "Beetle",
    core: [9, 8, 47, 48],
    corners: ["sq", "sq", ["cut", 5], ["cut", 5]],
    edges: [[{ k: "slot", w: 12, d: 7 }], [], [{ k: "slot", w: 10, d: 8 }]],
    eye: [28, 26],
  },
  {
    name: "Owl",
    core: [8, 8, 48, 48],
    corners: ["sq", "sq", ["cut", 6], ["cut", 6]],
    edges: [[{ k: "v", w: 40, d: 10 }]],
    eye: [28, 31],
  },
  {
    name: "Crown",
    core: [8, 10, 48, 48],
    corners: ["sq", "sq", ["cut", 5], ["cut", 5]],
    edges: [[{ k: "v", w: third, d: 8, at: 1 / 3 }, { k: "v", w: third, d: 8, at: 2 / 3 }]],
    eye: [28, 31],
  },
  {
    name: "Spark",
    core: [6, 6, 50, 50],
    corners: [["scoop", 14], ["scoop", 14], ["scoop", 14], ["scoop", 14]],
    eye: [28, 27],
  },
  {
    name: "Gear",
    core: [7, 7, 49, 49],
    corners: [["cut", 9], ["cut", 9], ["cut", 9], ["cut", 9]],
    edges: [[{ k: "slot", w: 8, d: 4 }], [{ k: "slot", w: 8, d: 4 }], [{ k: "slot", w: 8, d: 4 }], [{ k: "slot", w: 8, d: 4 }]],
    eye: [28, 27],
  },
  {
    name: "Walker",
    core: [8, 6, 48, 50],
    corners: [["cut", 8], ["cut", 8], "sq", "sq"],
    edges: [[], [], [{ k: "slot", w: 14, d: 14 }]],
    eye: [28, 21],
  },
  {
    name: "Plug",
    core: [10, 15, 46, 50],
    corners: ["sq", "sq", ["cut", 5], ["cut", 5]],
    edges: [[{ k: "slot", w: 6, d: -9, at: 0.25 }, { k: "slot", w: 6, d: -9, at: 0.75 }]],
    eye: [28, 31],
  },
  {
    name: "Helmet",
    core: [7, 12, 49, 48],
    corners: ["sq", "sq", ["cut", 9], ["cut", 9]],
    edges: [[{ k: "bump", r: 11 }], [{ k: "slot", w: 10, d: -5, at: 0.4 }], [], [{ k: "slot", w: 10, d: -5, at: 0.6 }]],
    eye: [28, 27],
  },
  {
    name: "Ticket",
    core: [6, 10, 50, 46],
    corners: [["scoop", 7], ["scoop", 7], ["scoop", 7], ["scoop", 7]],
    edges: [[], [{ k: "bite", r: 5 }], [], [{ k: "bite", r: 5 }]],
    eye: [28, 27],
  },
  {
    name: "Hourglass",
    core: [9, 5, 47, 51],
    edges: [[], [{ k: "v", w: 30, d: 7 }], [], [{ k: "v", w: 30, d: 7 }]],
    eye: [28, 17],
  },
  {
    name: "Totem",
    core: [14, 5, 42, 51],
    corners: [["cut", 4], ["cut", 4], ["cut", 4], ["cut", 4]],
    edges: [[{ k: "v", w: 8, d: 4 }], [{ k: "slot", w: 12, d: -8, at: 0.5 }], [], [{ k: "slot", w: 12, d: -8, at: 0.5 }]],
    eye: [28, 18],
  },
  {
    name: "Mantis",
    core: [10, 12, 46, 50],
    edges: [
      [{ k: "trap", w: 8, t: 3, h: 9, at: 0.17 }, { k: "trap", w: 8, t: 3, h: 9, at: 0.83 }],
      [{ k: "bite", r: 4, at: 0.62 }],
      [{ k: "v", w: 12, d: 7 }],
      [{ k: "bite", r: 4, at: 0.38 }],
    ],
    eye: [28, 26],
  },
  {
    name: "Badge",
    core: [8, 6, 48, 42],
    edges: [[{ k: "slot", w: 10, d: 5 }], [], [{ k: "v", w: 40, d: -11 }]],
    eye: [28, 23],
  },
  {
    name: "Lantern",
    core: [10, 11, 46, 45],
    corners: [["scoop", 5], ["scoop", 5], ["scoop", 5], ["scoop", 5]],
    edges: [[{ k: "slot", w: 16, d: -6 }], [], [{ k: "slot", w: 16, d: -6 }]],
    eye: [28, 27],
  },
  {
    name: "Comet",
    core: [5, 8, 41, 48],
    corners: ["sq", "sq", ["cut", 6], "sq"],
    edges: [[{ k: "v", w: 10, d: 6, at: 0.4 }], [{ k: "bump", r: 11 }], [{ k: "slot", w: 8, d: 7, at: 0.4 }], [{ k: "bite", r: 5 }]],
    eye: [23, 25],
  },
  {
    name: "Rune",
    core: [6, 6, 50, 50],
    corners: [["notch", 11], ["notch", 11], ["notch", 11], ["notch", 11]],
    edges: [[{ k: "v", w: 10, d: 4 }], [{ k: "v", w: 10, d: 4 }], [{ k: "v", w: 10, d: 4 }], [{ k: "v", w: 10, d: 4 }]],
    eye: [28, 27],
  },
  {
    name: "Bolt",
    core: [7, 7, 49, 49],
    corners: ["sq", ["cut", 15], "sq", ["cut", 15]],
    edges: [[{ k: "v", w: 10, d: 5, at: 0.33 }], [], [{ k: "v", w: 10, d: 5, at: 0.33 }]],
    eye: [28, 28],
  },
];

export const GLYPH_SHAPES: BotAvatarShape[] = GLYPHS.map((g) => ({ name: g.name, d: glyphPath(g), eye: g.eye }));

/** Sharp rectangle centered on (cx, cy). */
const rect = (cx: number, cy: number, w: number, h: number) =>
  `M${f(cx - w / 2)} ${f(cy - h / 2)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const pair = (x: number, y: number, k: number, dx: number, w: number, h: number, dy = 0): [string, string] => [
  rect(x - dx * k, y + dy * k, w * k, h * k),
  rect(x + dx * k, y + dy * k, w * k, h * k),
];

/** Small eyes set close together: about a tenth of the head width, one eye apart. */
export const GLYPH_EYES: BotAvatarEyes[] = [
  { name: "Dots", h: 5, draw: (x, y, k) => pair(x, y, k, 5, 5, 5) },
  { name: "Tiny", h: 3.8, draw: (x, y, k) => pair(x, y, k, 4.2, 3.8, 3.8) },
  { name: "Wide", h: 5, draw: (x, y, k) => pair(x, y, k, 7.5, 5, 5) },
  { name: "Slits", h: 2.4, draw: (x, y, k) => pair(x, y, k, 5.5, 6.5, 2.4) },
  { name: "Bars", h: 7.5, draw: (x, y, k) => pair(x, y, k, 4.5, 3.2, 7.5) },
  { name: "Lids", h: 3, draw: (x, y, k) => pair(x, y, k, 5.5, 6, 3, 1) },
  {
    name: "Glance",
    h: 5,
    draw: (x, y, k) => [rect(x - 2 * k, y, 5 * k, 5 * k), rect(x + 8 * k, y, 5 * k, 5 * k)],
  },
  {
    // One eye, drawn as two halves that overlap by a hair so each side can still blink and turn.
    name: "Mono",
    h: 6,
    draw: (x, y, k) => [rect(x - 1.9 * k, y, 4 * k, 6 * k), rect(x + 1.9 * k, y, 4 * k, 6 * k)],
  },
];
