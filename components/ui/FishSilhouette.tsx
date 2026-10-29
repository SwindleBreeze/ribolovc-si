import { outlinePath, SHAPES, shapeFor } from '@/lib/fish-shapes';

// Outlines are computed once per shape, not per render.
const PATHS = Object.fromEntries(Object.entries(SHAPES).map(([k, s]) => [k, outlinePath(s.outline)])) as Record<keyof typeof SHAPES, string>;

/** Field-guide fish plate silhouette; colour comes from `currentColor`, details from the paper colour. */
export function FishSilhouette({ slug, group, label, className = 'h-12 w-40' }: { slug: string; group: string; label?: string; className?: string }) {
  const key = shapeFor(slug, group);
  const s = SHAPES[key];
  const [ex, ey, er = 2.3] = s.eye;
  return (
    <svg viewBox="0 0 200 60" className={className} overflow="visible" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={PATHS[key]} fill="currentColor" />
      {s.bars?.map((d) => <path key={d} d={d} stroke="var(--paper)" strokeOpacity={0.22} strokeWidth={5} strokeLinecap="round" />)}
      {s.lines?.map((d) =>
        d.endsWith('Z') ? (
          <path key={d} d={d} fill="var(--paper)" fillOpacity={0.3} />
        ) : (
          <path key={d} d={d} fill="none" stroke="var(--paper)" strokeOpacity={0.55} strokeWidth={1} strokeLinecap="round" />
        ),
      )}
      {s.spots?.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="var(--paper)" fillOpacity={0.6} />)}
      {s.whiskers?.map((d) => <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />)}
      {s.clubs?.map(([x, y, rx, ry, r]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${r} ${x} ${y})`} fill="currentColor" />)}
      <circle cx={ex} cy={ey} r={er} fill="var(--paper)" />
      <circle cx={ex + 0.3} cy={ey} r={er * 0.5} fill="currentColor" />
    </svg>
  );
}
