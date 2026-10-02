'use client';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { EstimateFillOverlay } from './estimate-fill-overlay';
import { SignalDiagramOverlay } from './signal-diagram-overlay';

// Live Events "How we work": four drawn concept boards, brought to life.
// The boards are 1672 x 941; the animated details are laid over them in the same coordinate space.

const IMAGES = [
  '/images/graphics/board-sketch.webp',
  '/images/graphics/board-signal.webp',
  '/images/graphics/board-stage.webp',
  '/images/graphics/board-show.webp',
  '/images/graphics/board-estimate.webp',
];

type Band = { from: number; to: number; delay: number; shift: number };

// Each board appears in bands, one after another, like it is being sketched / assembled.
const BANDS: Band[][] = [
  [
    { from: 0, to: 45, delay: 0, shift: -18 },
    { from: 45, to: 74, delay: 1, shift: 18 },
    { from: 74, to: 100, delay: 2, shift: 26 },
  ],
  [{ from: 0, to: 100, delay: 0, shift: 0 }],
  [
    { from: 0, to: 14, delay: 0, shift: -30 },
    { from: 14, to: 42, delay: 0.8, shift: -16 },
    { from: 42, to: 72, delay: 1.7, shift: 16 },
    { from: 72, to: 100, delay: 2.6, shift: 30 },
  ],
  [{ from: 0, to: 100, delay: 0, shift: 0 }],
  [{ from: 0, to: 100, delay: 0, shift: 0 }],
];
const FINAL_DELAY = [3.4, 0.5, 4.2, 1.2, 0.5];
// Boards that appear at once (fast fade up from the dark) instead of in bands.
const QUICK = [1, 4];

// Signal paths traced from the signal line diagram (index 1). Video is orange, audio blue,
// lighting / control white dashed and wireless orange dashed, as drawn on the board.
const VIDEO = [
  'M700 812 L565 812 L565 768 L130 768 L130 572',
  'M778 780 L778 700 L832 692 L832 422 L486 420 L483 388 L402 385 L402 274',
  'M832 422 L1182 420 L1185 388 L1265 388 L1265 272',
  'M1232 775 L1545 774 L1545 570',
  'M668 752 L733 752 L733 782',
  'M858 752 L805 752 L805 782',
  'M946 805 L828 805',
];
const AUDIO = [
  'M985 778 L962 736 L960 406 L832 406',
  'M832 406 L612 405 L612 208 L588 204',
  'M832 406 L1050 405 L1050 208 L1078 204',
  'M832 406 L733 400 L733 360',
  'M832 406 L927 400 L927 360',
  'M832 406 L832 298',
];
const WIRELESS = ['M925 308 C 985 315, 1030 400, 1022 520 C 1018 620, 1030 700, 1018 778'];
const LIGHTING = [
  'M405 112 L405 65 L1260 65 L1260 112',
  'M607 112 L607 65',
  'M829 105 L829 65',
  'M1057 112 L1057 65',
  'M1225 790 L1232 738 L1478 736 L1478 220 L1430 218',
  'M1478 220 L1528 218',
  'M150 218 L255 218',
];
const RF_RINGS = [
  [914, 288],
  [158, 466],
  [1522, 480],
];

const SCREENS: number[][][][] = [
  [],
  [
    [
      [287, 140],
      [512, 138],
      [512, 262],
      [287, 262],
    ],
    [
      [686, 134],
      [980, 134],
      [980, 260],
      [686, 260],
    ],
    [
      [1157, 138],
      [1392, 138],
      [1392, 264],
      [1157, 264],
    ],
  ],
  [
    [
      [300, 113],
      [502, 113],
      [502, 230],
      [300, 230],
    ],
    [
      [688, 112],
      [982, 112],
      [982, 230],
      [688, 230],
    ],
    [
      [1167, 116],
      [1370, 116],
      [1370, 226],
      [1167, 226],
    ],
  ],
  [
    [
      [268, 290],
      [500, 290],
      [500, 425],
      [268, 425],
    ],
    [
      [668, 290],
      [1000, 290],
      [1000, 425],
      [668, 425],
    ],
    [
      [1170, 290],
      [1400, 290],
      [1400, 425],
      [1170, 425],
    ],
  ],
];

type Beam = { x: number; tx: number; color: 'blue' | 'orange'; delay: number; dur: number };
const STAGE_BEAMS: Beam[] = [
  { x: 305, tx: 345, color: 'blue', delay: 0, dur: 6 },
  { x: 498, tx: 520, color: 'orange', delay: 1.2, dur: 7.4 },
  { x: 710, tx: 700, color: 'blue', delay: 0.6, dur: 5.6 },
  { x: 905, tx: 900, color: 'orange', delay: 1.8, dur: 6.6 },
  { x: 1170, tx: 1150, color: 'blue', delay: 0.3, dur: 7.1 },
  { x: 1347, tx: 1325, color: 'orange', delay: 1.5, dur: 5.9 },
];
const SHOW_BEAMS: Beam[] = [
  { x: 380, tx: 410, color: 'blue', delay: 0, dur: 6 },
  { x: 543, tx: 590, color: 'blue', delay: 1.2, dur: 7.4 },
  { x: 648, tx: 610, color: 'orange', delay: 0.6, dur: 5.6 },
  { x: 1018, tx: 1000, color: 'orange', delay: 1.8, dur: 6.6 },
  { x: 1130, tx: 1100, color: 'blue', delay: 0.3, dur: 7.1 },
  { x: 1280, tx: 1250, color: 'blue', delay: 1.5, dur: 5.9 },
];

