/**
 * Field-guide fish silhouettes. Each fish is ONE closed outline that runs through its fins
 * (dorsal, adipose, tail, anal, pelvic), so fins are always attached to the body. Details
 * (gill cover, pectoral fin, lateral line, spots, bars) are drawn on top in the paper colour.
 *
 * Outlines are lists of points traced clockwise from the snout along the back; a point with
 * a third value of 1 is a sharp corner (fin tips, fin bases), the rest are joined by a smooth
 * Catmull-Rom curve. All drawings face left in a 200 × 60 box.
 */

type Pt = [number, number] | [number, number, 1];

export type FishShape = {
  outline: Pt[];
  eye: [number, number, number?];
  /** Paper-coloured detail strokes (gill cover, pectoral fin, lateral line). */
  lines?: string[];
  /** Small paper dots, e.g. trout spots. */
  spots?: [number, number, number][];
  /** Wide translucent vertical bars, e.g. perch stripes. */
  bars?: string[];
  /** Ink strokes that stick out of the body: barbels, tentacles. */
  whiskers?: string[];
  /** Ink ellipses at the end of a stroke (squid tentacle clubs): cx, cy, rx, ry, rotation. */
  clubs?: [number, number, number, number, number][];
};

const f = (n: number) => Math.round(n * 10) / 10;

