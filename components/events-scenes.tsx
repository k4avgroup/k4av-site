import layout from '@/data/sketch-layout.json';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { Frames, Plate, Sprite, type Anchor } from './scene';
import { SignalDiagramOverlay } from './signal-diagram-overlay';

// Board 1 and 2: the room sketch. Board 1 builds it step by step; board 2 shows it at once under the signal lines.
const SKETCH = '/images/animation/sketch';
const sprite = (file: string) => `${SKETCH}/${file.replace(/^board1-/, '').replace(/\.png$/, '')}.webp`;

export function SketchScene({ quick = false }: { quick?: boolean }) {
  return (
    <div className="sc">
      <Plate src={`${SKETCH}/room.webp`} delay={0} priority />
      {layout.items.map((item) => (
        <Sprite
          key={item.id}
          src={sprite(item.file)}
          x={item.x}
          y={item.y}
          w={item.w}
          anchor={item.anchor as Anchor}
          z={item.z}
          flip={item.flipX}
          // order 2..7 are the build steps; the room is already there at order 1
          delay={quick ? 0.15 : 0.45 + (item.order - 2) * 0.55}
        />
      ))}
    </div>
  );
}

// Board 2: the same room with the signal lines laid over it. Coordinates are in the 1672 x 941 space of the plate.
type Kind = 'video' | 'audio' | 'lighting' | 'wireless';
const ROUTES: { kind: Kind; d: string }[] = [
  // video, from the video switcher to the three screens
  { kind: 'video', d: 'M842 700 L842 560 L400 560 L400 262' },
  { kind: 'video', d: 'M842 560 L1273 560 L1273 262' },
  { kind: 'video', d: 'M862 700 L862 560 L870 560 L870 262' },
  // audio, from the audio console to the line arrays, the center cluster, the stage monitors and the podium
  { kind: 'audio', d: 'M642 700 L642 650 L470 650 L470 268 L555 268 L555 246' },
  { kind: 'audio', d: 'M642 650 L1210 650 L1210 268 L1117 268 L1117 246' },
  { kind: 'audio', d: 'M700 650 L700 72 L835 72 L835 98' },
  { kind: 'audio', d: 'M700 420 L744 420 L744 372' },
  { kind: 'audio', d: 'M1052 650 L1052 420 L918 420 L918 372' },
  { kind: 'audio', d: 'M700 395 L834 395 L834 360' },
  // lighting and control, along the top rig
  { kind: 'lighting', d: 'M1043 700 L1043 62 L1420 62' },
  { kind: 'lighting', d: 'M1043 62 L260 62' },
  // wireless: the two cameras
  { kind: 'wireless', d: 'M830 700 L830 640 L140 640 L140 592' },
  { kind: 'wireless', d: 'M860 640 L1540 640 L1540 592' },
];
const RF_RINGS = [
  [140, 500],
  [1540, 500],
];

export function SignalScene() {
  return (
    <div className="sc">
      <SketchScene quick />
      <svg className="g-overlay" viewBox="0 0 1672 941" aria-hidden="true" focusable="false">
        <defs>
          <filter id="g-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {ROUTES.map((r, i) => {
          const delay = 0.35 + i * 0.05;
          return (
            <g key={i}>
              <path
                d={r.d}
                pathLength={100}
                className={`sig sig-${r.kind}`}
                style={{ '--d': `${delay}s` } as CSSProperties}
              />
              {r.kind !== 'lighting' && r.kind !== 'wireless' && (
                <path
                  d={r.d}
                  pathLength={100}
                  className={`flow flow-${r.kind}`}
                  style={
                    { '--d': `${delay + 0.8 + (i % 5) * 0.12}s`, '--speed': `${2.2 + (i % 4) * 0.4}s` } as CSSProperties
                  }
                />
              )}
            </g>
          );
        })}
        {RF_RINGS.map(([cx, cy], i) => (
          <g className="rf" key={i} style={{ '--d': `${1.4 + i * 0.3}s` } as CSSProperties}>
            <circle cx={cx} cy={cy} r={8} className="rf-ring" />
            <circle cx={cx} cy={cy} r={8} className="rf-ring rf-ring-2" />
          </g>
        ))}
      </svg>
      <SignalDiagramOverlay delay={0.9} />
    </div>
  );
}

// Board 3: the stage is built. Times are in seconds from the start of the board.
const STAGE = '/images/animation/stage';
const st = (name: string) => `${STAGE}/${name}.webp`;
const T = {
  cases: 0.5,
  push: 0.8,
  arrive: 4.4,
  watch: 1.3,
  lift: 1.7,
  liftEnd: 4.7,
  tech: 4.2,
  camera: 5.2,
  projector: 6.4,
  beam: 7.4,
};
// the six lamps hang under the truss once it is up
const LAMPS = [583, 683, 786, 885, 987, 1087];
const LAMP_Y = 154;
const w = (n: number): CSSProperties => ({ '--d': `${n}s` }) as CSSProperties;

