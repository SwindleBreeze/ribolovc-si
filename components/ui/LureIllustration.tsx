import type { ReactNode } from 'react';

/**
 * Line drawings of each lure type in content/lures.yaml, in the field-guide style:
 * ink outlines, paper highlights and one accent colour, so they work in light and dark.
 */

const INK = 'currentColor';
const PAPER = 'var(--raised)';
const ACCENT = 'var(--accent)';
const BRAND = 'var(--brand)';
const MUTED = 'var(--muted)';

const line = { fill: 'none', stroke: INK, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Treble hook hanging from a ring at (x, y). */
function Treble({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...line} strokeWidth={1.4 / s}>
      <circle cx="0" cy="0" r="2.2" />
      <path d="M0 2.2 V13" />
      <path d="M0 13 c0 5 -7 5 -7 0 l0 -2.5" />
      <path d="M0 13 c0 5 7 5 7 0 l0 -2.5" />
      <path d="M0 13 c-2 6 4 7 5 3" strokeOpacity="0.55" />
    </g>
  );
}

/** Single hook lying along the x axis: eye at (x, y), point back towards the eye. */
function Hook({ x, y, len = 26, up = false }: { x: number; y: number; len?: number; up?: boolean }) {
  const d = up ? -1 : 1;
  return (
    <g {...line}>
      <circle cx={x} cy={y} r="2" />
      <path d={`M${x + 2} ${y} H${x + len} c6 0 6 ${9 * d} 0 ${9 * d} h-6 l3 ${-3 * d}`} />
    </g>
  );
}

