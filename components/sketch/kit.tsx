import type { CSSProperties, ReactNode } from 'react';

// Small drawing kit for the animated "How we work" sketches. Every shape is drawn as a line
// (stroke-dashoffset animation, see "Sketch animations" in app/globals.css). `delay` and `dur` are seconds.

type Base = {
  delay?: number;
  dur?: number;
  accent?: boolean;
  fill?: string;
  thick?: boolean;
  thin?: boolean;
  dotted?: boolean;
  sharp?: boolean;
  className?: string;
};

function vars(b: Base): CSSProperties {
  const delay = b.delay ?? 0;
  const dur = b.dur ?? 0.6;
  return {
    '--delay': `${delay}s`,
    '--dur': `${dur}s`,
    '--fdelay': `${delay + dur * 0.8}s`,
    '--fillc': b.fill,
  } as CSSProperties;
}

function cls(b: Base) {
  return [
    'd',
    b.accent && 'acc',
    b.fill && 'f',
    b.thick && 'thick',
    b.thin && 'thin',
    b.dotted && 'dot',
    b.sharp && 'sharp',
    b.className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function P({ d, ...b }: Base & { d: string }) {
  return <path d={d} pathLength={1} className={cls(b)} style={vars(b)} />;
}

export function R({ x, y, w, h, r = 0, ...b }: Base & { x: number; y: number; w: number; h: number; r?: number }) {
  const style = { ...vars(b), '--fmax': b.accent && b.fill ? 0.4 : 1 } as CSSProperties;
  return <rect x={x} y={y} width={w} height={h} rx={r} pathLength={1} className={cls(b)} style={style} />;
}

export function C({ cx, cy, r, ...b }: Base & { cx: number; cy: number; r: number }) {
  return <circle cx={cx} cy={cy} r={r} pathLength={1} className={cls(b)} style={vars(b)} />;
}

export function E({ cx, cy, rx, ry, ...b }: Base & { cx: number; cy: number; rx: number; ry: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} pathLength={1} className={cls(b)} style={vars(b)} />;
}

export function L({ x1, y1, x2, y2, ...b }: Base & { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} className={cls(b)} style={vars(b)} />;
}

export function Poly({ pts, close = false, ...b }: Base & { pts: number[][]; close?: boolean }) {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ') + (close ? ' Z' : '');
  return <P d={d} {...b} />;
}

// A text label. Labels fade in when their line is drawn and stay on the drawing.
export function T({
  x,
  y,
  children,
  delay = 0,
  anchor = 'middle',
  size,
}: {
  x: number;
  y: number;
  children: ReactNode;
  delay?: number;
  keep?: boolean; // accepted for older call sites; every label stays now
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className="lbl keep"
      style={{ '--delay': `${delay}s`, fontSize: size } as CSSProperties}
    >
      {children}
    </text>
  );
}

// A callout like on an old drawing: a thin line from the element at any angle, then a straight horizontal
// line under the word, with the word written on top of it. `to` is the corner where the line turns horizontal.
export function Callout({
  from,
  to,
  text,
  delay = 0,
  size = 15,
}: {
  from: [number, number];
  to: [number, number];
  text: string;
  delay?: number;
  size?: number;
}) {
  const right = to[0] >= from[0];
  const run = text.length * size * 0.6 + 18;
  const end: [number, number] = [to[0] + (right ? run : -run), to[1]];
  return (
    <>
      <Poly pts={[from, to, end]} sharp thin delay={delay} dur={0.6} />
      <T x={to[0] + (right ? 8 : -8)} y={to[1] - 6} delay={delay + 0.45} anchor={right ? 'start' : 'end'} size={size}>
        {text}
      </T>
    </>
  );
}
// Camera seen from above: a brick body, a cylinder on top of it and a short lens nose.
// `dir` is the way the camera looks.
export function CamPlan({
  x,
  y,
  dir,
  delay = 0,
}: {
  x: number;
  y: number;
  dir: 'right' | 'down' | 'left' | 'up';
  delay?: number;
}) {
  const angle = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <R x={-14} y={-8} w={18} h={16} r={2} delay={delay} dur={0.35} fill="var(--sk-tint)" />
      <C cx={-1} cy={0} r={6.5} delay={delay + 0.2} dur={0.3} accent />
      <R x={5} y={-3.5} w={9} h={7} r={1.5} delay={delay + 0.4} dur={0.25} accent />
    </g>
  );
}

// Camera on a wall, seen from the front: a brick body with a round lens cylinder on top.
// With `pan` the lens turns left and right while the body stays put.
export function CamElev({ x, y, delay = 0, pan = false }: { x: number; y: number; delay?: number; pan?: boolean }) {
  return (
    <g>
      <R x={x - 17} y={y} w={34} h={16} r={2} delay={delay} dur={0.35} fill="var(--sk-tint)" />
      <L x1={x} y1={y} x2={x} y2={y - 5} delay={delay + 0.25} dur={0.15} thin />
      <g className={pan ? 'lens lens-pan' : 'lens'}>
        <R x={x - 11} y={y - 21} w={22} h={16} r={6} delay={delay + 0.3} dur={0.35} accent />
        <E cx={x} cy={y - 13} rx={6} ry={6.5} delay={delay + 0.5} dur={0.3} accent />
        <C cx={x} cy={y - 13} r={2.2} delay={delay + 0.65} dur={0.15} accent fill="var(--sk-accent)" />
      </g>
    </g>
  );
}

export type FlowNode = { id: string; x: number; y: number; label: string; sub?: string; w?: number; h?: number };
export type FlowWire = {
  pts: number[][];
  delay: number;
  label?: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' };
  dotted?: boolean;
  accent?: boolean;
};

// Boxes and wires, drawn in the order of the signal.
export function Flow({
  nodes,
  wires,
  nodeDelays,
}: {
  nodes: FlowNode[];
  wires: FlowWire[];
  nodeDelays: Record<string, number>;
}) {
  return (
    <>
      {nodes.map((n) => {
        const w = n.w ?? 120;
        const h = n.h ?? 60;
        const delay = nodeDelays[n.id] ?? 0;
        return (
          <g key={n.id}>
            <R x={n.x} y={n.y} w={w} h={h} r={8} delay={delay} dur={0.5} fill="var(--sk-tint)" />
            <T x={n.x + w / 2} y={n.y + h / 2 + (n.sub ? -2 : 6)} delay={delay + 0.3} keep>
              {n.label}
            </T>
            {n.sub && (
              <T x={n.x + w / 2} y={n.y + h / 2 + 16} delay={delay + 0.35} keep size={12}>
                {n.sub}
              </T>
            )}
          </g>
        );
      })}
      {wires.map((wr, i) => {
        return (
          <g key={i}>
            <Poly pts={wr.pts} delay={wr.delay} dur={0.55} accent={wr.accent ?? true} dotted={wr.dotted} />
            {wr.label && (
              <T x={wr.label.x} y={wr.label.y} delay={wr.delay + 0.3} anchor={wr.label.anchor ?? 'middle'} size={12}>
                {wr.label.text}
              </T>
            )}
          </g>
        );
      })}
    </>
  );
}

export type RackUnit = {
  u: number;
  label: string;
  kind: 'blank' | 'patch' | 'switch' | 'dsp' | 'amp' | 'control' | 'power' | 'recv' | 'pc';
};

// Front view of an equipment rack, filled from the top. 1U = 44 units.
export function Rack({ units, x = 270, y = 34, w = 280 }: { units: RackUnit[]; x?: number; y?: number; w?: number }) {
  const U = 44;
  const total = 10;
  let cursor = y + 14;
  const out: ReactNode[] = [];
  units.forEach((unit, i) => {
    const top = cursor;
    const h = unit.u * U - 4;
    const d = 1.6 + i * 0.55;
    out.push(<R key={`r${i}`} x={x + 18} y={top} w={w - 36} h={h} r={3} delay={d} dur={0.45} fill="var(--sk-tint)" />);
    const mid = top + h / 2;
    if (unit.kind === 'patch') {
      for (let k = 0; k < 12; k++)
        out.push(<C key={`p${i}${k}`} cx={x + 42 + k * 17.5} cy={mid} r={4.5} delay={d + 0.25} dur={0.2} />);
    } else if (unit.kind === 'switch') {
      for (let k = 0; k < 12; k++)
        out.push(
          <R key={`s${i}${k}`} x={x + 40 + k * 17.5} y={mid - 8} w={11} h={16} r={1.5} delay={d + 0.25} dur={0.2} />,
        );
      out.push(
        <C key={`sl${i}`} cx={x + w - 38} cy={mid} r={4} delay={d + 0.3} dur={0.2} accent fill="var(--sk-accent)" />,
      );
    } else if (unit.kind === 'dsp') {
      out.push(<R key={`dd${i}`} x={x + 40} y={mid - 11} w={96} h={22} r={2} delay={d + 0.25} dur={0.3} accent />);
      for (let k = 0; k < 3; k++)
        out.push(<C key={`dk${i}${k}`} cx={x + 168 + k * 26} cy={mid} r={7} delay={d + 0.3} dur={0.25} />);
    } else if (unit.kind === 'amp') {
      for (let k = 0; k < 6; k++)
        out.push(
          <L
            key={`a${i}${k}`}
            x1={x + 40}
            y1={top + 14 + k * 11}
            x2={x + 150}
            y2={top + 14 + k * 11}
            delay={d + 0.25}
            dur={0.3}
            thin
          />,
        );
      out.push(<C key={`ak1${i}`} cx={x + 190} cy={mid} r={13} delay={d + 0.35} dur={0.3} />);
      out.push(<C key={`ak2${i}`} cx={x + 232} cy={mid} r={13} delay={d + 0.4} dur={0.3} />);
    } else if (unit.kind === 'control') {
      out.push(<R key={`cd${i}`} x={x + 40} y={mid - 10} w={60} h={20} r={2} delay={d + 0.25} dur={0.3} accent />);
      for (let k = 0; k < 4; k++)
        out.push(
          <R key={`cb${i}${k}`} x={x + 120 + k * 24} y={mid - 8} w={16} h={16} r={3} delay={d + 0.3} dur={0.2} />,
        );
    } else if (unit.kind === 'power') {
      for (let k = 0; k < 6; k++)
        out.push(
          <R key={`pw${i}${k}`} x={x + 42 + k * 34} y={mid - 9} w={22} h={18} r={3} delay={d + 0.25} dur={0.2} />,
        );
    } else if (unit.kind === 'recv') {
      out.push(<R key={`rd${i}`} x={x + 40} y={mid - 10} w={50} h={20} r={2} delay={d + 0.25} dur={0.25} accent />);
      out.push(<R key={`rd2${i}`} x={x + 100} y={mid - 10} w={50} h={20} r={2} delay={d + 0.3} dur={0.25} accent />);
      out.push(<C key={`ra1${i}`} cx={x + 190} cy={mid} r={6} delay={d + 0.35} dur={0.2} />);
      out.push(<C key={`ra2${i}`} cx={x + 220} cy={mid} r={6} delay={d + 0.4} dur={0.2} />);
    } else if (unit.kind === 'pc') {
      out.push(<R key={`pc${i}`} x={x + 40} y={top + 12} w={w - 80} h={h - 24} r={3} delay={d + 0.25} dur={0.35} />);
      out.push(
        <C key={`pcb${i}`} cx={x + w - 54} cy={mid} r={6} delay={d + 0.4} dur={0.2} accent fill="var(--sk-accent)" />,
      );
    } else {
      out.push(<C key={`b1${i}`} cx={x + 30} cy={mid} r={2.5} delay={d + 0.2} dur={0.15} />);
      out.push(<C key={`b2${i}`} cx={x + w - 30} cy={mid} r={2.5} delay={d + 0.2} dur={0.15} />);
    }
    if (unit.kind !== 'blank') {
      out.push(<L key={`ll${i}`} x1={x + 18} y1={mid} x2={x - 14} y2={mid} delay={d + 0.2} dur={0.25} thin />);
      out.push(
        <T key={`lt${i}`} x={x - 22} y={mid + 5} delay={d + 0.3} keep anchor="end" size={14}>
          {unit.label}
        </T>,
      );
    }
    cursor += unit.u * U;
  });
  const bottom = y + 14 + total * U;
  return (
    <>
      <R x={x} y={y} w={w} h={bottom - y + 6} r={6} delay={0} dur={1.2} thick />
      <L x1={x + 10} y1={y + 6} x2={x + 10} y2={bottom} delay={0.3} dur={1} thin />
      <L x1={x + w - 10} y1={y + 6} x2={x + w - 10} y2={bottom} delay={0.3} dur={1} thin />
      {out}
      <P
        d={`M${x + w} ${y + 40} C ${x + w + 46} ${y + 110}, ${x + w + 46} ${y + 330}, ${x + w} ${bottom - 30}`}
        delay={5.4}
        dur={1.1}
        accent
      />
      <P
        d={`M${x + w} ${y + 70} C ${x + w + 84} ${y + 150}, ${x + w + 84} ${y + 300}, ${x + w} ${bottom - 60}`}
        delay={5.7}
        dur={1.1}
        accent
      />
      <T x={x + w / 2} y={bottom + 28} delay={6.3} size={14}>
        cable management
      </T>
    </>
  );
}
