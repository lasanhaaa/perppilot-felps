/**
 * "Glyph" heads: the final bot faces (felipe, 2026-11-16). Explored on 2026-11-14 with 18 heads and
 * small eyes; the final set keeps 10 glyph heads plus two V1 Tech heads, with the V1 Tech eyes.
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

import type { BotAvatarShape } from "./bot-avatar";

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
    eye: [28, 26],
  },
  {
    name: "Beetle",
    core: [9, 8, 47, 48],
    corners: ["sq", "sq", ["cut", 5], ["cut", 5]],
    edges: [[{ k: "slot", w: 12, d: 7 }], [], [{ k: "slot", w: 10, d: 8 }]],
    eye: [28, 27.5],
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
    eye: [28, 32],
  },
  {
    name: "Badge",
    core: [8, 6, 48, 42],
    edges: [[{ k: "slot", w: 10, d: 5 }], [], [{ k: "v", w: 40, d: -11 }]],
    eye: [28, 24],
  },
  {
    name: "Bolt",
    core: [7, 7, 49, 49],
    corners: ["sq", ["cut", 15], "sq", ["cut", 15]],
    edges: [[{ k: "v", w: 10, d: 5, at: 0.33 }], [], [{ k: "v", w: 10, d: 5, at: 0.33 }]],
    eye: [28, 28],
  },
];

/**
 * Two V1 Tech heads felipe kept (Step, Twin cut), with sharp corners, scaled to sit at the same
 * visual size as the glyph heads (their cores are 40 wide, the V1 heads 50).
 */
const V1_KEPT: { name: string; pts: V[]; eye: V }[] = [
  { name: "Step", pts: [[19, 3], [53, 3], [53, 53], [3, 53], [3, 19], [19, 19]], eye: [28, 35] },
  { name: "Twin cut", pts: [[17, 3], [53, 3], [53, 39], [39, 53], [3, 53], [3, 17]], eye: [28, 28] },
];
const V1_SCALE = 0.86;
const toGlyphSize = (p: V): V => [28 + (p[0] - 28) * V1_SCALE, 28 + (p[1] - 28) * V1_SCALE];

/**
 * The final 12 heads (felipe, 2026-11-16), in stored order: the index is what gets saved.
 * Eyes are the V1 Tech eyes, sharp (see `glyph` in bot-avatar.ts).
 */
export const GLYPH_SHAPES: BotAvatarShape[] = [
  ...GLYPHS.map((g) => ({ name: g.name, d: glyphPath(g), eye: g.eye })),
  ...V1_KEPT.map((v) => ({
    name: v.name,
    d: `${v.pts.map((p, i) => `${i ? "L" : "M"}${pt(toGlyphSize(p))}`).join("")}Z`,
    eye: toGlyphSize(v.eye),
  })),
];
