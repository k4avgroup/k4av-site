import {
  formatLength,
  presenterSpot,
  roomTypes,
  rules,
  type Analysis,
  type Cable,
  type Plan,
  type Vec3,
} from './model.ts';
import { deviceSchedule, rackLayout } from './schedule.ts';

// Drawings of the planned room, as shapes in pixels: a floor plan, a ceiling plan, the display wall and a section.
// Shapes carry a style name; the page decides how each style looks. Dimension lines show the real lengths.

export type DrawingId = 'floor' | 'ceiling' | 'front' | 'side' | 'cabling' | 'rack' | 'schedule';
export type Style =
  | 'wall'
  | 'floor'
  | 'furniture'
  | 'ref'
  | 'chair'
  | 'display'
  | 'device'
  | 'control'
  | 'speaker'
  | 'mic'
  | 'camera'
  | 'fov'
  | 'grid'
  | 'dim'
  | 'ext'
  | 'person'
  | 'cable-video'
  | 'cable-audio'
  | 'cable-control'
  | 'cable-net'
  | 'rack'
  | 'rackfree'
  | 'rack-control'
  | 'rack-video'
  | 'rack-audio'
  | 'rack-network'
  | 'rack-compute'
  | 'rack-laptop'
  | 'rack-power'
  | 'rack-blank'
  | 'head'
  | 'group'
  | 'table';
export type TextStyle = 'label' | 'small' | 'dim' | 'title' | 'ondark';
export type Prim =
  | { k: 'rect'; x: number; y: number; w: number; h: number; s: Style; r?: number }
  | { k: 'circle'; x: number; y: number; r: number; s: Style }
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number; s: Style }
  | { k: 'poly'; pts: [number, number][]; s: Style }
  | { k: 'text'; x: number; y: number; t: string; s: TextStyle; a?: 'start' | 'middle' | 'end'; rot?: number };
export type Drawing = {
  id: DrawingId;
  title: string;
  width: number;
  height: number;
  scale: number; // pixels per metre
  prims: Prim[];
};

export const drawingTitles: Record<DrawingId, string> = {
  floor: 'Floor plan',
  ceiling: 'Ceiling plan',
  front: 'Display wall',
  side: 'Section',
  cabling: 'Cabling',
  rack: 'Rack',
  schedule: 'Schedule',
};

export type DrawingOptions = {
  scale?: number; // pixels per metre; by default each drawing is sized to fill the screen
  bare?: boolean; // only the drawing's name and key: no room line or disclaimer, for a sheet with its own title block
};
const MARGIN = { top: 70, bottom: 84 };
// room beside each drawing for its dimension lines: the plans need little on the right, the display wall a stack on both sides
const SIDE = { plan: { left: 66, right: 30 }, wall: { left: 92, right: 96 }, section: { left: 96, right: 60 } };
const bottomSpace = (o: DrawingOptions) => MARGIN.bottom - (o.bare ? 26 : 0);
const fit = (w: number, h: number) => Math.max(14, Math.min(64, 560 / w, 380 / h));
const unique = (values: number[], step = 0.05) => {
  const out: number[] = [];
  for (const v of [...values].sort((a, b) => a - b)) if (!out.some((o) => Math.abs(o - v) < step)) out.push(v);
  return out;
};

// Collects shapes and knows how to draw a dimension line between two points.
function sheet() {
  const prims: Prim[] = [];
  const add = (p: Prim) => prims.push(p);
  const rect = (x: number, y: number, w: number, h: number, s: Style, r?: number) =>
    add({ k: 'rect', x, y, w, h, s, r });
  const circle = (x: number, y: number, r: number, s: Style) => add({ k: 'circle', x, y, r, s });
  const line = (x1: number, y1: number, x2: number, y2: number, s: Style) => add({ k: 'line', x1, y1, x2, y2, s });
  const poly = (pts: [number, number][], s: Style) => add({ k: 'poly', pts, s });
  const text = (
    x: number,
    y: number,
    t: string,
    s: TextStyle = 'small',
    a: 'start' | 'middle' | 'end' = 'middle',
    rot?: number,
  ) => add({ k: 'text', x, y, t, s, a, rot });
  // `offset` moves the dimension line sideways from the measured points: to the left of the direction of travel when positive.
  const dim = (x1: number, y1: number, x2: number, y2: number, offset: number, t: string) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const sign = offset < 0 ? -1 : 1;
    const ax = x1 + nx * offset;
    const ay = y1 + ny * offset;
    const bx = x2 + nx * offset;
    const by = y2 + ny * offset;
    line(x1 + nx * sign * 3, y1 + ny * sign * 3, ax + nx * sign * 4, ay + ny * sign * 4, 'ext');
    line(x2 + nx * sign * 3, y2 + ny * sign * 3, bx + nx * sign * 4, by + ny * sign * 4, 'ext');
    line(ax, ay, bx, by, 'dim');
    const tx = (ux + nx) / Math.SQRT2;
    const ty = (uy + ny) / Math.SQRT2;
    for (const [px, py] of [
      [ax, ay],
      [bx, by],
    ]) {
      line(px - tx * 4, py - ty * 4, px + tx * 4, py + ty * 4, 'dim');
    }
    const vertical = Math.abs(dy) > Math.abs(dx);
    const outX = nx * sign;
    const outY = ny * sign;
    const gap = vertical ? (outX > 0 ? 13 : 6) : outY > 0 ? 15 : 7;
    const mx = (ax + bx) / 2 + outX * gap;
    const my = (ay + by) / 2 + outY * gap;
    text(mx, my, t, 'dim', 'middle', vertical ? -90 : undefined);
  };
  return { prims, rect, circle, line, poly, text, dim };
}

type Sheet = ReturnType<typeof sheet>;

// What the display wall shows, in a few words.
const displayName = (d: Analysis['displays']) =>
  d.type === 'led'
    ? `LED wall ${d.size}"`
    : d.type === 'projector'
      ? `${d.count}× ${d.size}" screen`
      : `${d.count}× ${d.size}" display`;