export function StageScene() {
  return (
    <div className="sc">
      <Plate src={st('plate')} priority />

      {/* the center screen hangs on the back wall, like the two side panels of the plate */}
      <div className="st-wall" style={w(0.3)} />

      {/* the truss goes up in steps, with the lamps under it */}
      <Sprite
        src={st('truss')}
        x={50}
        y={37.8}
        w={40}
        z={20}
        enter="none"
        className="sc-lift"
        style={
          { '--y0': '37.8%', '--y1': '9.1%', '--dur': `${T.liftEnd - T.lift}s`, '--d': `${T.lift}s` } as CSSProperties
        }
      />

      {/* the road cases */}
      <Sprite src={st('case-closed')} x={64} y={60} w={7.8} anchor="bottom-center" z={30} delay={T.cases} />
      <Sprite src={st('case-open')} x={73} y={63} w={8.2} anchor="bottom-center" z={31} delay={T.cases + 0.25} />
      <Sprite src={st('case-closed')} x={28} y={60} w={7.4} anchor="bottom-center" z={30} delay={T.arrive} />

      {/* one worker rolls a case in from the front and parks it on the left, clear of everyone else */}
      <Sprite
        x={42}
        y={76}
        w={9.6}
        anchor="bottom-center"
        z={40}
        enter="none"
        className="sc-walk"
        style={
          {
            '--x0': '42%',
            '--y0': '76%',
            '--x1': '28%',
            '--y1': '60%',
            '--w0': '9.6%',
            '--w1': '7.9%',
            '--dur': `${T.arrive - T.push}s`,
            '--d': `${T.push}s`,
          } as CSSProperties
        }
      >
        <Frames srcs={[st('pusher-a'), st('pusher-b')]} period={0.7} delay={T.push} />
      </Sprite>

      {/* two workers watch the truss go up, close to the stage */}
      <Sprite src={st('stand-a')} x={43} y={50} w={10.5} anchor="bottom-center" z={42} delay={T.watch} />
      <Sprite src={st('watch-a')} x={55} y={51} w={10.6} anchor="bottom-center" z={43} delay={T.watch + 0.2} />

      {/* sound and lighting at the consoles on the tech platform */}
      <Sprite src={st('tech-b')} x={38} y={86} w={13} anchor="bottom-center" z={50} delay={T.tech} />
      <Sprite src={st('tech-a')} x={51} y={86} w={13} anchor="bottom-center" z={51} delay={T.tech + 0.25} />

      {/* a cameraman at his camera */}
      <Sprite src={st('cameraman-a')} x={85} y={72} w={11} anchor="bottom-center" z={44} delay={T.camera} />

      {/* the projectionist checks the left screen */}
      <Sprite src={st('projector-worker')} x={27} y={46.5} w={9} anchor="bottom-center" z={46} delay={T.projector} />

      <svg className="g-overlay" viewBox="0 0 1672 941" aria-hidden="true" focusable="false" style={{ zIndex: 60 }}>
        <defs>
          <linearGradient id="st-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.1" />
          </linearGradient>
          <filter id="st-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        {/* lights blinking red and blue once the truss is up */}
        {LAMPS.map((x, i) => (
          <g key={x}>
            {(['red', 'blue'] as const).map((tone, k) => (
              <g key={tone} className={`st-lamp st-${tone}`} style={w(T.liftEnd + 0.1 + (i % 2 ? k : 1 - k) * 0.45)}>
                <polygon
                  points={`${x - 5},${LAMP_Y + 6} ${x + 5},${LAMP_Y + 6} ${x + 46},${LAMP_Y + 170} ${x - 46},${LAMP_Y + 170}`}
                  className="st-cone"
                />
                <circle cx={x} cy={LAMP_Y} r={13} className="st-bulb" filter="url(#st-glow)" />
              </g>
            ))}
          </g>
        ))}
        {/* the projector beam, from the projector to the left screen on the wall */}
        <polygon
          points="444,309 295,195 295,88 500,88 500,195"
          fill="url(#st-beam)"
          className="st-beam"
          style={w(T.beam)}
        />
      </svg>

      <div className="st-face" style={w(T.beam)}>
        <Image src={st('pattern-1')} alt="" fill unoptimized className="st-pat st-pat-1" />
        <Image src={st('pattern-2')} alt="" fill unoptimized className="st-pat st-pat-2" />
      </div>
    </div>
  );
}
// Board 4: the show. Slides run on the three screens, the presenter gestures and the lights change color slowly.
const SHOW = '/images/animation/show';
const sh = (name: string) => `${SHOW}/${name}.webp`;
const SLIDE = 1.8; // seconds per slide, also per presenter pose
// the three screens on the plate, in 1672 x 941 pixels
const SCREENS: { x: number; y: number; w: number; h: number; phase: number }[] = [
  { x: 270, y: 289, w: 229, h: 135, phase: 2 },
  { x: 669, y: 288, w: 330, h: 141, phase: 0 },
  { x: 1172, y: 289, w: 228, h: 135, phase: 1 },
];
// the lamps over the stage and where their light falls
const SHOW_LIGHTS = [
  { x: 380, tx: 400, d: 0 },
  { x: 543, tx: 585, d: 1.4 },
  { x: 648, tx: 620, d: 2.8 },
  { x: 740, tx: 760, d: 4.2 },
  { x: 921, tx: 905, d: 0.7 },
  { x: 1018, tx: 1040, d: 2.1 },
  { x: 1127, tx: 1090, d: 3.5 },
  { x: 1283, tx: 1250, d: 4.9 },
];
// the video operator's monitors show the same slides as the big screens (the fourth one is hidden behind his head)
const MONITORS: { x: number; y: number; w: number; h: number; phase: number }[] = [
  { x: 652, y: 621, w: 78, h: 80, phase: 1 },
  { x: 733, y: 621, w: 76, h: 80, phase: 3 },
  { x: 927, y: 621, w: 104, h: 78, phase: 2 },
];
// the camera operator's two small monitors: a close-up of the speaker, and the center screen
const CAM_SPEAKER = { x: 1475, y: 652, w: 60, h: 66 };
const CAM_SCREEN = { x: 1540, y: 655, w: 84, h: 76, phase: 0 };
const PRESENTER = ['presenter-a', 'presenter-b', 'presenter-c', 'presenter-d'].map(sh);
const pc = (n: number, total: number) => `${(n / total) * 100}%`;
const rect = (r: { x: number; y: number; w: number; h: number }): CSSProperties => ({
  left: pc(r.x, 1672),
  top: pc(r.y, 941),
  width: pc(r.w, 1672),
  height: pc(r.h, 941),
});
const SLIDES = [1, 2, 3, 4];

