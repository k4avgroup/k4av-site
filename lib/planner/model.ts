// Room planner model: everything that can be worked out without a browser.
// All lengths are in metres; the UI converts to feet. The room spans x in [-width/2, width/2], z in
// [-length/2, length/2] and y from 0 to height. The display wall (the "front") is at z = -length/2, the table's
// long side runs along z, and the audience faces -z.
//
// The numbers in `rules` are starting values for a pilot, taken from common AV rules of thumb. They are meant to be
// tuned by someone who commissions these rooms; the planner is an indicative sketch, not an engineering drawing.

export type Unit = 'm' | 'ft';
// `semi` is half a round table, its flat side against the display wall, with people sitting around the curve.
export type TableShape = 'rect' | 'boat' | 'round' | 'u' | 'semi';
export type TablePosition = 'center' | 'back' | 'front';
// Nothing beyond the display's own speakers, a pair beside the display, ceiling speakers, or both
export type Speakers = 'none' | 'display' | 'front' | 'ceiling' | 'both';
export type SpeakerSize = 4 | 7 | 8 | 10; // cone diameter in inches; 4 stands for the 4 to 5 in class
export type SpeakerMount = 'flush' | 'pendant'; // in the ceiling, or hung below it on cords
export type Mics = 'none' | 'table' | 'ceiling' | 'pendant' | 'gooseneck';
// Cameras at the display wall. A presenter always adds a camera of their own at the back; `pairs` is two on each
// side of the display, which the system switches between without a visible cut.
export type Cameras = 'none' | 'one' | 'two' | 'pairs';
// How closely ceiling speakers are spaced: `basic` at about the ceiling height (the usual rule of thumb), `good` so
// that their circles of sound meet without gaps at ear height, `full` with the circles overlapping.
export type CeilingCoverage = 'basic' | 'good' | 'full';
// Where the AV equipment lives: behind the display, in a rack in the room, or in a rack outside it.
export type Rack = 'none' | 'behind' | 'room' | 'outside';
// Where the cameras at the display go: one above or below the display, two beside it or one above and one below.
export type CameraSpot = 'above' | 'below' | 'sides' | 'both';
export type Bar = 'none' | 'compact' | 'large'; // an all-in-one video bar: camera, microphones and speakers
export type Sharing = 'none' | 'cable' | 'wireless' | 'both'; // laptops on a cable, a wireless presentation gateway
export type DisplayType = 'flat' | 'led' | 'projector';
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
  displayType: DisplayType;
  displays: 1 | 2;
  displaySize: number | null;
  readability: number;
  whiteboard: boolean; // an interactive whiteboard beside the display (classrooms)
  sharing: Sharing;
  bar: Bar;
  speakers: Speakers;
  speakerSize: SpeakerSize;
  speakerMount: SpeakerMount;
  speakerCones: boolean;
  listeningPlane: boolean;
  mics: Mics;
  micShape: MicShape; // ceiling microphone arrays come square or round
  speakerCoverage: CeilingCoverage;
  micCoverage: boolean;
  wireless: 0 | 2 | 4; // handheld or lapel microphones, interchangeable
  credenzaX: number | null; // the small cabinet with the wireless microphones and their charger; null: a default corner
  credenzaZ: number | null;
  rack: Rack;
  rackX: number | null; // where the rack was dragged to; null: its default place
  rackZ: number | null;
  dsp: boolean; // an audio processor: echo cancellation and mixing
  engine: boolean; // a separate room computer for the meeting platform; a video bar can run it by itself
  cameras: Cameras;
  cameraSpot: CameraSpot;
  tableCamera: boolean; // a small round camera on the table
  wallCameras: number; // on the side walls, left and right in turn
  backCameras: number; // on the back wall; the first one follows the presenter
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
    about: 'A small room for 2 to 6 people: one screen, an all-in-one video bar and a touch panel on the table.',
    seats: [2, 6],
    length: [2.5, 5.5],
    width: [2.5, 5.5],
    front: 1.0,
    back: 0.8,
    aisle: 0.8,
    shapes: ['rect', 'semi', 'round'],
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
    shapes: ['rect', 'boat', 'round', 'semi', 'u'],
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
  semi: {
    label: 'Semi-round',
    about:
      'Half a round table with its flat side against the display wall; everyone sits around the curve facing the display.',
  },
};

export function seatLimits(type: RoomType, shape: TableShape): [number, number] {
  const [lo, hi] = roomTypes[type].seats;
  if (shape === 'semi') return [Math.max(3, lo), Math.min(8, hi)];
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
  ledSizes: [110, 135, 165, 220], // an LED wall is built to the room, so these are steps along the way
  projectorSizes: [100, 120, 150, 180, 220],
  viewFactorLow: 8, // farthest viewer sits at 8 screen heights when small text does not matter
  viewFactorHigh: 4, // ... and at 4 heights when it does
  // Ceiling speakers: half the angle each one covers, and the tallest ceiling it still suits, by cone size. Bigger
  // cones reach farther and carry higher; pendant speakers hang lower, which helps in a tall room.
  speakerAngle: { 4: 40, 7: 45, 8: 50, 10: 55 },
  speakerMaxHeight: { 4: 3.0, 7: 3.6, 8: 4.2, 10: 5.0 },
  pendantDrop: 0.6, // how far a pendant speaker or microphone hangs below the ceiling
  // Ceiling speaker spacing, in units of the radius of a speaker's circle of sound at ear height: `good` is where the
  // circles of a square grid just meet (1.41), `full` has them overlap; `basic` is spaced at the ceiling height.
  coverageSpacing: { good: 1.41, full: 1.0 },
  ceilingMicHalfAngle: 55,
  micArrayEvery: 3.5, // metres of table per ceiling microphone array: a long table gets two
  tableMicEvery: 4, // seats per table microphone
  panelEvery: 2.4, // metres of table per connection panel
  // Slim wall speakers, sized like a K-array Kobra KK52 (spec sheet): 59 x 497 x 81 mm.
  wallSpeaker: { width: 0.06, height: 0.5, depth: 0.08 },
  // A small cabinet for the wireless microphones and their charger, and the rack cabinet (19 in, 44.5 mm per unit).
  credenza: { width: 0.9, height: 0.8, depth: 0.4 },
  rackUnit: 0.0445,
  rackBody: { width: 0.6, depth: 0.75 },
  // All-in-one video bars (indicative sizes): a compact one for huddles and a larger one for medium rooms.
  bar: {
    compact: { width: 0.6, height: 0.09, depth: 0.1 },
    large: { width: 0.9, height: 0.1, depth: 0.12 },
  },
  // Ceiling arrays, sized like the Shure MXA920 (spec sheet): square 603.8 mm, round 635.4 mm, 55 to 61 mm deep.
  micArray: {
    square: { size: 0.604, depth: 0.055 },
    round: { size: 0.635, depth: 0.061 },
  },
} as const;

export const displaySizes = (type: DisplayType): readonly number[] =>
  type === 'led' ? rules.ledSizes : type === 'projector' ? rules.projectorSizes : rules.sizes;

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
  displayType: 'flat',
  displays: 1,
  displaySize: null,
  readability: 0.5,
  whiteboard: false,
  sharing: 'cable',
  bar: 'none',
  speakers: 'both',
  speakerSize: 7,
  speakerMount: 'flush',
  speakerCones: false,
  listeningPlane: false,
  mics: 'ceiling',
  micShape: 'square',
  speakerCoverage: 'good',
  micCoverage: false,
  wireless: 2,
  credenzaX: null,
  credenzaZ: null,
  rack: 'room',
  rackX: null,
  rackZ: null,
  dsp: true,
  engine: true,
  cameras: 'one',
  cameraSpot: 'above',
  tableCamera: false,
  wallCameras: 0,
  backCameras: 0,
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

const oneOf = <T extends string | number>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (typeof v === 'string' || typeof v === 'number') && (allowed as readonly (string | number)[]).includes(v)
    ? (v as T)
    : fallback;
const num = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : fallback;
const whole = (v: unknown, lo: number, hi: number, fallback: number) => Math.round(num(v, lo, hi, fallback));
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

