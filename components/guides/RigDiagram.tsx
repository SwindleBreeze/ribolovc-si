import type { ReactNode } from 'react';

/**
 * Drawn rig diagrams for the guides. Parts are marked with numbers on the drawing; the
 * legend next to it carries the names and sizes, so it stays readable on a phone and can be
 * translated. Colours come from the theme (ink, paper, water, accent).
 */

type Legend = { title: string; spec?: string }[];
type Diagram = {
  viewBox: string;
  label: { sl: string; en: string };
  legend: { sl: Legend; en: Legend };
  draw: (lang: 'sl' | 'en') => ReactNode;
  markers: [number, number][];
};

const INK = 'var(--ink)';
const PAPER = 'var(--raised)';
const ACCENT = 'var(--accent)';
const MUTED = 'var(--muted)';

function Water({ top, bottom, width }: { top: number; bottom: number; width: number }) {
  return (
    <g aria-hidden="true">
      <rect x="0" y={top} width={width} height={bottom - top} fill="var(--water)" opacity="0.28" />
      <path
        d={`M0 ${top} ${'q 10 -5 20 0 t 20 0 '.repeat(Math.ceil(width / 40))}`}
        fill="none"
        stroke="var(--river)"
        strokeWidth="1.5"
      />
    </g>
  );
}

function Bed({ y, width, kind = 'gravel' }: { y: number; width: number; kind?: 'gravel' | 'sand' }) {
  return (
    <g aria-hidden="true">
      <line x1="0" x2={width} y1={y} y2={y} stroke={INK} strokeWidth="1.5" />
      {Array.from({ length: Math.floor(width / 18) }, (_, i) =>
        kind === 'gravel' ? (
          <ellipse key={i} cx={9 + i * 18} cy={y + 7} rx={5 + (i % 3)} ry="3.5" fill="none" stroke={MUTED} strokeWidth="1" />
        ) : (
          <circle key={i} cx={6 + i * 18} cy={y + 6 + (i % 2) * 4} r="1.2" fill={MUTED} />
        ),
      )}
    </g>
  );
}

