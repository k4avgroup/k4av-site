// Room planner model: everything that can be worked out without a browser.
// All lengths are in metres; the UI converts to feet. The room spans x in [-width/2, width/2], z in
// [-length/2, length/2] and y from 0 to height. The display wall (the "front") is at z = -length/2, the table's
// long side runs along z, and the audience faces -z.
//
// The numbers in `rules` are starting values for a pilot, taken from common AV rules of thumb. They are meant to be
// tuned by someone who commissions these rooms; the planner is an indicative sketch, not an engineering drawing.

export type Unit = 'm' | 'ft';
export type TableShape = 'rect' | 'boat' | 'round' | 'u';
export type TablePosition = 'center' | 'back' | 'front';
export type Speakers = 'none' | 'soundbar' | 'front' | 'ceiling';
export type Mics = 'none' | 'integrated' | 'table' | 'ceiling';
export type Cameras = 'none' | 'one' | 'two' | 'three';
export type CameraSpot = 'above' | 'below';
export type MicShape = 'square' | 'round';
export type Control = 'none' | 'table' | 'wall';
export type RoomSystem = 'byod' | 'teams' | 'zoom' | 'webex' | 'meet';
export type Preset = 'essential' | 'standard' | 'premium';
export type RoomType = 'huddle' | 'conference' | 'boardroom' | 'training';
export type Vec3 = [number, number, number];

export type Plan = {
  roomType: RoomType;
  unit: Unit;
  length: number;
  width: number;
  height: number;
  ceiling: boolean;
  shape: TableShape;
  seats: number;
  position: TablePosition;
  endChairs: boolean;
  presenter: boolean;
  presenterX: number | null; // where the presenter was dragged to; null means beside the display
  presenterZ: number | null;
  displays: 1 | 2;
  displaySize: number | null;
  readability: number;
  speakers: Speakers;
  speakerCones: boolean;
  listeningPlane: boolean;
  mics: Mics;
  micShape: MicShape; // ceiling microphone arrays come square or round
  micCoverage: boolean;
  cameras: Cameras;
  cameraSpot: CameraSpot; // a single camera sits above or below the display
  cameraView: boolean;
  tablePanels: boolean;
  control: Control;
  system: RoomSystem;
};

export const limits = {
  height: [2.3, 5],
} as const;

// What differs between the kinds of room: how many people, how big, how much space around the furniture, and which
// tables make sense. The order here is the order of the buttons.
type RoomKind = {
  label: string;
  noun: string; // "Huddle room", "Boardroom"
  about: string;
  seats: readonly [number, number];
  length: readonly [number, number];
  width: readonly [number, number];
  front: number; // display wall to the table
  back: number;
  aisle: number; // space beside the table
  shapes: readonly TableShape[];
};

export const roomTypes: Record<RoomType, RoomKind> = {
  huddle: {
    label: 'Huddle',
    noun: 'Huddle room',
    about: 'A small room for 2 to 6 people, usually one screen and an all-in-one video bar.',
    seats: [2, 6],
    length: [2.5, 5.5],
    width: [2.5, 5.5],
    front: 1.0,
    back: 0.8,
    aisle: 0.8,
    shapes: ['rect', 'round'],
  },
  conference: {
    label: 'Conference',
    noun: 'Conference room',
    about: 'A meeting room built around one table, for 2 to 24 people.',
    seats: [2, 24],
    length: [2.5, 12],
    width: [2.5, 12],
    front: 1.4,
    back: 1.0,
    aisle: 0.95,
    shapes: ['rect', 'boat', 'round', 'u'],
  },
  boardroom: {
    label: 'Boardroom',
    noun: 'Boardroom',
    about: 'A formal room around one large table for 8 to 20 people, usually with two displays and ceiling audio.',
    seats: [8, 20],
    length: [6, 12],
    width: [4.5, 12],
    front: 1.8,
    back: 1.2,
    aisle: 1.1,
    shapes: ['boat', 'rect', 'u', 'round'],
  },
  training: {
    label: 'Training',
    noun: 'Training room',
    about: 'A classroom with rows of desks facing the display and a presenter at the front, for 4 to 40 people.',
    seats: [4, 40],
    length: [4, 12],
    width: [4, 12],
    front: 2.2, // display wall to the first row: room for the presenter
    back: 0.9,
    aisle: 0.8,
    shapes: ['rect'],
  },
};

// The four tables met most often in meeting rooms, and how many seats each suits.
export const tableShapes: Record<TableShape, { label: string; about: string }> = {
  rect: { label: 'Rectangular', about: 'The classic table, with a head and a foot.' },
  boat: { label: 'Boat-shaped', about: 'Long with rounded ends, so everyone can see each other.' },
  round: { label: 'Round', about: 'Equal seats for a small group.' },
  u: { label: 'U-shaped', about: 'Open towards the display; people sit around the outside.' },
};

export function seatLimits(type: RoomType, shape: TableShape): [number, number] {
  const [lo, hi] = roomTypes[type].seats;
  if (shape === 'round') return [Math.max(3, lo), Math.min(14, hi)];
  if (shape === 'boat') return [Math.max(4, lo), Math.min(20, hi)];
  if (shape === 'u') return [Math.max(6, lo), hi];
  return [lo, hi];
}

export const limitsFor = (type: RoomType) => ({ ...roomTypes[type], height: limits.height });

// Classroom furniture: a desk seats two, rows are a little over a metre apart.
const desk = { width: 1.8, depth: 0.6, gap: 0.1, rowPitch: 1.3, chairBehind: 0.35 };

export const rules = {
  seatPitch: 0.7, // metres of table edge per person
  chairOffset: 0.42, // table edge to chair centre
  earHeight: 1.2, // seated head height: the "listening plane"
  displayCenterHeight: 1.5,
  displayBottomMin: 0.9,
  sizes: [43, 50, 55, 65, 75, 86, 98],
  viewFactorLow: 8, // farthest viewer sits at 8 screen heights when small text does not matter
  viewFactorHigh: 4, // ... and at 4 heights when it does
  speakerHalfAngle: 45, // degrees
  ceilingMicHalfAngle: 55,
  micArrayEvery: 4.8, // metres of table per ceiling microphone array
  tableMicEvery: 3, // seats per table microphone
  panelEvery: 2.4, // metres of table per connection panel
  displayBottomOverCamera: 1.4, // a camera under the display sits near seated eye level (1.2 m)
  // Ceiling arrays, sized like the Shure MXA920 (spec sheet): square 603.8 mm, round 635.4 mm, 55 to 61 mm deep.
  micArray: {
    square: { size: 0.604, depth: 0.055 },
    round: { size: 0.635, depth: 0.061 },
  },
} as const;

