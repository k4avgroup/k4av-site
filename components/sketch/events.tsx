import { C, Callout, CamPlan, E, Flow, L, P, Poly, R, Rack, T, type FlowNode, type FlowWire } from './kit';

// Live Events sketches, in the order of an event: venue plan, signal flow, racks, load-in, show.
// The drawing area is 800 x 560.

export function EventPlanScene() {
  const tableX = [250, 400, 550];
  const tableY = [235, 325, 415];
  return (
    <>
      <R x={60} y={50} w={680} h={470} r={4} delay={0} dur={1.3} thick />
      <T x={60} y={30} delay={0.6} size={13} anchor="start">
        venue plan
      </T>

      <R x={235} y={64} w={330} h={92} r={3} delay={1.2} dur={0.9} fill="var(--sk-tint)" />
      <R x={120} y={64} w={86} h={12} delay={2.2} dur={0.5} accent fill="var(--sk-accent)" />
      <R x={594} y={64} w={86} h={12} delay={2.4} dur={0.5} accent fill="var(--sk-accent)" />
      <Callout from={[163, 64]} to={[163, 34]} text="LED screens" delay={2.8} />

      {tableY.map((y, r) =>
        tableX.map((x, c) => {
          const i = r * 3 + c;
          return (
            <g key={i}>
              <C cx={x} cy={y} r={27} delay={3.2 + i * 0.14} dur={0.4} />
              {Array.from({ length: 8 }).map((_, k) => {
                const a = (k / 8) * Math.PI * 2;
                return (
                  <C
                    key={k}
                    cx={x + Math.cos(a) * 40}
                    cy={y + Math.sin(a) * 40}
                    r={6}
                    delay={3.4 + i * 0.14 + k * 0.03}
                    dur={0.2}
                  />
                );
              })}
            </g>
          );
        }),
      )}

      {[
        [212, 70],
        [212, 100],
        [574, 70],
        [574, 100],
      ].map(([x, y], i) => (
        <R key={i} x={x} y={y} w={14} h={26} r={2} delay={5 + i * 0.15} dur={0.3} accent fill="var(--sk-accent)" />
      ))}
      <R x={228} y={164} w={28} h={18} r={2} delay={5.7} dur={0.3} accent />
      <R x={544} y={164} w={28} h={18} r={2} delay={5.8} dur={0.3} accent />
      <T x={150} y={160} delay={5.9} anchor="middle" size={13}>
        line arrays
      </T>
      <T x={650} y={196} delay={6} anchor="middle" size={13}>
        subs
      </T>
      <R x={120} y={300} w={20} h={20} r={3} delay={6.3} dur={0.3} accent />
      <R x={660} y={300} w={20} h={20} r={3} delay={6.4} dur={0.3} accent />
      <T x={130} y={340} delay={6.6} size={13}>
        delay
      </T>

      <R x={360} y={466} w={80} h={36} r={4} delay={7} dur={0.4} fill="var(--sk-tint)" />
      <Callout from={[440, 486]} to={[486, 504]} text="FOH" delay={7.4} />
      <CamPlan x={289} y={482} dir="up" delay={7.8} />
      <Poly
        pts={[
          [289, 466],
          [274, 440],
          [304, 440],
        ]}
        close
        delay={8.2}
        dur={0.4}
        thin
      />
      <Callout from={[276, 490]} to={[236, 512]} text="camera" delay={8.5} />
      <C cx={400} cy={108} r={7} delay={8.8} dur={0.3} accent fill="var(--sk-accent)" />
      <Callout from={[406, 103]} to={[452, 34]} text="podium" delay={9.1} />
      <Callout from={[400, 64]} to={[370, 36]} text="stage" delay={9.6} />
    </>
  );
}