export const roomLabel = (plan: Plan) =>
  `${roomTypes[plan.roomType].noun}, ${formatLength(plan.length, plan.unit)} × ${formatLength(plan.width, plan.unit)}, ceiling ${formatLength(plan.height, plan.unit)}`;

// The title block under every drawing. A long legend continues on the next line.
function titleBlock(g: Sheet, x: number, y: number, title: string, plan: Plan, legend: string, bare = false) {
  g.text(x, y, title, 'title', 'start');
  if (!bare) g.text(x, y + 15, roomLabel(plan), 'label', 'start');
  const lines: string[] = [];
  let current = '';
  for (const part of legend ? legend.split(' · ') : []) {
    if (current && (current + ' · ' + part).length > 64) {
      lines.push(current);
      current = part;
    } else {
      current = current ? current + ' · ' + part : part;
    }
  }
  if (current) lines.push(current);
  if (!bare) lines.push('Indicative sketch. Check dimensions on site.');
  lines.forEach((line, i) => g.text(x, y + (bare ? 14 : 29) + i * 12, line, 'small', 'start'));
}

// ---------------------------------------------------------------- plan views

// A wedge on the plan: what a camera sees, cut off at the walls.
function wedge(
  g: Sheet,
  plan: Plan,
  cam: Analysis['gear']['cameras'][number],
  X: (x: number) => number,
  Y: (z: number) => number,
) {
  // a camera that looks all round (a table camera) has a circle of view, cut off at the walls
  if (cam.hfov >= 360) {
    const ring: [number, number][] = [];
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * 2 * Math.PI;
      ring.push([
        X(Math.min(plan.width / 2, Math.max(-plan.width / 2, cam.pos[0] + Math.sin(a) * 3))),
        Y(Math.min(plan.length / 2, Math.max(-plan.length / 2, cam.pos[2] + Math.cos(a) * 3))),
      ]);
    }
    g.poly(ring, 'fov');
    return;
  }
  const dx = cam.target[0] - cam.pos[0];
  const dz = cam.target[2] - cam.pos[2];
  const reach = Math.min(Math.hypot(dx, dz), 6);
  const a = Math.atan2(dx, dz);
  const half = (cam.hfov * Math.PI) / 360;
  const corner = (angle: number): [number, number] => [
    X(Math.min(plan.width / 2, Math.max(-plan.width / 2, cam.pos[0] + Math.sin(angle) * reach))),
    Y(Math.min(plan.length / 2, Math.max(-plan.length / 2, cam.pos[2] + Math.cos(angle) * reach))),
  ];
  g.poly([[X(cam.pos[0]), Y(cam.pos[2])], corner(a - half), corner(a + half)], 'fov');
}

function planBase(plan: Plan, a: Analysis, kind: 'floor' | 'ceiling' | 'cabling', opts: DrawingOptions) {
  const { length: L, width: W } = plan;
  const { layout, displays, gear } = a;
  const ceiling = kind === 'ceiling';
  const s = opts.scale ?? fit(W, L);
  const out = rackOutside(plan, a);
  const ox = SIDE.plan.left + out.left * s;
  const oy = MARGIN.top + out.top * s;
  const X = (x: number) => ox + (x + W / 2) * s;
  const Y = (z: number) => oy + (z + L / 2) * s;
  const g = sheet();
  g.rect(ox, oy, W * s, L * s, 'wall');

  if (ceiling) {
    const tile = plan.unit === 'ft' ? 0.6096 : 0.6;
    for (let x = tile; x < W - 0.01; x += tile) g.line(ox + x * s, oy, ox + x * s, oy + L * s, 'grid');
    for (let z = tile; z < L - 0.01; z += tile) g.line(ox, oy + z * s, ox + W * s, oy + z * s, 'grid');
  }

  // the display wall
  for (const x of displays.xs) g.rect(X(x - displays.width / 2), Y(-L / 2) - 1, displays.width * s, 6, 'display');
  g.text(X(0), Y(-L / 2) + 19, displayName(displays), 'small');
  const wb = displays.whiteboard;
  if (wb) {
    g.rect(X(wb.x - wb.width / 2), Y(-L / 2) - 1, wb.width * s, 6, 'display');
    g.text(X(wb.x), Y(-L / 2) + 19, 'whiteboard', 'small');
  }

  // furniture: drawn solid on the floor plan, dashed on the ceiling plan
  const chair = 0.45 * s;
  // a round table is a circle, a boat-shaped one a rectangle with half-round ends
  const tableShape = (t: Analysis['layout']['tables'][number], style: 'ref' | 'furniture') => {
    if (t.shape === 'semi') {
      // half a disc, its flat side on the display wall
      const wall = t.z - t.length / 2;
      const arc: [number, number][] = [];
      for (let i = 0; i <= 24; i++) {
        const a = -Math.PI / 2 + (i / 24) * Math.PI;
        arc.push([X(t.x + Math.sin(a) * t.length), Y(wall + Math.cos(a) * t.length)]);
      }
      g.poly(arc, style);
      return;
    }
    if (t.shape === 'round') g.circle(X(t.x), Y(t.z), (t.width / 2) * s, style);
    else
      g.rect(
        X(t.x - t.width / 2),
        Y(t.z - t.length / 2),
        t.width * s,
        t.length * s,
        style,
        t.shape === 'boat' ? (t.width / 2) * s : undefined,
      );
  };
  if (ceiling || kind === 'cabling') {
    for (const t of layout.tables) tableShape(t, 'ref');
  } else {
    for (const t of layout.tables) tableShape(t, 'furniture');
    for (const seat of layout.seats) g.rect(X(seat.x) - chair / 2, Y(seat.z) - chair / 2, chair, chair, 'chair', 3);
  }

  // dimensions of the room
  g.dim(X(-W / 2), Y(-L / 2), X(W / 2), Y(-L / 2), -26, formatLength(W, plan.unit));
  g.dim(X(-W / 2), Y(-L / 2), X(-W / 2), Y(L / 2), 30, formatLength(L, plan.unit));

  // wall devices: cameras with what they see, and the control panel
  // two cameras on the same spot of the plan (one above the display, one below) are drawn side by side
  const stacked = new Map<string, number>();
  const labels: [number, number][] = [];
  gear.cameras.forEach((cam, i) => {
    if (kind === 'floor') wedge(g, plan, cam, X, Y);
    const key = `${cam.pos[0]},${cam.pos[2]}`;
    const nth = stacked.get(key) ?? 0;
    stacked.set(key, nth + 1);
    const cx = X(cam.pos[0]) + nth * 13;
    const cy = Y(cam.pos[2]);
    if (cam.kind === 'table') g.circle(cx, cy, 5, 'camera');
    else g.rect(cx - 5, cy - 5, 10, 10, 'camera', 2);
    // cameras close together on a small plan would write their numbers on top of each other: raise the later ones
    let ly = cy - 9;
    while (labels.some(([lx, y]) => Math.abs(lx - cx) < 14 && Math.abs(y - ly) < 10)) ly -= 10;
    labels.push([cx, ly]);
    g.text(cx, ly, `C${i + 1}`, 'small');
  });
  const c = gear.control;
  if (c && plan.control === 'wall') g.rect(X(c[0]) - 1, Y(c[2]) - 0.11 * s, 6, 0.22 * s, 'control');
  if (c && plan.control === 'table' && !ceiling)
    g.rect(X(c[0]) - 0.12 * s, Y(c[2]) - 0.08 * s, 0.24 * s, 0.16 * s, 'control');

  return {
    g,
    s,
    ox,
    oy,
    X,
    Y,
    width: ox + W * s + SIDE.plan.right + out.right * s,
    height: oy + L * s + bottomSpace(opts) + out.bottom * s,
    below: out.bottom * s, // room taken by a rack outside, under the plan
  };
}