export const defaultPlan: Plan = {
  roomType: 'conference',
  unit: 'm',
  length: 8,
  width: 6,
  height: 3,
  ceiling: true,
  shape: 'rect',
  seats: 8,
  position: 'center',
  endChairs: false,
  presenter: false,
  presenterX: null,
  presenterZ: null,
  displays: 1,
  displaySize: null,
  readability: 0.5,
  speakers: 'front',
  speakerCones: false,
  listeningPlane: false,
  mics: 'ceiling',
  micShape: 'square',
  micCoverage: false,
  cameras: 'one',
  cameraSpot: 'above',
  cameraView: false,
  tablePanels: true,
  control: 'table',
  system: 'teams',
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const FT = 3.28084;
export const toUnit = (m: number, unit: Unit) => (unit === 'ft' ? m * FT : m);
export const fromUnit = (v: number, unit: Unit) => (unit === 'ft' ? v / FT : v);
export const formatLength = (m: number, unit: Unit) => (unit === 'ft' ? `${round1(m * FT)} ft` : `${round1(m)} m`);

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
const num = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const spot = (v: unknown, lo: number, hi: number) =>
  typeof v === 'number' && Number.isFinite(v) ? round2(clamp(v, lo, hi)) : null;

// How far a presenter can walk: not through the walls, and not into the display wall.
export const presenterRange = (width: number, length: number) => ({
  x: [-width / 2 + 0.3, width / 2 - 0.3] as const,
  z: [-length / 2 + 0.4, length / 2 - 0.3] as const,
});

// A standing presenter cannot be on the table or in the chairs around it: this pushes them to the nearest free floor.
export function keepClear(plan: Plan, layout: Layout, x: number, z: number) {
  const range = presenterRange(plan.width, plan.length);
  const px = clamp(x, ...range.x);
  const pz = clamp(z, ...range.z);
  const inside = (o: Obstacle, a: number, b: number) =>
    o.k === 'rect' ? a > o.x0 && a < o.x1 && b > o.z0 && b < o.z1 : Math.hypot(a - o.x, b - o.z) < o.r;
  const blocked = (a: number, b: number) => layout.keepOut.some((o) => inside(o, a, b));
  const free = (a: number, b: number) =>
    a >= range.x[0] && a <= range.x[1] && b >= range.z[0] && b <= range.z[1] && !blocked(a, b);
  const hit = layout.keepOut.find((o) => inside(o, px, pz));
  if (!hit) return { x: round2(px), z: round2(pz) };
  const gap = 0.01; // step clear of the edge, so rounding cannot put the presenter back inside
  let options: [number, number][];
  if (hit.k === 'circle') {
    const d = Math.hypot(px - hit.x, pz - hit.z);
    const ux = d === 0 ? 0 : (px - hit.x) / d;
    const uz = d === 0 ? -1 : (pz - hit.z) / d;
    options = [[hit.x + ux * (hit.r + gap), hit.z + uz * (hit.r + gap)]];
  } else {
    options = [
      [hit.x0 - gap, pz],
      [hit.x1 + gap, pz],
      [px, hit.z0 - gap],
      [px, hit.z1 + gap],
    ];
  }
  const best = options
    .filter(([a, b]) => free(a, b))
    .sort((m, n) => Math.hypot(m[0] - px, m[1] - pz) - Math.hypot(n[0] - px, n[1] - pz))[0];
  return best ? { x: round2(best[0]), z: round2(best[1]) } : { x: round2(px), z: round2(pz) };
}

// Where the presenter stands: the dragged spot, or beside the display until they are moved.
export function presenterSpot(plan: Plan, displays: { count: 1 | 2; width: number }) {
  const range = presenterRange(plan.width, plan.length);
  const beside = displays.count === 2 ? -(displays.width + 0.4) : -(displays.width / 2 + 0.7);
  return keepClear(
    plan,
    computeLayout(plan),
    plan.presenterX ?? clamp(beside, ...range.x),
    plan.presenterZ ?? range.z[0] + 0.6,
  );
}

// A starting point for each kind of room. Choosing a room type applies it.
export const templates = {
  huddle: {
    length: 4,
    width: 3.5,
    height: 2.7,
    seats: 4,
    shape: 'rect',
    position: 'center',
    endChairs: false,
    presenter: false,
    displays: 1,
    speakers: 'soundbar',
    mics: 'integrated',
    cameras: 'one',
    tablePanels: true,
    control: 'none',
  },
  conference: {
    length: 8,
    width: 6,
    height: 3,
    seats: 8,
    shape: 'rect',
    position: 'center',
    endChairs: false,
    presenter: false,
    displays: 1,
    speakers: 'front',
    mics: 'ceiling',
    cameras: 'one',
    tablePanels: true,
    control: 'table',
  },
  boardroom: {
    length: 10,
    width: 7,
    height: 3,
    seats: 14,
    shape: 'boat',
    position: 'center',
    endChairs: false,
    presenter: false,
    displays: 2,
    speakers: 'ceiling',
    mics: 'ceiling',
    cameras: 'two',
    tablePanels: true,
    control: 'table',
  },
  training: {
    length: 10,
    width: 8,
    height: 3,
    seats: 24,
    shape: 'rect',
    position: 'center',
    endChairs: false,
    presenter: true,
    displays: 1,
    speakers: 'front',
    mics: 'ceiling',
    cameras: 'two',
    tablePanels: false,
    control: 'wall',
  },
} as const satisfies Record<RoomType, Partial<Plan>>;

const numIn = (v: unknown, range: readonly [number, number], fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? clamp(v, range[0], range[1]) : clamp(fallback, range[0], range[1]);

// Clamps and repairs a plan, so anything that arrives from the address bar is safe to use.
export function normalizePlan(input: Partial<Record<keyof Plan, unknown>> = {}): Plan {
  const d = defaultPlan;
  const roomType = oneOf(input.roomType, ['huddle', 'conference', 'boardroom', 'training'] as const, d.roomType);
  const kind = roomTypes[roomType];
  const huddle = roomType === 'huddle';
  const training = roomType === 'training';
  const wanted = oneOf(input.shape, ['rect', 'boat', 'round', 'u'] as const, templates[roomType].shape);
  const shape: TableShape = kind.shapes.includes(wanted) ? wanted : templates[roomType].shape;
  const seats = Math.round(numIn(input.seats, seatLimits(roomType, shape), templates[roomType].seats));
  const length = round2(numIn(input.length, kind.length, templates[roomType].length));
  const width = round2(numIn(input.width, kind.width, templates[roomType].width));
  const cameras = oneOf(
    input.cameras === 'four' ? 'three' : input.cameras,
    ['none', 'one', 'two', 'three'] as const,
    d.cameras,
  );
  const mics = oneOf(input.mics, ['none', 'integrated', 'table', 'ceiling'] as const, d.mics);
  const control = oneOf(input.control, ['none', 'table', 'wall'] as const, d.control);
  return {
    roomType,
    unit: oneOf(input.unit, ['m', 'ft'] as const, d.unit),
    length,
    width,
    height: round2(num(input.height, limits.height[0], limits.height[1], d.height)),
    ceiling: bool(input.ceiling, d.ceiling),
    shape,
    seats,
    position: training ? 'center' : oneOf(input.position, ['center', 'back', 'front'] as const, d.position),
    endChairs:
      (roomType === 'conference' || roomType === 'boardroom') && (shape === 'rect' || shape === 'boat')
        ? bool(input.endChairs, d.endChairs)
        : false,
    presenter: huddle ? false : bool(input.presenter, d.presenter),
    presenterX: spot(input.presenterX, ...presenterRange(width, length).x),
    presenterZ: spot(input.presenterZ, ...presenterRange(width, length).z),
    displays: huddle ? 1 : input.displays === 2 ? 2 : 1,
    displaySize:
      typeof input.displaySize === 'number' && (rules.sizes as readonly number[]).includes(input.displaySize)
        ? input.displaySize
        : null,
    readability: round2(num(input.readability, 0, 1, d.readability)),
    speakers: oneOf(input.speakers, ['none', 'soundbar', 'front', 'ceiling'] as const, d.speakers),
    speakerCones: bool(input.speakerCones, d.speakerCones),
    listeningPlane: bool(input.listeningPlane, d.listeningPlane),
    mics: training && mics === 'table' ? 'ceiling' : mics,
    micShape: oneOf(input.micShape, ['square', 'round'] as const, d.micShape),
    micCoverage: bool(input.micCoverage, d.micCoverage),
    cameras: huddle && cameras === 'three' ? 'two' : cameras,
    cameraSpot: oneOf(input.cameraSpot, ['above', 'below'] as const, d.cameraSpot),
    cameraView: bool(input.cameraView, d.cameraView),
    tablePanels: training ? false : bool(input.tablePanels, d.tablePanels),
    control: training && control === 'table' ? 'wall' : control,
    system: oneOf(input.system, ['byod', 'teams', 'zoom', 'webex', 'meet'] as const, d.system),
  };
}

// Switches to another kind of room: its size, furniture and equipment start from that room's template.
export function applyRoomType(plan: Plan, type: RoomType): Plan {
  return normalizePlan({
    ...plan,
    ...templates[type],
    roomType: type,
    displaySize: null,
    presenterX: null,
    presenterZ: null,
    cameraSpot: 'above',
    speakerCones: false,
    micCoverage: false,
    cameraView: false,
    listeningPlane: false,
  });
}
// ---------------------------------------------------------------- table, chairs and where they stand

export type Seat = { x: number; z: number; rot: number };
export type TableBlock = { shape: TableShape; x: number; z: number; length: number; width: number };
// Where a standing person cannot be: on the furniture or in the chairs around it.
export type Obstacle =
  { k: 'rect'; x0: number; x1: number; z0: number; z1: number } | { k: 'circle'; x: number; z: number; r: number };
export type Layout = {
  table: TableBlock; // the table, or the block that holds a U of tables or every desk of a classroom
  tables: TableBlock[]; // the pieces that are drawn: one table, the three parts of a U, or a desk each
  seats: Seat[];
  endChairs: boolean;
  fits: boolean;
  rows: { count: number; perRow: number; desks: number } | null; // classrooms only
  path: [number, number][]; // a line along the tabletop, where table microphones and connection panels go
  touchSpot: [number, number]; // where a touch panel sits on the table
  keepOut: Obstacle[];
};

const reach = rules.chairOffset + 0.33; // table edge to the back of a chair

const pathLength = (path: [number, number][]) =>
  path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - path[i][0], p[1] - path[i][1]), 0);

