import { C, CamElev, CamPlan, Callout, E, Flow, L, P, Poly, R, Rack, T, type FlowNode, type FlowWire } from './kit';

// AV Integration sketches, in the order of a project: plan, signal flow, rack, install, program and commission.
// The drawing area is 800 x 560. Labels sit in empty space beside the drawing, joined by thin leader lines.

export function PlanScene() {
  const chairX = [248, 303, 358, 413, 468];
  return (
    <>
      <T x={20} y={22} delay={0.4} size={13} anchor="start">
        ceiling plan
      </T>
      <R x={170} y={60} w={460} h={440} r={4} delay={0} dur={1.3} thick />
      <P d="M170 394 L214 394" delay={0.8} dur={0.3} thin />
      <P d="M214 394 A44 44 0 0 0 170 350" delay={1} dur={0.4} thin />

      <R x={235} y={205} w={290} h={110} r={24} delay={1.2} dur={1} fill="var(--sk-tint)" />
      {chairX.map((x, i) => (
        <g key={i}>
          <R x={x} y={171} w={38} h={26} r={9} delay={2 + i * 0.12} dur={0.35} />
          <R x={x} y={327} w={38} h={26} r={9} delay={2.5 + i * 0.12} dur={0.35} />
        </g>
      ))}

      <R x={618} y={165} w={10} h={80} delay={3.3} dur={0.5} accent fill="var(--sk-accent)" />
      <R x={618} y={275} w={10} h={80} delay={3.5} dur={0.5} accent fill="var(--sk-accent)" />
      <Callout from={[628, 205]} to={[668, 190]} text="displays" delay={3.9} />

      {[
        [215, 115],
        [545, 115],
        [215, 458],
        [330, 458],
        [430, 458],
        [545, 458],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <C cx={cx} cy={cy} r={15} delay={4.6 + i * 0.16} dur={0.35} accent />
          <C cx={cx} cy={cy} r={6} delay={4.75 + i * 0.16} dur={0.2} accent />
          <L x1={cx - 15} y1={cy} x2={cx + 15} y2={cy} delay={4.8 + i * 0.16} dur={0.2} thin />
          <L x1={cx} y1={cy - 15} x2={cx} y2={cy + 15} delay={4.8 + i * 0.16} dur={0.2} thin />
        </g>
      ))}
      <Callout from={[200, 115]} to={[132, 115]} text="speakers" delay={5.6} />

      <CamPlan x={320} y={74} dir="down" delay={6.3} />
      <Poly
        pts={[
          [320, 94],
          [300, 148],
          [340, 148],
        ]}
        close
        delay={6.7}
        dur={0.45}
        thin
      />
      <Callout from={[320, 66]} to={[320, 34]} text="side cam" delay={7} />

      <CamPlan x={604} y={260} dir="left" delay={7.2} />
      <Poly
        pts={[
          [590, 260],
          [556, 244],
          [556, 276],
        ]}
        close
        delay={7.6}
        dur={0.4}
        thin
      />
      <Callout from={[618, 260]} to={[668, 270]} text="front cam" delay={7.9} />

      <CamPlan x={184} y={260} dir="right" delay={8.2} />
      <Poly
        pts={[
          [200, 260],
          [222, 248],
          [222, 272],
        ]}
        close
        delay={8.6}
        dur={0.4}
        thin
      />
      <Callout from={[176, 260]} to={[130, 272]} text="rear cam" delay={8.9} />

      <C cx={440} cy={118} r={10} delay={9.4} dur={0.35} accent />
      <L x1={434} y1={118} x2={446} y2={118} delay={9.6} dur={0.2} thin />
      <Callout from={[440, 108]} to={[440, 34]} text="ceiling mic" delay={9.9} />
    </>
  );
}

const flowNodes: FlowNode[] = [
  { id: 'mics', x: 30, y: 70, label: 'Mics' },
  { id: 'cams', x: 30, y: 200, label: 'Cameras' },
  { id: 'pc', x: 30, y: 330, label: 'Laptop', sub: 'HDMI + USB' },
  { id: 'dsp', x: 210, y: 70, label: 'DSP' },
  { id: 'uc', x: 210, y: 200, label: 'UC engine' },
  { id: 'sw', x: 210, y: 330, label: 'Switch' },
  { id: 'amp', x: 390, y: 70, label: 'Amp' },
  { id: 'ctl', x: 390, y: 200, label: 'Control' },
  { id: 'spk', x: 570, y: 70, label: 'Speakers' },
  { id: 'disp', x: 570, y: 330, label: 'Displays' },
];