const num = (n: number): CSSProperties => ({ '--d': `${n}s` }) as CSSProperties;

function Flows({ startAt }: { startAt: number }) {
  const groups: { paths: string[]; kind: 'video' | 'audio' | 'lighting' | 'wireless' }[] = [
    { paths: VIDEO, kind: 'video' },
    { paths: AUDIO, kind: 'audio' },
    { paths: WIRELESS, kind: 'wireless' },
    { paths: LIGHTING, kind: 'lighting' },
  ];
  let n = 0;
  return (
    <>
      {groups.map((g) =>
        g.paths.map((d) => {
          const i = n++;
          const delay = startAt + i * 0.04;
          return (
            <g key={`${g.kind}${i}`}>
              {(g.kind === 'video' || g.kind === 'audio') && (
                <path d={d} pathLength={100} className={`flow-base flow-${g.kind}`} style={num(delay)} />
              )}
              <path
                d={d}
                pathLength={100}
                className={`flow flow-${g.kind}`}
                style={{ ...num(delay + 0.4 + (i % 5) * 0.1), '--speed': `${2.2 + (i % 4) * 0.4}s` } as CSSProperties}
              />
            </g>
          );
        }),
      )}
      {RF_RINGS.map(([cx, cy], i) => (
        <g className="rf" key={i} style={num(startAt + 1.4 + i * 0.3)}>
          <circle cx={cx} cy={cy} r={7} className="rf-ring" />
          <circle cx={cx} cy={cy} r={7} className="rf-ring rf-ring-2" />
        </g>
      ))}
    </>
  );
}

function Screens({ index, delay }: { index: number; delay: number }) {
  return (
    <>
      {SCREENS[index].map((quad, i) => (
        <polygon
          key={i}
          className="shim"
          style={num(delay + i * 0.5)}
          points={quad.map((p) => p.join(',')).join(' ')}
        />
      ))}
    </>
  );
}

function Beams({
  beams,
  y0,
  y1,
  delay,
  strength = 1,
}: {
  beams: Beam[];
  y0: number;
  y1: number;
  delay: number;
  strength?: number;
}) {
  return (
    <>
      {beams.map((b, i) => (
        <g key={i}>
          <polygon
            className={`beam beam-${b.color}`}
            points={`${b.x - 8},${y0} ${b.x + 8},${y0} ${b.tx + 38},${y1} ${b.tx - 38},${y1}`}
            style={
              {
                '--d': `${delay + b.delay}s`,
                '--dur': `${b.dur}s`,
                '--ox': `${b.x}px`,
                '--oy': `${y0}px`,
                '--max': 0.42 * strength,
              } as CSSProperties
            }
          />
          <circle className="lamp" cx={b.x} cy={y0 - 4} r={10} style={num(delay + b.delay)} />
        </g>
      ))}
    </>
  );
}

export function EventsGraphic({ index, label }: { index: number; label: string }) {
  const src = IMAGES[index];
  return (
    <div className={`graphic g-${index}`} role="img" aria-label={label}>
      {BANDS[index].map((b, i) => (
        <div
          key={i}
          className="g-layer"
          style={
            {
              clipPath: `inset(${b.from}% 0 ${100 - b.to}% 0)`,
              '--d': `${b.delay}s`,
              '--shift': `${b.shift}px`,
              '--gdur': QUICK.includes(index) ? '0.45s' : undefined,
            } as CSSProperties
          }
        >
          <Image src={src} alt="" fill priority={index === 0} sizes="(max-width: 900px) 100vw, 56vw" />
        </div>
      ))}
      <div className="g-final" style={num(FINAL_DELAY[index])}>
        <Image src={src} alt="" fill sizes="(max-width: 900px) 100vw, 56vw" />
      </div>

      <svg className="g-overlay" viewBox="0 0 1672 941" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="gb-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3db4ff" stopOpacity="0.8" />
            <stop offset="1" stopColor="#3db4ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gb-orange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffa24a" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ff6a1a" stopOpacity="0" />
          </linearGradient>
          <filter id="g-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {index === 1 && (
          <>
            <Flows startAt={0.3} />
            <Screens index={1} delay={0.8} />
          </>
        )}
        {index === 2 && (
          <>
            <Beams beams={STAGE_BEAMS} y0={100} y1={330} delay={4.4} strength={0.7} />
            <Screens index={2} delay={4.6} />
          </>
        )}
        {index === 3 && (
          <>
            <Beams beams={SHOW_BEAMS} y0={156} y1={450} delay={1} />
            <Screens index={3} delay={1.4} />
          </>
        )}
      </svg>
      {index === 1 && <SignalDiagramOverlay delay={0.4} />}
      {index === 4 && <EstimateFillOverlay delay={700} />}
    </div>
  );
}