// Nothing extra: every choice of equipment set back to its plainest value. Templates and packages start from this.
const bare = {
  presenter: false,
  displayType: 'flat',
  displays: 1,
  whiteboard: false,
  sharing: 'none',
  bar: 'none',
  speakers: 'none',
  speakerSize: 7,
  speakerMount: 'flush',
  speakerCoverage: 'basic',
  mics: 'none',
  wireless: 0,
  credenzaX: null,
  credenzaZ: null,
  rack: 'none',
  rackX: null,
  rackZ: null,
  dsp: false,
  engine: false,
  cameras: 'none',
  cameraSpot: 'above',
  tableCamera: false,
  wallCameras: 0,
  backCameras: 0,
  tablePanels: false,
  control: 'none',
} as const satisfies Partial<Plan>;

// A starting point for each kind of room. Choosing a room type applies it, with a package on top.
export const templates = {
  huddle: { length: 4, width: 3.5, height: 2.7, seats: 4, shape: 'rect', position: 'center', endChairs: false },
  conference: { length: 8, width: 6, height: 3, seats: 8, shape: 'rect', position: 'center', endChairs: false },
  boardroom: { length: 10, width: 7, height: 3, seats: 14, shape: 'boat', position: 'center', endChairs: false },
  training: { length: 10, width: 8, height: 3, seats: 24, shape: 'rect', position: 'center', endChairs: false },
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
  const wanted = oneOf(input.shape, ['rect', 'boat', 'round', 'semi', 'u'] as const, templates[roomType].shape);
  const shape: TableShape = kind.shapes.includes(wanted) ? wanted : templates[roomType].shape;
  const seats = Math.round(numIn(input.seats, seatLimits(roomType, shape), templates[roomType].seats));
  const length = round2(numIn(input.length, kind.length, templates[roomType].length));
  const width = round2(numIn(input.width, kind.width, templates[roomType].width));

  // Older links: a soundbar and built-in microphones meant what a video bar is now, and the camera choices counted a
  // presenter camera as a third or fourth camera.
  const legacyBar = input.speakers === 'soundbar' || input.mics === 'integrated';
  const withPresenter = input.cameras === 'three' || input.cameras === 'four';
  const bar = oneOf(
    input.bar,
    ['none', 'compact', 'large'] as const,
    legacyBar ? (huddle ? 'compact' : 'large') : d.bar,
  );
  const presenter = huddle ? false : withPresenter || bool(input.presenter, d.presenter);

  const speakers = oneOf(
    huddle && input.speakers === 'ceiling' ? 'front' : huddle && input.speakers === 'both' ? 'front' : input.speakers,
    ['none', 'display', 'front', 'ceiling', 'both'] as const,
    legacyBar ? 'none' : d.speakers,
  );
  const wantedMics = oneOf(
    input.mics,
    ['none', 'table', 'ceiling', 'pendant', 'gooseneck'] as const,
    legacyBar ? 'none' : d.mics,
  );
  // a huddle has a table microphone or none; a classroom has no microphones on the desks, only on the ceiling
  const mics: Mics = huddle
    ? wantedMics === 'table'
      ? 'table'
      : 'none'
    : training && wantedMics === 'table'
      ? 'ceiling'
      : wantedMics;

  const cameras: Cameras =
    bar !== 'none' || withPresenter
      ? bar !== 'none'
        ? 'none'
        : 'two'
      : oneOf(input.cameras, ['none', 'one', 'two', 'pairs'] as const, d.cameras);
  const wantedSpot = oneOf(input.cameraSpot, ['above', 'below', 'sides', 'both'] as const, d.cameraSpot);
  // a bar or a single camera is above or below the display; two cameras are beside it, or one above and one below
  const cameraSpot: CameraSpot =
    cameras === 'pairs'
      ? 'sides'
      : cameras === 'two'
        ? wantedSpot === 'both'
          ? 'both'
          : 'sides'
        : wantedSpot === 'below'
          ? 'below'
          : 'above';

  const control = oneOf(input.control, ['none', 'table', 'wall'] as const, d.control);
  const displayType: DisplayType = huddle
    ? 'flat'
    : oneOf(input.displayType, ['flat', 'led', 'projector'] as const, d.displayType);
  const system = oneOf(input.system, ['byod', 'teams', 'zoom', 'webex', 'meet'] as const, d.system);
  const external = mics !== 'none' || speakers === 'ceiling' || speakers === 'both';
  const wireless = huddle ? 0 : oneOf(input.wireless, [0, 2, 4] as const, 0);
  const tablePanels = training ? false : bool(input.tablePanels, d.tablePanels);
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
    // a huddle table takes one chair at the end facing the display; a larger one, a chair at each end
    endChairs:
      ((roomType === 'conference' || roomType === 'boardroom') && (shape === 'rect' || shape === 'boat')) ||
      (huddle && shape === 'rect')
        ? bool(input.endChairs, d.endChairs)
        : false,
    presenter,
    presenterX: spot(input.presenterX, ...presenterRange(width, length).x),
    presenterZ: spot(input.presenterZ, ...presenterRange(width, length).z),
    displayType,
    displays: huddle || displayType === 'led' ? 1 : input.displays === 2 ? 2 : 1,
    displaySize:
      typeof input.displaySize === 'number' && displaySizes(displayType).includes(input.displaySize)
        ? input.displaySize
        : null,
    readability: round2(num(input.readability, 0, 1, d.readability)),
    whiteboard: training ? bool(input.whiteboard, d.whiteboard) : false,
    sharing: oneOf(input.sharing, ['none', 'cable', 'wireless', 'both'] as const, tablePanels ? 'cable' : 'none'),
    bar,
    speakers,
    speakerSize: oneOf(input.speakerSize, [4, 7, 8, 10] as const, d.speakerSize),
    speakerMount: oneOf(input.speakerMount, ['flush', 'pendant'] as const, d.speakerMount),
    speakerCones: bool(input.speakerCones, d.speakerCones),
    listeningPlane: bool(input.listeningPlane, d.listeningPlane),
    mics,
    micShape: oneOf(input.micShape, ['square', 'round'] as const, d.micShape),
    // older links said `partial`, then `standard` and `dense`, for what is now basic, good and full
    speakerCoverage: oneOf(
      { partial: 'basic', standard: 'good', dense: 'full' }[String(input.speakerCoverage)] ?? input.speakerCoverage,
      ['basic', 'good', 'full'] as const,
      d.speakerCoverage,
    ),
    micCoverage: bool(input.micCoverage, d.micCoverage),
    credenzaX: spot(input.credenzaX, -width / 2 + 0.25, width / 2 - 0.25),
    credenzaZ: spot(input.credenzaZ, -length / 2 + 0.25, length / 2 - 0.25),
    rack: oneOf(input.rack, ['none', 'behind', 'room', 'outside'] as const, huddle ? 'behind' : d.rack),
    rackX: spot(input.rackX, -width / 2 - 3, width / 2 + 3),
    rackZ: spot(input.rackZ, -length / 2 - 3, length / 2 + 3),
    // a presenter holds a wireless microphone, so there are always some
    wireless: presenter && wireless === 0 ? 2 : wireless,
    dsp: huddle ? false : bool(input.dsp, external),
    engine: system === 'byod' ? false : bar === 'none' ? true : bool(input.engine, false),
    cameras,
    cameraSpot,
    tableCamera: training ? false : bool(input.tableCamera, d.tableCamera),
    wallCameras: huddle ? 0 : whole(input.wallCameras, 0, 4, 0),
    backCameras: huddle ? 0 : Math.max(presenter ? 1 : 0, whole(input.backCameras, 0, 2, 0)),
    cameraView: bool(input.cameraView, d.cameraView),
    tablePanels,
    control: training && control === 'table' ? 'wall' : control,
    system,
  };
}

