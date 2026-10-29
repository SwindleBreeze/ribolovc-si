import type { ReactNode } from 'react';
import type { Bait } from '@/lib/advice';
import { outlinePath, SHAPES } from '@/lib/fish-shapes';
import { Hook, hookPaths, INK, line, MUTED, PAPER, Tube } from './tackle';
import { LureIllustration } from './LureIllustration';

/**
 * Natural baits, drawn like the lures: each sits on the hook it is fished on, with the
 * hook point showing through. Natural colours are fixed (worms are pink in any theme);
 * outlines and highlights follow the theme.
 */

const WORM = '#C0756A';
const WORM_BAND = '#DDA393';
const MAGGOT = '#F1E6C8';
const CORN = '#EFBE2C';
const BOILIE = '#C68A52';
const BREAD = '#EEDFBB';
const CRUST = '#B98245';
const CHEESE = '#EBC45E';
const PASTE = '#DDBB8E';
const PELLET = '#7E5232';
const RAGWORM = '#B4584B';

const ROACH = outlinePath(SHAPES.roach.outline);

function Maggot({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M-8 0C-8 -3.4 6 -3.8 8 -1.2C9 0 9 0 8 1.2C6 3.8 -8 3.4 -8 0Z" fill={MAGGOT} stroke={INK} strokeWidth={1.1} />
      {[-4.6, -1.6, 1.4, 4.4].map((sx) => (
        <path key={sx} d={`M${sx} -2.6Q${sx + 0.8} 0 ${sx} 2.6`} fill="none" stroke={INK} strokeOpacity={0.3} strokeWidth={0.7} />
      ))}
      <circle cx="6.4" cy="-0.4" r="0.6" fill={INK} />
    </g>
  );
}

function Kernel({ x, y, angle = 0, s = 1 }: { x: number; y: number; angle?: number; s?: number }) {
  // A sweetcorn kernel: broad, slightly domed crown narrowing to the tip where it sat on the cob.
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
      <path d="M-5.6 -3.6C-5.6 -6.4 5.6 -6.4 5.6 -3.6C5.6 0 3.4 4.6 0.8 6.4H-0.8C-3.4 4.6 -5.6 0 -5.6 -3.6Z" fill={CORN} stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
      <path d="M-1.8 -2.6C-1.8 -0.6 -1 2.4 0 3.4C1 2.4 1.8 -0.6 1.8 -2.6C1.8 -3.8 -1.8 -3.8 -1.8 -2.6Z" fill="#F7DC8A" />
      <path d="M-3.4 -4.4C-1.4 -5.2 1.4 -5.2 3.4 -4.4" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={0.9} strokeLinecap="round" />
    </g>
  );
}

function Speckled({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const dots = [
    [-0.4, -0.3],
    [0.3, -0.45],
    [0.45, 0.15],
    [-0.15, 0.4],
    [-0.5, 0.15],
    [0.1, 0],
  ];
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={1.2} />
      {dots.map(([dx, dy]) => (
        <circle key={`${dx}${dy}`} cx={x + dx * r} cy={y + dy * r} r={r * 0.07} fill={INK} fillOpacity={0.35} />
      ))}
      <path d={`M${x - r * 0.55} ${y - r * 0.35}A${r * 0.65} ${r * 0.65} 0 0 1 ${x - r * 0.05} ${y - r * 0.7}`} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.1} strokeLinecap="round" />
    </g>
  );
}

const hook = (x: number, y: number, len: number, gap = 12) => hookPaths(x, y, len, gap);