// `n` points spread evenly along a path, each in the middle of its share of it.
export function alongPath(path: [number, number][], n: number): [number, number][] {
  const out: [number, number][] = [];
  const total = pathLength(path);
  for (let i = 0; i < n; i++) {
    let want = ((i + 0.5) / n) * total;
    for (let k = 1; k < path.length; k++) {
      const seg = Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
      if (want <= seg || k === path.length - 1) {
        const t = seg === 0 ? 0 : Math.min(1, want / seg);
        out.push([
          round2(path[k - 1][0] + (path[k][0] - path[k - 1][0]) * t),
          round2(path[k - 1][1] + (path[k][1] - path[k - 1][1]) * t),
        ]);
        break;
      }
      want -= seg;
    }
  }
  return out;
}

const lengthwise = (t: TableBlock): [number, number][] => [
  [t.x, round2(t.z - t.length / 2)],
  [t.x, round2(t.z + t.length / 2)],
];
const around = (t: TableBlock, ends: boolean): Obstacle => ({
  k: 'rect',
  x0: t.x - t.width / 2 - reach,
  x1: t.x + t.width / 2 + reach,
  z0: t.z - t.length / 2 - (ends ? reach : 0.35),
  z1: t.z + t.length / 2 + (ends ? reach : 0.35),
});

