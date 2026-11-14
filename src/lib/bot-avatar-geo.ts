/**
 * Bot avatars, round 2 (2026-11-14): more geometric, slimmer and stranger heads than the v1 faces
 * (kept as the backup in bot-avatar.ts as "soft" and "tech").
 *
 * One set of 12 sharp silhouettes, drawn in four treatments:
 * - shard: a solid cut like a stone, beveled facets lit from the top left, dark cut-out eyes;
 * - sigil: an outline with construction lines inside (axis, horizon, inner polygon, circle),
 *   eyes in the bot color;
 * - matrix: the silhouette sampled on a 9 × 9 grid of square cells, the pixel idea made finer;
 * - halo: a flat solid with an ornament above the head (bar, ring, crown, antenna, horns, mark).
 *
 * Same three choices as v1 (12 shapes × 8 eyes × 8 colors), so a stored look maps 1:1.
 * Body and the two eyes stay separate paths, so every motion state works on every treatment.
 */

export type GeoStyle = "shard" | "sigil" | "matrix" | "halo";
export const GEO_STYLES: readonly GeoStyle[] = ["shard", "sigil", "matrix", "halo"];

/** Playground dials. `line` is in screen px (outlines keep their weight at every size). */
export type GeoTweak = { eye: number; line: number; detail: number; gap: number };
export const GEO_TWEAK: GeoTweak = { eye: 1, line: 1.5, detail: 1, gap: 1.4 };

type Pt = [number, number];
const f = (v: number) => +v.toFixed(2);

/** A layer drawn with the head: facets and lines inside the body, ornaments around it. */
export type GeoLayer = {
  d: string;
  fill?: string;
  stroke?: string;
  /** Stroke width; px when `screen` is set, face units otherwise. */
  width?: number;
  screen?: boolean;
  opacity?: number;
};

// ── Geometry helpers ───────────────────────────────────────────────────────────

const polyD = (pts: Pt[]) => `${pts.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join("")}Z`;
const rect = (cx: number, cy: number, w: number, h: number) =>
  `M${f(cx - w / 2)} ${f(cy - h / 2)}h${f(w)}v${f(h)}h${f(-w)}Z`;
/** Same rectangle wound the other way: inside another rectangle it cuts a hole. */
const hole = (cx: number, cy: number, w: number, h: number) =>
  `M${f(cx - w / 2)} ${f(cy - h / 2)}v${f(h)}h${f(w)}v${f(-h)}Z`;
const rhomb = (cx: number, cy: number, w: number, h: number) =>
  `M${f(cx)} ${f(cy - h / 2)}L${f(cx + w / 2)} ${f(cy)}L${f(cx)} ${f(cy + h / 2)}L${f(cx - w / 2)} ${f(cy)}Z`;
const seg = (a: Pt, b: Pt) => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;

function signedArea(pts: Pt[]) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

/** Edge `i` → its outward unit normal. */
function outward(pts: Pt[], i: number): Pt {
  const [x1, y1] = pts[i];
  const [x2, y2] = pts[(i + 1) % pts.length];
  const l = Math.hypot(x2 - x1, y2 - y1) || 1;
  const s = signedArea(pts) > 0 ? 1 : -1; // y points down: positive area = clockwise on screen
  return [(s * (y2 - y1)) / l, (-s * (x2 - x1)) / l];
}

/** The polygon moved in by `d` on every edge (mitered corners). */
function inset(pts: Pt[], d: number): Pt[] {
  const n = pts.length;
  const lines = pts.map((p, i) => {
    const [nx, ny] = outward(pts, i);
    const q = pts[(i + 1) % n];
    return [
      [p[0] - nx * d, p[1] - ny * d],
      [q[0] - nx * d, q[1] - ny * d],
    ] as [Pt, Pt];
  });
  return pts.map((_, i) => {
    const [a1, a2] = lines[(i - 1 + n) % n];
    const [b1, b2] = lines[i];
    const den = (a1[0] - a2[0]) * (b1[1] - b2[1]) - (a1[1] - a2[1]) * (b1[0] - b2[0]);
    if (Math.abs(den) < 1e-6) return b1;
    const t = ((a1[0] - b1[0]) * (b1[1] - b2[1]) - (a1[1] - b1[1]) * (b1[0] - b2[0])) / den;
    return [a1[0] + t * (a2[0] - a1[0]), a1[1] + t * (a2[1] - a1[1])] as Pt;
  });
}