const flowWires: FlowWire[] = [
  {
    pts: [
      [150, 100],
      [210, 100],
    ],
    delay: 1.6,
    label: { x: 180, y: 90, text: 'analog' },
  },
  {
    pts: [
      [330, 100],
      [390, 100],
    ],
    delay: 2.2,
    label: { x: 360, y: 90, text: 'Dante' },
  },
  {
    pts: [
      [510, 100],
      [570, 100],
    ],
    delay: 2.8,
  },
  {
    pts: [
      [270, 130],
      [270, 200],
    ],
    delay: 3.3,
    label: { x: 306, y: 168, text: 'USB audio' },
  },
  {
    pts: [
      [150, 230],
      [210, 230],
    ],
    delay: 3.8,
    label: { x: 180, y: 220, text: 'USB' },
  },
  {
    pts: [
      [150, 360],
      [210, 360],
    ],
    delay: 4.3,
    label: { x: 180, y: 350, text: 'HDMI' },
  },
  {
    pts: [
      [270, 260],
      [270, 330],
    ],
    delay: 4.8,
  },
  {
    pts: [
      [330, 360],
      [570, 360],
    ],
    delay: 5.2,
    label: { x: 450, y: 350, text: 'HDMI' },
  },
  {
    pts: [
      [450, 200],
      [450, 130],
    ],
    delay: 6,
    dotted: true,
  },
  {
    pts: [
      [390, 230],
      [330, 230],
    ],
    delay: 6.2,
    dotted: true,
  },
  {
    pts: [
      [450, 260],
      [450, 360],
    ],
    delay: 6.4,
    dotted: true,
  },
];

export function FlowScene() {
  return (
    <>
      <T x={400} y={34} delay={0.2} size={13}>
        signal line diagram
      </T>
      <Flow
        nodes={flowNodes}
        wires={flowWires}
        nodeDelays={{
          mics: 0.3,
          dsp: 0.6,
          amp: 0.9,
          spk: 1.2,
          cams: 3.2,
          uc: 3.4,
          pc: 3.9,
          sw: 4.1,
          disp: 4.9,
          ctl: 5.7,
        }}
      />
      <T x={600} y={235} delay={6.8} size={13}>
        dotted = control
      </T>
    </>
  );
}

export function RackScene() {
  return (
    <>
      <T x={410} y={22} delay={0.3} size={13}>
        rack elevation
      </T>
      <Rack
        units={[
          { u: 1, label: 'Patch panel', kind: 'patch' },
          { u: 1, label: 'Network switch', kind: 'switch' },
          { u: 1, label: 'Control processor', kind: 'control' },
          { u: 1, label: 'UC engine', kind: 'pc' },
          { u: 1, label: 'DSP', kind: 'dsp' },
          { u: 2, label: 'Amplifier', kind: 'amp' },
          { u: 1, label: 'Power', kind: 'power' },
          { u: 2, label: '', kind: 'blank' },
        ]}
      />
    </>
  );
}

// One-point perspective: everything drawn in the room shrinks towards this point on the back wall.
const VP: [number, number] = [400, 240];
const toward = (p: [number, number], k: number): [number, number] => [
  p[0] + (VP[0] - p[0]) * k,
  p[1] + (VP[1] - p[1]) * k,
];

