import type { ReactNode } from 'react';
import { ACCENT, BRAND, Hook, INK, line, MUTED, PAPER, Ring, Treble } from './tackle';

/**
 * Drawings of each lure type in content/lures.yaml, in the field-guide style: ink outlines,
 * paper highlights and one accent colour, so they work in light and dark. Rings, lips, fins
 * and hooks always overlap the part they hang from.
 */

const DRAWINGS: Record<string, ReactNode> = {
  vrtilka: (
    <>
      {/* wire shaft from the line eye to the rear eye */}
      <path d="M12.4 24H91" {...line} strokeWidth={1.3} />
      <Ring x={10} y={24} />
      {/* blade turning on a clevis at x = 30 */}
      <path d="M29 22.6C30 13 44 6 57 8.4C66 10 63 19.6 52.6 22.6C44.6 24.8 36 25.4 29 22.6Z" fill={PAPER} stroke={INK} strokeWidth={1.4} />
      <path d="M35 19.6C41 13.4 50 11 57 12.6" fill="none" stroke={MUTED} strokeWidth={1} />
      <path d="M27.6 21C31.4 21 31.4 27 27.6 27" fill="none" stroke={INK} strokeWidth={1.2} />
      <circle cx="65" cy="24" r="3.2" fill={ACCENT} stroke={INK} strokeWidth={1} />
      <circle cx="70.6" cy="24" r="2.3" fill={ACCENT} stroke={INK} strokeWidth={1} />
      <path d="M73 21.4C79 20.2 85 20.8 90 22.6V25.4C85 27.2 79 27.8 73 26.6Z" fill={INK} />
      <path d="M76 22.6C80 22 84 22.2 87 23" fill="none" stroke={PAPER} strokeOpacity={0.5} strokeWidth={0.9} />
      <Ring x={93} y={24} r={2.2} />
      <Treble x={95} y={24} angle={-90} />
    </>
  ),

  zlica: (
    <>
      <path d="M16 24C18 15 40 10 64 12C82 13.6 92 19 92 24C92 29 82 34.4 64 36C40 38 18 33 16 24Z" fill={PAPER} stroke={INK} strokeWidth={1.5} />
      <path d="M26 20.6C40 15 62 14 82 18.4" fill="none" stroke={ACCENT} strokeWidth={4.2} strokeLinecap="round" />
      <path d="M30 30C46 33.6 64 33.4 82 29" fill="none" stroke={MUTED} strokeWidth={1} />
      {/* holes at both ends, each with a split ring through it */}
      <circle cx="20" cy="24" r="1.3" fill={PAPER} stroke={INK} strokeWidth={0.9} />
      <circle cx="88.4" cy="24" r="1.3" fill={PAPER} stroke={INK} strokeWidth={0.9} />
      <Ring x={17.2} y={24} r={3} />
      <Ring x={91.2} y={24} r={3} />
      <Treble x={94.4} y={24} angle={-90} />
    </>
  ),

  wobler: (
    <>
      {/* clear diving lip, rooted inside the chin; the line tie goes through it */}
      <path d="M22 26.4L6.4 37.6C4.6 39.4 6.6 42.4 9.4 41.2L29 31Z" fill={PAPER} fillOpacity={0.75} stroke={INK} strokeWidth={1.2} />
      <Ring x={10.6} y={37.4} r={2.1} w={1.2} />
      <path d="M16 24C22 14 58 12 96 19C101.6 20.4 101.6 27.6 96 29C58 36 22 34 16 24Z" fill={PAPER} stroke={INK} strokeWidth={1.5} />
      <path d="M16.6 22.6C23 14.2 58 12.6 96 19.4C99.6 20.4 100.8 22.4 100.8 24C72 23.4 42 24 16.6 22.6Z" fill={BRAND} />
      <path d="M40 27C56 29.6 74 28.6 92 25.4" fill="none" stroke={MUTED} strokeWidth={0.9} strokeDasharray="1.2 2" />
      <path d="M31 17C27.6 21 27.6 27 31 31.4" fill="none" stroke={INK} strokeWidth={1.1} />
      <circle cx="24" cy="21.4" r="3.3" fill={PAPER} stroke={INK} strokeWidth={1.1} />
      <circle cx="24.5" cy="21.4" r="1.5" fill={INK} />
      {/* belly hanger and tail eye: rings centred on the body edge */}
      <Ring x={46} y={33} r={1.7} w={1.2} />
      <Treble x={46} y={34.4} s={0.9} />
      <Ring x={101.2} y={24} r={1.7} w={1.2} />
      <Treble x={102.6} y={24} angle={-90} s={0.9} />
    </>
  ),

  shad: (
    <>
      {/* soft body rooted inside the jig head, ribbed, with a paddle tail */}
      <path d="M22 18.4C38 14.4 60 15.4 76 21C80 22.2 83 22.4 86 22C88 16 92 12.6 95.4 13.6C98.6 18 98.6 30 95.4 34.4C92 35.4 88 32 86 26C83 25.6 80 25.8 76 27C60 32.6 38 33.6 22 29.6Z" fill={ACCENT} stroke={INK} strokeWidth={1.4} />
      {[36, 42, 48].map((x) => (
        <path key={x} d={`M${x} ${17.2}V${31.6}`} stroke={INK} strokeOpacity={0.28} strokeWidth={1} />
      ))}
      <circle cx="19" cy="24" r="8.4" fill={INK} />
      <circle cx="16.4" cy="22.2" r="2.3" fill={PAPER} />
      <circle cx="16" cy="22.2" r="1.1" fill={INK} />
      {/* hook eye on top of the head, hook point out through the back */}
      <Ring x={19} y={14.6} r={2.4} />
      <path d="M56 18.6C56 11 60 8.6 64.6 10.6M64.6 10.6l-1.2 1.8" {...line} />
    </>
  ),

  'drop-shot': (
    <>
      <path d="M30 0V38" {...line} strokeWidth={1.1} />
      {/* hook tied on the line (palomar), point up, micro worm on the point */}
      <circle cx="30" cy="14" r="1.8" fill="none" stroke={INK} strokeWidth={1.3} />
      <path d="M31.8 14H40C44.6 14 44.6 6.6 40 6.6L36.6 7.8M36.6 7.8l0.6 -1.8" {...line} strokeWidth={1.3} />
      <g fill="none" strokeLinecap="round">
        <path d="M37.6 7.4C46 3.6 54 10.4 62 8.2C70 6 76 12.2 84 11C90 10.2 96 13 104 13" stroke={INK} strokeWidth={6.4} />
        <path d="M37.6 7.4C46 3.6 54 10.4 62 8.2C70 6 76 12.2 84 11C90 10.2 96 13 104 13" stroke={BRAND} strokeWidth={4.6} />
      </g>
      <path d="M30 37C26.4 40 26 46.6 30 46.8C34 46.6 33.6 40 30 37Z" fill={INK} />
      <path d="M20 14.6V40M18 14.6H22M18 40H22" stroke={MUTED} strokeWidth={0.9} fill="none" />
    </>
  ),

  povrsinska: (
    <>
      <path d="M0 30q8 -3.4 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" fill="none" stroke="var(--river)" strokeWidth={1.2} />
      <path d="M14 15C40 13.4 70 15 92 19C97.4 20 97.4 25 92 26C70 30 40 32 14 31Z" fill={PAPER} stroke={INK} strokeWidth={1.5} />
      <path d="M18 16C40 14.6 70 16.2 92 19.6C70 19.6 40 19.2 18 19.8Z" fill={ACCENT} />
      {/* cupped face */}
      <path d="M14 15C18.6 19 18.6 27 14 31C11.6 27 11.6 19 14 15Z" fill={INK} />
      <circle cx="26" cy="21" r="2.6" fill={PAPER} stroke={INK} strokeWidth={1} />
      <circle cx="26.4" cy="21" r="1.2" fill={INK} />
      <Ring x={13.4} y={23} r={2.2} />
      <path d="M6 15.6l-3.6 -3.6M5.4 23l-4.6 0.4M7.4 29.4l-3.4 3" {...line} stroke={MUTED} strokeWidth={1.2} />
      <Ring x={54} y={30.4} r={1.6} w={1.2} />
      <Treble x={54} y={31.6} s={0.85} />
      <Ring x={96} y={22.6} r={1.6} w={1.2} />
      <Treble x={97.4} y={22.6} angle={-90} s={0.85} />
      <path d="M108 22.6l7 -4M108 22.6l8 -0.6M108 22.6l7 3.4" stroke={ACCENT} strokeWidth={1.2} strokeLinecap="round" />
    </>
  ),

  nimfa: (
    <>
      <Hook x={14.6} y={20} len={70} gap={13} />
      <circle cx="22" cy="20" r="5.6" fill={ACCENT} stroke={INK} strokeWidth={1.1} />
      <path d="M26.6 15.4C34 12.4 44 13.2 48.6 16.2V23.8C44 26.8 34 27.6 26.6 24.6Z" fill={INK} />
      <path d="M30 15.6C36 14 42 14.2 46.6 16.6" fill="none" stroke={PAPER} strokeOpacity={0.5} strokeWidth={1} />
      <path d="M48 16.4C60 16 72 18 83 19.4V20.8C72 22.6 60 24.4 48 24Z" fill={BRAND} stroke={INK} strokeWidth={1} />
      {[54, 60, 66, 72, 78].map((x) => (
        <path key={x} d={`M${x} ${16.8 + (x - 48) * 0.06}V${23.4 - (x - 48) * 0.08}`} stroke={PAPER} strokeOpacity={0.7} strokeWidth={0.9} />
      ))}
      <path d="M32 25.6l-3.4 6.4M38.4 26.6l-0.4 6.8M44.4 25.8l3 6" {...line} strokeWidth={1} />
      <path d="M83 20l9 -4.4M83 20l10.4 -1.4M83 20l9 2.6" {...line} strokeWidth={0.9} />
    </>
  ),

  'suha-muha': (
    <>
      <Hook x={14} y={32} len={64} gap={12} />
      {/* upright wings rooted on the shank */}
      <path d="M33.4 31.4C27.4 20 28.4 9 33 5C36.4 12 37.4 22 35.6 31.4Z" fill={PAPER} stroke={INK} strokeWidth={1.1} />
      <path d="M35.4 31.4C38.4 19 45 11 51.4 10C48.4 18 42.4 25.6 37.6 31.6Z" fill={PAPER} stroke={INK} strokeWidth={1.1} />
      <path d="M32.6 9.4C33.6 16 34.6 23 34.6 30M47 13.4C43 19 39.6 25 36.8 30.6" fill="none" stroke={MUTED} strokeWidth={0.8} />
      <path d="M38 30C52 29.2 64 30 75 31.2V32.8C64 34 52 34.8 38 34Z" fill={BRAND} stroke={INK} strokeWidth={0.9} />
      {/* hackle collar wound round the shank */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = ((i * 22.5 + 11) * Math.PI) / 180;
        return <path key={i} d={`M30 32l${(Math.cos(a) * 8).toFixed(1)} ${(Math.sin(a) * 8).toFixed(1)}`} stroke={ACCENT} strokeWidth={0.9} strokeLinecap="round" />;
      })}
      <path d="M75 31.6l20 -5.4M75 32l21 -1.4M75 32.4l20 2.4" {...line} strokeWidth={0.9} />
    </>
  ),

  streamer: (
    <>
      <Hook x={12} y={22} len={52} gap={12} />
      <path d="M22 17C40 9.6 72 11.6 112 19.6C92 22.4 72 23.4 62 22.6C50 22 36 21.8 22 21.6Z" fill={BRAND} stroke={INK} strokeWidth={1.1} />
      <path d="M30 15.6C52 12.6 80 14 108 19.4M30 19C54 17.6 80 18.6 104 20.6" fill="none" stroke={PAPER} strokeOpacity={0.55} strokeWidth={0.9} />
      <path d="M24 20.6C40 20.6 54 21 66 21.6" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" />
      <path d="M14 17.4L23 15.6V28.4L14 26.6Z" fill={INK} />
      <circle cx="18.4" cy="20.6" r="1.9" fill={PAPER} />
    </>
  ),

  zopf: (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} fill="none" strokeLinecap="round">
          <path d={`M${23 + i * 13} 18c6 0 8 12 13 12`} stroke={ACCENT} strokeWidth={5.2} />
          <path d={`M${23 + i * 13} 30c6 0 8 -12 13 -12`} stroke={BRAND} strokeWidth={5.2} />
        </g>
      ))}
      <path d="M101 18l11 -4.4M101 30l11 4.4" stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
      <circle cx="18" cy="24" r="8.4" fill={INK} />
      <circle cx="15.4" cy="22.2" r="2.2" fill={PAPER} />
      <circle cx="15" cy="22.2" r="1" fill={INK} />
      <Ring x={18} y={14.6} r={2.4} />
      <path d="M42 18.6C42 11 46 8.6 50.6 10.6M50.6 10.6l-1.2 1.8" {...line} />
    </>
  ),

  kalamarjera: (
    <>
      {/* side fins and lead keel rooted under the body */}
      <path d="M33 28L27 40.4L45 30.6Z" fill={PAPER} stroke={INK} strokeWidth={1} />
      <path d="M50 29L46 40.4L59 30.4Z" fill={PAPER} stroke={INK} strokeWidth={1} />
      <path d="M13 26C15 33 25 34.6 30 31L28 28Z" fill={INK} />
      <path d="M11 22C14 13 30 11 64 13.4C72 14 78 16 82 18.6V25.4C78 28 72 30 64 30.6C30 33 14 31 11 22Z" fill={ACCENT} stroke={INK} strokeWidth={1.4} />
      <path d="M18 19.6C32 16.4 56 15.6 78 18.6M24 26.6C40 28 60 27.6 78 25" fill="none" stroke={PAPER} strokeOpacity={0.6} strokeWidth={0.9} />
      <circle cx="19" cy="20" r="2.7" fill={INK} />
      <circle cx="18.2" cy="19.2" r="0.9" fill={PAPER} />
      <Ring x={9} y={22} r={2.3} />
      {/* stem and two crowns of needles */}
      <path d="M82 22H96" {...line} strokeWidth={1.3} />
      {[88, 95].map((x) =>
        [-6, -3, 0, 3, 6].map((dy) => (
          <path key={`${x}${dy}`} d={`M${x} 22L${x + 7} ${22 + dy * 1.1}l-1.6 ${dy >= 0 ? -1.4 : 1.4}`} {...line} strokeWidth={0.9} />
        )),
      )}
    </>
  ),

  'metal-jig': (
    <>
      <path d="M12 22C20 15 60 13 104 19C109.4 20.4 109.4 25.6 104 27C60 32 20 29.6 12 22Z" fill={PAPER} stroke={INK} strokeWidth={1.5} />
      <path d="M13 21.2C21 15.6 60 13.8 103.6 19.4C106 20 107.2 21.2 107.6 22.4C76 21.4 44 22.4 13 21.2Z" fill={BRAND} />
      <path d="M26 25.4C48 27 76 26.4 100 24" fill="none" stroke={ACCENT} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="22" cy="21.6" r="2.2" fill={INK} />
      <Ring x={10.4} y={22} r={2.6} />
      <Ring x={109.4} y={23} r={2.1} />
      <Treble x={110.8} y={23} angle={-90} s={0.8} />
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
    <svg viewBox="0 0 120 48" className={className} overflow="visible" aria-hidden="true" focusable="false">
      {drawing}
    </svg>
  );
}