// A U of tables: two arms and a base, open towards the display. People sit around the outside.
function uDims(seats: number) {
  const back = Math.max(2, Math.ceil(seats / 3));
  const arms = seats - back;
  const left = Math.ceil(arms / 2);
  const right = Math.floor(arms / 2);
  const depth = 0.9;
  const width = round2(Math.max(3.0, back * rules.seatPitch + 0.2));
  const arm = round2(Math.max(1.4, left * rules.seatPitch + 0.2));
  return { back, left, right, depth, width, arm, length: round2(arm + depth) };
}

export function tableSize(shape: TableShape, seats: number, endChairs: boolean, small = false) {
  if (shape === 'round') {
    const d = round2(Math.max(small ? 1.0 : 1.2, (seats * rules.seatPitch) / Math.PI));
    return { length: d, width: d };
  }
  if (shape === 'u') {
    const u = uDims(seats);
    return { length: u.length, width: u.width };
  }
  const regular = Math.max(1, seats - (endChairs ? 2 : 0));
  const perSide = Math.ceil(regular / 2);
  const width = small ? 1.0 : seats <= 8 ? 1.2 : seats <= 14 ? 1.4 : 1.6;
  if (shape === 'boat') {
    const bulge = round2(width + 0.2);
    return { length: round2(Math.max(2.2, perSide * rules.seatPitch + 0.2 + bulge)), width: bulge };
  }
  return { length: round2(Math.max(small ? 1.2 : 1.4, perSide * rules.seatPitch + 0.2)), width };
}

const facing = (dx: number, dz: number) => Math.atan2(dx, dz);

// Rows of two-seat desks facing the display, centred, with the front row clear of the presenter.
function classroomLayout(plan: Plan): Layout {
  const { length: L, width: W } = plan;
  const kind = roomTypes.training;
  const perDeskRow = Math.max(1, Math.floor((W - 2 * kind.aisle + desk.gap) / (desk.width + desk.gap)));
  const count = Math.max(1, Math.ceil(plan.seats / (perDeskRow * 2)));
  const perRow = Math.ceil(plan.seats / count);
  const tables: TableBlock[] = [];
  const seats: Seat[] = [];
  const z0 = -L / 2 + kind.front + desk.depth / 2;
  let left = plan.seats;
  for (let r = 0; r < count; r++) {
    const n = Math.min(left, perRow);
    left -= n;
    const desks = Math.ceil(n / 2);
    const rowWidth = desks * desk.width + (desks - 1) * desk.gap;
    const z = z0 + r * desk.rowPitch;
    for (let k = 0; k < desks; k++) {
      const x = -rowWidth / 2 + desk.width / 2 + k * (desk.width + desk.gap);
      tables.push({ shape: 'rect', x: round2(x), z: round2(z), length: desk.depth, width: desk.width });
      const offsets = n - 2 * k >= 2 ? [-0.45, 0.45] : [0];
      for (const o of offsets) {
        seats.push({ x: round2(x + o), z: round2(z + desk.depth / 2 + desk.chairBehind), rot: Math.PI });
      }
    }
  }
  const minX = Math.min(...tables.map((t) => t.x - t.width / 2));
  const maxX = Math.max(...tables.map((t) => t.x + t.width / 2));
  const minZ = Math.min(...tables.map((t) => t.z - t.length / 2));
  const maxZ = Math.max(...tables.map((t) => t.z + t.length / 2));
  const lastChair = Math.max(...seats.map((s) => s.z)) + 0.25;
  const table: TableBlock = {
    shape: 'rect',
    x: round2((minX + maxX) / 2),
    z: round2((minZ + maxZ) / 2),
    length: round2(maxZ - minZ),
    width: round2(maxX - minX),
  };
  return {
    table,
    tables,
    seats,
    endChairs: true,
    fits: lastChair <= L / 2 - 0.6 && maxX - minX <= W - 1.2,
    rows: { count, perRow, desks: tables.length },
    path: lengthwise(table),
    touchSpot: [0.35, round2(table.z - table.length / 2 + 0.4)],
    keepOut: [around(table, true)],
  };
}

function uLayout(plan: Plan): Layout {
  const { length: L, width: W } = plan;
  const kind = roomTypes[plan.roomType];
  const u = uDims(plan.seats);
  const zMin = -L / 2 + kind.front + u.length / 2;
  const zMax = L / 2 - kind.back - 0.5 - u.length / 2; // chairs stand behind the base
  const fitsLength = zMin <= zMax;
  const fits = fitsLength && u.width + 2 * kind.aisle <= W;
  let tz = 0;
  if (fitsLength) tz = plan.position === 'front' ? zMin : plan.position === 'back' ? zMax : clamp(0, zMin, zMax);
  const zFront = tz - u.length / 2;
  const zBase = tz + u.length / 2 - u.depth / 2;
  const armX = u.width / 2 - u.depth / 2;
  const armZ = round2(zFront + u.arm / 2);
  const tables: TableBlock[] = [
    { shape: 'rect', x: round2(-armX), z: armZ, length: u.arm, width: u.depth },
    { shape: 'rect', x: round2(armX), z: armZ, length: u.arm, width: u.depth },
    { shape: 'rect', x: 0, z: round2(zBase), length: u.depth, width: u.width },
  ];
  const seats: Seat[] = [];
  const along = (count: number, x: number, rot: number) => {
    for (let i = 0; i < count; i++) {
      seats.push({ x: round2(x), z: round2(zFront + ((i + 0.5) * u.arm) / count), rot });
    }
  };
  along(u.left, -(u.width / 2 + rules.chairOffset), facing(1, 0));
  along(u.right, u.width / 2 + rules.chairOffset, facing(-1, 0));
  const usable = u.width - 0.7;
  for (let i = 0; i < u.back; i++) {
    seats.push({
      x: round2(-usable / 2 + ((i + 0.5) * usable) / u.back),
      z: round2(zBase + u.depth / 2 + rules.chairOffset),
      rot: facing(0, -1),
    });
  }
  const outer = u.width / 2 + reach;
  const inner = u.width / 2 - u.depth - 0.3;
  return {
    table: { shape: 'u', x: 0, z: round2(tz), length: u.length, width: u.width },
    tables,
    seats,
    endChairs: true,
    fits,
    rows: null,
    path: [
      [round2(-armX), round2(zFront + 0.2)],
      [round2(-armX), round2(zBase)],
      [round2(armX), round2(zBase)],
      [round2(armX), round2(zFront + 0.2)],
    ],
    touchSpot: [0.35, round2(zBase - 0.1)],
    keepOut: [
      { k: 'rect', x0: -outer, x1: -inner, z0: zFront - 0.35, z1: zBase },
      { k: 'rect', x0: inner, x1: outer, z0: zFront - 0.35, z1: zBase },
      { k: 'rect', x0: -outer, x1: outer, z0: zBase - u.depth / 2 - 0.3, z1: zBase + u.depth / 2 + reach },
    ],
  };
}