export function floorPlan(plan: Plan, a: Analysis, opts: DrawingOptions = {}): Drawing {
  const { layout, displays, gear } = a;
  const { length: L, unit } = plan;
  const { g, s, ox, oy, X, Y, width, height, below } = planBase(plan, a, 'floor', opts);
  equipmentOnPlan(g, plan, a, X, Y, s);

  if (gear.bar) g.rect(X(0) - (gear.bar.width * s) / 2, Y(-L / 2) + 8, gear.bar.width * s, 6, 'camera');
  for (const p of gear.wallSpeakers) g.rect(X(p[0]) - 0.08 * s, Y(p[2]) - 0.07 * s, 0.16 * s, 0.14 * s, 'speaker');
  if (plan.mics === 'table' || plan.mics === 'gooseneck')
    for (const p of gear.mics) g.circle(X(p[0]), Y(p[2]), Math.max(3, 0.05 * s), 'mic');

  if (plan.presenter && plan.roomType !== 'huddle') {
    const at = presenterSpot(plan, displays);
    g.circle(X(at.x), Y(at.z), Math.max(5, 0.22 * s), 'person');
    g.text(X(at.x), Y(at.z) + 3.5, 'P', 'small');
  }

  // distances: the wall to the first furniture, the furniture itself, and the farthest viewer
  const first = Math.min(...layout.tables.map((t) => t.z - t.length / 2));
  const left = Math.min(...layout.tables.map((t) => t.x - t.width / 2));
  if (first + L / 2 > 0.4)
    g.dim(X(left - 0.6), Y(-L / 2), X(left - 0.6), Y(first), 0, formatLength(first + L / 2, unit));
  if (layout.rows) {
    const rows = unique(
      layout.tables.map((t) => t.z),
      0.2,
    );
    const d0 = layout.tables[0];
    g.dim(
      X(d0.x - d0.width / 2),
      Y(d0.z - d0.length / 2),
      X(d0.x + d0.width / 2),
      Y(d0.z - d0.length / 2),
      -12,
      formatLength(d0.width, unit),
    );
    if (rows.length > 1)
      g.dim(X(left - 0.1), Y(rows[0]), X(left - 0.1), Y(rows[1]), 0, formatLength(rows[1] - rows[0], unit));
  } else {
    const t = layout.table;
    const right = t.x + t.width / 2 + 0.9;
    g.dim(X(right), Y(t.z - t.length / 2), X(right), Y(t.z + t.length / 2), -14, formatLength(t.length, unit));
    if (!layout.endChairs)
      g.dim(
        X(t.x - t.width / 2),
        Y(t.z - t.length / 2),
        X(t.x + t.width / 2),
        Y(t.z - t.length / 2),
        -10,
        formatLength(t.width, unit),
      );
  }
  titleBlock(
    g,
    ox,
    oy + L * s + below + 50,
    'Floor plan',
    plan,
    `C camera · P presenter · ■ video bar · ● microphone · AVR rack · WM microphone cabinet · farthest seat ${formatLength(displays.farthest, unit)} from the display`,
    opts.bare,
  );
  return { id: 'floor', title: drawingTitles.floor, width, height, scale: s, prims: g.prims };
}