const DRAWINGS: Record<string, ReactNode> = {
  vrtilka: (
    <>
      <path d="M8 24 H96" {...line} />
      <circle cx="10" cy="24" r="2.4" {...line} />
      {/* blade on a clevis, tilted as it spins */}
      <path d="M28 24 C30 10 52 6 58 16 C62 24 46 34 34 30 Z" fill={PAPER} stroke={INK} strokeWidth="1.6" />
      <path d="M36 22 C42 14 50 13 54 17" fill="none" stroke={MUTED} strokeWidth="1.1" />
      <rect x="60" y="20" width="8" height="8" rx="4" fill={ACCENT} stroke={INK} strokeWidth="1.2" />
      <path d="M68 20 L82 21 L84 24 L82 27 L68 28 Z" fill={INK} />
      <Treble x={96} y={24} />
    </>
  ),
  zlica: (
    <>
      <circle cx="12" cy="24" r="3" {...line} />
      <path d="M15 24 C22 10 58 4 86 16 C96 20 96 28 86 32 C58 44 22 38 15 24 Z" fill={PAPER} stroke={INK} strokeWidth="1.6" />
      <path d="M26 22 C40 12 64 11 82 18" fill="none" stroke={ACCENT} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      <path d="M30 30 C46 34 64 34 80 29" fill="none" stroke={MUTED} strokeWidth="1" />
      <Treble x={100} y={24} />
    </>
  ),
  wobler: (
    <>
      <circle cx="8" cy="22" r="2.4" {...line} />
      {/* diving lip */}
      <path d="M10 22 L4 34 L16 32 Z" fill={PAPER} stroke={INK} strokeWidth="1.3" />
      <path d="M16 22 C24 8 64 6 90 16 L104 10 L102 24 L104 36 L90 30 C64 40 24 38 16 22 Z" fill={PAPER} stroke={INK} strokeWidth="1.6" />
      <path d="M18 21 C30 11 62 9 88 17 C62 18 36 20 18 21 Z" fill={BRAND} />
      <circle cx="26" cy="20" r="3.4" fill={PAPER} stroke={INK} strokeWidth="1.2" />
      <circle cx="26.6" cy="20" r="1.5" fill={INK} />
      <path d="M36 15 C33 20 33 26 36 30" fill="none" stroke={INK} strokeWidth="1.1" />
      <Treble x={48} y={33} s={0.85} />
      <Treble x={80} y={30} s={0.85} />
    </>
  ),
  shad: (
    <>
      <circle cx="18" cy="24" r="8" fill={INK} />
      <circle cx="16" cy="22" r="2.2" fill={PAPER} />
      <path d="M24 18 C40 12 70 14 84 20 L98 12 C102 18 102 30 98 36 L84 28 C70 34 40 36 24 30 Z" fill={ACCENT} stroke={INK} strokeWidth="1.4" />
      {[40, 52, 64].map((x) => (
        <path key={x} d={`M${x} 17 V31`} stroke={INK} strokeOpacity="0.35" strokeWidth="1" />
      ))}
      {/* hook point coming out of the back */}
      <path d="M56 18 C56 10 60 8 64 10" {...line} />
    </>
  ),
  'drop-shot': (
    <>
      <path d="M4 10 H112" {...line} strokeDasharray="1 0" />
      <path d="M60 10 V44" {...line} />
      <path d="M60 18 C70 18 74 22 72 26" {...line} />
      {/* nose-hooked micro worm */}
      <path d="M72 24 C82 20 94 22 104 26 C108 28 110 30 112 30" fill="none" stroke={BRAND} strokeWidth="5" strokeLinecap="round" />
      <path d="M58 38 C54 40 54 46 60 46 C66 46 66 40 62 38 Z" fill={INK} />
    </>
  ),
  povrsinska: (
    <>
      <path d="M2 30 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="var(--river)" strokeWidth="1.3" />
      <circle cx="12" cy="20" r="2.4" {...line} />
      {/* popper with a cupped face */}
      <path d="M16 12 C14 16 14 24 16 28 L86 24 C96 22 96 18 86 16 Z" fill={PAPER} stroke={INK} strokeWidth="1.6" />
      <path d="M16 12 C20 16 20 24 16 28" fill={INK} />
      <path d="M30 13 C50 12 70 13 86 16 C70 17 50 17 30 18 Z" fill={ACCENT} />
      <circle cx="28" cy="18" r="2.2" fill={INK} />
      <path d="M6 14 l-4 -4 M6 24 l-5 2 M8 8 l-1 -5" {...line} stroke={MUTED} />
      <Treble x={48} y={27} s={0.8} />
      <Treble x={94} y={20} s={0.8} />
    </>
  ),
  nimfa: (
    <>
      <Hook x={18} y={22} len={64} />
      <circle cx="22" cy="22" r="5.5" fill={ACCENT} stroke={INK} strokeWidth="1.2" />
      <path d="M28 18 C34 14 44 15 48 19 L48 25 C44 29 34 30 28 26 Z" fill={INK} />
      <path d="M48 19 C60 18 72 20 80 22 C72 25 60 27 48 25 Z" fill={BRAND} stroke={INK} strokeWidth="1" />
      {[54, 60, 66, 72].map((x) => (
        <path key={x} d={`M${x} 19.5 V25.5`} stroke={PAPER} strokeWidth="1" />
      ))}
      <path d="M34 28 l-4 7 M40 28 l0 8 M44 27 l4 7" {...line} strokeWidth="1" />
      <path d="M80 22 l10 -3 M80 22 l10 3" {...line} strokeWidth="1" />
    </>
  ),
  'suha-muha': (
    <>
      <Hook x={22} y={30} len={52} />
      {/* upright wings and hackle */}
      <path d="M40 30 C34 16 36 6 42 4 C44 12 44 22 42 30 Z" fill={PAPER} stroke={INK} strokeWidth="1.2" />
      <path d="M44 30 C46 16 52 8 58 8 C54 16 50 24 46 30 Z" fill={PAPER} stroke={INK} strokeWidth="1.2" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (-90 + (i - 4) * 20) * (Math.PI / 180);
        return <path key={i} d={`M44 30 l${Math.cos(a) * 12} ${Math.sin(a) * 12 + 6}`} stroke={ACCENT} strokeWidth="1.2" />;
      })}
      <path d="M48 28 C58 27 70 28 76 30 C70 32 58 33 48 32 Z" fill={BRAND} />
      {/* tail fibres */}
      <path d="M76 30 l20 -4 M76 30 l20 0 M76 30 l20 4" {...line} strokeWidth="1" />
    </>
  ),
  streamer: (
    <>
      <Hook x={14} y={22} len={40} />
      <circle cx="17" cy="22" r="4.5" fill={INK} />
      <circle cx="16" cy="21" r="1.4" fill={PAPER} />
      <path d="M22 22 C30 14 44 14 52 18 C70 14 90 14 110 22 C90 26 72 26 54 28 C44 30 30 30 22 22 Z" fill={BRAND} stroke={INK} strokeWidth="1.2" />
      <path d="M30 18 C50 16 80 16 108 21" fill="none" stroke={PAPER} strokeWidth="1" opacity="0.7" />
      <path d="M26 24 C40 28 56 28 70 26" fill="none" stroke={ACCENT} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  zopf: (
    <>
      <circle cx="16" cy="24" r="8" fill={INK} />
      <circle cx="14" cy="22" r="2" fill={PAPER} />
      {/* braided leather strips */}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <path d={`M${24 + i * 13} 18 c6 0 8 12 13 12`} fill="none" stroke={ACCENT} strokeWidth="5" strokeLinecap="round" />
          <path d={`M${24 + i * 13} 30 c6 0 8 -12 13 -12`} fill="none" stroke={BRAND} strokeWidth="5" strokeLinecap="round" />
        </g>
      ))}
      <path d="M102 18 l10 -4 M102 30 l10 4" {...line} />
      <path d="M40 18 C40 8 46 6 50 8" {...line} />
    </>
  ),
  kalamarjera: (
    <>
      <circle cx="8" cy="22" r="2.4" {...line} />
      {/* egi body with fins */}
      <path d="M10 22 C14 12 30 10 72 14 L82 18 L82 26 L72 30 C30 34 14 32 10 22 Z" fill={ACCENT} stroke={INK} strokeWidth="1.5" />
      <path d="M16 22 C30 18 56 17 76 20" fill="none" stroke={PAPER} strokeWidth="1.2" opacity="0.8" />
      <path d="M36 30 l-6 10 l12 -9 Z M52 30 l-4 10 l10 -9 Z" fill={PAPER} stroke={INK} strokeWidth="1" />
      <circle cx="18" cy="20" r="2.4" fill={INK} />
      {/* crown of needles */}
      {[-8, -4, 0, 4, 8].map((dy) => (
        <path key={dy} d={`M82 ${22 + dy * 0.6} l10 ${dy * 0.9} m0 0 l-2 ${dy > 0 ? -2 : 2}`} {...line} strokeWidth="1.1" />
      ))}
      <path d="M86 22 l10 0 m0 0 l-2 -2" {...line} strokeWidth="1.1" />
    </>
  ),
  'metal-jig': (
    <>
      <circle cx="10" cy="24" r="2.6" {...line} />
      {/* assist hook on a short cord */}
      <path d="M12 24 C16 30 20 34 24 36" fill="none" stroke={MUTED} strokeWidth="1.1" />
      <path d="M24 36 h10 c5 0 5 -7 0 -7 l-3 2" {...line} strokeWidth="1.3" />
      <path d="M14 24 C22 17 60 14 104 20 C108 22 108 26 104 28 C60 34 22 31 14 24 Z" fill={PAPER} stroke={INK} strokeWidth="1.6" />
      <path d="M22 22 C44 18 76 18 100 21 C76 23 44 24 22 22 Z" fill={BRAND} />
      <path d="M30 27 C50 29 76 28 98 26" fill="none" stroke={MUTED} strokeWidth="1" />
      <circle cx="24" cy="23" r="2" fill={INK} />
    </>
  ),
};

export function hasLureIllustration(slug: string) {
  return slug in DRAWINGS;
}

export function LureIllustration({ slug, className }: { slug: string; className?: string }) {
  const drawing = DRAWINGS[slug];
  if (!drawing) return null;
  return (
    <svg viewBox="0 0 120 48" className={className} aria-hidden="true" focusable="false">
      {drawing}
    </svg>
  );
}