export function computeLayout(plan: Plan): Layout {
  if (plan.roomType === 'training') return classroomLayout(plan);
  if (plan.shape === 'u') return uLayout(plan);
  const { length: L, width: W } = plan;
  const kind = roomTypes[plan.roomType];
  const lengthways = plan.shape === 'rect' || plan.shape === 'boat';
  const ends = lengthways && plan.endChairs && plan.seats >= 4;
  const dim = tableSize(plan.shape, plan.seats, ends, plan.roomType === 'huddle');
  const endExtra = ends ? 0.7 : 0;
  const zMin = -L / 2 + kind.front + endExtra + dim.length / 2;
  const zMax = L / 2 - kind.back - endExtra - dim.length / 2;
  const fitsLength = zMin <= zMax;
  const fits = fitsLength && dim.width + 2 * kind.aisle <= W;
  let tz = 0;
  if (fitsLength) tz = plan.position === 'front' ? zMin : plan.position === 'back' ? zMax : clamp(0, zMin, zMax);
  const seats: Seat[] = [];
  if (plan.shape === 'round') {
    const r = dim.width / 2 + rules.chairOffset;
    for (let i = 0; i < plan.seats; i++) {
      const a = (2 * Math.PI * i) / plan.seats;
      const x = Math.sin(a) * r;
      const z = tz + Math.cos(a) * r;
      seats.push({ x: round2(x), z: round2(z), rot: facing(-x, -(z - tz)) });
    }
  } else {
    const regular = plan.seats - (ends ? 2 : 0);
    const left = Math.ceil(regular / 2);
    const right = Math.floor(regular / 2);
    // along a boat-shaped table the chairs stand beside the straight part, between the rounded ends
    const span = plan.shape === 'boat' ? dim.length - dim.width : dim.length;
    const side = (count: number, x: number, rot: number) => {
      for (let i = 0; i < count; i++) {
        seats.push({ x: round2(x), z: round2(tz - span / 2 + ((i + 0.5) * span) / count), rot });
      }
    };
    const off = dim.width / 2 + rules.chairOffset;
    side(left, -off, facing(1, 0));
    side(right, off, facing(-1, 0));
    if (ends) {
      seats.push({ x: 0, z: round2(tz - dim.length / 2 - rules.chairOffset), rot: facing(0, 1) });
      seats.push({ x: 0, z: round2(tz + dim.length / 2 + rules.chairOffset), rot: facing(0, -1) });
    }
  }
  const table: TableBlock = { shape: plan.shape, x: 0, z: round2(tz), length: dim.length, width: dim.width };
  const keepOut: Obstacle[] =
    plan.shape === 'round' ? [{ k: 'circle', x: 0, z: table.z, r: table.width / 2 + reach }] : [around(table, ends)];
  return {
    table,
    tables: [table],
    seats,
    endChairs: ends,
    fits,
    rows: null,
    path: lengthwise(table),
    touchSpot: [0.35, round2(table.z - table.length / 2 + 0.4)],
    keepOut,
  };
}

// ---------------------------------------------------------------- displays

export type DisplayInfo = {
  count: 1 | 2;
  size: number;
  recommended: number;
  width: number;
  height: number;
  centerY: number;
  xs: number[];
  farthest: number;
  maxDistance: number;
  wallFits: boolean;
};

export function computeDisplays(plan: Plan, layout: Layout): DisplayInfo {
  const f = rules.viewFactorLow - (rules.viewFactorLow - rules.viewFactorHigh) * plan.readability;
  const farthest = layout.seats.reduce((m, s) => Math.max(m, Math.hypot(s.x, s.z + plan.length / 2)), 0);
  const needIn = (farthest / f) * 80.3; // 16:9: diagonal in inches = height in metres * 80.3
  const sizes = rules.sizes as readonly number[];
  const recommended = sizes.find((s) => s >= needIn) ?? sizes[sizes.length - 1];
  const size = plan.displaySize ?? recommended;
  const height = round2(size * 0.01245);
  const width = round2(size * 0.02214);
  const bottomMin =
    plan.cameras === 'one' && plan.cameraSpot === 'below' ? rules.displayBottomOverCamera : rules.displayBottomMin;
  const lo = bottomMin + height / 2;
  const hi = plan.height - 0.25 - height / 2;
  const centerY = round2(Math.min(hi, Math.max(lo, rules.displayCenterHeight)));
  const gap = 0.12;
  const xs = plan.displays === 2 ? [-(width / 2 + gap / 2), width / 2 + gap / 2] : [0];
  const total = plan.displays * width + (plan.displays - 1) * gap;
  return {
    count: plan.displays,
    size,
    recommended,
    width,
    height,
    centerY,
    xs,
    farthest: round1(farthest),
    maxDistance: round1(height * f),
    wallFits: total <= plan.width - 0.6 && centerY + height / 2 <= plan.height - 0.1,
  };
}

// ---------------------------------------------------------------- audio, cameras and accessories