// A chair beside the table, turned towards it, drawn in perspective: the seat top, the backrest on the outer
// side and four legs, shrinking towards the vanishing point. `inner` is the x of the seat edge next to the table.
function Chair({
  inner,
  floor,
  s,
  side,
  delay,
}: {
  inner: number;
  floor: number;
  s: number;
  side: 'left' | 'right';
  delay: number;
}) {
  const k = 0.13; // how far the far edge of the seat shrinks towards the vanishing point
  const len = 60 * s; // seat depth (front to back of the chair), along x
  const seatY = floor - 54 * s;
  const outer = side === 'left' ? inner - len : inner + len;
  const backH = 70 * s;
  const nearOuter: [number, number] = [outer, seatY];
  const nearInner: [number, number] = [inner, seatY];
  const farOuter = toward(nearOuter, k);
  const farInner = toward(nearInner, k);
  const floorFarY = floor + (VP[1] - floor) * k;
  const legsNear = [outer, inner].map((x) => [x, floor] as [number, number]);
  const legsFar = [farOuter[0], farInner[0]].map((x) => [x, floorFarY] as [number, number]);
  const back = [
    nearOuter,
    farOuter,
    [farOuter[0], farOuter[1] - backH * (1 - k)],
    [nearOuter[0], nearOuter[1] - backH],
  ] as [number, number][];
  return (
    <g>
      <L x1={farOuter[0]} y1={farOuter[1]} x2={legsFar[0][0]} y2={legsFar[0][1]} delay={delay} dur={0.25} thin />
      <L x1={farInner[0]} y1={farInner[1]} x2={legsFar[1][0]} y2={legsFar[1][1]} delay={delay + 0.05} dur={0.25} thin />
      <Poly
        pts={[nearOuter, nearInner, farInner, farOuter]}
        close
        delay={delay + 0.15}
        dur={0.4}
        fill="var(--sk-tint)"
      />
      <Poly pts={back} close delay={delay + 0.4} dur={0.4} />
      <L x1={nearOuter[0]} y1={nearOuter[1]} x2={legsNear[0][0]} y2={legsNear[0][1]} delay={delay + 0.7} dur={0.25} />
      <L x1={nearInner[0]} y1={nearInner[1]} x2={legsNear[1][0]} y2={legsNear[1][1]} delay={delay + 0.75} dur={0.25} />
    </g>
  );
}

export function InstallScene() {
  // The room is drawn smaller, in the middle, so the labels have room at the sides.
  const m = (x: number, y: number): [number, number] => [80 + 0.8 * x, 40 + 0.8 * y];
  const chairDepths = [0.04, 0.42, 0.78];
  return (
    <>
      <g transform="translate(80 40) scale(0.8)">
        <Poly
          pts={[
            [250, 140],
            [60, 40],
          ]}
          delay={0}
          dur={0.8}
          thin
        />
        <Poly
          pts={[
            [550, 140],
            [740, 40],
          ]}
          delay={0.1}
          dur={0.8}
          thin
        />
        <Poly
          pts={[
            [250, 340],
            [60, 520],
          ]}
          delay={0.2}
          dur={0.8}
          thin
        />
        <Poly
          pts={[
            [550, 340],
            [740, 520],
          ]}
          delay={0.3}
          dur={0.8}
          thin
        />
        <R x={250} y={140} w={300} h={200} delay={0.4} dur={0.9} thick />
        <Poly
          pts={[
            [60, 40],
            [60, 520],
          ]}
          delay={1}
          dur={0.8}
          thick
        />
        <Poly
          pts={[
            [740, 40],
            [740, 520],
          ]}
          delay={1.1}
          dur={0.8}
          thick
        />

        <R x={278} y={192} w={112} h={64} delay={1.8} dur={0.6} fill="var(--sk-tint)" />
        <R x={410} y={192} w={112} h={64} delay={2} dur={0.6} fill="var(--sk-tint)" />
        <L x1={288} y1={202} x2={312} y2={202} delay={2.5} dur={0.2} thin />
        <L x1={420} y1={202} x2={444} y2={202} delay={2.6} dur={0.2} thin />

        <CamElev x={400} y={168} delay={3.1} />

        {[
          [180, 76],
          [620, 76],
          [330, 112],
          [470, 112],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <E cx={cx} cy={cy} rx={20} ry={8} delay={4.2 + i * 0.2} dur={0.4} accent />
            <E cx={cx} cy={cy} rx={9} ry={3.5} delay={4.4 + i * 0.2} dur={0.25} accent />
          </g>
        ))}

        <L x1={400} y1={52} x2={400} y2={90} delay={5.3} dur={0.3} thin />
        <C cx={400} cy={96} r={7} delay={5.5} dur={0.3} accent fill="var(--sk-accent)" />

        {/* a raised table: top surface, thin edge and long legs */}
        <Poly
          pts={[
            [345, 318],
            [455, 318],
            [565, 400],
            [235, 400],
          ]}
          close
          delay={5.9}
          dur={0.8}
          fill="var(--sk-tint)"
        />
        <Poly
          pts={[
            [235, 400],
            [235, 411],
            [565, 411],
            [565, 400],
          ]}
          delay={6.5}
          dur={0.4}
        />
        <L x1={248} y1={411} x2={248} y2={500} delay={6.8} dur={0.3} />
        <L x1={552} y1={411} x2={552} y2={500} delay={6.9} dur={0.3} />
        <L x1={357} y1={320} x2={357} y2={342} delay={7} dur={0.2} />
        <L x1={443} y1={320} x2={443} y2={342} delay={7.05} dur={0.2} />

        {chairDepths.map((t, i) => {
          const s = 1 - 0.55 * t;
          const floor = 500 - 160 * t;
          return (
            <g key={t}>
              <Chair inner={235 + 110 * t - 12 * s} floor={floor} s={s} side="left" delay={7.3 + i * 0.5} />
              <Chair inner={565 - 110 * t + 12 * s} floor={floor} s={s} side="right" delay={7.55 + i * 0.5} />
            </g>
          );
        })}
      </g>

      <Callout from={m(180, 76)} to={[108, m(180, 76)[1]]} text="speakers" delay={3.8} />
      <Callout from={m(417, 172)} to={[690, 150]} text="camera" delay={4.7} />
      <Callout from={m(400, 96)} to={[m(400, 96)[0] - 60, 28]} text="ceiling mic" delay={5.9} />
      <Callout from={m(522, 224)} to={[690, 218]} text="displays" delay={6.2} />
    </>
  );
}

