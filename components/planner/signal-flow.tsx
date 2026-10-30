import { signalFlow, type FlowNode } from '@/lib/planner/flow';
import type { Analysis, Plan } from '@/lib/planner/model';

const BOX = { w: 130, h: 62, gap: 16 };
const COLUMN_X = [8, 208, 408, 608];
const WIDTH = 746;
const LEGEND = 44; // room at the bottom for the legend

// Breaks a title into at most two lines.
function wrap(text: string, max = 18): string[] {
  if (text.length <= max) return [text];
  const words = text.split(' ');
  const first: string[] = [];
  while (words.length > 1 && (first.join(' ') + ' ' + words[0]).length <= max) first.push(words.shift() as string);
  if (first.length === 0) first.push(words.shift() as string);
  return [first.join(' '), words.join(' ')];
}

// The key to the colours and the dashes.
const legend = [
  { x: 66, className: 'flow-video', text: 'Video' },
  { x: 166, className: 'flow-audio', text: 'Audio' },
  { x: 266, className: 'flow-control', text: 'Control' },
  { x: 380, className: 'flow-neutral', text: 'Digital or network: solid' },
  { x: 560, className: 'flow-neutral', text: 'Analog: dashed', analog: true },
];

// What connects to what, drawn from the plan: sources on the left, the room system in the middle, screens and speakers
// on the right. Colour is what travels (video, audio, control); dashed is analog, solid is digital or network.
export default function SignalFlow({ plan, analysis }: { plan: Plan; analysis: Analysis }) {
  const { nodes, links } = signalFlow(plan, analysis);
  const columns = [0, 1, 2, 3].map((c) => nodes.filter((n) => n.column === c));
  const tallest = Math.max(...columns.map((c) => c.length));
  const height = tallest * BOX.h + (tallest - 1) * BOX.gap + 32;
  const place = new Map<string, { node: FlowNode; x: number; y: number }>();
  columns.forEach((col, c) => {
    const total = col.length * BOX.h + (col.length - 1) * BOX.gap;
    col.forEach((node, i) =>
      place.set(node.id, { node, x: COLUMN_X[c], y: (height - total) / 2 + i * (BOX.h + BOX.gap) }),
    );
  });

  // Where each cable meets its box: spread along the side, so cables into the same box do not pile up.
  const ends = new Map<string, number>();
  const spread = (side: 'in' | 'out', nodeId: string) => {
    const mine = links
      .map((l, index) => ({ l, index }))
      .filter(({ l }) => (side === 'in' ? l.to : l.from) === nodeId)
      .sort((p, q) => {
        const py = place.get(side === 'in' ? p.l.from : p.l.to)?.y ?? 0;
        const qy = place.get(side === 'in' ? q.l.from : q.l.to)?.y ?? 0;
        return py - qy || p.index - q.index;
      });
    mine.forEach(({ index }, i) => ends.set(`${side}:${index}`, (i + 1) / (mine.length + 1)));
  };
  for (const node of nodes) {
    spread('in', node.id);
    spread('out', node.id);
  }

  // Labels that would land on each other are nudged down.
  const placed: { x: number; y: number; w: number }[] = [];
  const nudge = (x: number, y: number, label: string) => {
    const w = label.length * 5.4;
    let ny = y;
    for (let tries = 0; tries < 4; tries++) {
      const hit = placed.some((p) => Math.abs(p.x - x) < (p.w + w) / 2 && Math.abs(p.y - ny) < 11);
      if (!hit) break;
      ny += 11;
    }
    placed.push({ x, y: ny, w });
    return ny;
  };

  const full = height + LEGEND;
  return (
    <div className="planner-flow">
      <svg viewBox={`0 0 ${WIDTH} ${full}`} role="img" aria-label="Signal flow of the room">
        <title>Signal flow of the room</title>
        {links.map((l, index) => {
          const a = place.get(l.from);
          const b = place.get(l.to);
          if (!a || !b) return null;
          const x1 = a.x + BOX.w;
          const y1 = a.y + BOX.h * (ends.get(`out:${index}`) ?? 0.5);
          const x2 = b.x;
          const y2 = b.y + BOX.h * (ends.get(`in:${index}`) ?? 0.5);
          const bend = (x2 - x1) / 2;
          // A long cable passes behind the boxes in between, so its label sits near the source instead of the middle.
          const t = x2 - x1 > 120 ? 0.12 : 0.5;
          const u = 1 - t;
          const lx = u * u * u * x1 + 3 * u * u * t * (x1 + bend) + 3 * u * t * t * (x2 - bend) + t * t * t * x2;
          const ly = u * u * u * y1 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y2;
          return (
            <g key={`${l.from}-${l.to}-${l.signal}-${index}`}>
              <path
                className={`flow-link flow-${l.signal}`}
                data-analog={l.analog || undefined}
                d={`M${x1} ${y1} C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`}
              />
              <text className="flow-edge" x={lx} y={nudge(lx, ly - 5, l.label)} textAnchor="middle">
                {l.label}
              </text>
            </g>
          );
        })}
        {[...place.values()].map(({ node, x, y }) => {
          const lines = wrap(node.title);
          const textY = y + (node.detail ? 20 : 26) - (lines.length - 1) * 7;
          return (
            <g key={node.id}>
              <rect
                className="flow-box"
                data-core={node.column === 2 || undefined}
                x={x}
                y={y}
                width={BOX.w}
                height={BOX.h}
                rx={8}
              />
              {lines.map((line, i) => (
                <text key={i} className="flow-title" x={x + BOX.w / 2} y={textY + i * 15} textAnchor="middle">
                  {line}
                </text>
              ))}
              {node.detail && (
                <text className="flow-detail" x={x + BOX.w / 2} y={y + BOX.h - 12} textAnchor="middle">
                  {node.detail}
                </text>
              )}
            </g>
          );
        })}
        <g aria-label="Legend">
          <line className="flow-rule" x1={8} y1={height + 6} x2={WIDTH - 8} y2={height + 6} />
          <text className="flow-detail" x={8} y={height + 29}>
            Legend
          </text>
          {legend.map((item) => (
            <g key={item.text}>
              <line
                className={`flow-link ${item.className}`}
                data-analog={item.analog || undefined}
                x1={item.x}
                y1={height + 26}
                x2={item.x + 30}
                y2={height + 26}
              />
              <text className="flow-detail" x={item.x + 38} y={height + 29}>
                {item.text}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