export type CameraSpec = {
  pos: Vec3;
  target: Vec3;
  hfov: number;
  vfov: number;
};
export type Equipment = {
  speakers: Vec3[];
  speakerTargets: Vec3[];
  speakerRadius: number;
  soundbar: { pos: Vec3; width: number } | null;
  mics: Vec3[];
  micRadius: number;
  cameras: CameraSpec[];
  panels: Vec3[];
  control: Vec3 | null;
};

export function computeEquipment(plan: Plan, layout: Layout, d: DisplayInfo): Equipment {
  const { length: L, width: W, height: H } = plan;
  const t = layout.table;
  const frontZ = -L / 2;
  const totalW = d.count * d.width + (d.count - 1) * 0.12;
  const displayBottom = d.centerY - d.height / 2;
  const displayTop = d.centerY + d.height / 2;
  const drop = Math.max(0.5, H - rules.earHeight);

  const speakers: Vec3[] = [];
  const speakerTargets: Vec3[] = [];
  let speakerRadius = 0;
  let soundbar: Equipment['soundbar'] = null;
  if (plan.speakers === 'soundbar') {
    soundbar = { pos: [0, round2(displayBottom - 0.1), frontZ + 0.12], width: round2(Math.min(1.2, totalW)) };
  } else if (plan.speakers === 'front') {
    for (const sx of [-1, 1]) {
      speakers.push([round2(sx * (totalW / 2 + 0.4)), d.centerY, frontZ + 0.1]);
      speakerTargets.push([0, rules.earHeight, t.z]);
    }
  } else if (plan.speakers === 'ceiling') {
    speakerRadius = round2(drop * Math.tan((rules.speakerHalfAngle * Math.PI) / 180));
    const spacing = speakerRadius * 1.41;
    const zoneW = Math.min(W - 0.4, t.width + 2.4);
    const zoneL = Math.min(L - 0.4, t.length + 2.0 + (layout.endChairs ? 1.4 : 0));
    let nx = Math.max(1, Math.ceil(zoneW / spacing));
    if (plan.mics === 'ceiling' && nx % 2 === 1) nx += 1; // no speaker on the centre line, where the microphone array hangs
    const nz = Math.max(2, Math.ceil(zoneL / spacing));
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        speakers.push([
          round2(((i + 0.5) * zoneW) / nx - zoneW / 2),
          round2(H - 0.02),
          round2(t.z + ((j + 0.5) * zoneL) / nz - zoneL / 2),
        ]);
      }
    }
  }

  const mics: Vec3[] = [];
  let micRadius = 0;
  if (plan.mics === 'ceiling') {
    micRadius = round2(drop * Math.tan((rules.ceilingMicHalfAngle * Math.PI) / 180));
    const n = Math.max(1, Math.ceil(t.length / rules.micArrayEvery));
    for (let i = 0; i < n; i++) mics.push([0, round2(H - 0.02), round2(t.z + ((i + 0.5) / n - 0.5) * t.length)]);
  } else if (plan.mics === 'table') {
    micRadius = 1.4;
    const n = Math.max(1, Math.ceil(plan.seats / rules.tableMicEvery));
    for (const [x, z] of alongPath(layout.path, n)) mics.push([x, 0.78, z]);
  } else if (plan.mics === 'integrated') {
    micRadius = 4.5;
  }

  // Common PTZ placements: one on the centre line of the display (above it, or below it at eye level),
  // two beside the display, and a third at the back of the room that follows the presenter.
  // The front cameras are modelled on the Q-SYS NC-12x80 (12x zoom, 80 degrees at the wide end), the back one on
  // the NC-20x60 (20x zoom, 60 degrees wide), zoomed in on the presenter.
  const target: Vec3 = [0, 1.1, t.z];
  const cameras: CameraSpec[] = [];
  const sideY = round2(clamp(d.centerY - 0.2, 1.3, H - 0.3));
  const sideX = round2(Math.min(W / 2 - 0.3, totalW / 2 + (plan.speakers === 'front' ? 0.85 : 0.45)));
  if (plan.cameras === 'one') {
    const y = plan.cameraSpot === 'below' ? Math.max(0.6, displayBottom - 0.2) : Math.min(H - 0.3, displayTop + 0.22);
    cameras.push({ pos: [0, round2(y), frontZ + 0.12], target, hfov: 80, vfov: 50 });
  } else if (plan.cameras === 'two' || plan.cameras === 'three') {
    for (const sx of [-1, 1]) {
      cameras.push({
        pos: [round2(sx * sideX), sideY, frontZ + 0.12],
        target: [0, 1.1, round2(t.z + t.length * 0.2)],
        hfov: 80,
        vfov: 50,
      });
    }
  }
  if (plan.cameras === 'three') {
    const at = presenterSpot(plan, d);
    cameras.push({
      pos: [0, round2(Math.min(H - 0.3, 2.2)), round2(L / 2 - 0.15)],
      target: [at.x, 1.45, at.z],
      hfov: 30,
      vfov: 17,
    });
  }
  const panels: Vec3[] = [];
  if (plan.tablePanels) {
    const n = Math.max(1, Math.ceil(pathLength(layout.path) / rules.panelEvery));
    for (const [x, z] of alongPath(layout.path, n)) panels.push([x, 0.765, z]);
  }
  let control: Vec3 | null = null;
  if (plan.control === 'table') control = [layout.touchSpot[0], 0.78, layout.touchSpot[1]];
  if (plan.control === 'wall') control = [-W / 2 + 0.04, 1.35, round2(L / 2 - 1.0)];

  return { speakers, speakerTargets, speakerRadius, soundbar, mics, micRadius, cameras, panels, control };
}

// ---------------------------------------------------------------- the equipment list and warnings

export type Item = { name: string; qty: number; note?: string };
export const systemName: Record<RoomSystem, string> = {
  byod: 'BYOD gateway (cable or wireless sharing)',
  teams: 'Microsoft Teams Rooms system',
  zoom: 'Zoom Rooms system',
  webex: 'Webex room system',
  meet: 'Google Meet room system',
};

export type Analysis = {
  layout: Layout;
  displays: DisplayInfo;
  gear: Equipment;
  items: Item[];
  warnings: string[];
};