export function ceilingPlan(plan: Plan, a: Analysis, opts: DrawingOptions = {}): Drawing {
  const { gear } = a;
  const { length: L, width: W, unit } = plan;
  const { g, s, ox, oy, X, Y, width, height, below } = planBase(plan, a, 'ceiling', opts);
  let spacing = '';
  const rack = gear.rack;
  const home: [number, number] = rack && rack.mode !== 'behind' ? [rack.pos[0], rack.pos[2]] : [0, -L / 2 + 0.06];
  if (gear.speakers.length) {
    // one speaker loop through the ceiling, row by row, ending at the rack
    const loop = speakerLoop(gear.speakers, home);
    draw(g, loop, X, Y, 'cable-audio');
    const end = loop[loop.length - 1];
    g.text(X(end[0]) + 6, Y(end[1]) - 6, 'TO RACK', 'small', 'start');
  }

  if (gear.speakers.length) {
    const r = Math.max(4, 0.1 * s);
    for (const p of gear.speakers) {
      g.circle(X(p[0]), Y(p[2]), r, 'speaker');
      g.line(X(p[0]) - r * 0.6, Y(p[2]) - r * 0.6, X(p[0]) + r * 0.6, Y(p[2]) + r * 0.6, 'speaker');
      g.line(X(p[0]) - r * 0.6, Y(p[2]) + r * 0.6, X(p[0]) + r * 0.6, Y(p[2]) - r * 0.6, 'speaker');
    }
    const xs = unique(gear.speakers.map((p) => p[0]));
    const zs = unique(gear.speakers.map((p) => p[2]));
    // A dimension needs room for its label. Where the speakers stand close to a wall or to each other, the spacing
    // goes into the key under the drawing instead.
    const stepX = xs.length > 1 ? xs[1] - xs[0] : 0;
    const stepZ = zs.length > 1 ? zs[1] - zs[0] : 0;
    const roomAbove = (zs[0] + L / 2) * s >= 34;
    const roomLeft = (xs[0] + W / 2) * s >= 46;
    const roomRight = (W / 2 - xs[xs.length - 1]) * s >= 30;
    if (xs.length > 1 && stepX * s >= 34 && roomAbove) {
      g.dim(X(xs[0]), Y(zs[0]), X(xs[1]), Y(zs[0]), -16, formatLength(stepX, unit));
    }
    if (zs.length > 1 && stepZ * s >= 34 && roomLeft) {
      g.dim(X(xs[0]), Y(zs[0]), X(xs[0]), Y(zs[1]), 16, formatLength(stepZ, unit));
    }
    if (roomAbove && roomRight) {
      g.dim(X(xs[xs.length - 1]), Y(-L / 2), X(xs[xs.length - 1]), Y(zs[0]), -16, formatLength(zs[0] + L / 2, unit));
    }
    if ((stepX && stepX * s < 34) || (stepZ && stepZ * s < 34) || !roomAbove || !roomLeft || !roomRight) {
      spacing = `speakers every ${formatLength(stepX || stepZ, unit)} × ${formatLength(stepZ || stepX, unit)}`;
    }
  }
  for (const p of gear.wallSpeakers) g.rect(X(p[0]) - 0.08 * s, Y(p[2]) - 0.07 * s, 0.16 * s, 0.14 * s, 'speaker');

  const proj = a.displays.projector;
  if (proj) {
    for (const x of a.displays.xs) {
      g.rect(X(x) - 0.2 * s, Y(proj.pos[2]) - 0.15 * s, 0.4 * s, 0.3 * s, 'camera');
      g.text(X(x) + 0.2 * s + 3, Y(proj.pos[2]) + 3.5, 'PROJ', 'small', 'start');
    }
  }

  if (plan.mics === 'ceiling' || plan.mics === 'pendant') {
    const { size } = rules.micArray[plan.micShape];
    for (const p of gear.mics) {
      if (plan.micShape === 'round') g.circle(X(p[0]), Y(p[2]), (size / 2) * s, 'mic');
      else g.rect(X(p[0]) - (size * s) / 2, Y(p[2]) - (size * s) / 2, size * s, size * s, 'mic');
      g.text(X(p[0]), Y(p[2]) + 3.5, 'MIC', 'small');
    }
    const p = gear.mics[0];
    if (p) {
      g.dim(
        X(p[0] - size / 2),
        Y(p[2] + size / 2),
        X(p[0] + size / 2),
        Y(p[2] + size / 2),
        22,
        plan.micShape === 'round' ? '25 in (635 mm)' : '24 in (604 mm)',
      );
    }
  }
  const legend =
    '○ ceiling speaker, green: speaker loop · □ microphone array · C camera · PROJ projector · dashed: furniture below · grid: ' +
    (plan.unit === 'ft' ? '2 × 2 ft tiles' : '600 mm tiles') +
    (spacing ? ` · ${spacing}` : '');
  titleBlock(g, ox, oy + L * s + below + 50, 'Ceiling plan', plan, legend, opts.bare);
  return { id: 'ceiling', title: drawingTitles.ceiling, width, height, scale: s, prims: g.prims };
}

// ---------------------------------------------------------------- elevation and section

