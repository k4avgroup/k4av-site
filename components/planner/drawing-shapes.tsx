import type { Prim } from '@/lib/planner/drawings';

// The drawings carry their own styles, so a saved SVG looks the same outside the page.
export const drawingStyles = `
.s-wall{fill:none;stroke:#1f2933;stroke-width:2.4;stroke-linejoin:round}
.s-floor{fill:none;stroke:#1f2933;stroke-width:3}
.s-furniture{fill:#efe3d3;stroke:#7a6246;stroke-width:1.2}
.s-ref{fill:none;stroke:#8896a5;stroke-width:1;stroke-dasharray:5 4}
.s-chair{fill:#dfe4ea;stroke:#7b8794;stroke-width:1}
.s-display{fill:#1f2933;stroke:#1f2933}
.s-device{fill:#c9d3de;stroke:#52606d;stroke-width:1}
.s-speaker{fill:#d9f2e3;stroke:#2f9e68;stroke-width:1.2}
.s-mic{fill:#dff3fb;stroke:#1c8fb5;stroke-width:1.4}
.s-camera{fill:#fff1cc;stroke:#c98a00;stroke-width:1.2}
.s-fov{fill:rgba(255,183,3,.08);stroke:#e0a100;stroke-width:.8;stroke-dasharray:3 3}
.s-grid{fill:none;stroke:#dde3e9;stroke-width:.7}
.s-dim,.s-ext{fill:none;stroke:#b4412c;stroke-width:1}
.s-ext{stroke-width:.6}
.s-person{fill:#cfe0ff;stroke:#3a6fd8;stroke-width:1.2}
.s-frame{fill:none;stroke:#1f2933;stroke-width:1.4}
.s-rule{fill:none;stroke:#1f2933;stroke-width:.8}
text{font-family:Arial,Helvetica,sans-serif}
.t-label{font-size:11px;fill:#1f2933}
.t-small{font-size:9.5px;fill:#52606d}
.t-dim{font-size:10.5px;fill:#b4412c;paint-order:stroke;stroke:#fff;stroke-width:3px}
.t-title{font-size:13px;font-weight:700;fill:#1f2933}
.t-ondark{font-size:10px;fill:#fff}
`;

const n = (v: number) => Math.round(v * 10) / 10;

export function Shape({ p }: { p: Prim }) {
  if (p.k === 'rect') {
    return <rect className={`s-${p.s}`} x={n(p.x)} y={n(p.y)} width={n(p.w)} height={n(p.h)} rx={p.r} />;
  }
  if (p.k === 'circle') return <circle className={`s-${p.s}`} cx={n(p.x)} cy={n(p.y)} r={n(p.r)} />;
  if (p.k === 'line') {
    return <line className={`s-${p.s}`} x1={n(p.x1)} y1={n(p.y1)} x2={n(p.x2)} y2={n(p.y2)} />;
  }
  if (p.k === 'poly') {
    return <polygon className={`s-${p.s}`} points={p.pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')} />;
  }
  return (
    <text
      className={`t-${p.s}`}
      x={n(p.x)}
      y={n(p.y)}
      textAnchor={p.a ?? 'middle'}
      transform={p.rot ? `rotate(${p.rot} ${n(p.x)} ${n(p.y)})` : undefined}
    >
      {p.t}
    </text>
  );
}