function insidePoly(pts: Pt[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Where a vertical (axis "x") or horizontal (axis "y") line at `v` enters and leaves the shape. */
function span(pts: Pt[], axis: "x" | "y", v: number): [number, number] | null {
  const hits: number[] = [];
  const a = axis === "x" ? 0 : 1;
  const b = 1 - a;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    if ((p[a] - v) * (q[a] - v) > 0 || p[a] === q[a]) continue;
    hits.push(p[b] + ((v - p[a]) / (q[a] - p[a])) * (q[b] - p[b]));
  }
  return hits.length < 2 ? null : [Math.min(...hits), Math.max(...hits)];
}

/** Largest circle around `c` that stays inside the shape (distance to the nearest edge). */
function innerRadius(pts: Pt[], c: Pt) {
  let r = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const t = Math.max(0, Math.min(1, ((c[0] - p[0]) * dx + (c[1] - p[1]) * dy) / (dx * dx + dy * dy)));
    r = Math.min(r, Math.hypot(c[0] - (p[0] + t * dx), c[1] - (p[1] + t * dy)));
  }
  return r;
}

const circle = (c: Pt, r: number) => `M${f(c[0] - r)} ${f(c[1])}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

function mixHex(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

// ── Silhouettes ────────────────────────────────────────────────────────────────

type LineKind = "axis" | "horizon" | "inner" | "circle";
type Ornament = "bar" | "ring" | "crown" | "antenna" | "horns" | "mark";

type GeoShape = { name: string; pts: Pt[]; eye: Pt; lines: LineKind[]; ornament: Ornament };

/** Slim, sharp, no rounded corners. 56 × 56 box; most heads stand on y ≈ 52. */
export const GEO_SHAPES: GeoShape[] = [
  { name: "Kite", pts: [[28, 3], [49, 22], [28, 53], [7, 22]], eye: [28, 24], lines: ["inner", "axis"], ornament: "ring" },
  { name: "Spire", pts: [[28, 3], [45, 13], [45, 43], [28, 53], [11, 43], [11, 13]], eye: [28, 29], lines: ["inner"], ornament: "bar" },
  { name: "Obelisk", pts: [[28, 3], [42, 15], [42, 53], [14, 53], [14, 15]], eye: [28, 31], lines: ["axis", "horizon"], ornament: "antenna" },
  { name: "Prism", pts: [[28, 4], [52, 50], [4, 50]], eye: [28, 37], lines: ["inner", "circle"], ornament: "mark" },
  { name: "Delta", pts: [[4, 8], [52, 8], [28, 52]], eye: [28, 22], lines: ["circle", "axis"], ornament: "crown" },
  { name: "Gem", pts: [[15, 8], [41, 8], [52, 21], [28, 52], [4, 21]], eye: [28, 20], lines: ["horizon", "axis"], ornament: "ring" },
  { name: "Lozenge", pts: [[28, 8], [53, 28], [28, 48], [3, 28]], eye: [28, 28], lines: ["inner", "horizon"], ornament: "horns" },
  { name: "Crown", pts: [[6, 16], [17, 6], [28, 16], [39, 6], [50, 16], [50, 51], [6, 51]], eye: [28, 33], lines: ["axis", "horizon"], ornament: "mark" },
  { name: "Blade", pts: [[22, 4], [48, 4], [34, 52], [8, 52]], eye: [28, 24], lines: ["horizon"], ornament: "bar" },
  { name: "Shield", pts: [[6, 6], [28, 14], [50, 6], [50, 34], [28, 52], [6, 34]], eye: [28, 29], lines: ["axis", "circle"], ornament: "crown" },
  { name: "Monolith", pts: [[13, 4], [37, 4], [43, 10], [43, 52], [13, 52]], eye: [28, 23], lines: ["horizon", "axis"], ornament: "antenna" },
  { name: "Octa", pts: [[19, 3], [37, 3], [47, 13], [47, 43], [37, 53], [19, 53], [9, 43], [9, 13]], eye: [28, 28], lines: ["inner", "circle"], ornament: "horns" },
];

// ── Eyes ───────────────────────────────────────────────────────────────────────

export type GeoEyes = { name: string; h: number; draw: (cx: number, cy: number, k: number) => [string, string] };

/** Small and sharp: the heads are slimmer, so the eyes are too. */
export const GEO_EYES: GeoEyes[] = [
  { name: "Slits", h: 2.4, draw: (x, y, k) => [rect(x - 7 * k, y, 8 * k, 2.4 * k), rect(x + 7 * k, y, 8 * k, 2.4 * k)] },
  { name: "Needles", h: 10, draw: (x, y, k) => [rect(x - 5.5 * k, y, 2.6 * k, 10 * k), rect(x + 5.5 * k, y, 2.6 * k, 10 * k)] },
  { name: "Squares", h: 4.6, draw: (x, y, k) => [rect(x - 6.5 * k, y, 4.6 * k, 4.6 * k), rect(x + 6.5 * k, y, 4.6 * k, 4.6 * k)] },
  { name: "Lenses", h: 8, draw: (x, y, k) => [rhomb(x - 6.5 * k, y, 5.6 * k, 8 * k), rhomb(x + 6.5 * k, y, 5.6 * k, 8 * k)] },
  { name: "Visor", h: 3.4, draw: (x, y, k) => [rect(x - 5 * k, y, 9.2 * k, 3.4 * k), rect(x + 5 * k, y, 9.2 * k, 3.4 * k)] },
  // One eye in the middle, split in two halves so blinks and head turns still work.
  {
    name: "Oracle",
    h: 6.4,
    draw: (x, y, k) => [
      `M${f(x)} ${f(y - 3.2 * k)}L${f(x - 6 * k)} ${f(y)}L${f(x)} ${f(y + 3.2 * k)}Z`,
      `M${f(x)} ${f(y - 3.2 * k)}L${f(x + 6 * k)} ${f(y)}L${f(x)} ${f(y + 3.2 * k)}Z`,
    ],
  },
  { name: "Wink", h: 10, draw: (x, y, k) => [rect(x - 5.5 * k, y, 2.6 * k, 10 * k), rect(x + 6.5 * k, y + 3.8 * k, 7 * k, 2.4 * k)] },
  {
    name: "Frames",
    h: 6.4,
    draw: (x, y, k) => [
      rect(x - 6.5 * k, y, 6.4 * k, 6.4 * k) + hole(x - 6.5 * k, y, 2.4 * k, 2.4 * k),
      rect(x + 6.5 * k, y, 6.4 * k, 6.4 * k) + hole(x + 6.5 * k, y, 2.4 * k, 2.4 * k),
    ],
  },
];

/** Matrix: a cell grid, so the eyes are cells. Offsets of the left eye in cells; the right mirrors. */
const PITCH = 6;
const GRID = 9;
const cellCenter = (i: number) => 4 + PITCH * i;
const MATRIX_EYE_CELLS: { name: string; cells: Pt[] }[] = [
  { name: "Pixels", cells: [[-1, 0]] },
  { name: "Wide", cells: [[-2, 0]] },
  { name: "Bars", cells: [[-1, 0], [-1, 1]] },
  { name: "Tall", cells: [[-1, -1], [-1, 0], [-1, 1]] },
  { name: "Slits", cells: [[-2, 0], [-1, 0]] },
  { name: "Blocks", cells: [[-2, 0], [-1, 0], [-2, 1], [-1, 1]] },
  { name: "One", cells: [[0, 0]] },
  { name: "Stacks", cells: [[-2, 0], [-2, 1]] },
];

function cellBlock(cx: number, cy: number, cells: Pt[], mirror: boolean, size: number) {
  const xs = cells.map(([c]) => cx + (mirror ? -c : c) * PITCH);
  const ys = cells.map(([, r]) => cy + r * PITCH);
  const x0 = Math.min(...xs) - size / 2;
  const x1 = Math.max(...xs) + size / 2;
  const y0 = Math.min(...ys) - size / 2;
  const y1 = Math.max(...ys) + size / 2;
  return `M${f(x0)} ${f(y0)}H${f(x1)}V${f(y1)}H${f(x0)}Z`;
}

export const MATRIX_EYES: GeoEyes[] = MATRIX_EYE_CELLS.map(({ name, cells }) => {
  const rows = cells.map(([, r]) => r);
  return {
    name,
    h: (Math.max(...rows) - Math.min(...rows)) * PITCH + PITCH,
    // Holes cover the whole cell plus a hair, so a dark eye reads as a cell that is off.
    draw: (x, y) => [cellBlock(x, y, cells, false, PITCH + 0.2), cellBlock(x, y, cells, true, PITCH + 0.2)],
  };
});

/** Lit cells of a silhouette: a cell is on when most of it sits inside the shape. */
function rasterize(shape: GeoShape, eyeIndex: number): { on: boolean[][]; eye: Pt } {
  const on = Array.from({ length: GRID }, (_, r) =>
    Array.from({ length: GRID }, (_, c) => {
      let n = 0;
      for (const dy of [-1.8, 0, 1.8])
        for (const dx of [-1.8, 0, 1.8]) if (insidePoly(shape.pts, cellCenter(c) + dx, cellCenter(r) + dy)) n++;
      return n >= 5;
    }),
  );
  const row = Math.max(1, Math.min(GRID - 2, Math.round((shape.eye[1] - 4) / PITCH)));
  const eye: Pt = [cellCenter(4), cellCenter(row)];
  // The eye cells always exist, even where a slim shape would leave them off.
  for (const [dc, dr] of MATRIX_EYE_CELLS[eyeIndex % MATRIX_EYE_CELLS.length].cells) {
    for (const c of [4 + dc, 4 - dc]) {
      const r = row + dr;
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) on[r][c] = true;
    }
  }
  return { on, eye };
}

function matrixBody(on: boolean[][], gap: number) {
  const s = PITCH - gap;
  let d = "";
  on.forEach((row, r) => row.forEach((lit, c) => lit && (d += rect(cellCenter(c), cellCenter(r), s, s))));
  return d;
}

// ── Treatments ─────────────────────────────────────────────────────────────────

const LIGHT: Pt = [-0.55, -0.83];

function sigilLines(shape: GeoShape): string {
  const { pts, eye } = shape;
  return shape.lines
    .map((kind) => {
      if (kind === "inner") {
        const mids = pts.map((p, i) => {
          const q = pts[(i + 1) % pts.length];
          return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as Pt;
        });
        return polyD(mids);
      }
      if (kind === "circle") return circle(eye, innerRadius(pts, eye) * 0.92);
      if (kind === "axis") {
        const s = span(pts, "x", eye[0]);
        return s ? seg([eye[0], s[0]], [eye[0], s[1]]) : "";
      }
      const s = span(pts, "y", eye[1]);
      return s ? seg([s[0], eye[1]], [s[1], eye[1]]) : "";
    })
    .join("");
}

function ornament(shape: GeoShape, color: string, strength: number): GeoLayer[] {
  const top = Math.min(...shape.pts.map((p) => p[1]));
  const topAt = (x: number) => span(shape.pts, "x", x)?.[0] ?? top;
  const o = Math.min(1, 0.95 * strength);
  const x = shape.eye[0];
  switch (shape.ornament) {
    case "bar":
      return [{ d: rect(x, top - 5, 22, 1.8), fill: color, opacity: o }];
    case "ring":
      return [{ d: `M${x - 13} ${top - 4}a13 3.2 0 1 0 26 0a13 3.2 0 1 0 -26 0Z`, stroke: color, width: 1.4, opacity: o }];
    case "crown":
      return [
        { d: rect(x - 8, top - 4.5, 2.8, 2.8) + rect(x, top - 6.5, 2.8, 2.8) + rect(x + 8, top - 4.5, 2.8, 2.8), fill: color, opacity: o },
      ];
    case "antenna":
      return [{ d: rect(x, top - 4, 1.4, 8) + rect(x, top - 9, 3.6, 3.6), fill: color, opacity: o }];
    case "horns":
      return [{ d: rect(x - 9, topAt(x - 9) - 3.6, 1.6, 6) + rect(x + 9, topAt(x + 9) - 3.6, 1.6, 6), fill: color, opacity: o }];
    case "mark":
      return [];
  }
}

export type GeoParts = {
  body: string;
  center: Pt;
  fill: string;
  stroke: { color: string; width: number } | null;
  details: GeoLayer[];
  ornaments: GeoLayer[];
  eyes: readonly [string, string];
  eyeColor: string;
  eyeH: number;
  /** Cell pitch when the face is a grid (eyes snap to it), else null. */
  grid: number | null;
  shapeName: string;
  eyeName: string;
};

/** Paths and layers of one look in one treatment, ready for a `0 0 56 56` viewBox. */
export function geoParts(
  style: GeoStyle,
  look: { shape: number; eyes: number },
  color: string,
  dark: string,
  tweak: GeoTweak = GEO_TWEAK,
): GeoParts {
  const shape = GEO_SHAPES[look.shape % GEO_SHAPES.length];
  if (style === "matrix") {
    const ei = look.eyes % MATRIX_EYES.length;
    const eyeDef = MATRIX_EYES[ei];
    const { on, eye } = rasterize(shape, ei);
    return {
      body: matrixBody(on, tweak.gap),
      center: eye,
      fill: color,
      stroke: null,
      details: [],
      ornaments: [],
      eyes: eyeDef.draw(eye[0], eye[1], 1),
      eyeColor: dark,
      eyeH: eyeDef.h,
      grid: PITCH,
      shapeName: shape.name,
      eyeName: eyeDef.name,
    };
  }

  const eyeDef = GEO_EYES[look.eyes % GEO_EYES.length];
  const k = tweak.eye;
  const eyes = eyeDef.draw(shape.eye[0], shape.eye[1], k);
  const base = {
    body: polyD(shape.pts),
    center: shape.eye,
    eyes,
    eyeH: eyeDef.h * k,
    grid: null,
    shapeName: shape.name,
    eyeName: eyeDef.name,
  };

  if (style === "sigil") {
    return {
      ...base,
      fill: mixHex(dark, color, 0.13),
      stroke: { color, width: tweak.line },
      details: [{ d: sigilLines(shape), stroke: color, width: Math.max(0.75, tweak.line * 0.6), screen: true, opacity: 0.55 * tweak.detail }],
      ornaments: [],
      eyeColor: color,
    };
  }

  if (style === "shard") {
    // Bevel: the outline minus an inset face; each bevel takes light from the top left.
    const inner = inset(shape.pts, 4.2);
    const details: GeoLayer[] = shape.pts.map((p, i) => {
      const q = shape.pts[(i + 1) % shape.pts.length];
      const [nx, ny] = outward(shape.pts, i);
      const t = nx * LIGHT[0] + ny * LIGHT[1];
      return {
        d: polyD([p, q, inner[(i + 1) % inner.length], inner[i]]),
        fill: t > 0 ? "#FFFFFF" : "#000000",
        opacity: f(Math.min(1, (t > 0 ? 0.34 : 0.42) * Math.abs(t) * tweak.detail)),
      };
    });
    return { ...base, fill: color, stroke: null, details, ornaments: [], eyeColor: dark };
  }

  // halo
  const details: GeoLayer[] =
    shape.ornament === "mark" ? [{ d: rhomb(shape.eye[0], shape.eye[1] - 9.5, 4.4, 6), fill: dark, opacity: Math.min(1, tweak.detail) }] : [];
  return { ...base, fill: color, stroke: null, details, ornaments: ornament(shape, color, tweak.detail), eyeColor: dark };
}

/** Editor and gallery lists: name + a plain outline path for each silhouette. */
export const GEO_SHAPE_LIST = GEO_SHAPES.map((s) => ({ name: s.name, d: polyD(s.pts), eye: s.eye }));
