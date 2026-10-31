import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildAllDrawings, type DrawingId } from '@/lib/planner/drawings';
import type { Analysis, Plan } from '@/lib/planner/model';
import { buildSheets } from '@/lib/planner/sheet';
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
  schedule: 'k4av-device-schedule.svg',
};

// The drawings one at a time, with dimensions, and the same drawings on three printable sheets.
export default function PlanDrawings({ plan, analysis }: { plan: Plan; analysis: Analysis }) {
  const [id, setId] = useState<DrawingId>('floor');
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const svg = useRef<SVGSVGElement | null>(null);
  const sheetSvgs = useRef<(SVGSVGElement | null)[]>([]);
  // the rack elevation is there only when the plan has a rack or an equipment box
  const drawings = useMemo(
    () => buildAllDrawings(plan, analysis).filter((d) => d.id !== 'rack' || analysis.gear.rack),
    [plan, analysis],
  );
  const sheets = useMemo(() => buildSheets(plan, analysis, today), [plan, analysis, today]);
  const drawing = drawings.find((d) => d.id === id) ?? drawings[0];

  // the browser may ask once to allow several downloads
  const saveSheets = () =>
    sheets.forEach((_, i) =>
      setTimeout(() => saveSvg(sheetSvgs.current[i], `k4av-drawing-sheet-${i + 1}.svg`), i * 400),
    );

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
        <button type="button" onClick={saveSheets}>
          Save the sheets (SVG)
        </button>
        <button type="button" className="primary" onClick={() => window.print()}>
          Print the sheets or save them as PDF
        </button>
      </div>
      <p className="planner-plans-note">
        {sheets.length} {sheets[0].paper.name} sheets: the four drawings at {sheets[0].scale?.label}, the cabling plan
        at {sheets[1].scale?.label}, and the device schedule with the rack. In the print dialog choose Save as PDF, and
        set margins to none.
      </p>
      {createPortal(
        <div className="planner-print-root">
          <style>{`@page { size: ${sheets[0].paper.w}pt ${sheets[0].paper.h}pt; margin: 0 }`}</style>
          {sheets.map((sheet, i) => (
            <div key={i} className="planner-print-page">
              <PrintSheet
                sheet={sheet}
                number={i + 1}
                of={sheets.length}
                svgRef={(el) => {
                  sheetSvgs.current[i] = el;
                }}
              />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