// Switches to another kind of room: its size and furniture start from that room's template, and the equipment from
// the package the room had.
export function applyRoomType(plan: Plan, type: RoomType): Plan {
  return normalizePlan({
    ...plan,
    ...templates[type],
    ...bare,
    ...presetChoices[type].standard,
    roomType: type,
    displaySize: null,
    presenterX: null,
    presenterZ: null,
    speakerCones: false,
    micCoverage: false,
    cameraView: false,
    listeningPlane: false,
    credenzaX: null,
    credenzaZ: null,
    rackX: null,
    rackZ: null,
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
  center: [number, number]; // the middle of the tabletop, or of the desks
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

// The radius of a semi-round table, wide enough to seat everyone around the curve.
export const semiRadius = (seats: number) => round2(Math.max(0.9, (0.62 * seats) / Math.PI - rules.chairOffset + 0.05));

// `endChairs` is how many chairs stand at the ends of a rectangular table: none, one (true for a huddle) or two.
export function tableSize(shape: TableShape, seats: number, endChairs: boolean | number, small = false) {
  if (shape === 'semi') {
    const r = semiRadius(seats);
    return { length: r, width: round2(2 * r) };
  }
  if (shape === 'round') {
    const d = round2(Math.max(small ? 1.0 : 1.2, (seats * rules.seatPitch) / Math.PI));
    return { length: d, width: d };
  }
  if (shape === 'u') {
    const u = uDims(seats);
    return { length: u.length, width: u.width };
  }
  const ends = typeof endChairs === 'number' ? endChairs : endChairs ? 2 : 0;
  const regular = Math.max(1, seats - ends);
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
    center: [table.x, table.z],
    keepOut: [around(table, true)],
  };
}

// Half a round table with its flat side against the display wall. People sit around the curve, facing the display.
function semiLayout(plan: Plan): Layout {
  const { length: L, width: W } = plan;
  const wall = -L / 2;
  const r = semiRadius(plan.seats);
  const ring = r + rules.chairOffset;
  const seats: Seat[] = [];
  for (let i = 0; i < plan.seats; i++) {
    const a = -Math.PI / 2 + ((i + 0.5) * Math.PI) / plan.seats;
    const x = Math.sin(a) * ring;
    const z = wall + Math.cos(a) * ring;
    seats.push({ x: round2(x), z: round2(z), rot: facing(-x, wall - z) });
  }
  const table: TableBlock = { shape: 'semi', x: 0, z: round2(wall + r / 2), length: r, width: round2(2 * r) };
  const arc = [-60, -30, 0, 30, 60].map((deg): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [round2(Math.sin(a) * r * 0.62), round2(wall + Math.cos(a) * r * 0.62)];
  });
  return {
    table,
    tables: [table],
    seats,
    endChairs: false,
    fits: ring + 0.33 + 0.6 <= L && 2 * (ring + 0.33) <= W,
    rows: null,
    path: arc,
    touchSpot: [0.35, round2(wall + 0.35)],
    center: [0, round2(wall + r * 0.45)],
    keepOut: [{ k: 'circle', x: 0, z: wall, r: ring + 0.33 }],
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
    center: [0, round2(zBase)],
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
  if (plan.shape === 'semi') return semiLayout(plan);
  const { length: L, width: W } = plan;
  const kind = roomTypes[plan.roomType];
  const huddle = plan.roomType === 'huddle';
  const lengthways = plan.shape === 'rect' || plan.shape === 'boat';
  // a huddle table takes one chair at the far end, facing the display; a larger table, one at each end
  const endCount = lengthways && plan.endChairs && plan.seats >= (huddle ? 3 : 4) ? (huddle ? 1 : 2) : 0;
  const ends = endCount > 0;
  const dim = tableSize(plan.shape, plan.seats, endCount, huddle);
  const endExtra = ends ? 0.7 : 0;
  const zMin = -L / 2 + kind.front + (endCount === 2 ? endExtra : 0) + dim.length / 2;
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
    const regular = plan.seats - endCount;
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
    if (endCount === 2) {
      seats.push({ x: 0, z: round2(tz - dim.length / 2 - rules.chairOffset), rot: facing(0, 1) });
    }
    if (ends) seats.push({ x: 0, z: round2(tz + dim.length / 2 + rules.chairOffset), rot: facing(0, -1) });
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
    center: [table.x, table.z],
    keepOut,
  };
}

// ---------------------------------------------------------------- displays

export type DisplayInfo = {
  type: DisplayType;
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
  projector: { pos: Vec3; throw: number; short: boolean } | null; // the projector hangs from the ceiling
  whiteboard: { x: number; width: number; height: number; centerY: number } | null; // on the display wall
};

export function computeDisplays(plan: Plan, layout: Layout): DisplayInfo {
  const f = rules.viewFactorLow - (rules.viewFactorLow - rules.viewFactorHigh) * plan.readability;
  const farthest = layout.seats.reduce((m, s) => Math.max(m, Math.hypot(s.x, s.z + plan.length / 2)), 0);
  const needIn = (farthest / f) * 80.3; // 16:9: diagonal in inches = height in metres * 80.3
  const sizes = displaySizes(plan.displayType);
  const recommended = sizes.find((s) => s >= needIn) ?? sizes[sizes.length - 1];
  const size = plan.displaySize ?? recommended;
  const height = round2(size * 0.01245);
  const width = round2(size * 0.02214);
  // the display stays where it is; a camera or a bar below it is the one that moves
  const lo = rules.displayBottomMin + height / 2;
  const hi = plan.height - 0.25 - height / 2;
  const centerY = round2(Math.min(hi, Math.max(lo, rules.displayCenterHeight)));
  const gap = 0.12;
  const xs = plan.displays === 2 ? [-(width / 2 + gap / 2), width / 2 + gap / 2] : [0];
  const total = plan.displays * width + (plan.displays - 1) * gap;

  // an interactive whiteboard (86 in) stands to the right of the display, so the presenter keeps the left side
  const wbWidth = 1.9;
  const whiteboard = plan.whiteboard
    ? { x: round2(total / 2 + 0.3 + wbWidth / 2), width: wbWidth, height: 1.07, centerY: 1.45 }
    : null;
  const wbEdge = whiteboard ? whiteboard.x + whiteboard.width / 2 : 0;
  const sideRoom = plan.width / 2 - 0.3;

  // a projector hangs from the ceiling in front of the screen: standard throw if the room is long enough, otherwise
  // short throw, close to the screen
  let projector: DisplayInfo['projector'] = null;
  if (plan.displayType === 'projector') {
    const standard = 1.5 * width;
    const short = standard <= plan.length - 2.5 ? false : true;
    const dist = short ? 0.5 * width : standard;
    projector = { pos: [0, round2(plan.height - 0.1), round2(-plan.length / 2 + dist)], throw: round2(dist), short };
  }
  return {
    type: plan.displayType,
    count: plan.displays,
    size,
    recommended,
    width,
    height,
    centerY,
    xs,
    farthest: round1(farthest),
    maxDistance: round1(height * f),
    wallFits:
      total / 2 <= sideRoom &&
      wbEdge <= sideRoom &&
      centerY + height / 2 <= plan.height - 0.1 &&
      (plan.displayType !== 'projector' || centerY - height / 2 >= 0.6),
    projector,
    whiteboard,
  };
}

// ---------------------------------------------------------------- audio, cameras and accessories

export type CameraKind = 'bar' | 'front' | 'wall' | 'back' | 'presenter' | 'table';
export type CameraSpec = {
  pos: Vec3;
  target: Vec3;
  hfov: number;
  vfov: number;
  kind: CameraKind;
  wall: 'front' | 'left' | 'right' | 'back' | 'table'; // what it is fixed to
};
// What goes into the rack, top to bottom. Names are by function, not by brand.
export type RackKind = 'control' | 'video' | 'audio' | 'network' | 'compute' | 'laptop' | 'power' | 'blank';
export type RackItem = { name: string; u: number; kind: RackKind };
// A cable run drawn on the floor and up the wall. A laptop cable carries HDMI and USB-C, a control cable is network.
export type CableKind = 'laptop' | 'control' | 'display';
export type Cable = { kind: CableKind; label: string; points: Vec3[] };
export type Wall = 'front' | 'back' | 'left' | 'right';
export type Equipment = {
  speakers: Vec3[]; // ceiling speakers
  speakerRadius: number;
  speakerDrop: number; // how far they hang below the ceiling: 0 for flush speakers
  wallSpeakers: Vec3[]; // the pair beside the display
  wallTargets: Vec3[];
  bar: { pos: Vec3; width: number; height: number; depth: number } | null;
  mics: Vec3[];
  micRadius: number;
  micDrop: number; // how far the microphones hang below the ceiling
  wireless: number;
  cameras: CameraSpec[];
  panels: Vec3[];
  control: Vec3 | null;
  laptopInputs: Vec3[]; // where a laptop plugs in on the table
  pucks: Vec3[]; // wireless sharing buttons on the table
  cables: Cable[];
  // the cabinet for the wireless microphones: their charger, and the handhelds and lapels standing in it
  credenza: { pos: Vec3; rot: number; wall: Wall; mics: ('handheld' | 'lapel')[] } | null;
  // the equipment: in a box behind the display, or in a rack in the room or outside it
  rack: {
    mode: Exclude<Rack, 'none'>;
    pos: Vec3;
    rot: number;
    wall: Wall | null;
    outside: boolean;
    u: number;
    items: RackItem[];
    width: number;
    height: number;
    depth: number;
  } | null;
};

// Pulls a spot to the nearest wall: the object stands against it, facing into the room.
export function snapToWall(plan: Pick<Plan, 'width' | 'length'>, x: number, z: number, depth: number) {
  const W = plan.width;
  const L = plan.length;
  const edges: [Wall, number][] = [
    ['left', x + W / 2],
    ['right', W / 2 - x],
    ['front', z + L / 2],
    ['back', L / 2 - z],
  ];
  const wall = edges.sort((a, b) => a[1] - b[1])[0][0];
  const margin = 0.45;
  const sx = clamp(x, -W / 2 + margin, W / 2 - margin);
  const sz = clamp(z, -L / 2 + margin, L / 2 - margin);
  const at = {
    left: { x: -W / 2 + depth / 2, z: sz, rot: Math.PI / 2 },
    right: { x: W / 2 - depth / 2, z: sz, rot: -Math.PI / 2 },
    front: { x: sx, z: -L / 2 + depth / 2, rot: 0 },
    back: { x: sx, z: L / 2 - depth / 2, rot: Math.PI },
  }[wall];
  return { x: round2(at.x), z: round2(at.z), rot: at.rot, wall };
}

// Where a dragged rack ends up: against a wall inside the room, or outside it, one metre beyond the nearest wall.
export function moveRack(plan: Pick<Plan, 'width' | 'length' | 'rack'>, x: number, z: number) {
  if (plan.rack === 'room') {
    const s = snapToWall(plan, x, z, rules.rackBody.depth);
    return { x: s.x, z: s.z };
  }
  const W = plan.width;
  const L = plan.length;
  if (Math.abs(x) > W / 2 + 0.3 || Math.abs(z) > L / 2 + 0.3) return { x: round2(x), z: round2(z) };
  const edges: [string, number][] = [
    ['left', x + W / 2],
    ['right', W / 2 - x],
    ['front', z + L / 2],
    ['back', L / 2 - z],
  ];
  const wall = edges.sort((a, b) => a[1] - b[1])[0][0];
  if (wall === 'left') return { x: round2(-W / 2 - 1.1), z: round2(z) };
  if (wall === 'right') return { x: round2(W / 2 + 1.1), z: round2(z) };
  if (wall === 'front') return { x: round2(x), z: round2(-L / 2 - 1.1) };
  return { x: round2(x), z: round2(L / 2 + 1.1) };
}

// The units of the rack, by what the room needs. Every room gets a power distribution unit; the rest follows from
// the choices: a network switch for networked devices, an audio processor and amplifier, a video switcher for laptops,
// a computer for the meeting platform, a place for the client's laptop.
export function rackItems(plan: Plan, parts: { networked: number }): RackItem[] {
  const items: RackItem[] = [];
  const add = (name: string, u: number, kind: RackKind) => items.push({ name, u, kind });
  const projector = plan.displayType === 'projector';
  const cable = plan.sharing === 'cable' || plan.sharing === 'both';
  const wireless = plan.sharing === 'wireless' || plan.sharing === 'both';
  if (plan.control !== 'none' && (plan.system === 'byod' || plan.displayType !== 'flat' || plan.displays === 2)) {
    add('Control processor', 1, 'control');
  }
  if (plan.displays === 2 || (cable && wireless)) add('Video matrix switcher', 1, 'video');
  else if (cable || wireless) add('Video switcher (HDMI and USB-C)', 1, 'video');
  if (projector || plan.rack === 'outside') {
    add('Video transmitter', 1, 'video');
    add('Video receiver', 1, 'video');
  }
  if (wireless) add('Wireless presentation gateway', 1, 'network');
  if (plan.engine && plan.system !== 'byod') add('Room computer', 2, 'compute');
  if (cable && plan.rack !== 'behind') add("Client's laptop shelf (space kept free)", 2, 'laptop');
  if (plan.dsp) add('Audio processor (DSP)', 1, 'audio');
  if (plan.speakers === 'front' || plan.speakers === 'ceiling' || plan.speakers === 'both') {
    add('Power amplifier', 1, 'audio');
  }
  if (plan.wireless > 0) add('Wireless microphone receiver', 1, 'audio');
  if (parts.networked > 0 || plan.engine || wireless || plan.control === 'table') {
    add('Network switch (PoE)', 1, 'network');
  }
  add('Power distribution unit (PDU)', 1, 'power');
  return items;
}

// The smallest standard rack that holds the units, with a unit or two to spare; the rest is blank panels.
const rackSizes = [6, 10, 12, 16, 20, 24, 32, 42];
const rackHeight = (u: number) => round2(u * rules.rackUnit + 0.2);

export function computeEquipment(plan: Plan, layout: Layout, d: DisplayInfo): Equipment {
  const { length: L, width: W, height: H } = plan;
  const t = layout.table;
  const frontZ = -L / 2;
  const totalW = d.count * d.width + (d.count - 1) * 0.12;
  const displayBottom = d.centerY - d.height / 2;
  const displayTop = d.centerY + d.height / 2;
  const rightEdge = Math.max(totalW / 2, d.whiteboard ? d.whiteboard.x + d.whiteboard.width / 2 : 0);

  // speakers: a pair beside the display, and a grid of ceiling speakers over the seats
  const speakers: Vec3[] = [];
  const wallSpeakers: Vec3[] = [];
  const wallTargets: Vec3[] = [];
  let speakerRadius = 0;
  const speakerDrop = plan.speakerMount === 'pendant' ? rules.pendantDrop : 0;
  if (plan.speakers === 'front' || plan.speakers === 'both') {
    for (const sx of [-1, 1]) {
      const x = sx < 0 ? -(totalW / 2 + 0.4) : rightEdge + 0.4;
      wallSpeakers.push([round2(x), d.centerY, frontZ + 0.1]);
      wallTargets.push([0, rules.earHeight, t.z]);
    }
  }
  if (plan.speakers === 'ceiling' || plan.speakers === 'both') {
    const drop = Math.max(0.5, H - speakerDrop - rules.earHeight);
    speakerRadius = round2(drop * Math.tan((rules.speakerAngle[plan.speakerSize] * Math.PI) / 180));
    // basic: spaced at about the ceiling height; good: circles that just meet; full: circles that overlap
    const angle = (rules.speakerAngle[plan.speakerSize] * Math.PI) / 180;
    const spacing =
      plan.speakerCoverage === 'basic'
        ? (H - speakerDrop) * Math.tan(angle)
        : speakerRadius * rules.coverageSpacing[plan.speakerCoverage];
    const zoneW = Math.min(W - 0.4, t.width + 2.4);
    // rows of desks have their chairs on one side only
    const zoneL = Math.min(L - 0.4, t.length + (layout.rows ? 1.6 : 2.0 + (layout.endChairs ? 1.4 : 0)));
    let nx = Math.max(1, Math.ceil(zoneW / spacing));
    // no speaker on the centre line, where a ceiling microphone hangs
    if ((plan.mics === 'ceiling' || plan.mics === 'pendant') && nx % 2 === 1) nx += 1;
    const nz = Math.max(2, Math.ceil(zoneL / spacing));
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        speakers.push([
          round2(((i + 0.5) * zoneW) / nx - zoneW / 2),
          round2(H - speakerDrop - 0.02),
          round2(t.z + ((j + 0.5) * zoneL) / nz - zoneL / 2),
        ]);
      }
    }
  }

  // microphones: arrays in the ceiling or hung on cords (a boardroom or classroom has at least two), microphones on
  // the table, or a gooseneck at every second seat
  const mics: Vec3[] = [];
  let micRadius = 0;
  const micDrop = plan.mics === 'pendant' ? rules.pendantDrop : 0;
  if (plan.mics === 'ceiling' || plan.mics === 'pendant') {
    const drop = Math.max(0.5, H - micDrop - rules.earHeight);
    micRadius = round2(drop * Math.tan((rules.ceilingMicHalfAngle * Math.PI) / 180));
    const least = plan.roomType === 'boardroom' || plan.roomType === 'training' ? 2 : 1;
    const n = Math.max(least, Math.ceil(t.length / rules.micArrayEvery));
    for (let i = 0; i < n; i++)
      mics.push([0, round2(H - micDrop - 0.02), round2(t.z + ((i + 0.5) / n - 0.5) * t.length)]);
  } else if (plan.mics === 'table') {
    micRadius = 1.4;
    const n = plan.roomType === 'huddle' ? 1 : Math.max(1, Math.ceil(plan.seats / rules.tableMicEvery));
    // a table camera stands in the middle; a microphone that would stand on it is moved a little along the table
    for (const [x, z] of alongPath(layout.path, n)) {
      const near = plan.tableCamera && Math.hypot(x - layout.center[0], z - (layout.center[1] - 0.22)) < 0.35;
      const edge = t.z + t.length / 2 - 0.1;
      mics.push([x, 0.78, near ? round2(Math.min(z + 0.4, edge)) : z]);
    }
  } else if (plan.mics === 'gooseneck') {
    micRadius = 0.9;
    layout.seats.forEach((s, i) => {
      // the base stands on the tabletop, 15 cm in from the edge the chair faces
      if (i % 2 === 0) mics.push([round2(s.x + Math.sin(s.rot) * 0.57), 0.78, round2(s.z + Math.cos(s.rot) * 0.57)]);
    });
  }

  // An all-in-one bar sits on the centre line of the display, above it or below it.
  let bar: Equipment['bar'] = null;
  const cameras: CameraSpec[] = [];
  const target: Vec3 = [0, 1.1, t.z];
  if (plan.bar !== 'none') {
    const b = rules.bar[plan.bar];
    const y =
      plan.cameraSpot === 'below'
        ? Math.max(0.5, displayBottom - 0.06 - b.height / 2)
        : Math.min(H - 0.15, displayTop + 0.06 + b.height / 2);
    bar = { pos: [0, round2(y), round2(frontZ + b.depth / 2)], width: b.width, height: b.height, depth: b.depth };
    cameras.push({ pos: [0, round2(y), round2(frontZ + 0.1)], target, hfov: 90, vfov: 55, kind: 'bar', wall: 'front' });
  }

  // Common PTZ placements: one on the centre line of the display (above it, or below it at eye level), two beside the
  // display (or one above and one below it), or two on each side. Whenever there is a presenter, a camera of their own
  // is added at the back of the room, aimed at wherever they stand. The front cameras are modelled on the Q-SYS
  // NC-12x80 (12x zoom, 80 degrees at the wide end), the presenter camera on the NC-20x60 (20x zoom, 60 degrees wide),
  // zoomed in on the presenter.
  const sideY = round2(clamp(d.centerY - 0.2, 1.3, H - 0.3));
  const beside = plan.speakers === 'front' || plan.speakers === 'both' ? 0.85 : 0.45;
  const sideX = (sign: number, step: number) =>
    round2(sign * Math.min(W / 2 - 0.3, (sign < 0 ? totalW / 2 : rightEdge) + beside + step));
  const front = (pos: Vec3, aim: Vec3 = target): CameraSpec => ({
    pos,
    target: aim,
    hfov: 80,
    vfov: 50,
    kind: 'front',
    wall: 'front',
  });
  if (plan.cameras === 'one') {
    const y = plan.cameraSpot === 'below' ? Math.max(0.6, displayBottom - 0.2) : Math.min(H - 0.3, displayTop + 0.22);
    cameras.push(front([0, round2(y), frontZ + 0.12]));
  } else if (plan.cameras === 'two' && plan.cameraSpot === 'both') {
    cameras.push(
      front([0, round2(Math.min(H - 0.3, displayTop + 0.22)), frontZ + 0.12]),
      front([0, round2(Math.max(0.6, displayBottom - 0.2)), frontZ + 0.12]),
    );
  } else if (plan.cameras === 'two' || plan.cameras === 'pairs') {
    const steps = plan.cameras === 'pairs' ? [0, 0.22] : [0];
    for (const step of steps) {
      for (const sx of [-1, 1]) {
        cameras.push(
          front([sideX(sx, step), sideY, frontZ + 0.12], [0, 1.1, round2(t.z + t.length * (step ? 0.3 : 0.2))]),
        );
      }
    }
  }

  // on the side walls, left and right in turn, looking across the table
  for (let k = 0; k < plan.wallCameras; k++) {
    const left = k % 2 === 0;
    const sign = left ? -1 : 1;
    const onSide = left ? Math.ceil(plan.wallCameras / 2) : Math.floor(plan.wallCameras / 2);
    const z = clamp(
      t.z - t.length * 0.1 + (Math.floor(k / 2) - (onSide - 1) / 2) * Math.min(2.2, t.length * 0.4),
      frontZ + 0.8,
      L / 2 - 0.8,
    );
    cameras.push({
      pos: [round2(sign * (W / 2 - 0.12)), round2(Math.min(H - 0.3, 2.2)), round2(z)],
      target: [round2(-sign * (t.width / 2 + 0.45)), 1.15, round2(z + 0.3)],
      hfov: 80,
      vfov: 50,
      kind: 'wall',
      wall: left ? 'left' : 'right',
    });
  }

  // at the back, looking towards the display: the first one follows the presenter
  for (let k = 0; k < plan.backCameras; k++) {
    const x = plan.backCameras === 1 ? 0 : k === 0 ? -W / 4 : W / 4;
    const pos: Vec3 = [round2(x), round2(Math.min(H - 0.3, 2.2)), round2(L / 2 - 0.15)];
    if (k === 0 && plan.presenter) {
      const at = presenterSpot(plan, d);
      cameras.push({ pos, target: [at.x, 1.45, at.z], hfov: 30, vfov: 17, kind: 'presenter', wall: 'back' });
    } else {
      cameras.push({ pos, target: [0, 1.4, round2(frontZ + 1.2)], hfov: 60, vfov: 34, kind: 'back', wall: 'back' });
    }
  }

  // A small round camera in the middle of the table. It looks all round (360 degrees), so it is drawn with a circle
  // of view, not a wedge. A U of tables has no middle, so it stands at the near end of an arm instead.
  if (plan.tableCamera) {
    const middle = t.shape !== 'u';
    const x = middle ? layout.center[0] : -t.width / 2 + 0.45;
    const z = middle ? layout.center[1] - 0.22 : t.z - t.length / 2 + 0.35;
    cameras.push({
      pos: [round2(x), 0.87, round2(z)],
      target: [round2(x), 1.2, round2(z + 1)],
      hfov: 360,
      vfov: 90,
      kind: 'table',
      wall: 'table',
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

  // laptops on a cable plug into a panel on the table, or into the tabletop where there is no panel; a wireless
  // sharing button stands on the table beside them, two for a big table
  const cable = plan.sharing === 'cable' || plan.sharing === 'both';
  const wirelessShare = plan.sharing === 'wireless' || plan.sharing === 'both';
  const sockets = panels.length ? panels : alongPath(layout.path, 1).map(([x, z]): Vec3 => [x, 0.765, z]);
  const laptopInputs: Vec3[] = cable ? sockets.slice(0, 2) : [];
  const pucks: Vec3[] = wirelessShare
    ? alongPath(layout.path, plan.seats >= 6 ? 2 : 1).map(([x, z]): Vec3 => [round2(x + 0.2), 0.77, z])
    : [];

  // the rack: a box behind the display, a rack standing against a wall, or one outside the room
  const networked =
    (plan.mics === 'ceiling' || plan.mics === 'pendant' ? mics.length : 0) +
    ptzCameras({ cameras } as Equipment).length;
  let rack: Equipment['rack'] = null;
  if (plan.rack !== 'none') {
    const items = rackItems(plan, { networked });
    const used = items.reduce((sum, i) => sum + i.u, 0);
    const u = plan.rack === 'behind' ? 6 : (rackSizes.find((s) => s >= used + 1) ?? used);
    const body = rules.rackBody;
    if (plan.rack === 'behind') {
      rack = {
        mode: 'behind',
        pos: [0, round2(d.centerY), round2(frontZ - 0.06)],
        rot: Math.PI,
        wall: 'front',
        outside: false,
        u,
        items,
        width: 0.5,
        height: round2(u * rules.rackUnit + 0.05),
        depth: 0.12,
      };
    } else if (plan.rack === 'room') {
      const s = snapToWall(plan, plan.rackX ?? -W / 2 + 0.5, plan.rackZ ?? frontZ + 0.5, body.depth);
      rack = {
        mode: 'room',
        pos: [s.x, 0, s.z],
        rot: s.rot,
        wall: s.wall,
        outside: false,
        u,
        items,
        width: body.width,
        height: rackHeight(u),
        depth: body.depth,
      };
    } else {
      const x = plan.rackX ?? -W / 2 - 1.1;
      const z = plan.rackZ ?? frontZ + 0.9;
      const inside = Math.abs(x) < W / 2 && Math.abs(z) < L / 2;
      rack = {
        mode: 'outside',
        pos: [x, 0, z],
        // its front faces the room, square to the wall it stands beside
        rot: inside
          ? 0
          : Math.abs(x) - W / 2 >= Math.abs(z) - L / 2
            ? x < 0
              ? Math.PI / 2
              : -Math.PI / 2
            : z < 0
              ? 0
              : Math.PI,
        wall: null,
        outside: !inside,
        u,
        items,
        width: body.width,
        height: rackHeight(u),
        depth: body.depth,
      };
    }
  }

  // the cabinet with the wireless microphones, against a wall; by default in the corner next to the display wall
  let credenza: Equipment['credenza'] = null;
  if (plan.wireless > 0) {
    const c = rules.credenza;
    const s = snapToWall(plan, plan.credenzaX ?? W / 2 - 0.6, plan.credenzaZ ?? frontZ + 0.5, c.depth);
    credenza = {
      pos: [s.x, 0, s.z],
      rot: s.rot,
      wall: s.wall,
      mics: plan.wireless === 4 ? ['handheld', 'handheld', 'lapel', 'lapel'] : ['handheld', 'lapel'],
    };
  }

  // Cables run from the table down to the floor, along it to the wall, and up the wall to the equipment: the bar or the
  // display, or the rack. They are drawn dashed, as if under the floor, so furniture hides them.
  const cables: Cable[] = [];
  const floor = 0.012;
  const lane = (n: number) => round2(frontZ + 0.06 + n * 0.05);
  const toBox = (from: Vec3, n: number): Vec3[] => {
    const bundle = lane(n);
    if (rack && rack.mode !== 'behind') {
      const [rx, , rz] = rack.pos;
      return [from, [from[0], floor, from[2]], [from[0], floor, rz], [rx, floor, rz], [rx, 0.9, rz]];
    }
    const y = bar ? bar.pos[1] : Math.max(0.3, displayBottom - 0.1);
    const x = bar ? bar.pos[0] : 0;
    return [from, [from[0], floor, from[2]], [from[0], floor, bundle], [x, floor, bundle], [x, y, bundle]];
  };
  laptopInputs.forEach((p, i) =>
    cables.push({ kind: 'laptop', label: 'HDMI and USB-C', points: toBox([p[0], 0.77, p[2]], i).map(round3) }),
  );
  if (control && plan.control === 'table') {
    cables.push({
      kind: 'control',
      label: 'Control, network cable',
      points: toBox([control[0], 0.77, control[2]], 2).map(round3),
    });
  }
  if (rack && rack.mode !== 'behind') {
    const [rx, , rz] = rack.pos;
    const wallZ = lane(3);
    cables.push({
      kind: 'display',
      label: 'HDMI to the display',
      points: [
        [rx, 0.9, rz],
        [rx, floor, rz],
        [rx, floor, wallZ],
        [0, floor, wallZ],
        [0, round2(displayBottom - 0.1), wallZ],
      ].map((p) => round3(p as Vec3)),
    });
  }

  return {
    speakers,
    speakerRadius,
    speakerDrop,
    wallSpeakers,
    wallTargets,
    bar,
    mics,
    micRadius,
    micDrop,
    wireless: plan.wireless,
    cameras,
    panels,
    control,
    laptopInputs,
    pucks,
    cables,
    credenza,
    rack,
  };
}

const round3 = (p: Vec3): Vec3 => [
  Math.round(p[0] * 1000) / 1000,
  Math.round(p[1] * 1000) / 1000,
  Math.round(p[2] * 1000) / 1000,
];

// ---------------------------------------------------------------- the equipment list and warnings

export type Item = { name: string; qty: number; note?: string };
export const systemName: Record<RoomSystem, string> = {
  byod: 'BYOD gateway (cable or wireless sharing)',
  teams: 'Microsoft Teams Rooms system',
  zoom: 'Zoom Rooms system',
  webex: 'Webex room system',
  meet: 'Google Meet room system',
};

export const speakerSizeLabel: Record<SpeakerSize, string> = { 4: '4 to 5 in', 7: '7 in', 8: '8 in', 10: '10 in' };

export const coverageNote: Record<CeilingCoverage, string> = {
  basic: 'Basic coverage: spaced at about the ceiling height, enough for speech.',
  good: 'Good coverage: even sound, with no gaps between the speakers.',
  full: 'Full coverage: closer together, for even sound and music everywhere.',
};

export type Analysis = {
  layout: Layout;
  displays: DisplayInfo;
  gear: Equipment;
  items: Item[];
  warnings: string[];
};

// The devices powered over their network cable: the PTZ cameras and the ceiling microphone arrays (the speakers run
// from the audio processor, and a bar or a table camera brings its own power and cable). One of them plugs straight
// into the room's network point; two or more need a PoE switch.
export const ptzCameras = (gear: Equipment) => gear.cameras.filter((c) => c.kind !== 'bar' && c.kind !== 'table');
export const poeDevices = (plan: Plan, gear: Equipment) =>
  (plan.mics === 'ceiling' || plan.mics === 'pendant' ? gear.mics.length : 0) + ptzCameras(gear).length;
export const needsSwitch = (plan: Plan, gear: Equipment) => poeDevices(plan, gear) >= 2;

const count = (cams: CameraSpec[], kind: CameraKind) => cams.filter((c) => c.kind === kind).length;

export function analyze(plan: Plan): Analysis {
  const layout = computeLayout(plan);
  const displays = computeDisplays(plan, layout);
  const gear = computeEquipment(plan, layout, displays);
  const u = plan.unit;
  const items: Item[] = [];

  const shown = `Recommended size for this room: ${displays.recommended}". Farthest seat ${formatLength(displays.farthest, u)} away; small text is comfortable up to ${formatLength(displays.maxDistance, u)}.`;
  if (plan.displayType === 'led') {
    items.push({
      name: `LED video wall, about ${displays.size}" (${formatLength(displays.width, u)} × ${formatLength(displays.height, u)})`,
      qty: 1,
      note: `Built to size from cabinets. ${shown}`,
    });
  } else if (plan.displayType === 'projector') {
    items.push({
      name: 'Projector',
      qty: displays.count,
      note: displays.projector?.short
        ? 'Short-throw, hung from the ceiling close to the screen: the room is too short for a standard lens.'
        : 'Standard lens, hung from the ceiling in front of the screen.',
    });
    items.push({ name: `Retractable screen, ${displays.size}"`, qty: displays.count, note: shown });
  } else {
    items.push({
      name: `${displays.size}" display`,
      qty: displays.count,
      note: plan.speakers === 'display' ? `${shown} The sound comes from the display's own speakers.` : shown,
    });
  }
  if (plan.whiteboard)
    items.push({ name: 'Interactive whiteboard, 86"', qty: 1, note: 'On the display wall, beside the display.' });
  if (plan.sharing === 'cable' || plan.sharing === 'both')
    items.push({ name: 'Laptop sharing cable (HDMI and USB-C)', qty: 1, note: 'Bring your own device, on a cable.' });
  if (plan.sharing === 'wireless' || plan.sharing === 'both')
    items.push({
      name: 'Wireless presentation gateway',
      qty: 1,
      note: 'Share a laptop to the display without a cable (a ClickShare or AirMedia type).',
    });

  if (plan.bar !== 'none') {
    items.push({
      name: 'All-in-one video bar: camera, microphones and speakers',
      qty: 1,
      note:
        plan.bar === 'compact'
          ? 'For huddle rooms, like a Logitech Rally Bar Huddle or Poly Studio X30.'
          : 'For medium rooms, like a Logitech Rally Bar, Poly Studio X72 or Neat Bar Pro.',
    });
  }
  if (plan.speakers === 'front' || plan.speakers === 'both')
    items.push({
      name: 'Slim wall speakers beside the display',
      qty: 2,
      note: 'Line-array columns about 60 mm wide, like a K-array Kobra.',
    });
  if (plan.speakers === 'ceiling' || plan.speakers === 'both') {
    items.push({
      name: `Ceiling speakers, ${speakerSizeLabel[plan.speakerSize]}, ${plan.speakerMount === 'pendant' ? 'hung on cords' : 'flush in the ceiling'}`,
      qty: gear.speakers.length,
      note: coverageNote[plan.speakerCoverage],
    });
  }
  if (plan.mics === 'ceiling')
    items.push({
      name:
        plan.micShape === 'round'
          ? 'Ceiling microphone array, round 25 in (635 mm)'
          : 'Ceiling microphone array, square 24 in (604 mm)',
      qty: gear.mics.length,
    });
  if (plan.mics === 'pendant')
    items.push({
      name: 'Pendant ceiling microphones, lowered on cords',
      qty: gear.mics.length,
      note: 'Hung above the table; they can retract into the ceiling.',
    });
  if (plan.mics === 'table') items.push({ name: 'Table microphones', qty: gear.mics.length });
  if (plan.mics === 'gooseneck')
    items.push({
      name: 'Gooseneck microphones (conference system)',
      qty: gear.mics.length,
      note: 'One for every two seats, as in courts and council rooms.',
    });
  if (plan.wireless > 0)
    items.push({
      name: 'Wireless microphones, handheld or lapel (interchangeable)',
      qty: plan.wireless,
      note: plan.presenter ? 'The presenter takes one; a receiver sits in the rack.' : 'A receiver sits in the rack.',
    });
  if (plan.dsp) items.push({ name: 'Audio processor (echo cancellation and mixing)', qty: 1 });
  const parts = gear.rack?.items ?? rackItems(plan, { networked: 0 });
  const has = (text: string) => parts.some((i) => i.name.startsWith(text));
  if (has('Power amplifier')) items.push({ name: 'Power amplifier', qty: 1, note: 'Drives the speakers.' });
  if (has('Control processor')) items.push({ name: 'Control processor', qty: 1, note: 'Runs the touch panel.' });
  if (has('Video switcher') || has('Video matrix'))
    items.push({ name: has('Video matrix') ? 'Video matrix switcher' : 'Video switcher (HDMI and USB-C)', qty: 1 });
  if (has('Video transmitter'))
    items.push({ name: 'Video transmitter and receiver (a pair)', qty: 1, note: 'A long run to the display.' });
  if (needsSwitch(plan, gear))
    items.push({
      name: 'Network switch with PoE',
      qty: 1,
      note: 'Powers the ceiling microphones and the PTZ cameras over one cable each.',
    });
  const front = count(gear.cameras, 'front');
  if (front)
    items.push({
      name: front === 1 ? 'PTZ camera, 12x zoom, 80° wide view' : 'PTZ cameras, 12x zoom, with automatic switching',
      qty: front,
      note: plan.cameras === 'pairs' ? 'Two on each side of the display, switched without a visible cut.' : undefined,
    });
  if (count(gear.cameras, 'wall'))
    items.push({
      name: 'PTZ cameras on the side walls',
      qty: count(gear.cameras, 'wall'),
      note: 'Face-on views across the table.',
    });
  if (count(gear.cameras, 'back'))
    items.push({ name: 'PTZ cameras at the back of the room', qty: count(gear.cameras, 'back') });
  if (count(gear.cameras, 'presenter'))
    items.push({
      name: 'PTZ presenter camera, 20x zoom',
      qty: 1,
      note: 'At the back of the room; it follows the presenter.',
    });
  if (plan.tableCamera)
    items.push({
      name: 'Table camera, small and round',
      qty: 1,
      note: 'Close-up faces of the people around the table.',
    });
  if (gear.panels.length) items.push({ name: 'Table connection panel', qty: gear.panels.length });
  if (plan.control === 'table') items.push({ name: 'Touch panel on the table', qty: 1 });
  if (plan.control === 'wall') items.push({ name: 'Touch panel on the wall', qty: 1 });
  items.push({
    name: systemName[plan.system],
    qty: 1,
    note:
      plan.system === 'byod'
        ? undefined
        : plan.engine
          ? 'Runs on a room computer of its own.'
          : 'Runs on the video bar itself.',
  });
  if (gear.pucks.length)
    items.push({
      name: 'Wireless sharing button for the table',
      qty: gear.pucks.length,
      note: 'Plugs into a laptop; a click shares the screen.',
    });
  if (gear.credenza)
    items.push({
      name: 'Cabinet for the wireless microphones',
      qty: 1,
      note: 'A small credenza with the charger; it can stand against any wall.',
    });
  if (gear.rack) {
    const used = gear.rack.items.reduce((sum, i) => sum + i.u, 0);
    items.push(
      gear.rack.mode === 'behind'
        ? {
            name: 'Equipment box on the wall behind the display',
            qty: 1,
            note: `${used} units of equipment, hidden behind the display.`,
          }
        : {
            name: `AV equipment rack, ${gear.rack.u} U`,
            qty: 1,
            note: gear.rack.outside ? 'Outside the room, location to be confirmed.' : 'In the room, against a wall.',
          },
    );
  }
  items.push({ name: 'Installation, cabling, programming and commissioning', qty: 1 });

  const warnings: string[] = [];
  if (!layout.fits) {
    warnings.push(
      'The table and chairs do not fit this room with comfortable clearance. Reduce the seats or enlarge the room.',
    );
  }
  if (!displays.wallFits)
    warnings.push(
      plan.whiteboard
        ? 'The display and the whiteboard do not fit the front wall. Choose a smaller display or a wider room.'
        : 'The display does not fit the front wall at this size. Choose a smaller size or one display.',
    );
  if (displays.farthest > displays.maxDistance) {
    warnings.push(
      `The farthest seat is ${formatLength(displays.farthest, u)} from the display; small text is hard to read beyond ${formatLength(displays.maxDistance, u)}. Choose a larger display or sit closer.`,
    );
  }
  const hasMics = plan.mics !== 'none' || plan.bar !== 'none';
  if (plan.system !== 'byod' && !hasMics)
    warnings.push('A room system is selected but there are no microphones: the far end will not hear the room.');
  if (plan.system !== 'byod' && gear.cameras.length === 0)
    warnings.push('A room system is selected but there is no camera: the far end will not see the room.');
  if (gear.cameras.length > 0 && !hasMics)
    warnings.push('A camera without microphones: remote people will see the room but not hear it.');
  if (plan.speakers === 'none' && plan.bar === 'none')
    warnings.push('No speakers: people in the room will not hear remote participants.');
  if (gear.rack?.mode === 'behind' && gear.rack.items.reduce((sum, i) => sum + i.u, 0) > 6) {
    warnings.push('There is more equipment than fits in a box behind the display. Put it in a rack in the room.');
  }
  if (
    (plan.speakers === 'ceiling' || plan.speakers === 'both') &&
    plan.height - gear.speakerDrop > rules.speakerMaxHeight[plan.speakerSize]
  ) {
    warnings.push(
      `The ceiling is ${formatLength(plan.height, u)}: ${speakerSizeLabel[plan.speakerSize]} ceiling speakers suit ceilings up to ${formatLength(rules.speakerMaxHeight[plan.speakerSize], u)}. Choose larger speakers, or hang them on cords.`,
    );
  }
  if ((plan.speakers === 'ceiling' || plan.speakers === 'both') && !plan.dsp)
    warnings.push('Ceiling speakers need an audio processor with amplification.');
  return { layout, displays, gear, items, warnings };
}

// ---------------------------------------------------------------- packages as starting points

// What each package adds to a room, for each kind of room, on top of `bare`. A huddle is a video bar and a touch panel
// from the start; the packages add sharing, a room computer, a table microphone and a table camera, never an audio
// processor or ceiling parts. In the larger rooms the first package is a bar or a few devices, the middle one is
// separate parts (camera, ceiling or table microphones, wall and ceiling speakers, an audio processor, wireless
// microphones), and the top one adds more cameras, denser ceiling audio and wireless sharing. A presenter always gets
// a camera of their own and wireless microphones.
export const presetChoices: Record<RoomType, Record<Preset, Partial<Plan>>> = {
  huddle: {
    essential: { bar: 'compact', control: 'table', rack: 'behind' },
    standard: { bar: 'compact', control: 'table', sharing: 'cable', tablePanels: true, rack: 'behind' },
    premium: {
      bar: 'compact',
      engine: true,
      mics: 'table',
      tableCamera: true,
      control: 'table',
      sharing: 'cable',
      tablePanels: true,
      rack: 'behind',
    },
  },
  conference: {
    essential: { bar: 'large', sharing: 'cable', tablePanels: true, control: 'table', rack: 'behind' },
    standard: {
      cameras: 'one',
      mics: 'ceiling',
      speakers: 'both',
      speakerCoverage: 'basic',
      dsp: true,
      wireless: 2,
      sharing: 'cable',
      tablePanels: true,
      control: 'table',
      rack: 'room',
    },
    premium: {
      displays: 2,
      cameras: 'one',
      wallCameras: 2,
      presenter: true,
      mics: 'ceiling',
      speakers: 'both',
      speakerCoverage: 'full',
      dsp: true,
      wireless: 4,
      sharing: 'both',
      tablePanels: true,
      control: 'table',
      rack: 'room',
    },
  },
  boardroom: {
    essential: {
      cameras: 'one',
      presenter: true,
      mics: 'ceiling',
      speakers: 'front',
      sharing: 'cable',
      tablePanels: true,
      control: 'table',
      rack: 'room',
    },
    standard: {
      displays: 2,
      cameras: 'two',
      presenter: true,
      mics: 'ceiling',
      speakers: 'both',
      speakerCoverage: 'basic',
      dsp: true,
      wireless: 2,
      sharing: 'cable',
      tablePanels: true,
      control: 'table',
      rack: 'room',
    },
    premium: {
      displays: 2,
      cameras: 'pairs',
      presenter: true,
      mics: 'ceiling',
      speakers: 'both',
      speakerCoverage: 'good',
      dsp: true,
      wireless: 4,
      sharing: 'both',
      tablePanels: true,
      control: 'table',
      rack: 'outside',
    },
  },
  training: {
    essential: { bar: 'large', presenter: true, speakers: 'front', sharing: 'cable', control: 'wall', rack: 'room' },
    standard: {
      cameras: 'one',
      presenter: true,
      mics: 'ceiling',
      speakers: 'both',
      speakerCoverage: 'basic',
      dsp: true,
      wireless: 2,
      sharing: 'cable',
      control: 'wall',
      rack: 'room',
    },
    premium: {
      displays: 2,
      cameras: 'two',
      presenter: true,
      mics: 'ceiling',
      speakers: 'both',
      speakerCoverage: 'good',
      dsp: true,
      wireless: 4,
      sharing: 'both',
      control: 'wall',
      rack: 'room',
    },
  },
};

export const presetText: Record<RoomType, Record<Preset, string>> = {
  huddle: {
    essential: 'An all-in-one video bar and a touch panel on the table',
    standard: 'Video bar, touch panel, and a cable at the table for laptops',
    premium: 'Video bar with its own room computer, a table microphone, a round table camera and a touch panel',
  },
  conference: {
    essential: 'A larger video bar, a touch panel, and laptops on a cable at the table',
    standard:
      'A camera above the display, ceiling microphone, wall and ceiling speakers, audio processor, two wireless microphones, table touch panel',
    premium:
      'Two displays, cameras above and on both side walls, a presenter camera, full ceiling audio, four wireless microphones, wireless sharing',
  },
  boardroom: {
    essential: 'One display, ceiling microphones, a camera and a presenter camera, wall speakers, touch panel',
    standard:
      'Two displays, two cameras beside them and a presenter camera, wall and ceiling speakers, audio processor, two wireless microphones',
    premium:
      'Two displays, two cameras on each side of the display and a presenter camera, good ceiling audio, four wireless microphones, wireless sharing, the rack outside the room',
  },
  training: {
    essential: 'A video bar, a presenter camera, wall speakers and a touch panel on the wall',
    standard:
      'A camera above the display and a presenter camera, ceiling microphones, wall and ceiling speakers, audio processor, two wireless microphones',
    premium:
      'Two displays, two cameras and a presenter camera, good ceiling audio, four wireless microphones, wireless sharing',
  },
};

export function applyPreset(plan: Plan, preset: Preset): Plan {
  return normalizePlan({
    ...plan,
    ...bare,
    displaySize: null,
    speakerCones: false,
    micCoverage: false,
    cameraView: false,
    listeningPlane: false,
    ...presetChoices[plan.roomType][preset],
  });
}
// ---------------------------------------------------------------- ready-made rooms

export type ScenarioId = 'huddle' | 'semi' | 'screen' | 'team' | 'boardroom' | 'classroom' | 'workshop' | 'roundtable';
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
    about: 'A small room with a video bar (camera, microphones and speakers in one) and a touch panel on the table.',
    type: 'huddle',
    preset: 'essential',
    changes: {},
  },
  {
    id: 'semi',
    label: 'Huddle with a semi-round table',
    about:
      'A small room with a half-round table against the display wall, five people around the curve, a video bar and a cable for laptops.',
    type: 'huddle',
    preset: 'standard',
    changes: { shape: 'semi', seats: 5 },
  },
  {
    id: 'screen',
    label: 'Screen-share room',
    about:
      'The simplest room: a display with a cable to the table. Plug in a laptop and share, with the sound from the display.',
    type: 'huddle',
    preset: 'essential',
    changes: {
      bar: 'none',
      engine: false,
      system: 'byod',
      speakers: 'display',
      sharing: 'cable',
      tablePanels: true,
      control: 'none',
      rack: 'behind',
    },
  },
  {
    id: 'team',
    label: 'Team room for eight',
    about:
      'A rectangular table, a camera above the display, ceiling microphone and speakers, audio processor and a touch panel.',
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
    about:
      'A boat-shaped table, two displays, good ceiling audio, two cameras on each side of the display and a presenter camera, the rack in its own room.',
    type: 'boardroom',
    preset: 'premium',
    changes: { seats: 12 },
  },
  {
    id: 'classroom',
    label: 'Classroom for eighteen',
    about:
      'Three rows of two-seat desks facing the display and an interactive whiteboard, a camera and a presenter camera, a touch panel on the wall.',
    type: 'training',
    preset: 'standard',
    changes: { seats: 18, whiteboard: true },
  },
  {
    id: 'workshop',
    label: 'Workshop in a U',
    about: 'Tables in a U, open towards the display, so the presenter can walk in the middle; a camera follows them.',
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
  'speakerCoverage',
  'bar',
  'tableCamera',
  'wallCameras',
  'backCameras',
  'wireless',
  'dsp',
  'engine',
  'sharing',
  'speakerSize',
  'speakerMount',
  'displayType',
  'whiteboard',
  'rack',
  'rackX',
  'rackZ',
  'credenzaX',
  'credenzaZ',
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
  semi: 'semi-round',
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