export function analyze(plan: Plan): Analysis {
  const layout = computeLayout(plan);
  const displays = computeDisplays(plan, layout);
  const gear = computeEquipment(plan, layout, displays);
  const u = plan.unit;
  const items: Item[] = [];
  items.push({
    name: `${displays.size}" display`,
    qty: displays.count,
    note: `Recommended size for this room: ${displays.recommended}". Farthest seat ${formatLength(displays.farthest, u)} away; small text is comfortable up to ${formatLength(displays.maxDistance, u)}.`,
  });
  if (plan.speakers === 'soundbar') items.push({ name: 'Soundbar', qty: 1 });
  if (plan.speakers === 'front') items.push({ name: 'Wall speakers beside the display', qty: 2 });
  if (plan.speakers === 'ceiling') items.push({ name: 'Ceiling speakers', qty: gear.speakers.length });
  if (plan.mics === 'ceiling')
    items.push({
      name:
        plan.micShape === 'round'
          ? 'Ceiling microphone array, round 25 in (635 mm)'
          : 'Ceiling microphone array, square 24 in (604 mm)',
      qty: gear.mics.length,
    });
  if (plan.mics === 'table') items.push({ name: 'Table microphones', qty: gear.mics.length });
  if (plan.mics === 'integrated') items.push({ name: 'Microphones built into the bar or camera', qty: 1 });
  const ceilingDevices =
    (plan.speakers === 'ceiling' ? gear.speakers.length : 0) + (plan.mics === 'ceiling' ? gear.mics.length : 0);
  if (plan.mics === 'ceiling' || plan.mics === 'table' || plan.speakers === 'ceiling') {
    items.push({ name: 'Audio processor (echo cancellation and mixing)', qty: 1 });
  }
  if (ceilingDevices + gear.cameras.length > 0)
    items.push({
      name: 'Network switch with PoE',
      qty: 1,
      note: 'Powers the ceiling devices and the PTZ cameras over one cable each.',
    });
  if (plan.cameras === 'one') items.push({ name: 'PTZ camera, 12x zoom, 80° wide view', qty: 1 });
  if (plan.cameras === 'two') items.push({ name: 'PTZ cameras, 12x zoom, with automatic switching', qty: 2 });
  if (plan.cameras === 'three')
    items.push({
      name: 'PTZ cameras with automatic switching',
      qty: 3,
      note: 'Two beside the display (12x zoom, 80° wide view) and one at the back (20x zoom) that follows the presenter.',
    });
  if (gear.panels.length) items.push({ name: 'Table connection panel', qty: gear.panels.length });
  if (plan.control === 'table') items.push({ name: 'Touch panel on the table', qty: 1 });
  if (plan.control === 'wall') items.push({ name: 'Touch panel on the wall', qty: 1 });
  items.push({ name: systemName[plan.system], qty: 1 });
  items.push({ name: 'Installation, cabling, programming and commissioning', qty: 1 });

  const warnings: string[] = [];
  if (!layout.fits) {
    warnings.push(
      'The table and chairs do not fit this room with comfortable clearance. Reduce the seats or enlarge the room.',
    );
  }
  if (!displays.wallFits)
    warnings.push('The display does not fit the front wall at this size. Choose a smaller size or one display.');
  if (displays.farthest > displays.maxDistance) {
    warnings.push(
      `The farthest seat is ${formatLength(displays.farthest, u)} from the display; small text is hard to read beyond ${formatLength(displays.maxDistance, u)}. Choose a larger display or sit closer.`,
    );
  }
  if (plan.system !== 'byod' && plan.mics === 'none')
    warnings.push('A room system is selected but there are no microphones: the far end will not hear the room.');
  if (plan.system !== 'byod' && plan.cameras === 'none')
    warnings.push('A room system is selected but there is no camera: the far end will not see the room.');
  if (plan.cameras !== 'none' && plan.mics === 'none')
    warnings.push('A camera without microphones: remote people will see the room but not hear it.');
  if (plan.speakers === 'none') warnings.push('No speakers: people in the room will not hear remote participants.');
  return { layout, displays, gear, items, warnings };
}

// ---------------------------------------------------------------- packages as starting points

// What each package adds to a room, for each kind of room.
const presetChoices: Record<RoomType, Record<Preset, Partial<Plan>>> = {
  boardroom: {
    essential: { displays: 1, speakers: 'front', mics: 'ceiling', cameras: 'two', tablePanels: true, control: 'table' },
    standard: {
      displays: 2,
      speakers: 'ceiling',
      mics: 'ceiling',
      cameras: 'two',
      tablePanels: true,
      control: 'table',
    },
    premium: {
      displays: 2,
      speakers: 'ceiling',
      mics: 'ceiling',
      cameras: 'three',
      tablePanels: true,
      control: 'table',
      presenter: true,
    },
  },
  huddle: {
    essential: { speakers: 'soundbar', mics: 'integrated', cameras: 'one', tablePanels: false, control: 'none' },
    standard: { speakers: 'soundbar', mics: 'table', cameras: 'one', tablePanels: true, control: 'table' },
    premium: { speakers: 'front', mics: 'ceiling', cameras: 'two', tablePanels: true, control: 'table' },
  },
  conference: {
    essential: {
      displays: 1,
      speakers: 'soundbar',
      mics: 'integrated',
      cameras: 'one',
      tablePanels: false,
      control: 'none',
    },
    standard: {
      displays: 1,
      speakers: 'front',
      mics: 'ceiling',
      cameras: 'two',
      tablePanels: true,
      control: 'table',
    },
    premium: {
      displays: 2,
      speakers: 'ceiling',
      mics: 'ceiling',
      cameras: 'three',
      tablePanels: true,
      control: 'table',
    },
  },
  training: {
    essential: { displays: 1, speakers: 'front', mics: 'integrated', cameras: 'one', control: 'none' },
    standard: { displays: 1, speakers: 'front', mics: 'ceiling', cameras: 'two', control: 'wall' },
    premium: { displays: 2, speakers: 'ceiling', mics: 'ceiling', cameras: 'three', control: 'wall', presenter: true },
  },
};

