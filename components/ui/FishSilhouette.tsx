/** Hand-drawn species-group silhouettes for field-guide plates. */
type Shape = 'trout' | 'grayling' | 'pike' | 'perch' | 'carp' | 'catfish' | 'eel' | 'bream' | 'squid';

const SHAPES: Record<Shape, { body: string; extra?: string; eye: [number, number]; lines?: string }> = {
  trout: {
    body: 'M8 30C30 12 70 8 112 12c28 3 46 10 58 16l26-16-8 18 8 18-26-14c-12 6-30 12-58 14-42 4-82 0-104-18z',
    extra: 'M70 12c8-10 26-10 34 0z',
    eye: [22, 27],
  },
  grayling: {
    body: 'M8 34c22-14 62-16 104-14 28 2 46 8 58 12l26-16-8 18 8 18-26-14c-12 6-30 10-58 12-42 2-82-2-104-16z',
    extra: 'M52 20C60 0 120 0 128 22z',
    eye: [20, 31],
  },
  pike: {
    body: 'M2 32c18-8 58-10 118-8 30 1 45 4 52 6l24-12-6 13 6 13-24-10c-7 2-22 5-52 6-60 2-100 0-118-8z',
    extra: 'M138 25c6-9 18-9 22 2z',
    eye: [16, 29],
  },
  perch: {
    body: 'M8 32c16-14 56-18 102-16 30 2 50 8 60 13l26-13-6 15 6 15-26-13c-12 7-40 13-70 13-40 0-76-2-92-14z',
    extra: 'M50 17l6-13 6 12 6-12 6 12 6-11 6 11z',
    eye: [22, 29],
  },
  carp: {
    body: 'M10 32C26 12 70 6 110 10c30 3 50 12 58 18l26-16-6 19 6 19-26-16c-12 8-38 16-68 16-40 0-76-4-90-20z',
    extra: 'M70 10c20-10 50-8 65 4z',
    eye: [24, 29],
  },
  catfish: {
    body: 'M4 30c6-8 26-12 56-10 50 2 90 6 136 10-46 4-86 10-136 10-30 2-50-2-56-10z',
    eye: [16, 27],
    lines: 'M8 27L0 15M10 33L2 45M12 26L6 12',
  },
  eel: {
    body: 'M4 30c36-10 66 10 106 0s60-8 86 0c-26 4-56 10-86 6S40 40 4 30z',
    eye: [14, 28],
  },
  bream: {
    body: 'M10 30C30 8 80 4 120 10c30 5 45 14 52 18l24-16-6 18 6 18-24-16c-7 6-22 14-52 18-40 6-90 2-110-20z',
    extra: 'M60 8c20-6 50-6 70 4z',
    eye: [26, 26],
  },
  squid: {
    body: 'M60 18l90 2c20 0 40 6 46 10-6 4-26 10-46 10l-90 2c-8-4-8-20 0-24z',
    eye: [66, 27],
    lines: 'M58 22L6 14M58 26L4 24M58 30L4 32M58 34L6 42M58 38L12 50',
  },
};

const BY_SLUG: Record<string, Shape> = {
  lipan: 'grayling',
  scuka: 'pike',
  smuc: 'perch',
  ostriz: 'perch',
  'soncni-ostriz': 'perch',
  jegulja: 'eel',
  ugor: 'eel',
  cipelj: 'trout',
  bolen: 'trout',
  lignji: 'squid',
  sipa: 'squid',
  som: 'catfish',
  'americki-somic': 'catfish',
  menek: 'catfish',
};
const BY_GROUP: Record<string, Shape> = {
  salmonid: 'trout',
  predator: 'perch',
  cyprinid: 'carp',
  catfish: 'catfish',
  sea: 'bream',
  cephalopod: 'squid',
  other: 'carp',
};

export function shapeFor(slug: string, group: string): Shape {
  return BY_SLUG[slug] ?? BY_GROUP[group] ?? 'carp';
}

export function FishSilhouette({ slug, group, label, className = 'h-12 w-40' }: { slug: string; group: string; label?: string; className?: string }) {
  const s = SHAPES[shapeFor(slug, group)];
  return (
    <svg viewBox="0 0 200 60" className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={s.body} fill="currentColor" />
      {s.extra && <path d={s.extra} fill="currentColor" />}
      {s.lines && <path d={s.lines} stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
      <circle cx={s.eye[0]} cy={s.eye[1]} r="2.2" fill="var(--paper)" />
    </svg>
  );
}