/** Smooth closed path through the points, with corners where a point is flagged. */
export function outlinePath(pts: Pt[]): string {
  const n = pts.length;
  const P = (i: number) => pts[(i + n) % n];
  const sharp = (i: number) => P(i).length === 3;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    if (sharp(i) && sharp(i + 1)) {
      d += `L${f(p2[0])} ${f(p2[1])}`;
      continue;
    }
    // At a corner the tangent follows the segment itself instead of the neighbour.
    const a = sharp(i) ? p1 : p0;
    const b = sharp(i + 1) ? p2 : p3;
    const c1x = p1[0] + (p2[0] - a[0]) / 6;
    const c1y = p1[1] + (p2[1] - a[1]) / 6;
    const c2x = p2[0] - (b[0] - p1[0]) / 6;
    const c2y = p2[1] - (b[1] - p1[1]) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

// Shared pieces --------------------------------------------------------------

/** A forked tail between the peduncle top (x, yTop) and bottom (x, yBot). */
const forked = (x: number, yTop: number, yBot: number, tip = 194, spread = 18, notch = 10): Pt[] => {
  const mid = (yTop + yBot) / 2;
  return [
    [x, yTop, 1],
    [tip, mid - spread, 1],
    [tip - notch * 0.55, mid - spread * 0.35],
    [tip - notch, mid, 1],
    [tip - notch * 0.55, mid + spread * 0.35],
    [tip, mid + spread, 1],
    [x, yBot, 1],
  ];
};

/** A rounded tail (tench, burbot, catfish-like). */
const rounded = (x: number, yTop: number, yBot: number, tip = 192, spread = 12): Pt[] => {
  const mid = (yTop + yBot) / 2;
  return [
    [x, yTop, 1],
    [x + (tip - x) * 0.55, mid - spread],
    [tip, mid - spread * 0.4],
    [tip, mid + spread * 0.4],
    [x + (tip - x) * 0.55, mid + spread],
    [x, yBot, 1],
  ];
};

/**
 * A belly fin (pelvic or anal) on an outline that runs right-to-left along the belly: back
 * base, a tip that sweeps backwards, a curved leading edge, front base.
 */
const fin = (xBack: number, yBack: number, xFront: number, yFront: number, depth: number): Pt[] => {
  const w = xBack - xFront;
  const y = Math.max(yBack, yFront);
  return [
    [xBack, yBack, 1],
    [xBack + w * 0.3, y + depth, 1],
    [xFront + w * 0.45, y + depth * 0.72],
    [xFront + w * 0.12, y + depth * 0.3],
    [xFront, yFront, 1],
  ];
};

/** A back fin (dorsal) on an outline that runs left-to-right: tallest at the front, sloping back. */
const dorsal = (xFront: number, yFront: number, xBack: number, yBack: number, height: number): Pt[] => {
  const w = xBack - xFront;
  const y = Math.min(yFront, yBack);
  return [
    [xFront, yFront, 1],
    [xFront + w * 0.12, y - height * 0.55],
    [xFront + w * 0.3, y - height, 1],
    [xFront + w * 0.72, y - height * 0.6],
    [xBack + w * 0.06, y - height * 0.26, 1],
    [xBack, yBack, 1],
  ];
};

const gill = (x: number, top: number, bot: number) => `M${x} ${top}C${x + 7} ${(top * 2 + bot) / 3} ${x + 7} ${(top + bot * 2) / 3} ${x - 1} ${bot}`;
const pectoral = (x: number, y: number, len = 16) =>
  `M${x} ${y}C${x + len * 0.45} ${y - 1.5} ${x + len * 0.85} ${y + 1.5} ${x + len} ${y + 5.5}C${x + len * 0.6} ${y + 5.5} ${x + len * 0.25} ${y + 4} ${x} ${y + 2.6}Z`;
const lateral = (x1: number, x2: number, y: number, sag = 1) => `M${x1} ${y}C${x1 + (x2 - x1) * 0.35} ${y + sag} ${x1 + (x2 - x1) * 0.7} ${y + sag} ${x2} ${y}`;

// Shapes ---------------------------------------------------------------------

const trout: FishShape = {
  outline: [
    [6, 31],
    [14, 24],
    [28, 19],
    [48, 15.5],
    ...dorsal(72, 13.6, 97, 13.4, 10.5),
    [122, 15],
    [143, 18.6, 1],
    [147, 14.6],
    [153, 14.4],
    [156, 19.8, 1],
    [166, 23.2],
    ...forked(170, 24, 36, 194, 18, 7),
    [166, 36.8],
    ...fin(157.0, 38.6, 143.0, 40.6, 8.4),
    [122, 43.4],
    ...fin(103.0, 44.4, 89.0, 44.6, 7.9),
    [62, 44.4],
    [38, 42],
    [20, 38],
    [10, 34.5],
  ],
  eye: [17, 27.2],
  lines: [gill(33, 20.5, 40.5), pectoral(37, 36.5, 17), lateral(40, 166, 29.6, 0.6)],
  spots: [
    [52, 21, 1.1],
    [64, 24, 1.2],
    [76, 19.5, 1],
    [88, 23.5, 1.2],
    [104, 19.5, 1.1],
    [112, 25, 1],
    [126, 21, 1.2],
    [138, 25, 1],
    [150, 23.5, 0.9],
    [70, 30, 1],
    [98, 32, 1],
    [120, 33, 0.9],
  ],
};

const huchen: FishShape = {
  ...trout,
  outline: [
    [4, 31],
    [12, 25.5],
    [28, 21],
    [52, 18],
    ...dorsal(84, 16.6, 107, 16.4, 9),
    [130, 17.6],
    [148, 20, 1],
    [151, 16.4],
    [156, 16.4],
    [159, 21, 1],
    [168, 24],
    ...forked(171, 24.6, 35.4, 194, 15, 5),
    [168, 36],
    ...fin(160.0, 37.6, 147.0, 39.4, 7.1),
    [126, 42],
    ...fin(110.0, 42.6, 97.0, 42.8, 6.7),
    [64, 42.6],
    [38, 40.6],
    [18, 37],
    [8, 34],
  ],
  eye: [15, 27.6],
  lines: [gill(32, 22, 39.5), pectoral(36, 35.5, 16), lateral(40, 168, 29.8, 0.4)],
  spots: [
    [50, 23.5, 0.8],
    [62, 22, 0.8],
    [74, 24.5, 0.8],
    [88, 21.5, 0.8],
    [102, 23.5, 0.8],
    [116, 21.6, 0.8],
    [128, 24, 0.8],
  ],
};

const grayling: FishShape = {
  outline: [
    [8, 32],
    [14, 26.5],
    [26, 22],
    [44, 19],
    [54, 18, 1],
    [58, 7, 1],
    [72, 3.2],
    [92, 3.4],
    [106, 6.4],
    [116, 11, 1],
    [118, 17.2, 1],
    [140, 20.4, 1],
    [144, 17],
    [149, 17],
    [151, 21.8, 1],
    [164, 25],
    ...forked(168, 25.4, 35.6, 194, 18, 11),
    [164, 36.4],
    ...fin(154.0, 38.0, 141.0, 39.6, 7.4),
    [118, 42],
    ...fin(100.0, 43.0, 86.0, 43.3, 7.2),
    [58, 43],
    [36, 41.5],
    [20, 38.5],
    [11, 35.5],
  ],
  eye: [18, 29],
  lines: [gill(32, 23, 40.5), pectoral(36, 37, 15), lateral(40, 164, 31, 0.4), 'M62 10C78 8 94 8 110 11M60 15C80 13 98 13 114 15.5'],
};

const pike: FishShape = {
  outline: [
    [2, 31],
    [10, 27.6],
    [26, 25],
    [60, 23.4],
    [100, 22.6],
    ...dorsal(128, 22.6, 152, 22.4, 9.5),
    [164, 25.4],
    ...forked(170, 26, 34, 194, 13, 6),
    [164, 34.6],
    ...fin(154.0, 37.8, 130.0, 37.6, 8.2),
    [108, 37.8],
    ...fin(96.0, 38.2, 83.0, 38.2, 6.8),
    [50, 38],
    [24, 36],
    [10, 34],
    [3, 32.4],
  ],
  eye: [17, 28.6],
  lines: [gill(32, 25.5, 37), pectoral(36, 34.5, 13), lateral(40, 164, 30.6, 0.2), 'M3 31.6L16 32.6'],
  spots: [
    [52, 28, 0.9],
    [62, 32, 0.9],
    [74, 27.6, 0.9],
    [86, 32, 0.9],
    [98, 27.6, 0.9],
    [110, 31.6, 0.9],
    [122, 28, 0.9],
    [140, 30.5, 0.9],
  ],
};

const perch: FishShape = {
  outline: [
    [8, 32],
    [14, 25],
    [26, 19],
    [38, 15.4, 1],
    [42, 4, 1],
    [47, 11, 1],
    [52, 3, 1],
    [57, 10.4, 1],
    [62, 3.6, 1],
    [67, 10.8, 1],
    [72, 5, 1],
    [77, 11.6, 1],
    [82, 7.6, 1],
    [86, 13.4, 1],
    ...dorsal(92, 14, 120, 16.2, 8),
    [146, 22],
    [160, 24.6],
    ...forked(166, 25, 35, 194, 17, 8),
    [160, 35.6],
    ...fin(150.0, 38.0, 133.0, 41.0, 6.0),
    [110, 44],
    ...fin(92.0, 46.4, 78.0, 46.4, 7.6),
    [50, 45],
    [30, 42.5],
    [16, 38.5],
  ],
  eye: [18.5, 27],
  lines: [gill(31, 18.5, 41.5), pectoral(35, 36, 16), lateral(38, 160, 28.5, -1)],
  bars: ['M58 17L60 44', 'M78 15L80 46', 'M100 16L102 45', 'M122 18L123 42', 'M142 21L143 39'],
};

const zander: FishShape = {
  ...perch,
  outline: [
    [4, 31.5],
    [12, 26.5],
    [28, 22],
    [42, 20, 1],
    [46, 9, 1],
    [51, 15.4, 1],
    [56, 8, 1],
    [61, 15, 1],
    [66, 8.6, 1],
    [71, 15.2, 1],
    [76, 10, 1],
    [81, 16, 1],
    [86, 17.6, 1],
    ...dorsal(92, 18, 122, 18.6, 8.5),
    [148, 23],
    [162, 25.6],
    ...forked(167, 26, 34, 194, 15, 8),
    [162, 34.4],
    ...fin(150.0, 36.6, 133.0, 39.4, 5.6),
    [110, 41.4],
    ...fin(94.0, 42.6, 80.0, 42.6, 7.0),
    [50, 41.6],
    [28, 39.6],
    [14, 36.6],
    [6, 33.5],
  ],
  eye: [16, 28],
  lines: [gill(30, 22, 39), pectoral(34, 35, 15), lateral(38, 162, 29.6, -0.6)],
  bars: ['M60 20L61 40', 'M84 19L85 41', 'M108 19L109 40', 'M132 21L132 37'],
};

const carp: FishShape = {
  outline: [
    [8, 31],
    [13, 23],
    [24, 15.5],
    [40, 11],
    [58, 8.4, 1],
    [63, 1.8, 1],
    [70, 3.4],
    [92, 4.8],
    [114, 7.4],
    [128, 10.4, 1],
    [130, 13.4, 1],
    [150, 19.6],
    [162, 23.8],
    ...forked(167, 24.4, 37.6, 194, 20, 11),
    [162, 38.4],
    ...fin(146.0, 42.0, 130.0, 45.6, 5.9),
    [110, 49],
    ...fin(94.0, 50.2, 80.0, 50.4, 7.0),
    [56, 50],
    [34, 46.5],
    [18, 41],
    [10, 35.5],
  ],
  eye: [20, 27.5],
  lines: [gill(34, 17, 45), pectoral(38, 40.5, 18), lateral(42, 162, 30.4, 0.6)],
  whiskers: ['M9 34.2C6 37 4 40 3 42.6', 'M12 36C11 39 11 41.4 12 43.4'],
};

/** Slim cyprinid: roach, chub, rudd, dace, nase, asp. */
const roach: FishShape = {
  outline: [
    [7, 31],
    [13, 25],
    [26, 19.4],
    [44, 15.4],
    ...dorsal(70, 13, 94, 13.6, 10),
    [118, 16],
    [140, 20],
    [158, 24.4],
    ...forked(164, 25, 35, 194, 18, 11),
    [158, 35.6],
    ...fin(142.0, 39.2, 126.0, 42.0, 6.0),
    [104, 43.6],
    ...fin(92.0, 44.4, 80.0, 44.6, 7.0),
    [56, 44.4],
    [34, 42],
    [18, 38],
    [9, 34.4],
  ],
  eye: [18, 27.4],
  lines: [gill(32, 19.5, 41), pectoral(36, 36.6, 15), lateral(40, 158, 31, 1.6)],
};

const bream: FishShape = {
  outline: [
    [10, 30],
    [16, 21],
    [30, 12.6],
    [50, 7],
    ...dorsal(64, 5.2, 92, 6.6, 5.5),
    [96, 8.4, 1],
    [126, 15],
    [150, 22.2],
    [160, 24.6],
    ...forked(165, 25.2, 34.8, 194, 22, 12),
    [160, 35.6],
    [152, 37.8, 1],
    [144, 48.6, 1],
    [128, 51.4],
    [110, 54.4],
    [96, 55.6, 1],
    [94, 49.6, 1],
    ...fin(76.0, 51.0, 62.0, 50.4, 7.0),
    [44, 47.4],
    [28, 42],
    [16, 36],
  ],
  eye: [21, 25.6],
  lines: [gill(34, 14, 44), pectoral(38, 38, 15), lateral(42, 160, 30.6, 2)],
};

const tench: FishShape = {
  outline: [
    [8, 31],
    [14, 23.6],
    [28, 17.6],
    [48, 14.4],
    [70, 13, 1],
    [76, 4, 1],
    [88, 5],
    [96, 9.6],
    [100, 14.6, 1],
    [126, 17.6],
    [150, 22.4],
    ...rounded(158, 23.4, 36.6, 192, 15),
    [150, 37.6],
    [136, 41, 1],
    [132, 48.4],
    [124, 50],
    [118, 43.6, 1],
    [104, 44.6],
    [92, 45.2, 1],
    [86, 53.6],
    [78, 53],
    [76, 45.2, 1],
    [52, 45],
    [30, 42.4],
    [16, 38],
  ],
  eye: [19, 27.4],
  lines: [gill(33, 18.5, 42), pectoral(37, 37.4, 17), lateral(42, 152, 30, 0.6)],
  whiskers: ['M9 33.6C7 35.4 6 37 5.6 38.6'],
};

const barbel: FishShape = {
  outline: [
    [5, 33],
    [10, 26],
    [24, 20],
    [46, 15.6],
    ...dorsal(72, 13.6, 93, 14, 10.5),
    [118, 16.4],
    [142, 20.6],
    [158, 24.6],
    ...forked(164, 25.2, 34.8, 194, 17, 10),
    [158, 35.4],
    ...fin(142.0, 38.0, 128.0, 40.4, 6.2),
    [104, 41.6],
    ...fin(92.0, 42.0, 80.0, 42.2, 6.8),
    [52, 42],
    [30, 40.6],
    [14, 38.6],
    [7, 36.4],
  ],
  eye: [18, 27.6],
  lines: [gill(32, 21, 40), pectoral(36, 36, 16), lateral(40, 158, 30.6, 0.4)],
  whiskers: ['M7 36.4C5 40 4 43 4.5 46', 'M11 38C10.5 41.6 11 44.4 12.4 47'],
};

const catfish: FishShape = {
  outline: [
    [4, 31],
    [8, 25],
    [20, 20.4],
    [38, 18.6],
    ...dorsal(50, 18.4, 61, 18.6, 6),
    [100, 21.6],
    [150, 25.4],
    ...rounded(170, 27.4, 34, 194, 6),
    [168, 34.6, 1],
    [150, 38.6],
    [120, 44.6],
    [90, 46.2],
    [76, 45.6, 1],
    [73, 42.8, 1],
    [70, 39.4, 1],
    ...fin(62.0, 40.2, 52.0, 40.0, 6.2),
    [30, 40.6],
    [14, 38],
    [6, 35],
  ],
  eye: [14, 27, 1.8],
  lines: [gill(28, 22, 38.5), pectoral(30, 36.6, 15)],
  whiskers: ['M7 28.4C2 22 0 15 2 8', 'M7 35.6C3 40 2 46 4 51', 'M10 37.4C9 42 10 46 13 50'],
};

const eel: FishShape = {
  outline: [
    [4, 30.6],
    [10, 27.4],
    [26, 26],
    [52, 25.6, 1],
    [70, 22.4],
    [110, 22.6],
    [160, 24.8],
    [186, 27.4],
    [196, 30],
    [186, 32.6],
    [160, 35.4],
    [110, 37.4],
    [80, 37.4],
    [64, 36.4, 1],
    [40, 35.6],
    [20, 34.6],
    [8, 33],
  ],
  eye: [13, 28.8, 1.7],
  lines: [gill(24, 27, 34), pectoral(26, 32, 8), lateral(30, 186, 30.6, 0)],
};

const seabass: FishShape = {
  outline: [
    [6, 31],
    [14, 24],
    [28, 18.6],
    [46, 15, 1],
    [50, 5, 1],
    [55, 10, 1],
    [60, 4.4, 1],
    [65, 10, 1],
    [70, 5.4, 1],
    [75, 11, 1],
    [80, 12.6, 1],
    ...dorsal(88, 13.4, 114, 15.4, 8),
    [140, 20.4],
    [158, 24.2],
    ...forked(164, 24.8, 35.2, 194, 17, 7),
    [158, 35.8],
    ...fin(146.0, 38.4, 128.0, 41.4, 6.0),
    [106, 43.6],
    ...fin(88.0, 45.0, 74.0, 45.0, 7.4),
    [48, 44.4],
    [28, 41.6],
    [14, 37.6],
  ],
  eye: [19, 26.8],
  lines: [gill(32, 18.5, 40.5), pectoral(36, 35.5, 16), lateral(40, 158, 28.6, -0.6)],
};

const seabream: FishShape = {
  outline: [
    [9, 32],
    [12, 24],
    [22, 15.6],
    [38, 9.6, 1],
    [42, 2.4, 1],
    [48, 7, 1],
    [53, 1.4, 1],
    [58, 6.4, 1],
    [63, 1.4, 1],
    [68, 6.4, 1],
    [73, 2, 1],
    [78, 7, 1],
    [84, 3.6],
    [100, 4.8],
    [112, 8.6, 1],
    [116, 13, 1],
    [140, 20.6],
    [156, 24.4],
    ...forked(162, 25, 35, 194, 20, 11),
    [156, 35.6],
    [140, 39.6, 1],
    [132, 50, 1],
    [118, 52],
    [108, 47.4, 1],
    [90, 49.6],
    ...fin(74.0, 51.6, 61.0, 50.6, 6.4),
    [42, 47.6],
    [24, 42.4],
    [13, 37],
  ],
  eye: [21, 24.8, 2.6],
  lines: [gill(34, 13, 44), pectoral(38, 37.6, 20), lateral(42, 156, 27, -1.6), 'M22 22C26 21 30 21.6 33 23'],
};

const mullet: FishShape = {
  outline: [
    [5, 30],
    [10, 24],
    [24, 19.6],
    [48, 17],
    ...dorsal(62, 16.4, 76, 16.2, 7.4),
    ...dorsal(104, 17.6, 118, 18.2, 7),
    [146, 22],
    [160, 24.6],
    ...forked(166, 25.2, 34.8, 194, 18, 10),
    [160, 35.4],
    ...fin(146.0, 38.0, 128.0, 40.4, 5.2),
    [104, 42.4],
    ...fin(88.0, 42.8, 74.0, 42.8, 6.8),
    [48, 42.4],
    [26, 40],
    [12, 36],
  ],
  eye: [16, 26.8],
  lines: [gill(30, 20.5, 39.5), pectoral(34, 26.5, 16), lateral(38, 160, 29.6, 0), lateral(40, 158, 25.4, 0), lateral(40, 158, 34, 0)],
};

const flatfish: FishShape = {
  outline: [
    [12, 26],
    [18, 15],
    [34, 8.6],
    [70, 6.2],
    [110, 8.6],
    [140, 15],
    [154, 22, 1],
    ...rounded(160, 24, 36, 186, 12),
    [154, 38, 1],
    [140, 45],
    [110, 51.4],
    [70, 53.8],
    [34, 51.4],
    [18, 45],
    [10, 34],
  ],
  eye: [24, 22, 2],
  lines: ['M40 12C70 9 110 11 142 19', 'M40 48C70 51 110 49 142 41', lateral(36, 156, 30, 0), gill(36, 16, 44)],
  spots: [
    [64, 22, 1.4],
    [94, 36, 1.4],
    [118, 24, 1.2],
    [80, 42, 1.1],
    [52, 36, 1.2],
  ],
};

const sturgeon: FishShape = {
  outline: [
    [2, 33],
    [10, 29],
    [26, 25.4],
    [50, 22.6],
    [100, 21],
    ...dorsal(128, 21.4, 143, 22.4, 7),
    [160, 25.6],
    [170, 25.6, 1],
    [196, 9, 1],
    [190, 22],
    [176, 32, 1],
    [184, 40, 1],
    [168, 35.4, 1],
    ...fin(150.0, 37.2, 134.0, 38.2, 5.8),
    [110, 39.4],
    ...fin(92.0, 40.6, 80.0, 40.6, 5.4),
    [50, 40.4],
    [26, 38.4],
    [12, 36],
  ],
  eye: [20, 29.2, 1.7],
  lines: [gill(32, 25, 39), pectoral(36, 36, 14), 'M40 25L46 23L52 25M62 23.6L68 21.6L74 23.6M84 22.6L90 20.6L96 22.6M106 22.4L112 20.6L118 22.6'],
  whiskers: ['M8 35.6L7 40', 'M12 36.4L11.6 41'],
};

const squid: FishShape = {
  outline: [
    [70, 28.6, 1],
    [90, 22],
    [140, 20.6],
    [170, 22, 1],
    [196, 12, 1],
    [192, 30],
    [196, 48, 1],
    [170, 38, 1],
    [140, 39.4],
    [90, 38],
    [70, 31.4, 1],
    [66, 32.6],
    [64, 30],
    [66, 27.4],
  ],
  eye: [74, 27.6, 2],
  lines: ['M96 25C120 24 150 24 170 26', 'M96 35C120 36 150 36 170 34'],
  whiskers: [
    'M66 27.6C56 25 46 23.6 36 23.4',
    'M65 28.8C55 28 45 28 34 28.6',
    'M65 30.6C55 31.4 45 32.6 35 34',
    'M66 32C57 34.6 48 37 40 38.6',
    // the two long tentacles, ending in clubs
    'M65 29.4C48 27 30 24 14 18.6',
    'M65 30.4C48 33 30 37 14 42',
  ],
  clubs: [
    [12, 18, 4, 1.6, -18],
    [12, 42.6, 4, 1.6, 18],
  ],
};

const cuttlefish: FishShape = {
  outline: [
    [58, 30, 1],
    [66, 20],
    [90, 13],
    [140, 12.6],
    [176, 18],
    [192, 30],
    [176, 42],
    [140, 47.4],
    [90, 47],
    [66, 40],
  ],
  eye: [66, 25.6, 2.2],
  lines: ['M76 15.6C110 11 150 12 184 24', 'M76 44.4C110 49 150 48 184 36', 'M96 22C110 26 130 24 150 28M100 36C116 32 134 36 152 32'],
  whiskers: ['M58 27C50 24 42 22.6 34 22.6', 'M58 29C50 28 42 28 33 28.6', 'M58 31C50 32 42 33.4 34 34.6', 'M58 33C51 36 44 38 37 39'],
};

export const SHAPES = {
  trout,
  huchen,
  grayling,
  pike,
  perch,
  zander,
  carp,
  roach,
  bream,
  tench,
  barbel,
  catfish,
  eel,
  seabass,
  seabream,
  mullet,
  flatfish,
  sturgeon,
  squid,
  cuttlefish,
} satisfies Record<string, FishShape>;

export type Shape = keyof typeof SHAPES;

const BY_SLUG: Record<string, Shape> = {
  sulec: 'huchen',
  lipan: 'grayling',
  scuka: 'pike',
  ostriz: 'perch',
  // Largemouth bass (no bars) and pumpkinseed (deep, round body).
  'postrvji-ostriz': 'seabass',
  'soncni-ostriz': 'seabream',
  // Asp is a cyprinid, not a perch.
  bolen: 'roach',
  smuc: 'zander',
  krap: 'carp',
  koreselj: 'bream',
  tolstolobik: 'roach',
  linj: 'tench',
  mrena: 'barbel',
  ploscic: 'bream',
  platnica: 'bream',
  ogrica: 'bream',
  som: 'catfish',
  'americki-somic': 'catfish',
  menek: 'catfish',
  jegulja: 'eel',
  ugor: 'eel',
  brancin: 'seabass',
  cipelj: 'mullet',
  'morski-list': 'flatfish',
  jeseter: 'sturgeon',
  lignji: 'squid',
  sipa: 'cuttlefish',
};

const BY_GROUP: Record<string, Shape> = {
  salmonid: 'trout',
  predator: 'perch',
  cyprinid: 'roach',
  catfish: 'catfish',
  sea: 'seabream',
  cephalopod: 'squid',
  other: 'roach',
};

export function shapeFor(slug: string, group: string): Shape {
  return BY_SLUG[slug] ?? BY_GROUP[group] ?? 'roach';
}