const flowNodes: FlowNode[] = [
  { id: 'mics', x: 30, y: 70, label: 'Wireless', sub: 'mics' },
  { id: 'pb', x: 30, y: 200, label: 'Playback', sub: 'laptop' },
  { id: 'cams', x: 30, y: 330, label: 'Cameras' },
  { id: 'foh', x: 210, y: 70, label: 'FOH console' },
  { id: 'sw', x: 210, y: 330, label: 'Video', sub: 'switcher' },
  { id: 'dsp', x: 390, y: 70, label: 'Processor', sub: 'and amps' },
  { id: 'ctl', x: 390, y: 200, label: 'Show control' },
  { id: 'spk', x: 570, y: 70, label: 'Line arrays' },
  { id: 'led', x: 570, y: 330, label: 'LED screens' },
];

const flowWires: FlowWire[] = [
  {
    pts: [
      [150, 100],
      [210, 100],
    ],
    delay: 1.6,
    label: { x: 180, y: 90, text: 'RF' },
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
      [150, 230],
      [185, 230],
      [185, 100],
    ],
    delay: 3.4,
  },
  {
    pts: [
      [150, 360],
      [210, 360],
    ],
    delay: 4.1,
    label: { x: 180, y: 350, text: 'SDI' },
  },
  {
    pts: [
      [150, 230],
      [185, 230],
      [185, 345],
      [210, 345],
    ],
    delay: 4.6,
  },
  {
    pts: [
      [330, 360],
      [570, 360],
    ],
    delay: 5.2,
    label: { x: 450, y: 350, text: 'SDI / HDMI' },
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
      [330, 360],
    ],
    delay: 6.2,
    dotted: true,
  },
];

export function EventFlowScene() {
  return (
    <>
      <T x={400} y={34} delay={0.2} size={13}>
        signal line diagram
      </T>
      <Flow
        nodes={flowNodes}
        wires={flowWires}
        nodeDelays={{ mics: 0.3, foh: 0.6, dsp: 0.9, spk: 1.2, pb: 3.2, cams: 3.9, sw: 4.1, led: 4.9, ctl: 5.7 }}
      />
      <T x={600} y={235} delay={6.8} size={13}>
        dotted = control
      </T>
    </>
  );
}

export function EventRackScene() {
  return (
    <>
      <T x={410} y={22} delay={0.3} size={13}>
        road case rack
      </T>
      <Rack
        units={[
          { u: 1, label: 'Wireless receivers', kind: 'recv' },
          { u: 1, label: 'Network switch', kind: 'switch' },
          { u: 1, label: 'Processor', kind: 'dsp' },
          { u: 1, label: 'Video switcher', kind: 'control' },
          { u: 2, label: 'Playback computer', kind: 'pc' },
          { u: 2, label: 'Amplifiers', kind: 'amp' },
          { u: 1, label: 'Power', kind: 'power' },
          { u: 1, label: '', kind: 'blank' },
        ]}
      />
    </>
  );
}

export function EventSetupScene() {
  return (
    <>
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

      <Poly
        pts={[
          [290, 300],
          [510, 300],
          [545, 342],
          [255, 342],
        ]}
        close
        delay={1.8}
        dur={0.8}
        fill="var(--sk-tint)"
      />
      <T x={400} y={330} delay={2.4} size={13}>
        stage
      </T>
      <R x={300} y={178} w={200} h={104} delay={2.6} dur={0.7} accent fill="var(--sk-accent)" />
      <R x={262} y={190} w={28} h={70} delay={3.1} dur={0.4} />
      <R x={510} y={190} w={28} h={70} delay={3.2} dur={0.4} />
      <T x={400} y={236} delay={3.4} size={13}>
        LED wall
      </T>

      <L x1={262} y1={160} x2={538} y2={160} delay={3.8} dur={0.7} thick />
      <P
        d="M262 160 L284 172 L306 160 L328 172 L350 160 L372 172 L394 160 L416 172 L438 160 L460 172 L482 160 L504 172 L526 160"
        delay={4}
        dur={0.9}
        thin
      />
      {[300, 350, 400, 450, 500].map((x, i) => (
        <C key={x} cx={x} cy={182} r={6} delay={4.8 + i * 0.12} dur={0.25} accent fill="var(--sk-accent)" />
      ))}
      <T x={400} y={150} delay={5} size={13}>
        truss + lights
      </T>
      <R x={222} y={172} w={16} h={44} r={2} delay={5.6} dur={0.3} accent />
      <R x={562} y={172} w={16} h={44} r={2} delay={5.7} dur={0.3} accent />

      {[
        [150, 400],
        [650, 400],
        [250, 440],
        [550, 440],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <E cx={cx} cy={cy} rx={44} ry={15} delay={6 + i * 0.2} dur={0.4} />
          <L x1={cx} y1={cy + 15} x2={cx} y2={cy + 40} delay={6.3 + i * 0.2} dur={0.2} thin />
        </g>
      ))}

      <Poly
        pts={[
          [320, 462],
          [480, 462],
          [520, 520],
          [280, 520],
        ]}
        close
        delay={7.2}
        dur={0.7}
        fill="var(--sk-tint)"
      />
      <R x={340} y={472} w={120} h={24} r={3} delay={7.8} dur={0.4} accent />
      <T x={400} y={456} delay={8.1} size={13}>
        FOH
      </T>
    </>
  );
}

