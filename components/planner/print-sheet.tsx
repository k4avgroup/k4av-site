import type { DrawingSheet } from '@/lib/planner/sheet';
import { drawingStyles, Shape } from './drawing-shapes';

const n = (v: number) => Math.round(v * 10) / 10;

// The sheet as one SVG, in points: it prints at its real size and saves as a file that looks the same anywhere.
export default function PrintSheet({ sheet, svgRef }: { sheet: DrawingSheet; svgRef?: React.Ref<SVGSVGElement> }) {
  const { paper, frame, block, bar } = sheet;
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${paper.w} ${paper.h}`}
      width={`${paper.w}pt`}
      height={`${paper.h}pt`}
      role="img"
      aria-label={`Drawing sheet, ${paper.name}, scale ${sheet.scale.label}`}
    >
      <title>{`Drawing sheet, ${paper.name}, scale ${sheet.scale.label}`}</title>
      <style>{drawingStyles}</style>
      <rect width={paper.w} height={paper.h} fill="#fff" />
      <rect className="s-frame" x={frame.x} y={frame.y} width={frame.w} height={frame.h} />
      {sheet.placed.map(({ drawing, x, y }) => (
        <g key={drawing.id} transform={`translate(${n(x)} ${n(y)})`}>
          {drawing.prims.map((p, i) => (
            <Shape key={i} p={p} />
          ))}
        </g>
      ))}
      <line className="s-rule" x1={frame.x} y1={sheet.rule} x2={frame.x + frame.w} y2={sheet.rule} />
      <rect className="s-frame" x={block.x} y={block.y} width={block.w} height={block.h} />
      {block.lines.map((line, i) => (
        <text key={i} className={`t-${line.style}`} x={block.x + 10} y={block.y + 20 + i * 15}>
          {line.text}
        </text>
      ))}
      <line className="s-rule" x1={bar.x} y1={bar.y} x2={bar.x + bar.width} y2={bar.y} />
      {bar.ticks.map((t) => (
        <g key={t.label}>
          <line className="s-rule" x1={t.x} y1={bar.y - 5} x2={t.x} y2={bar.y + 5} />
          <text className="t-small" x={t.x} y={bar.y + 18} textAnchor="middle">
            {t.label}
          </text>
        </g>
      ))}
      <text className="t-small" x={bar.x} y={bar.y - 12}>
        {`Scale ${sheet.scale.label}`}
      </text>
      {sheet.key.items.map((item, i) => (
        <g key={item.label}>
          <rect
            className={`s-${item.style}`}
            x={sheet.key.x}
            y={sheet.key.y + i * 15 - 8}
            width={14}
            height={9}
            rx={1.5}
          />
          <text className="t-small" x={sheet.key.x + 22} y={sheet.key.y + i * 15}>
            {item.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
