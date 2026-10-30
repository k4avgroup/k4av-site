import { buildDrawings, roomLabel, type Drawing, type TextStyle } from './drawings.ts';
import type { Analysis, Plan } from './model.ts';

// One printable sheet: the four drawings at a single standard scale, with a frame, a scale bar and a title block.
// Everything is measured in points (1/72 inch), so one drawing pixel is one point on the paper.

const PT_PER_MM = 72 / 25.4;
const round = (n: number, places = 100) => Math.round(n * places) / places;

export type Paper = { name: string; w: number; h: number };
export const papers: Record<'metric' | 'imperial', Paper> = {
  metric: { name: 'A3', w: round(420 * PT_PER_MM), h: round(297 * PT_PER_MM) },
  imperial: { name: 'Tabloid', w: 17 * 72, h: 11 * 72 },
};

export type PaperScale = { ratio: number; label: string };
export const metricScales: PaperScale[] = [20, 25, 50, 75, 100, 125, 150, 200, 250, 300].map((ratio) => ({
  ratio,
  label: `1:${ratio}`,
}));
// the usual architectural scales, in inches of paper to a foot of room
export const imperialScales: PaperScale[] = [
  { ratio: 24, label: '1/2" = 1\'-0"' },
  { ratio: 32, label: '3/8" = 1\'-0"' },
  { ratio: 48, label: '1/4" = 1\'-0"' },
  { ratio: 64, label: '3/16" = 1\'-0"' },
  { ratio: 96, label: '1/8" = 1\'-0"' },
  { ratio: 192, label: '1/16" = 1\'-0"' },
  { ratio: 384, label: '1/32" = 1\'-0"' },
];

// Pixels (points) on the sheet for one metre of the room, at a scale of 1 to `ratio`.
export const pointsPerMetre = (ratio: number) => (1000 * PT_PER_MM) / ratio;

export type PlacedDrawing = { drawing: Drawing; x: number; y: number };
export type SheetLine = { text: string; style: TextStyle };
export type ScaleBar = {
  x: number;
  y: number;
  width: number;
  total: number;
  unit: 'm' | 'ft';
  ticks: { x: number; label: string }[];
};
export type DrawingSheet = {
  paper: Paper;
  frame: { x: number; y: number; w: number; h: number };
  rule: number; // the line above the strip with the scale bar and the title block
  scale: PaperScale;
  pointsPerMetre: number;
  fits: boolean; // every drawing is inside its place at this scale
  placed: PlacedDrawing[];
  block: { x: number; y: number; w: number; h: number; lines: SheetLine[] };
  bar: ScaleBar;
};

const MARGIN = 22;
const BAND = 104; // the strip at the bottom, for the scale bar and the title block
const BLOCK = { w: 330, h: 92 };
const PAD = 6;

type Area = { x: number; y: number; w: number; h: number };

// The two plans stand side by side at full height; the display wall and the section are stacked in a third column.
// Returns null when they do not fit, unless `force` asks for the best it can do.
export function placeDrawings(drawings: Drawing[], area: Area, force = false): PlacedDrawing[] | null {
  const [floor, ceiling, front, side] = drawings;
  const third = Math.max(front.width, side.width);
  const spare = area.w - floor.width - ceiling.width - third;
  const stackSpare = area.h - front.height - side.height;
  const fits = spare >= 0 && stackSpare >= 0 && floor.height <= area.h && ceiling.height <= area.h;
  if (!fits && !force) return null;
  const gap = Math.max(0, spare) / 4;
  const x1 = area.x + gap;
  const x2 = x1 + floor.width + gap;
  const x3 = x2 + ceiling.width + gap;
  const vgap = Math.max(0, stackSpare) / 3;
  return [
    { drawing: floor, x: x1, y: area.y + Math.max(0, (area.h - floor.height) / 2) },
    { drawing: ceiling, x: x2, y: area.y + Math.max(0, (area.h - ceiling.height) / 2) },
    { drawing: front, x: x3, y: area.y + vgap },
    { drawing: side, x: x3, y: area.y + vgap * 2 + front.height },
  ];
}

export function buildSheet(plan: Plan, analysis: Analysis, date: string): DrawingSheet {
  const metric = plan.unit === 'm';
  const paper = metric ? papers.metric : papers.imperial;
  const scales = metric ? metricScales : imperialScales;
  const frame = { x: MARGIN, y: MARGIN, w: paper.w - 2 * MARGIN, h: paper.h - 2 * MARGIN };
  const rule = frame.y + frame.h - BAND;
  const area = { x: frame.x + PAD, y: frame.y + PAD, w: frame.w - 2 * PAD, h: rule - frame.y - 2 * PAD };

  // the largest standard scale at which all four drawings fit their places
  let chosen = scales[scales.length - 1];
  let placed: PlacedDrawing[] | null = null;
  for (const candidate of scales) {
    const built = buildDrawings(plan, analysis, { scale: pointsPerMetre(candidate.ratio), bare: true });
    placed = placeDrawings(built, area);
    if (placed) {
      chosen = candidate;
      break;
    }
  }
  const fits = placed !== null;
  if (!placed) {
    const built = buildDrawings(plan, analysis, { scale: pointsPerMetre(chosen.ratio), bare: true });
    placed = placeDrawings(built, area, true) as PlacedDrawing[];
  }

  const ppm = pointsPerMetre(chosen.ratio);
  const perUnit = metric ? ppm : ppm * 0.3048; // points for one metre, or one foot
  const totals = metric ? [1, 2, 3, 4, 5, 6, 8, 10, 15, 20] : [3, 5, 10, 15, 20, 30, 40, 60];
  const total = [...totals].reverse().find((t) => t * perUnit <= 220) ?? totals[0];
  const bar: ScaleBar = {
    x: frame.x + 14,
    y: frame.y + frame.h - 34,
    width: round(total * perUnit),
    total,
    unit: metric ? 'm' : 'ft',
    ticks: [0, total / 2, total].map((v) => ({
      x: round(frame.x + 14 + v * perUnit),
      label: v === 0 ? '0' : `${v} ${metric ? 'm' : 'ft'}`,
    })),
  };

  const block = {
    x: frame.x + frame.w - BLOCK.w - 8,
    y: frame.y + frame.h - BLOCK.h - 8,
    w: BLOCK.w,
    h: BLOCK.h,
    lines: [
      { text: 'K4 AV GROUP', style: 'title' },
      { text: 'Meeting room plan', style: 'label' },
      { text: roomLabel(plan), style: 'label' },
      { text: `Scale ${chosen.label}   ·   Date ${date}   ·   Sheet 1 of 1`, style: 'label' },
      { text: `${paper.name} sheet. Indicative sketch. Check dimensions on site.`, style: 'small' },
    ] satisfies SheetLine[],
  };

  return { paper, frame, rule, scale: chosen, pointsPerMetre: ppm, fits, placed, block, bar };
}