export function displayWall(plan: Plan, a: Analysis, opts: DrawingOptions = {}): Drawing {
  const { width: W, height: H, unit } = plan;
  const { displays, gear } = a;
  const s = opts.scale ?? fit(W, H);
  const ox = SIDE.wall.left;
  const oy = MARGIN.top - 12;
  const X = (x: number) => ox + (x + W / 2) * s;
  const Y = (y: number) => oy + (H - y) * s;
  const g = sheet();
  g.rect(ox, oy, W * s, H * s, 'wall');
  g.line(ox - 12, Y(0), ox + W * s + 12, Y(0), 'floor');

  const bottom = displays.centerY - displays.height / 2;
  const top = displays.centerY + displays.height / 2;
  for (const x of displays.xs) {
    g.rect(X(x - displays.width / 2), Y(top), displays.width * s, displays.height * s, 'display');
    g.text(X(x), Y(displays.centerY) + 4, `${displays.size}"${displays.type === 'led' ? ' LED' : ''}`, 'ondark');
  }
  const wb = displays.whiteboard;
  if (wb) {
    g.rect(X(wb.x - wb.width / 2), Y(wb.centerY + wb.height / 2), wb.width * s, wb.height * s, 'display');
    g.text(X(wb.x), Y(wb.centerY) + 4, 'whiteboard', 'ondark');
  }
  if (gear.bar) {
    g.rect(
      X(0) - (gear.bar.width * s) / 2,
      Y(gear.bar.pos[1]) - (gear.bar.height * s) / 2,
      gear.bar.width * s,
      gear.bar.height * s,
      'camera',
    );
  }
  for (const p of gear.wallSpeakers) g.rect(X(p[0]) - 0.08 * s, Y(p[1]) - 0.18 * s, 0.16 * s, 0.36 * s, 'speaker');
  // the cameras at the display; the others are on the side walls, the back wall or the table
  const onWall = gear.cameras.filter((c) => c.kind === 'front');
  for (const cam of onWall) {
    g.rect(X(cam.pos[0]) - 0.085 * s, Y(cam.pos[1]) - 0.1 * s, 0.17 * s, 0.2 * s, 'camera', 2);
    // the label of a camera below the display goes under it, not onto the screen; the number is the one on the plans
    const below = cam.pos[1] < bottom;
    g.text(
      X(cam.pos[0]),
      Y(cam.pos[1]) + (below ? 0.1 * s + 12 : -0.1 * s - 5),
      `C${gear.cameras.indexOf(cam) + 1}`,
      'small',
    );
  }
  const lowBar = gear.bar !== null && gear.bar.pos[1] < bottom;
  if (gear.rack?.mode === 'behind') {
    const box = gear.rack;
    g.rect(X(-box.width / 2), Y(displays.centerY + box.height / 2), box.width * s, box.height * s, 'rackfree');
    g.text(X(0), Y(displays.centerY - displays.height / 2) + 14, 'equipment box behind the display', 'small');
  }

  // heights above the floor, stacked on the left; widths along the top
  g.dim(X(-W / 2), Y(H), X(W / 2), Y(H), -26, formatLength(W, unit));
  g.dim(X(-W / 2), Y(H), X(-W / 2), Y(0), 30, formatLength(H, unit));
  const span = displays.count === 2 ? 2 * displays.width + 0.12 : displays.width;
  g.dim(
    X(-span / 2),
    Y(bottom),
    X(span / 2),
    Y(bottom),
    onWall.some((c) => c.pos[1] < bottom) || lowBar ? 46 : 24,
    formatLength(span, unit),
  );
  g.dim(X(W / 2), Y(bottom), X(W / 2), Y(0), -30, `bottom ${formatLength(bottom, unit)}`);
  g.dim(X(W / 2), Y(top), X(W / 2), Y(0), -64, `top ${formatLength(top, unit)}`);
  unique(onWall.map((c) => c.pos[1])).forEach((y, i) => {
    g.dim(X(-W / 2), Y(y), X(-W / 2), Y(0), 64 + i * 34, `camera ${formatLength(y, unit)}`);
  });
  titleBlock(g, ox, oy + H * s + 46, 'Display wall, seen from the room', plan, 'C camera · ■ video bar', opts.bare);
  return {
    id: 'front',
    title: drawingTitles.front,
    width: ox + W * s + SIDE.wall.right,
    height: oy + H * s + bottomSpace(opts),
    scale: s,
    prims: g.prims,
  };
}

export function section(plan: Plan, a: Analysis, opts: DrawingOptions = {}): Drawing {
  const { length: L, height: H, unit } = plan;
  const { layout, displays, gear } = a;
  const s = opts.scale ?? fit(L, H);
  const ox = SIDE.section.left;
  const oy = MARGIN.top - 12;
  const X = (z: number) => ox + (z + L / 2) * s;
  const Y = (y: number) => oy + (H - y) * s;
  const g = sheet();
  g.line(X(-L / 2), Y(H), X(L / 2), Y(H), 'wall');
  g.line(X(-L / 2), Y(0), X(L / 2), Y(0), 'floor');
  g.line(X(-L / 2), Y(H), X(-L / 2), Y(0), 'floor');
  g.line(X(L / 2), Y(H), X(L / 2), Y(0), 'wall');

  // the display, a person at the front, and the furniture
  const top = displays.centerY + displays.height / 2;
  g.rect(X(-L / 2), Y(top), Math.max(6, 0.06 * s), displays.height * s, 'display');
  for (const z of unique(layout.tables.map((t) => t.z))) {
    const t = layout.tables.find((d) => Math.abs(d.z - z) < 0.05);
    if (!t) continue;
    g.rect(X(z - t.length / 2), Y(0.76), t.length * s, 0.04 * s, 'furniture');
    g.line(X(z - t.length / 2 + 0.06), Y(0.72), X(z - t.length / 2 + 0.06), Y(0), 'furniture');
    g.line(X(z + t.length / 2 - 0.06), Y(0.72), X(z + t.length / 2 - 0.06), Y(0), 'furniture');
  }
  for (const z of unique(layout.seats.map((seat) => seat.z))) {
    g.rect(X(z) - 0.2 * s, Y(0.46), 0.4 * s, 0.05 * s, 'chair');
    g.line(X(z), Y(0.46), X(z), Y(0), 'chair');
    g.circle(X(z), Y(rules.earHeight), 0.11 * s, 'person');
    g.line(X(z), Y(rules.earHeight - 0.11), X(z), Y(0.5), 'person');
  }
  if (plan.presenter && plan.roomType !== 'huddle') {
    const at = presenterSpot(plan, displays);
    g.circle(X(at.z), Y(1.62), 0.11 * s, 'person');
    g.line(X(at.z), Y(1.5), X(at.z), Y(0), 'person');
    g.text(X(at.z), Y(1.62) - 0.11 * s - 5, 'P', 'small');
  }

  // ceiling devices: flush in the ceiling, or hung below it on cords
  for (const z of unique(gear.speakers.map((p) => p[2]))) {
    const y = H - gear.speakerDrop;
    if (gear.speakerDrop > 0) g.line(X(z), Y(H), X(z), Y(y), 'ref');
    g.rect(X(z) - 0.1 * s, Y(y), 0.2 * s, Math.max(3, 0.04 * s), 'speaker');
  }
  if (plan.mics === 'ceiling' || plan.mics === 'pendant') {
    const { size, depth } = rules.micArray[plan.micShape];
    for (const p of gear.mics) {
      const y = H - gear.micDrop;
      if (gear.micDrop > 0) g.line(X(p[2]), Y(H), X(p[2]), Y(y), 'ref');
      g.rect(X(p[2]) - (size * s) / 2, Y(y), size * s, Math.max(4, depth * s), 'mic');
    }
  }
  // microphones on the table
  if (plan.mics === 'table' || plan.mics === 'gooseneck')
    for (const z of unique(gear.mics.map((p) => p[2]))) g.rect(X(z) - 0.04 * s, Y(0.86), 0.08 * s, 0.1 * s, 'mic');
  // the bar, and the projector with its screen
  if (gear.bar)
    g.rect(
      X(-L / 2),
      Y(gear.bar.pos[1]) - (gear.bar.height * s) / 2,
      Math.max(8, gear.bar.depth * s),
      gear.bar.height * s,
      'camera',
    );
  const proj = a.displays.projector;
  if (proj) g.rect(X(proj.pos[2]) - 0.2 * s, Y(H), 0.4 * s, 0.14 * s, 'camera');

  // cameras, with the height they can see
  gear.cameras.forEach((cam, i) => {
    const dz = cam.target[2] - cam.pos[2];
    const dy = cam.target[1] - cam.pos[1];
    const reach = Math.min(Math.hypot(dz, dy), 7);
    const a0 = Math.atan2(dy, dz);
    const half = (cam.vfov * Math.PI) / 360;
    const corner = (angle: number): [number, number] => [
      X(Math.min(L / 2, Math.max(-L / 2, cam.pos[2] + Math.cos(angle) * reach))),
      Y(Math.min(H, Math.max(0, cam.pos[1] + Math.sin(angle) * reach))),
    ];
    g.poly([[X(cam.pos[2]), Y(cam.pos[1])], corner(a0 - half), corner(a0 + half)], 'fov');
    g.rect(X(cam.pos[2]) - 0.071 * s, Y(cam.pos[1]) - 0.1 * s, 0.142 * s, 0.2 * s, 'camera', 2);
    g.text(X(cam.pos[2]), Y(cam.pos[1]) - 0.1 * s - 5, `C${i + 1}`, 'small');
  });

  // eye level, then the dimensions
  g.line(X(-L / 2), Y(rules.earHeight), X(L / 2), Y(rules.earHeight), 'ref');
  g.text(
    X(L / 2) - 4,
    Y(rules.earHeight) - 4,
    `seated ear height ${formatLength(rules.earHeight, unit)}`,
    'small',
    'end',
  );
  g.dim(X(L / 2), Y(H), X(L / 2), Y(0), -30, formatLength(H, unit));
  g.dim(X(-L / 2), Y(0), X(L / 2), Y(0), 24, formatLength(L, unit));
  const far = Math.max(...layout.seats.map((seat) => seat.z), -L / 2);
  g.dim(X(-L / 2), Y(0), X(far), Y(0), 52, `farthest seat ${formatLength(displays.farthest, unit)}`);
  g.dim(X(-L / 2), Y(displays.centerY), X(-L / 2), Y(0), 34, `display centre ${formatLength(displays.centerY, unit)}`);
  const wallCams = gear.cameras.filter((c) => c.kind === 'front');
  unique(wallCams.map((c) => c.pos[1])).forEach((y, i) => {
    g.dim(X(-L / 2), Y(y), X(-L / 2), Y(0), 68 + i * 34, `camera ${formatLength(y, unit)}`);
  });
  titleBlock(
    g,
    ox,
    oy + H * s + 100,
    'Section, seen from the side wall',
    plan,
    'C camera · P presenter · ■ video bar · dashed: seated ear height',
    opts.bare,
  );
  return {
    id: 'side',
    title: drawingTitles.side,
    width: ox + L * s + SIDE.section.right,
    height: oy + H * s + bottomSpace(opts) + 62,
    scale: s,
    prims: g.prims,
  };
}