const DRAWINGS: Partial<Record<Bait, ReactNode>> = {
  worms: (() => {
    const h = hook(14, 14, 46, 13);
    const worm = 'M20 14.6C30 12.6 44 16.6 57 14.6C66 13.4 71 20 66.6 26C62.6 32 70 39.4 81 35.4C91 31.6 98 39.6 108 41';
    return (
      <>
        <g {...line}>
          <circle {...h.eye} />
          <path d={h.shank} />
        </g>
        <Tube d={worm} width={5} fill={WORM} />
        <path d={worm} pathLength={100} fill="none" stroke={WORM_BAND} strokeWidth={5.4} strokeDasharray="0 22 7 71" strokeLinecap="round" />
        <path d={h.bend} {...line} />
      </>
    );
  })(),

  maggots: (() => {
    const h = hook(30, 10, 22, 11);
    return (
      <>
        <path d="M0 10H28" stroke={MUTED} strokeWidth={1} />
        <Maggot x={47.4} y={28.4} angle={84} />
        <Maggot x={55} y={26.6} angle={42} />
        <Maggot x={40} y={26} angle={130} />
        <g {...line}>
          <circle {...h.eye} />
          <path d={h.shank} />
          <path d={h.bend} />
        </g>
        <Maggot x={86} y={22} angle={-12} />
        <Maggot x={102} y={33} angle={18} />
      </>
    );
  })(),

  corn: (() => {
    const h = hook(26, 12, 26, 13);
    return (
      <>
        <path d="M0 12H24" stroke={MUTED} strokeWidth={1} />
        <g {...line}>
          <circle {...h.eye} />
          <path d={h.shank} />
        </g>
        <Kernel x={44} y={12} angle={0} />
        <Kernel x={57} y={19} angle={90} />
        <path d={h.bend} {...line} />
        <Kernel x={84} y={28} angle={20} s={0.95} />
        <Kernel x={98} y={20} angle={-30} s={0.95} />
        <Kernel x={104} y={34} angle={70} s={0.95} />
      </>
    );
  })(),

  boilies: (
    <>
      <path d="M0 16H12" stroke={MUTED} strokeWidth={1.2} />
      <Hook x={14} y={16} len={40} gap={14} />
      {/* the hair runs from the bend to the boilie and its stop */}
      <path d="M54.6 30C60 32 64 32 68 32" fill="none" stroke={MUTED} strokeWidth={1.1} />
      <Speckled x={79} y={32} r={11} fill={BOILIE} />
      <path d="M90 32H95" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Speckled x={108} y={16} r={7} fill={BOILIE} />
    </>
  ),

  bread: (() => {
    const h = hook(14, 20, 50, 13);
    return (
      <>
        <g {...line}>
          <circle {...h.eye} />
          <path d={h.shank} />
        </g>
        <path d="M30 18C28 12 36 9 42 12C46 7 56 8 58 13C64 12 68 18 64 22C68 27 62 32 56 30C52 35 42 34 40 30C34 32 28 28 30 23C26 22 26 18 30 18Z" fill={BREAD} stroke={INK} strokeWidth={1.2} />
        <path d="M36 17C40 16 44 18 46 20M50 16C53 15.4 56 16.6 57 19M40 26C44 25.4 48 27 50 28" fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={0.9} strokeLinecap="round" />
        <path d={h.bend} {...line} />
        {/* the slice it was pinched from */}
        <path d="M84 40V22C84 14 90 10 98 10C106 10 112 14 112 22V40Z" fill={BREAD} stroke={CRUST} strokeWidth={3} strokeLinejoin="round" />
        <path d="M84 40V22C84 14 90 10 98 10C106 10 112 14 112 22V40Z" fill="none" stroke={INK} strokeWidth={1.1} />
        <path d="M90 26c2 -1 3 1 5 0M100 31c2 -1 3 1 5 0M94 36c2 -1 3 1 5 0" fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={0.9} />
      </>
    );
  })(),

  cheese: (() => {
    const h = hook(14, 16, 44, 14);
    return (
      <>
        <g {...line}>
          <circle {...h.eye} />
          <path d={h.shank} />
        </g>
        {/* cube threaded on the bend */}
        <path d="M46 20L56 15L68 19L58 24Z" fill="#F4D98A" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
        <path d="M46 20V33L58 38V24Z" fill={CHEESE} stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
        <path d="M58 24V38L68 33V19Z" fill="#D8AE45" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
        <circle cx="51" cy="27" r="1.6" fill="#C79A33" />
        <circle cx="54.6" cy="33" r="1.1" fill="#C79A33" />
        <circle cx="63" cy="27.6" r="1.4" fill="#B88C2A" />
        <path d={h.bend} {...line} />
        <path d="M88 26L96 22L106 25L98 29Z" fill="#F4D98A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <path d="M88 26V36L98 40V29Z" fill={CHEESE} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <path d="M98 29V40L106 36V25Z" fill="#D8AE45" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <circle cx="93" cy="32" r="1.3" fill="#C79A33" />
      </>
    );
  })(),

  deadbait: (
    <>
      <path d="M0 8H67" stroke={MUTED} strokeWidth={1} />
      <g transform="translate(8 9) scale(0.52)">
        <path d={ROACH} fill={PAPER} stroke={INK} strokeWidth={2.4} />
        <path d="M32 19.5C39 25 39 36 31 41M40 31C80 31 120 31 158 31" fill="none" stroke={MUTED} strokeWidth={1.8} />
        <circle cx="18" cy="27.4" r="3" fill={INK} />
      </g>
      {/* single hook through the back, behind the dorsal fin: shank goes in, point comes out */}
      <circle cx="69" cy="8" r="2" fill="none" stroke={INK} strokeWidth={1.5} />
      <path d="M69 10V18.6" {...line} />
      <path d="M74.6 18.4C75 14.6 77.6 12.4 80.6 13M80.6 13l-1.8 1" {...line} />
    </>
  ),

  seaworm: (() => {
    const h = hook(10, 16, 64, 13);
    const worm = 'M16 16.6C34 14.4 52 18.6 72 16.4C80 15.6 84 22 80 28C76 34 86 40 98 36C106 33.4 110 36 114 39';
    return (
      <>
        <g {...line}>
          <circle {...h.eye} />
          <path d={h.shank} />
        </g>
        {/* parapodia fringe under the body */}
        <path d={worm} fill="none" stroke={INK} strokeOpacity={0.75} strokeWidth={8.4} strokeDasharray="0.9 1.6" strokeLinecap="butt" />
        <Tube d={worm} width={4.2} fill={RAGWORM} />
        <path d={h.bend} {...line} />
      </>
    );
  })(),

  paste: (() => {
    const h = hook(14, 22, 44, 13);
    return (
      <>
        <g {...line}>
          <circle {...h.eye} />
          <path d={h.shank} />
        </g>
        {/* moulded round the shank, leaving the bend and point free */}
        <path d="M26 20C26 11 36 7 44 10C53 13 56 22 52 30C48 37 36 38 30 33C26 30 25 25 26 20Z" fill={PASTE} stroke={INK} strokeWidth={1.2} />
        <path d="M32 15C36 13 40 13 43 15M31 23C33 22 36 22 38 23.4" fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={1} strokeLinecap="round" />
        <path d={h.bend} {...line} />
        <circle cx="96" cy="28" r="9" fill={PASTE} stroke={INK} strokeWidth={1.1} />
        <path d="M91 24C93 22.6 96 22.4 98 23.6" fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={1} strokeLinecap="round" />
      </>
    );
  })(),

  pellets: (
    <>
      <path d="M0 14H12" stroke={MUTED} strokeWidth={1.2} />
      <Hook x={14} y={14} len={36} gap={14} />
      <path d="M50.6 28C55 30 58 30 62 30" fill="none" stroke={MUTED} strokeWidth={1.1} />
      {/* drilled pellet on the hair */}
      <g>
        <ellipse cx="70" cy="30" rx="8" ry="9" fill={PELLET} stroke={INK} strokeWidth={1.2} />
        <ellipse cx="70" cy="30" rx="2" ry="2.2" fill={PAPER} stroke={INK} strokeWidth={0.8} />
        <path d="M64.4 25C66 22.6 69 22 71 22.4" fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={1} strokeLinecap="round" />
      </g>
      {[
        [92, 22, 5.6],
        [104, 32, 6],
        [90, 38, 4.4],
        [108, 16, 4],
      ].map(([x, y, r]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r={r} fill={PELLET} stroke={INK} strokeWidth={1} />
          <path d={`M${x - r * 0.55} ${y - r * 0.3}A${r * 0.6} ${r * 0.6} 0 0 1 ${x} ${y - r * 0.65}`} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={0.9} />
        </g>
      ))}
    </>
  ),
};

/** Baits that are really artificial flies or lures use the lure drawing. */
const AS_LURE: Partial<Record<Bait, string>> = { nymph: 'nimfa', dryfly: 'suha-muha', streamer: 'streamer', squidjig: 'kalamarjera' };

export function hasBaitIllustration(bait: Bait) {
  return bait in DRAWINGS || bait in AS_LURE;
}

export function BaitIllustration({ bait, className }: { bait: Bait; className?: string }) {
  const lure = AS_LURE[bait];
  if (lure) return <LureIllustration slug={lure} className={className} />;
  const drawing = DRAWINGS[bait];
  if (!drawing) return null;
  return (
    <svg viewBox="0 0 120 48" className={className} overflow="visible" aria-hidden="true" focusable="false">
      {drawing}
    </svg>
  );
}