function Slides({ phase }: { phase: number }) {
  return (
    <>
      {SLIDES.map((n, i) => (
        <Image
          key={n}
          src={sh(`slide-${n}`)}
          alt=""
          fill
          unoptimized
          className="sh-slide"
          style={{ '--d': `${0.5 + ((i + phase) % 4) * SLIDE}s`, '--cycle': `${SLIDE * 4}s` } as CSSProperties}
        />
      ))}
    </>
  );
}

export function ShowScene() {
  return (
    <div className="sc">
      <Plate src={sh('plate')} priority />

      {SCREENS.map((s, k) => (
        <div key={k} className="sh-screen" style={rect(s)}>
          <Slides phase={s.phase} />
        </div>
      ))}

      {MONITORS.map((m, k) => (
        <div key={k} className="sh-screen sh-monitor" style={rect(m)}>
          <Slides phase={m.phase} />
        </div>
      ))}

      {/* the camera operator's monitors: the speaker in close-up, in step with the podium, and the center screen */}
      <div className="sh-screen sh-monitor sh-cam" style={rect(CAM_SPEAKER)}>
        <div className="sh-cam-inner">
          <Frames srcs={PRESENTER} period={SLIDE * 4} delay={0.5} />
        </div>
      </div>
      <div className="sh-screen sh-monitor" style={rect(CAM_SCREEN)}>
        <Slides phase={CAM_SCREEN.phase} />
      </div>

      <svg className="g-overlay" viewBox="0 0 1672 941" aria-hidden="true" focusable="false" style={{ zIndex: 20 }}>
        <defs>
          <linearGradient id="sh-ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="sh-mask">
            <rect width="1672" height="941" fill="url(#sh-ray)" />
          </mask>
        </defs>
        {SHOW_LIGHTS.map((l, i) => (
          <polygon
            key={i}
            className="sh-ray"
            points={`${l.x - 6},158 ${l.x + 6},158 ${l.tx + 60},470 ${l.tx - 60},470`}
            style={{ '--d': `${l.d}s` } as CSSProperties}
          />
        ))}
      </svg>

      {/* the presenter at the podium: four poses, a new one with every slide */}
      <Sprite x={49.6} y={51.4} w={9} anchor="bottom-center" z={30} delay={0.2}>
        <Frames srcs={PRESENTER} period={SLIDE * 4} delay={0.5} />
      </Sprite>
    </div>
  );
}