export const presetText: Record<RoomType, Record<Preset, string>> = {
  boardroom: {
    essential: 'One display, wall speakers, ceiling microphones, two PTZ cameras',
    standard: 'Two displays, ceiling audio, two PTZ cameras, table touch panel',
    premium: 'Two displays, ceiling audio, three PTZ cameras that follow the presenter, table panels',
  },
  huddle: {
    essential: 'Soundbar with built-in microphones and one PTZ camera',
    standard: 'Soundbar, table microphone, one PTZ camera, touch panel',
    premium: 'Wall speakers, ceiling microphone, two PTZ cameras, touch panel',
  },
  conference: {
    essential: 'Soundbar, built-in microphones, one PTZ camera',
    standard: 'Wall speakers, ceiling microphones, two PTZ cameras, touch panel',
    premium: 'Two displays, ceiling audio, three PTZ cameras, touch panel',
  },
  training: {
    essential: 'Wall speakers, built-in microphones, one PTZ camera',
    standard: 'Wall speakers, ceiling microphones, two PTZ cameras, wall touch panel',
    premium: 'Two displays, ceiling audio, three PTZ cameras that follow the presenter, wall touch panel',
  },
};

export function applyPreset(plan: Plan, preset: Preset): Plan {
  return normalizePlan({
    ...plan,
    displaySize: null,
    speakerCones: false,
    micCoverage: false,
    cameraView: false,
    listeningPlane: false,
    ...presetChoices[plan.roomType][preset],
  });
}
// ---------------------------------------------------------------- ready-made rooms

export type ScenarioId = 'huddle' | 'team' | 'boardroom' | 'classroom' | 'workshop' | 'roundtable';
export type Scenario = {
  id: ScenarioId;
  label: string;
  about: string;
  type: RoomType;
  preset: Preset;
  changes: Partial<Plan>; // what sets this room apart from its kind of room
};

// Typical rooms to start from: a kind of room, a package and the few things that make this one what it is.
export const scenarios: Scenario[] = [
  {
    id: 'huddle',
    label: 'Huddle for four',
    about: 'A small room with a video bar: soundbar, built-in microphones and one PTZ camera.',
    type: 'huddle',
    preset: 'essential',
    changes: {},
  },
  {
    id: 'team',
    label: 'Team room for eight',
    about: 'A rectangular table, wall speakers, ceiling microphones, two PTZ cameras and a touch panel.',
    type: 'conference',
    preset: 'standard',
    changes: {},
  },
  {
    id: 'roundtable',
    label: 'Round table for eight',
    about: 'Everyone equal around a round table, with one PTZ camera above the display.',
    type: 'conference',
    preset: 'standard',
    changes: { shape: 'round', seats: 8, length: 6, width: 6, cameras: 'one' },
  },
  {
    id: 'boardroom',
    label: 'Boardroom for twelve',
    about: 'A boat-shaped table, two displays, ceiling audio and three PTZ cameras, one following the presenter.',
    type: 'boardroom',
    preset: 'premium',
    changes: { seats: 12 },
  },
  {
    id: 'classroom',
    label: 'Classroom for eighteen',
    about: 'Three rows of two-seat desks facing the display, two PTZ cameras and a touch panel on the wall.',
    type: 'training',
    preset: 'standard',
    changes: { seats: 18 },
  },
  {
    id: 'workshop',
    label: 'Workshop in a U',
    about: 'Tables in a U, open towards the display, so the presenter can walk in the middle.',
    type: 'conference',
    preset: 'standard',
    changes: { shape: 'u', seats: 14, length: 8, width: 8, presenter: true },
  },
];

// Starts from a ready-made room. The unit, the meeting platform and the other personal choices stay as they are.
export function applyScenario(plan: Plan, id: ScenarioId): Plan {
  const s = scenarios.find((x) => x.id === id) ?? scenarios[0];
  const room = normalizePlan({ ...applyRoomType(plan, s.type), ...s.changes });
  return normalizePlan({ ...applyPreset(room, s.preset), ...s.changes });
}

// ---------------------------------------------------------------- sharing

const KEYS = [
  'unit',
  'length',
  'width',
  'height',
  'ceiling',
  'shape',
  'seats',
  'position',
  'endChairs',
  'presenter',
  'displays',
  'displaySize',
  'readability',
  'speakers',
  'speakerCones',
  'listeningPlane',
  'mics',
  'micCoverage',
  'cameras',
  'cameraView',
  'tablePanels',
  'control',
  'system',
  'presenterX',
  'presenterZ',
  'cameraSpot',
  'micShape',
  'roomType',
] as const satisfies readonly (keyof Plan)[];

export function encodePlan(plan: Plan): string {
  const list = KEYS.map((k) => plan[k]);
  return btoa(JSON.stringify(list)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePlan(text: string): Plan | null {
  try {
    const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    const list: unknown = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
    if (!Array.isArray(list) || list.length > KEYS.length + 4) return null;
    const raw: Record<string, unknown> = {};
    KEYS.forEach((k, i) => {
      raw[k] = list[i];
    });
    return normalizePlan(raw);
  } catch {
    return null;
  }
}

const tableWord: Record<TableShape, string> = {
  rect: 'rectangular',
  boat: 'boat-shaped',
  round: 'round',
  u: 'U-shaped',
};

const roomLine = (plan: Plan) =>
  plan.roomType === 'training'
    ? `Training room, ${plan.seats} seats in rows of desks.`
    : `${roomTypes[plan.roomType].noun}, ${plan.seats} seats at a ${tableWord[plan.shape]} table.`;

// A short text for the request form. The plan link goes first so it survives the form's length limit.
export function planSummary(plan: Plan, link: string): string {
  const a = analyze(plan);
  const u = plan.unit;
  const lines = [
    `Room planner (pilot): ${link}`,
    `Room ${formatLength(plan.length, u)} x ${formatLength(plan.width, u)}, ceiling ${formatLength(plan.height, u)}.`,
    roomLine(plan),
    ...a.items.filter((i) => !i.name.startsWith('Installation')).map((i) => `${i.qty} x ${i.name}`),
  ];
  return lines.join('\n').slice(0, 900);
}
