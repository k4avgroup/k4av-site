import { signalFlow, type FlowNode } from '@/lib/planner/flow';
import type { Analysis, Plan } from '@/lib/planner/model';

const BOX = { w: 130, h: 62, gap: 16 };
const COLUMN_X = [8, 208, 408, 608];
const WIDTH = 746;

// Breaks a title into at most two lines.
function wrap(text: string, max = 18): string[] {
  if (text.length <= max) return [text];
  const words = text.split(' ');
  const first: string[] = [];
  while (words.length > 1 && (first.join(' ') + ' ' + words[0]).length <= max) first.push(words.shift() as string);
  if (first.length === 0) first.push(words.shift() as string);
  return [first.join(' '), words.join(' ')];
}

// What connects to what, drawn from the plan: sources on the left, the room system in the middle, screens and speakers on the right.
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
  const spread = (key: string, ids: string[], pick: (id: string) => number) => {
    const sorted = [...ids].sort((a, b) => pick(a) - pick(b));
    sorted.forEach((id, i) => ends.set(`${key}:${id}`, (i + 1) / (sorted.length + 1)));
  };
  for (const node of nodes) {
    const incoming = links.filter((l) => l.to === node.id).map((l) => l.from);
    const outgoing = links.filter((l) => l.from === node.id).map((l) => l.to);
    spread(`in-${node.id}`, incoming, (id) => place.get(id)?.y ?? 0);
    spread(`out-${node.id}`, outgoing, (id) => place.get(id)?.y ?? 0);
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

  return (
    <div className="planner-flow">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="Signal flow of the room">
        <title>Signal flow of the room</title>
        {links.map((l) => {
          const a = place.get(l.from);
          const b = place.get(l.to);
          if (!a || !b) return null;
          const x1 = a.x + BOX.w;
          const y1 = a.y + BOX.h * (ends.get(`out-${l.from}:${l.to}`) ?? 0.5);
          const x2 = b.x;
          const y2 = b.y + BOX.h * (ends.get(`in-${l.to}:${l.from}`) ?? 0.5);
          const bend = (x2 - x1) / 2;
          // A long cable passes behind the boxes in between, so its label sits near the source instead of the middle.
          const t = x2 - x1 > 120 ? 0.12 : 0.5;
          const u = 1 - t;
          const lx = u * u * u * x1 + 3 * u * u * t * (x1 + bend) + 3 * u * t * t * (x2 - bend) + t * t * t * x2;
          const ly = u * u * u * y1 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y2;
          return (
            <g key={`${l.from}-${l.to}`}>
              <path d={`M${x1} ${y1} C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`} />
              <text className="flow-edge" x={lx} y={nudge(lx, ly - 5, l.label)} textAnchor="middle">
                {l.label}
              </text>
            </g>
          );
        })}{' '}
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
      </svg>
    </div>
  );
}