// ---------------------------------------------------------------- cabling and the rack

const runStyle: Record<Cable['kind'], Style> = {
  laptop: 'cable-video',
  display: 'cable-video',
  control: 'cable-control',
};

// A cable run seen from above: the same line, without its height, and without points that repeat.
function flatten(points: Vec3[]): [number, number][] {
  const out: [number, number][] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(last[0] - p[0], last[1] - p[2]) > 0.01) out.push([p[0], p[2]]);
  }
  return out;
}

// The speakers in one run, row by row, left to right and then right to left, ending at the rack ("TO RACK").
function speakerLoop(speakers: Vec3[], rack: [number, number] | null): [number, number][] {
  const rows = unique(
    speakers.map((p) => p[2]),
    0.2,
  );
  const path: [number, number][] = [];
  rows.forEach((z, i) => {
    const row = speakers
      .filter((p) => Math.abs(p[2] - z) < 0.2)
      .sort((p, q) => (i % 2 === 0 ? p[0] - q[0] : q[0] - p[0]));
    for (const p of row) path.push([p[0], p[2]]);
  });
  if (rack && path.length) {
    const last = path[path.length - 1];
    path.push([last[0], rack[1]], rack);
  }
  return path;
}

const draw = (g: Sheet, pts: [number, number][], X: (x: number) => number, Y: (z: number) => number, s: Style) => {
  for (let i = 1; i < pts.length; i++) g.line(X(pts[i - 1][0]), Y(pts[i - 1][1]), X(pts[i][0]), Y(pts[i][1]), s);
};

// The footprint of the rack or the cabinet on the plan, whichever way it faces.
function footprint(rot: number, width: number, depth: number) {
  const sideways = Math.abs(Math.sin(rot)) > 0.5;
  return sideways ? { w: depth, h: width } : { w: width, h: depth };
}

// How far the rack stands outside the room, in metres on each side, so the drawing leaves room for it.
function rackOutside(plan: Plan, a: Analysis) {
  const rack = a.gear.rack;
  const out = { left: 0, right: 0, top: 0, bottom: 0 };
  if (!rack || !rack.outside) return out;
  const f = footprint(rack.rot, rack.width, rack.depth);
  out.left = Math.max(0, -plan.width / 2 - (rack.pos[0] - f.w / 2) + 0.3);
  out.right = Math.max(0, rack.pos[0] + f.w / 2 - plan.width / 2 + 0.3);
  out.top = Math.max(0, -plan.length / 2 - (rack.pos[2] - f.h / 2) + 0.3);
  out.bottom = Math.max(0, rack.pos[2] + f.h / 2 - plan.length / 2 + 0.3);
  return out;
}

