/**
 * Shared tackle parts for the lure and bait drawings (120 × 48 box). Every part is placed by
 * the point where it attaches – a ring by its centre on the body edge, a hook by its eye – so
 * nothing floats free of what it hangs from.
 */

export const INK = 'currentColor';
export const PAPER = 'var(--raised)';
export const ACCENT = 'var(--accent)';
export const BRAND = 'var(--brand)';
export const MUTED = 'var(--muted)';

export const line = { fill: 'none', stroke: INK, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** A split ring or wire eye centred at (x, y). */
export function Ring({ x, y, r = 2.4, w = 1.4 }: { x: number; y: number; r?: number; w?: number }) {
  return <circle cx={x} cy={y} r={r} fill="none" stroke={INK} strokeWidth={w} />;
}

/**
 * A treble hook whose eye sits at (x, y), hanging straight down; `angle` turns it about the
 * eye (−90 points it backwards, in line with a spinner or spoon).
 */
export function Treble({ x, y, angle = 0, s = 1 }: { x: number; y: number; angle?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`} {...line} strokeWidth={1.3 / s}>
      <circle cx="0" cy="1.6" r="1.6" />
      <path d="M0 3.2V11.5" />
      <path d="M0 11.5C0 15.6 -6 15.6 -6 11.2M-6 11.2l1.5 1.6" />
      <path d="M0 11.5C0 15.6 6 15.6 6 11.2M6 11.2l-1.5 1.6" />
      <path d="M0 11.5C0.4 14.6 -0.8 16.4 -2.2 16" strokeOpacity={0.55} />
    </g>
  );
}

/**
 * A single hook lying on its side: eye at (x, y), shank to the right, bend below and the
 * point turning back towards the eye. Returns the parts separately so a bait can sit
 * between the shank and the bend.
 */
export function hookPaths(x: number, y: number, len: number, gap = 12) {
  const e = x + 2;
  const b = x + len;
  const r = gap / 2;
  return {
    eye: { cx: x, cy: y, r: 2 },
    shank: `M${e} ${y}H${b}`,
    bend: `M${b} ${y}C${b + r * 1.35} ${y} ${b + r * 1.35} ${y + gap} ${b} ${y + gap}H${b - r * 1.1}L${b - r * 1.7} ${y + gap - 1.6}M${b - r * 1.7} ${y + gap - 1.6}l1.9 0.4`,
  };
}

export function Hook({ x, y, len, gap = 12, parts = 'all' }: { x: number; y: number; len: number; gap?: number; parts?: 'all' | 'shank' | 'bend' }) {
  const h = hookPaths(x, y, len, gap);
  return (
    <g {...line}>
      {parts !== 'bend' && (
        <>
          <circle {...h.eye} />
          <path d={h.shank} />
        </>
      )}
      {parts !== 'shank' && <path d={h.bend} />}
    </g>
  );
}

/** A tube drawn as a stroke with an ink outline (worms, maggots), optionally with segment bands. */
export function Tube({ d, width, fill, bands = true }: { d: string; width: number; fill: string; bands?: boolean }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={INK} strokeWidth={width + 1.8} />
      <path d={d} stroke={fill} strokeWidth={width} />
      {bands && <path d={d} stroke={INK} strokeOpacity={0.28} strokeWidth={width - 0.6} strokeDasharray="0.7 2.6" strokeLinecap="butt" />}
    </g>
  );
}