// A laptop key row: `units` are key widths (a space bar is wide); everything stays inside the base.
function KeyRow({ y, units, width, delay }: { y: number; units: number[]; width: number; delay: number }) {
  const gap = 3;
  const total = units.reduce((a, b) => a + b, 0);
  const unit = (width - gap * (units.length - 1)) / total;
  const start = 400 - width / 2;
  return (
    <>
      {units.map((u, i) => {
        const before = units.slice(0, i).reduce((a, b) => a + b, 0);
        const x = start + before * unit + i * gap;
        return <R key={i} x={x} y={y} w={u * unit} h={11} r={2} delay={delay + i * 0.03} dur={0.15} thin />;
      })}
    </>
  );
}

export function CommissionScene() {
  // The base of the laptop is a trapezoid; each key row is as wide as the base is at that height.
  const baseHalf = (y: number) => 135 + (y - 468) * (60 / 84);
  const rows: { y: number; units: number[] }[] = [
    { y: 476, units: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { y: 492, units: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { y: 508, units: [1.4, 1, 1, 1, 1, 1, 1, 1, 1, 1.4] },
    { y: 524, units: [1.2, 1.2, 5.6, 1.2, 1.2] },
  ];
  return (
    <>
      {/* the table in perspective, and the wall display hanging above it */}
      <Poly
        pts={[
          [110, 262],
          [690, 262],
          [790, 556],
          [10, 556],
        ]}
        close
        delay={0.2}
        dur={1}
        thin
        fill="var(--sk-tint)"
      />
      <R x={270} y={116} w={260} h={124} r={4} delay={0} dur={0.7} thick />
      <R x={274} y={120} w={252} h={116} r={3} className="screen-on" delay={0.8} dur={0.4} fill="var(--sk-accent)" />

      {/* a video call: the person on the left, a presentation and the other attendees on the right */}
      <R x={282} y={128} w={150} h={100} r={4} delay={2.6} dur={0.4} thin />
      <C cx={357} cy={164} r={15} delay={2.9} dur={0.3} thin />
      <P d="M327 224 Q357 186 387 224" delay={3.1} dur={0.4} thin />
      <R x={440} y={128} w={78} h={62} r={3} delay={3.3} dur={0.4} thin />
      <L x1={448} y1={140} x2={500} y2={140} delay={3.6} dur={0.25} thin />
      <R x={450} y={166} w={10} h={16} delay={3.8} dur={0.15} thin />
      <R x={466} y={156} w={10} h={26} delay={3.85} dur={0.15} thin />
      <R x={482} y={148} w={10} h={34} delay={3.9} dur={0.15} thin />
      {[440, 466, 492].map((x, i) => (
        <g key={x}>
          <R x={x} y={198} w={24} h={30} r={3} delay={4 + i * 0.15} dur={0.2} thin />
          <C cx={x + 12} cy={209} r={5} delay={4.1 + i * 0.15} dur={0.15} thin />
          <P d={`M${x + 4} 226 Q ${x + 12} 216 ${x + 20} 226`} delay={4.2 + i * 0.15} dur={0.15} thin />
        </g>
      ))}
      <Callout from={[530, 214]} to={[590, 236]} text="display" delay={4.6} />

      <CamElev x={300} y={92} delay={1} pan />
      <CamElev x={500} y={92} delay={1.2} pan />
      <Callout from={[283, 98]} to={[200, 150]} text="camera" delay={1.9} />

      <L x1={400} y1={8} x2={400} y2={32} delay={1.4} dur={0.2} thin />
      <C cx={400} cy={40} r={7} delay={1.5} dur={0.25} accent fill="var(--sk-accent)" />
      <g className="waves waves-mic">
        <P d="M382 22 A26 26 0 0 0 382 58" delay={2} dur={0.3} accent />
        <P d="M418 22 A26 26 0 0 1 418 58" delay={2} dur={0.3} accent />
      </g>
      <Callout from={[407, 38]} to={[452, 26]} text="ceiling mic" delay={2.1} />

      {[90, 710].map((cx, i) => (
        <g key={cx}>
          <E cx={cx} cy={56} rx={26} ry={12} delay={1.6 + i * 0.1} dur={0.35} accent />
          <E cx={cx} cy={56} rx={11} ry={5} delay={1.8 + i * 0.1} dur={0.25} accent />
          <g className="waves waves-spk">
            <P d={`M${cx - 20} 80 Q ${cx} 102 ${cx + 20} 80`} delay={2.2} dur={0.3} accent />
            <P d={`M${cx - 34} 96 Q ${cx} 130 ${cx + 34} 96`} delay={2.3} dur={0.3} accent />
          </g>
        </g>
      ))}
      <Callout from={[90, 44]} to={[90, 26]} text="speaker" delay={2.4} />

      {/* the laptop on the table: a screen and a base of the same width at the hinge */}
      <R x={265} y={300} w={270} h={168} r={10} delay={2.6} dur={0.7} thick />
      <R x={275} y={310} w={250} h={148} r={4} delay={3.1} dur={0.5} fill="var(--sk-tint)" />
      <Poly
        pts={[
          [265, 468],
          [535, 468],
          [595, 552],
          [205, 552],
        ]}
        close
        delay={3.3}
        dur={0.7}
        thick
      />
      {rows.map((row, r) => (
        <KeyRow key={r} y={row.y} units={row.units} width={2 * baseHalf(row.y) - 36} delay={4 + r * 0.2} />
      ))}

      <g className="app app-1">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4, 5].map((c) => (
            <C
              key={`${r}${c}`}
              cx={300 + c * 40}
              cy={336 + r * 34}
              r={7}
              delay={0}
              dur={0.01}
              accent={(r + c) % 4 === 0}
            />
          )),
        )}
        <T x={400} y={288} delay={0} keep size={13}>
          DSP matrix
        </T>
      </g>
      <g className="app app-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <R key={i} className={`bar bar-${i}`} x={290 + i * 32} y={330} w={20} h={120} delay={0} dur={0.01} accent />
        ))}
        <T x={400} y={288} delay={0} keep size={13}>
          meters
        </T>
      </g>
      <g className="app app-3">
        <R x={286} y={322} w={110} h={100} r={4} delay={0} dur={0.01} />
        <C cx={341} cy={354} r={12} delay={0} dur={0.01} />
        <P d="M318 418 Q341 384 364 418" delay={0} dur={0.01} />
        <L x1={414} y1={344} x2={512} y2={344} delay={0} dur={0.01} thin />
        <L x1={414} y1={372} x2={494} y2={372} delay={0} dur={0.01} thin />
        <L x1={414} y1={400} x2={474} y2={400} delay={0} dur={0.01} thin />
        <T x={400} y={288} delay={0} keep size={13}>
          camera view
        </T>
      </g>
    </>
  );
}
