import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildAllDrawings, type DrawingId } from '@/lib/planner/drawings';
import type { Analysis, Plan } from '@/lib/planner/model';
import { buildSheet } from '@/lib/planner/sheet';
import { drawingStyles, Shape } from './drawing-shapes';
import PrintSheet from './print-sheet';

const n = (v: number) => Math.round(v * 10) / 10;

function saveSvg(svg: SVGSVGElement | null, name: string) {
  if (!svg) return;
  const text = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fileNames: Record<DrawingId, string> = {
  floor: 'k4av-floor-plan.svg',
  ceiling: 'k4av-ceiling-plan.svg',
  front: 'k4av-display-wall.svg',
  side: 'k4av-section.svg',
  cabling: 'k4av-cabling-plan.svg',
  rack: 'k4av-rack-elevation.svg',
};

// Floor plan, ceiling plan, display wall and section, with dimensions, and the same four on one printable sheet.
export default function PlanDrawings({ plan, analysis }: { plan: Plan; analysis: Analysis }) {
  const [id, setId] = useState<DrawingId>('floor');
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const svg = useRef<SVGSVGElement | null>(null);
  const sheetSvg = useRef<SVGSVGElement | null>(null);
  // the rack elevation is there only when the plan has a rack or an equipment box
  const drawings = useMemo(
    () => buildAllDrawings(plan, analysis).filter((d) => d.id !== 'rack' || analysis.gear.rack),
    [plan, analysis],
  );
  const sheet = useMemo(() => buildSheet(plan, analysis, today), [plan, analysis, today]);
  const drawing = drawings.find((d) => d.id === id) ?? drawings[0];

  return (
    <div className="planner-plans">
      <div className="planner-plans-tabs" role="group" aria-label="Drawings">
        {drawings.map((d) => (
          <button key={d.id} type="button" aria-pressed={d.id === id} onClick={() => setId(d.id)}>
            {d.title}
          </button>
        ))}
      </div>
      <div className="planner-plans-paper">
        <svg
          ref={svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${n(drawing.width)} ${n(drawing.height)}`}
          role="img"
          aria-label={`${drawing.title} of the room`}
        >
          <title>{`${drawing.title} of the room`}</title>
          <style>{drawingStyles}</style>
          <rect width={n(drawing.width)} height={n(drawing.height)} fill="#fff" />
          {drawing.prims.map((p, i) => (
            <Shape key={i} p={p} />
          ))}
        </svg>
      </div>
      <div className="planner-plans-actions">
        <button type="button" onClick={() => saveSvg(svg.current, fileNames[drawing.id])}>
          Save this drawing (SVG)
        </button>
        <button type="button" onClick={() => saveSvg(sheetSvg.current, 'k4av-drawing-sheet.svg')}>
          Save the sheet (SVG)
        </button>
        <button type="button" className="primary" onClick={() => window.print()}>
          Print the sheet or save it as PDF
        </button>
      </div>
      <p className="planner-plans-note">
        One {sheet.paper.name} sheet with all four drawings at {sheet.scale.label}. In the print dialog choose Save as
        PDF, and set margins to none.
      </p>
      {createPortal(
        <div className="planner-print-root">
          <style>{`@page { size: ${sheet.paper.w}pt ${sheet.paper.h}pt; margin: 0 }`}</style>
          <PrintSheet sheet={sheet} svgRef={sheetSvg} />
        </div>,
        document.body,
      )}
    </div>
  );
}