// What the plans show of the equipment: the rack ("AVR"), outside the room too, and the cabinet for the microphones.
function equipmentOnPlan(
  g: Sheet,
  plan: Plan,
  a: Analysis,
  X: (x: number) => number,
  Y: (z: number) => number,
  s: number,
) {
  const { rack, credenza } = a.gear;
  if (rack && rack.mode !== 'behind') {
    const f = footprint(rack.rot, rack.width, rack.depth);
    const cx = X(rack.pos[0]);
    const cy = Y(rack.pos[2]);
    g.rect(cx - (f.w * s) / 2, cy - (f.h * s) / 2, f.w * s, f.h * s, 'rack');
    g.text(cx, cy + 3.5, 'AVR', 'small');
    if (rack.outside) g.text(cx, cy - (f.h * s) / 2 - 5, 'AV rack, location TBD', 'small');
  }
  if (credenza) {
    const c = rules.credenza;
    const f = footprint(credenza.rot, c.width, c.depth);
    const cx = X(credenza.pos[0]);
    const cy = Y(credenza.pos[2]);
    g.rect(cx - (f.w * s) / 2, cy - (f.h * s) / 2, f.w * s, f.h * s, 'device');
    g.text(cx, cy + 3.5, 'WM', 'small');
  }
}

// The cabling plan, "AV infrastructure floor plan": where each cable runs from the devices to the rack or the display.
export function cablingPlan(plan: Plan, a: Analysis, opts: DrawingOptions = {}): Drawing {
  const { gear } = a;
  const { length: L } = plan;
  const { g, s, ox, oy, X, Y, width, height } = planBase(plan, a, 'cabling', opts);
  const rack = gear.rack;
  const home: [number, number] = rack && rack.mode !== 'behind' ? [rack.pos[0], rack.pos[2]] : [0, -L / 2 + 0.06];

  // laptop and control cables, from the table to the equipment, and the feed from the rack to the display
  for (const c of gear.cables) {
    const pts = flatten(c.points);
    draw(g, pts, X, Y, runStyle[c.kind]);
  }
  // speakers: one loop through the ceiling, ending at the rack
  if (gear.speakers.length) {
    draw(g, speakerLoop(gear.speakers, home), X, Y, 'cable-audio');
    const r = Math.max(4, 0.09 * s);
    for (const p of gear.speakers) {
      g.circle(X(p[0]), Y(p[2]), r, 'speaker');
      g.text(X(p[0]), Y(p[2]) + 3, 'CS', 'small');
    }
  }
  for (const p of gear.wallSpeakers) {
    g.rect(X(p[0]) - 0.05 * s, Y(p[2]) - 0.05 * s, 0.1 * s, 0.1 * s, 'speaker');
    draw(g, [[p[0], p[2]], [p[0], home[1] < -L / 2 + 0.2 ? home[1] : -L / 2 + 0.06], home], X, Y, 'cable-audio');
  }
  // network devices (PTZ cameras, ceiling microphones, the wireless gateway) run a network cable to the switch
  const networked: [number, number][] = [
    ...gear.cameras
      .filter((c) => c.kind !== 'bar' && c.kind !== 'table')
      .map((c): [number, number] => [c.pos[0], c.pos[2]]),
    ...(plan.mics === 'ceiling' || plan.mics === 'pendant' ? gear.mics.map((m): [number, number] => [m[0], m[2]]) : []),
  ];
  for (const [x, z] of networked) draw(g, [[x, z], [x, home[1]], home], X, Y, 'cable-net');
  if (plan.mics === 'ceiling' || plan.mics === 'pendant')
    for (const m of gear.mics) g.circle(X(m[0]), Y(m[2]), 3, 'mic');
  equipmentOnPlan(g, plan, a, X, Y, s);
  if (rack?.mode === 'behind') {
    g.rect(X(-0.25), Y(-L / 2) - 4, 0.5 * s, 8, 'rackfree');
    g.text(X(0), Y(-L / 2) - 8, 'equipment behind the display', 'small');
  }
  g.text(ox, oy - 48, 'PROVIDE PULL STRING IN ALL CONDUIT', 'small', 'start');
  titleBlock(
    g,
    ox,
    oy + L * s + 50,
    'Cabling plan',
    plan,
    'blue: HDMI and USB-C, green: speaker cable, amber: control, dotted: network (PoE) · AVR rack · WM microphone cabinet · CS ceiling speaker',
    opts.bare,
  );
  return { id: 'cabling', title: drawingTitles.cabling, width, height, scale: s, prims: g.prims };
}

// The AV system rack elevation: the units from the top down, by function and not by brand, with room kept free for
// the client's laptop. A rack behind the display also shows the wall, with the box drawn dashed behind the display.
export function rackElevation(plan: Plan, a: Analysis, opts: DrawingOptions = {}): Drawing {
  const rack = a.gear.rack;
  const g = sheet();
  const unitPx = 24;
  const ox = 84;
  const oy = 64;
  const rw = 330;
  const rows = rack ? rackLayout(rack) : [];
  const u = rack ? (rows[0]?.top ?? rack.u) : 6;
  const h = u * unitPx;
  const behind = rack?.mode === 'behind';
  const width = ox + rw + 110 + (behind ? 330 : 0);
  const height = oy + h + 110;
  if (!rack) {
    g.text(ox, oy + 20, 'No rack: the devices stand where they are used.', 'label', 'start');
    titleBlock(g, ox, oy + 60, 'Rack elevation', plan, 'SCALE: NTS', opts.bare);
    return { id: 'rack', title: drawingTitles.rack, width, height: oy + 150, scale: unitPx, prims: g.prims };
  }
  g.rect(ox - 14, oy - 14, rw + 28, h + 28, 'wall');
  for (let i = 1; i <= u; i++) g.text(ox - 22, oy + h - (i - 0.5) * unitPx + 3.5, String(i), 'small', 'end');
  let y = oy;
  for (const { item, label } of rows) {
    const hh = item.u * unitPx;
    g.rect(ox, y, rw, hh, item.kind === 'laptop' ? 'rackfree' : (`rack-${item.kind}` as Style));
    g.text(ox + 10, y + hh / 2 + 3.5, item.name, 'label', 'start');
    if (label) g.text(ox + rw + 22, y + hh / 2 + 3.5, label, 'small', 'start');
    y += hh;
  }
  g.dim(ox + rw + 78, oy, ox + rw + 78, oy + h, -8, `${u} U`);

  if (behind) {
    // the wall: the display, and the box behind it
    const wx = ox + rw + 110;
    const wy = oy;
    const k = 100; // pixels per metre of the little wall
    const d = a.displays;
    g.rect(wx, wy, 2.4 * k, 1.5 * k, 'wall');
    const dw = Math.min(d.width, 2.2) * k * 0.9;
    const dh = Math.min(d.height, 1.2) * k * 0.9;
    g.rect(wx + 1.2 * k - dw / 2, wy + 0.18 * k, dw, dh, 'display');
    g.text(wx + 1.2 * k, wy + 0.18 * k + dh / 2 + 4, `${d.size}"`, 'ondark');
    g.rect(wx + 1.2 * k - 0.25 * k, wy + 0.18 * k + dh / 2 - 0.16 * k, 0.5 * k, 0.32 * k, 'rackfree');
    g.text(wx + 1.2 * k, wy + 1.5 * k + 18, 'Equipment box on the wall behind the display', 'small');
    g.text(wx + 1.2 * k, wy + 1.5 * k + 30, '(500 × 320 mm, dashed)', 'small');
  }
  const where = behind
    ? 'Equipment box on the wall behind the display'
    : rack.outside
      ? 'Rack outside the room, location to be confirmed'
      : `Rack in the room, against the ${rack.wall ?? 'front'} wall`;
  titleBlock(g, ox - 14, oy + h + 52, 'AV system rack elevation', plan, `SCALE: NTS · ${where}`, opts.bare);
  return { id: 'rack', title: drawingTitles.rack, width, height, scale: unitPx, prims: g.prims };
}