export function ShowScene() {
  return (
    <>
      <L x1={230} y1={36} x2={570} y2={36} delay={0} dur={0.6} thick />
      <R x={250} y={70} w={300} h={150} delay={0.3} dur={0.7} accent fill="var(--sk-accent)" />
      {Array.from({ length: 12 }).map((_, i) => (
        <R key={i} className={`bar bar-${i % 7}`} x={268 + i * 23} y={100} w={14} h={96} delay={1} dur={0.01} accent />
      ))}
      {[290, 345, 400, 455, 510].map((x, i) => (
        <g key={x}>
          <C cx={x} cy={44} r={6} delay={1 + i * 0.1} dur={0.25} accent fill="var(--sk-accent)" />
          <polygon className={`beam beam-${i % 3}`} points={`${x},50 ${x - 46},230 ${x + 46},230`} />
        </g>
      ))}

      {[150, 650].map((cx, i) => (
        <g key={cx}>
          <R x={cx - 17} y={96} w={34} h={96} r={3} delay={1.4 + i * 0.1} dur={0.4} accent />
          <L x1={cx - 17} y1={128} x2={cx + 17} y2={128} delay={1.7} dur={0.2} thin />
          <L x1={cx - 17} y1={160} x2={cx + 17} y2={160} delay={1.8} dur={0.2} thin />
          <g className="waves waves-spk">
            <P d={`M${cx - 34} 118 Q ${cx - 54} 144 ${cx - 34} 170`} delay={2.4} dur={0.3} accent />
            <P d={`M${cx - 54} 108 Q ${cx - 84} 144 ${cx - 54} 180`} delay={2.5} dur={0.3} accent />
          </g>
        </g>
      ))}

      {[0, 1, 2].map((r) =>
        Array.from({ length: 13 }).map((_, c) => (
          <C
            key={`${r}${c}`}
            cx={190 + c * 35 + (r % 2) * 14}
            cy={282 + r * 30}
            r={7}
            delay={2 + (r * 13 + c) * 0.03}
            dur={0.2}
          />
        )),
      )}
      <T x={400} y={262} delay={3} size={13}>
        audience
      </T>

      <Poly
        pts={[
          [240, 400],
          [560, 400],
          [610, 520],
          [190, 520],
        ]}
        close
        delay={3.4}
        dur={0.9}
        thick
      />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <g key={i}>
          <L x1={268 + i * 38} y1={420} x2={262 + i * 41} y2={500} delay={4.3 + i * 0.06} dur={0.2} thin />
          <R
            className={`fader fader-${i % 4}`}
            x={262 + i * 38}
            y={430}
            w={14}
            h={9}
            r={2}
            delay={4.5 + i * 0.06}
            dur={0.2}
            accent
            fill="var(--sk-accent)"
          />
        </g>
      ))}
      <T x={400} y={392} delay={4.8} size={13}>
        mix position
      </T>
    </>
  );
}