function Hook({ x, y, scale = 1, up = false }: { x: number; y: number; scale?: number; up?: boolean }) {
  // Eye at (x, y); shank down, bend and point back up.
  const s = scale * (up ? -1 : 1);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale} ${s})`} fill="none" stroke={INK} strokeWidth={2 / scale} strokeLinecap="round">
      <circle cx="0" cy="-3" r="3" />
      <path d="M0 0 L0 22 C0 32 14 32 14 22 L14 16" />
      <path d="M14 16 l-4 5" />
    </g>
  );
}

function Shot({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill={INK} />;
}

const DIAGRAMS: Record<string, Diagram> = {
  'float-rig': {
    viewBox: '0 0 300 460',
    label: { sl: 'Sistem s plovcem', en: 'Float rig' },
    markers: [
      [150, 40],
      [150, 92],
      [150, 150],
      [150, 262],
      [150, 352],
      [150, 404],
    ],
    draw: (lang) => (
      <>
        <Water top={112} bottom={430} width={300} />
        <Bed y={430} width={300} kind="sand" />
        <line x1="120" x2="120" y1="0" y2="400" stroke={INK} strokeWidth="1.2" />
        {/* waggler float: orange antenna above the surface */}
        <rect x="117" y="84" width="6" height="30" fill={ACCENT} />
        <path d="M117 114 L123 114 L129 160 Q120 176 111 160 Z" fill={PAPER} stroke={INK} strokeWidth="1.6" />
        <Shot x={120} y={250} />
        <Shot x={120} y={262} />
        <Shot x={120} y={274} />
        <Shot x={120} y={352} r={3.5} />
        <Hook x={120} y={400} scale={0.9} />
        <path d="M128 425 q4 -3 8 0 M124 428 q4 -3 8 0" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* depth: bait 5–10 cm above the bottom */}
        <path d="M40 114 V420 M34 114 H46 M34 420 H46" stroke={MUTED} strokeWidth="1" fill="none" />
        <text x="30" y="270" fontSize="11" fill={MUTED} transform="rotate(-90 30 270)" textAnchor="middle" fontFamily="var(--font-mono)">
          ↕ {lang === 'sl' ? 'globina' : 'depth'}
        </text>
      </>
    ),
    legend: {
      sl: [
        { title: 'Glavna vrvica', spec: '0,18–0,22 mm' },
        { title: 'Konica plovca nad vodo', spec: 'le 3–5 mm – tako vidite nežen prijem' },
        { title: 'Plovec (waggler)', spec: '1–4 g, pritrjen spodaj ali drsni s stoperjem' },
        { title: 'Glavne šibrice', spec: '≈ 70 % obtežitve, 40 cm nad trnkom' },
        { title: 'Kazalna šibrica', spec: '10 cm nad trnkom' },
        { title: 'Trnek z vabo', spec: 'vel. 12–16 (krap 8–10), 5–10 cm nad dnom' },
      ],
      en: [
        { title: 'Main line', spec: '0.18–0.22 mm' },
        { title: 'Float tip above the surface', spec: 'just 3–5 mm – shows the softest bite' },
        { title: 'Float (waggler)', spec: '1–4 g, bottom-end fixed or sliding with a stop knot' },
        { title: 'Bulk shot', spec: '≈ 70 % of the load, 40 cm above the hook' },
        { title: 'Tell-tale shot', spec: '10 cm above the hook' },
        { title: 'Hook and bait', spec: 'size 12–16 (carp 8–10), 5–10 cm off the bottom' },
      ],
    },
  },

  'feeder-rig': {
    viewBox: '0 0 420 300',
    label: { sl: 'Feeder sistem', en: 'Feeder rig' },
    markers: [
      [70, 52],
      [205, 236],
      [246, 286],
      [300, 262],
      [384, 266],
    ],
    draw: () => (
      <>
        <Water top={30} bottom={276} width={420} />
        <Bed y={276} width={420} />
        <path d="M0 6 C70 40 150 160 200 238" fill="none" stroke={INK} strokeWidth="1.2" />
        {/* feeder cage */}
        <g>
          <rect x="182" y="238" width="44" height="36" fill={PAPER} stroke={INK} strokeWidth="1.6" />
          {[194, 206, 218].map((x) => (
            <line key={x} x1={x} x2={x} y1="238" y2="274" stroke={INK} strokeWidth="0.8" />
          ))}
          {[250, 262].map((y) => (
            <line key={y} x1="182" x2="226" y1={y} y2={y} stroke={INK} strokeWidth="0.8" />
          ))}
          <rect x="182" y="266" width="44" height="8" fill={INK} />
        </g>
        {/* groundbait cloud */}
        {Array.from({ length: 18 }, (_, i) => (
          <circle key={i} cx={170 + ((i * 37) % 90)} cy={226 + ((i * 13) % 40)} r="1.6" fill={ACCENT} opacity="0.7" />
        ))}
        {/* swivel */}
        <path d="M232 268 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M240 268 h6 M246 268 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" fill="none" stroke={INK} strokeWidth="1.4" />
        <path d="M254 268 C290 262 330 272 372 266" fill="none" stroke={INK} strokeWidth="1" />
        <Hook x={372} y={262} scale={0.7} />
        <path d="M376 284 q4 -3 8 0" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    ),
    legend: {
      sl: [
        { title: 'Glavna vrvica', spec: '0,22–0,28 mm ali pletenica 0,10 mm' },
        { title: 'Krmilni koš', spec: '20–60 g (v toku 60–120 g), napolnjen z vabilno mešanico' },
        { title: 'Vrtljivka', spec: 'preprečuje zvijanje povrvice' },
        { title: 'Povrvica', spec: '50–100 cm, 0,14–0,18 mm' },
        { title: 'Trnek z vabo', spec: 'vel. 10–16 – ličinke, črvi, koruza' },
      ],
      en: [
        { title: 'Main line', spec: '0.22–0.28 mm or 0.10 mm braid' },
        { title: 'Feeder', spec: '20–60 g (60–120 g in current), filled with groundbait' },
        { title: 'Swivel', spec: 'stops the hooklength twisting' },
        { title: 'Hooklength', spec: '50–100 cm, 0.14–0.18 mm' },
        { title: 'Hook and bait', spec: 'size 10–16 – maggots, worms, corn' },
      ],
    },
  },

  'hair-rig': {
    viewBox: '0 0 420 300',
    label: { sl: 'Krapolov: hair rig z boilijem', en: 'Carp hair rig with a boilie' },
    markers: [
      [60, 168],
      [150, 214],
      [276, 112],
      [312, 236],
      [358, 222],
    ],
    draw: () => (
      <>
        <Water top={20} bottom={278} width={420} />
        <Bed y={278} width={420} kind="sand" />
        <path d="M0 40 C40 90 50 150 64 186" fill="none" stroke={INK} strokeWidth="1.2" />
        {/* lead clip + pear lead */}
        <rect x="58" y="184" width="14" height="22" rx="3" fill={PAPER} stroke={INK} strokeWidth="1.4" />
        <path d="M65 206 C40 214 40 262 65 270 C90 262 90 214 65 206 Z" fill={INK} />
        {/* hooklink */}
        <path d="M72 196 C140 210 200 190 246 146" fill="none" stroke={INK} strokeWidth="1.6" />
        {/* large hook */}
        <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
          <circle cx="250" cy="140" r="6" />
          <path d="M254 146 L276 206 C284 230 318 226 316 200 L312 184" />
          <path d="M312 184 l-8 10" />
        </g>
        {/* hair from the bend to the boilie */}
        <path d="M286 222 C300 240 320 250 336 256" fill="none" stroke={MUTED} strokeWidth="1.2" strokeDasharray="3 2" />
        <circle cx="358" cy="258" r="20" fill={ACCENT} opacity="0.85" stroke={INK} strokeWidth="1.4" />
        <line x1="378" x2="388" y1="258" y2="258" stroke={INK} strokeWidth="3" />
      </>
    ),
    legend: {
      sl: [
        { title: 'Svinec na varnostnem klipu', spec: '70–110 g; ob zatiku se sname' },
        { title: 'Povrvica', spec: '15–25 cm obložene pletenice' },
        { title: 'Trnek', spec: 'vel. 4–8, konica navzven' },
        { title: 'Lasek', spec: '1–2 cm od krivine trnka' },
        { title: 'Boili s stoperjem', spec: '15–20 mm' },
      ],
      en: [
        { title: 'Lead on a safety clip', spec: '70–110 g; drops off if snagged' },
        { title: 'Hooklink', spec: '15–25 cm of coated braid' },
        { title: 'Hook', spec: 'size 4–8, point turned out' },
        { title: 'Hair', spec: '1–2 cm off the bend' },
        { title: 'Boilie with stop', spec: '15–20 mm' },
      ],
    },
  },

  'drop-shot': {
    viewBox: '0 0 300 380',
    label: { sl: 'Drop-shot sistem', en: 'Drop-shot rig' },
    markers: [
      [150, 60],
      [150, 196],
      [254, 214],
      [150, 344],
    ],
    draw: () => (
      <>
        <Water top={30} bottom={360} width={300} />
        <Bed y={360} width={300} />
        <line x1="120" x2="120" y1="0" y2="330" stroke={INK} strokeWidth="1.2" />
        {/* hook tied with a palomar, point up, soft bait nose-hooked */}
        <Hook x={120} y={212} scale={0.8} up />
        <path d="M134 196 C160 190 190 200 214 194 C226 191 236 196 240 200" fill="none" stroke={ACCENT} strokeWidth="6" strokeLinecap="round" />
        {/* teardrop weight on the bottom */}
        <path d="M120 330 C104 338 106 358 120 358 C134 358 136 338 120 330 Z" fill={INK} />
        {/* distance */}
        <path d="M70 212 V340 M64 212 H76 M64 340 H76" stroke={MUTED} strokeWidth="1" fill="none" />
        <text x="58" y="280" fontSize="12" fill={MUTED} fontFamily="var(--font-mono)" textAnchor="end">
          20–50
        </text>
        <text x="58" y="294" fontSize="12" fill={MUTED} fontFamily="var(--font-mono)" textAnchor="end">
          cm
        </text>
      </>
    ),
    legend: {
      sl: [
        { title: 'Pletenica + fluorokarbon', spec: '0,06–0,10 mm + 0,20–0,25 mm' },
        { title: 'Trnek z vozlom palomar', spec: 'vel. 2–6, konica navzgor' },
        { title: 'Mikro gumica', spec: '5–8 cm, nataknjena skozi gobček' },
        { title: 'Utež na koncu', spec: '5–15 g – ostane na dnu, vaba pleše nad njo' },
      ],
      en: [
        { title: 'Braid + fluorocarbon', spec: '0.06–0.10 mm + 0.20–0.25 mm' },
        { title: 'Hook on a palomar knot', spec: 'size 2–6, point up' },
        { title: 'Micro soft bait', spec: '5–8 cm, nose-hooked' },
        { title: 'Weight at the end', spec: '5–15 g – stays down while the bait dances above' },
      ],
    },
  },

  'sea-bottom-rig': {
    viewBox: '0 0 320 420',
    label: { sl: 'Talni sistem (paternoster)', en: 'Bottom rig (paternoster)' },
    markers: [
      [180, 60],
      [270, 168],
      [282, 300],
      [180, 372],
    ],
    draw: () => (
      <>
        <Water top={30} bottom={400} width={320} />
        <Bed y={400} width={320} kind="sand" />
        <line x1="140" x2="140" y1="0" y2="368" stroke={INK} strokeWidth="1.4" />
        {[190, 290].map((y) => (
          <g key={y}>
            <circle cx="140" cy={y} r="4" fill={PAPER} stroke={INK} strokeWidth="1.4" />
            <path d={`M144 ${y} C190 ${y + 4} 220 ${y + 14} 246 ${y + 18}`} fill="none" stroke={INK} strokeWidth="1" />
            <Hook x={246} y={y + 16} scale={0.75} />
            <path d={`M252 ${y + 40} q5 -4 10 0 t10 0`} stroke={ACCENT} strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        ))}
        {/* pyramid weight */}
        <path d="M140 368 L124 398 L156 398 Z" fill={INK} />
      </>
    ),
    legend: {
      sl: [
        { title: 'Glavna vrvica', spec: '0,28–0,35 mm' },
        { title: 'Povrvici na trojnih vrtljivkah', spec: '30–50 cm, 0,20–0,25 mm' },
        { title: 'Trnek z morskim črvom', spec: 'vel. 4–10' },
        { title: 'Utež', spec: '30–100 g – piramidna na pesku' },
      ],
      en: [
        { title: 'Main line', spec: '0.28–0.35 mm' },
        { title: 'Snoods on three-way swivels', spec: '30–50 cm, 0.20–0.25 mm' },
        { title: 'Hook with sea worm', spec: 'size 4–10' },
        { title: 'Weight', spec: '30–100 g – pyramid on sand' },
      ],
    },
  },

  'euro-nymphing': {
    viewBox: '0 0 420 300',
    label: { sl: 'Evropsko nimfanje v toku', en: 'Euro nymphing in current' },
    markers: [
      [70, 30],
      [128, 64],
      [190, 160],
      [280, 236],
    ],
    draw: () => (
      <>
        <Water top={80} bottom={270} width={420} />
        <Bed y={270} width={420} />
        {[110, 160, 210].map((y) => (
          <path key={y} d={`M300 ${y} h60 m-8 -5 l8 5 l-8 5`} fill="none" stroke="var(--river)" strokeWidth="1.2" />
        ))}
        {/* rod tip, sighter above water, tippet down to the nymph */}
        <path d="M0 10 L96 34" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <path d="M96 34 L118 56" stroke={INK} strokeWidth="1.2" />
        <path d="M118 56 L138 92" stroke={ACCENT} strokeWidth="3" />
        <path d="M138 92 C160 150 200 210 240 252" fill="none" stroke={INK} strokeWidth="1" />
        {/* drift path */}
        <path d="M170 258 C210 256 250 254 300 252" fill="none" stroke={MUTED} strokeWidth="1" strokeDasharray="4 3" />
        {/* tungsten bead nymph */}
        <circle cx="244" cy="254" r="5" fill={ACCENT} stroke={INK} strokeWidth="1" />
        <path d="M249 254 C258 250 268 252 274 258 C266 262 256 262 249 256" fill={INK} />
      </>
    ),
    legend: {
      sl: [
        { title: 'Palica 10–11 čevljev', spec: 'vrh visoko, vrvica napeta' },
        { title: 'Indikator', spec: 'barvni del vrvice nad vodo – vsak zastoj je zasek' },
        { title: 'Predvrvica', spec: '0,12–0,16 mm, zameti 2–5 m' },
        { title: 'Nimfa z volframovo glavico', spec: 'vel. 12–18, tik nad dnom, s hitrostjo toka' },
      ],
      en: [
        { title: 'Rod 10–11 ft', spec: 'tip high, line tight' },
        { title: 'Sighter', spec: 'coloured section above the water – any pause means strike' },
        { title: 'Tippet', spec: '0.12–0.16 mm, casts of 2–5 m' },
        { title: 'Tungsten bead nymph', spec: 'size 12–18, just off the bottom at current speed' },
      ],
    },
  },

  eging: {
    viewBox: '0 0 420 260',
    label: { sl: 'Vodenje kalamarjere', en: 'Working a squid jig' },
    markers: [
      [60, 120],
      [190, 120],
      [300, 214],
    ],
    draw: () => (
      <>
        <Water top={30} bottom={240} width={420} />
        <Bed y={240} width={420} kind="sand" />
        <path
          d="M20 34 C40 120 60 190 90 222 L130 140 L150 210 L190 120 L210 200 C250 214 300 222 340 226"
          fill="none"
          stroke={INK}
          strokeWidth="1.4"
          strokeDasharray="5 3"
        />
        {/* jig */}
        <g transform="translate(340 222)">
          <path d="M0 0 L36 -6 L40 0 L36 6 Z" fill={ACCENT} stroke={INK} strokeWidth="1" />
          {[-4, 0, 4].map((dy) => (
            <path key={dy} d={`M-2 ${dy} l-8 ${dy - 2} M-2 ${dy} l-8 ${dy + 2}`} stroke={INK} strokeWidth="1" />
          ))}
        </g>
      </>
    ),
    legend: {
      sl: [
        { title: 'Potone', spec: 'štejte sekunde – tako spoznate globino' },
        { title: '2–3 ostri sunki navzgor', spec: 'vaba poskoči kot prestrašena kozica' },
        { title: 'Drsenje navzdol z napeto vrvico', spec: 'takrat lignji primejo – enakomerno navijajte' },
      ],
      en: [
        { title: 'Let it sink', spec: 'count the seconds to learn the depth' },
        { title: '2–3 sharp upward jerks', spec: 'the jig darts like a startled shrimp' },
        { title: 'Glide down on a tight line', spec: 'squid take now – then reel steadily' },
      ],
    },
  },
};

export function hasDiagram(slug: string) {
  return slug in DIAGRAMS;
}

export function RigDiagram({ slug, locale }: { slug: string; locale: string }) {
  const d = DIAGRAMS[slug];
  if (!d) return null;
  const lang = locale === 'sl' ? 'sl' : 'en';
  const legend = d.legend[lang];
  return (
    <figure className="not-prose my-8 grid items-start gap-6 border-y border-ink py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-testid="rig-diagram">
      <svg viewBox={d.viewBox} role="img" aria-label={d.label[lang]} className="block h-auto w-full max-w-[360px] justify-self-center text-ink">
        {d.draw(lang)}
        {d.markers.map(([x, y], i) => (
          <g key={i} aria-hidden="true">
            <circle cx={x} cy={y} r="11" fill={INK} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill={PAPER} fontFamily="var(--font-mono)">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        <p className="label mb-2">{d.label[lang]}</p>
        <ol className="text-[15px]">
          {legend.map((l, i) => (
            <li key={l.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 border-b border-rule-2 py-2">
              <span className="num mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] text-paper">{i + 1}</span>
              <span>
                <span className="block font-medium">{l.title}</span>
                {l.spec && <span className="num block text-[13px] text-muted">{l.spec}</span>}
              </span>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