// ---------------------------------------------------------------- the device schedule

// Columns of the schedule, in pixels, and how many characters of the two text sizes fit in each.
const COLUMNS = [
  { key: 'tag', title: 'TAG', w: 54 },
  { key: 'name', title: 'DEVICE', w: 236 },
  { key: 'qty', title: 'QTY', w: 34 },
  { key: 'where', title: 'LOCATION', w: 158 },
  { key: 'mount', title: 'MOUNTING', w: 118 },
] as const;
const charsIn = (w: number, size: 'label' | 'small') => Math.floor((w - 12) / (size === 'label' ? 5.4 : 4.7));

// Breaks a text into lines of at most `max` characters, at the spaces.
export function wrapText(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  lines.push(line);
  return lines;
}

// The device schedule as a table: tag, device, quantity, location and mounting height, in groups.
export function scheduleDrawing(plan: Plan, a: Analysis, opts: DrawingOptions = {}): Drawing {
  const g = sheet();
  const ox = 16;
  const oy = 20;
  const tableW = COLUMNS.reduce((sum, c) => sum + c.w, 0);
  const edges = COLUMNS.reduce<number[]>((xs, c) => [...xs, xs[xs.length - 1] + c.w], [ox]);
  let y = oy;

  const head = 22;
  g.rect(ox, y, tableW, head, 'head');
  COLUMNS.forEach((c, i) =>
    g.text(
      c.key === 'qty' ? edges[i] + c.w / 2 : edges[i] + 6,
      y + 15,
      c.title,
      'ondark',
      c.key === 'qty' ? 'middle' : 'start',
    ),
  );
  y += head;
  // the rows of devices, whose cells the column lines run through; a group title has the whole width
  const spans: [number, number][] = [];

  for (const group of deviceSchedule(plan, a)) {
    g.rect(ox, y, tableW, 20, 'group');
    g.text(ox + 6, y + 14, group.title, 'label', 'start');
    y += 20;
    for (const row of group.rows) {
      const top = y;
      const cells = {
        tag: wrapText(row.tag, charsIn(COLUMNS[0].w, 'label')),
        name: wrapText(row.name, charsIn(COLUMNS[1].w, 'label')),
        qty: [String(row.qty)],
        where: wrapText(row.where, charsIn(COLUMNS[3].w, 'small')),
        mount: wrapText(row.mount || '-', charsIn(COLUMNS[4].w, 'small')),
      };
      const lines = Math.max(...Object.values(cells).map((c) => c.length));
      const height = lines * 12 + 8;
      COLUMNS.forEach((c, i) => {
        const style = c.key === 'where' || c.key === 'mount' ? 'small' : 'label';
        cells[c.key].forEach((t, k) =>
          g.text(
            c.key === 'qty' ? edges[i] + c.w / 2 : edges[i] + 6,
            y + 14 + k * 12,
            t,
            style,
            c.key === 'qty' ? 'middle' : 'start',
          ),
        );
      });
      y += height;
      spans.push([top, y]);
      g.line(ox, y, ox + tableW, y, 'table');
    }
  }
  for (const x of edges.slice(1, -1)) for (const [top, bottom] of spans) g.line(x, top, x, bottom, 'table');
  g.rect(ox, oy, tableW, y - oy, 'table');

  titleBlock(
    g,
    ox,
    y + 34,
    'Device schedule',
    plan,
    'AFF: above finished floor · U: rack unit · tags match the drawings: C camera, CS ceiling speaker, MIC microphone, WM microphone cabinet, AVR rack',
    opts.bare,
  );
  return {
    id: 'schedule',
    title: drawingTitles.schedule,
    width: ox * 2 + tableW,
    height: y + 34 + (opts.bare ? 14 : 29) + 3 * 12 + 14,
    scale: 1,
    prims: g.prims,
  };
}

// The four drawings of the first printed sheet, then the cabling plan, the rack elevation and the device schedule.
export function buildAllDrawings(plan: Plan, a: Analysis, opts: DrawingOptions = {}): Drawing[] {
  return [
    ...buildDrawings(plan, a, opts),
    cablingPlan(plan, a, opts),
    rackElevation(plan, a, opts),
    scheduleDrawing(plan, a, opts),
  ];
}

export function buildDrawings(plan: Plan, a: Analysis, opts: DrawingOptions = {}): Drawing[] {
  return [floorPlan(plan, a, opts), ceilingPlan(plan, a, opts), displayWall(plan, a, opts), section(plan, a, opts)];
}
