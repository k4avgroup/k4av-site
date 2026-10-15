// Room planner model: everything that can be worked out without a browser.
// All lengths are in metres; the UI converts to feet. The room spans x in [-width/2, width/2], z in
// [-length/2, length/2] and y from 0 to height. The display wall (the "front") is at z = -length/2, the table's
// long side runs along z, and the audience faces -z.
//
// The numbers in `rules` are starting values for a pilot, taken from common AV rules of thumb. They are meant to be
// tuned by someone who commissions these rooms; the planner is an indicative sketch, not an engineering drawing.

export type Unit = 'm' | 'ft';
export type TableShape = 'rect' | 'round';
export type TablePosition = 'center' | 'back' | 'front';
export type Speakers = 'none' | 'soundbar' | 'front' | 'ceiling';
export type Mics = 'none' | 'integrated' | 'table' | 'ceiling';
export type Cameras = 'none' | 'one' | 'two' | 'four';
export type Control = 'none' | 'table' | 'wall';
export type RoomSystem = 'byod' | 'teams' | 'zoom' | 'webex' | 'meet';
export type Preset = 'essential' | 'standard' | 'premium';
export type Vec3 = [number, number, number];

export type Plan = {
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
  displays: 1 | 2;
  displaySize: number | null;
  readability: number;
  speakers: Speakers;
  speakerCones: boolean;
  listeningPlane: boolean;
  mics: Mics;
  micCoverage: boolean;
  cameras: Cameras;
  cameraView: boolean;
  tablePanels: boolean;
  control: Control;
  system: RoomSystem;
};

export const limits = {
  length: [2.5, 12],
  width: [2.5, 12],
  height: [2.3, 5],
  seats: [2, 24],
} as const;

export const rules = {
  seatPitch: 0.7, // metres of table edge per person
  chairOffset: 0.42, // table edge to chair centre
  frontClearance: 1.4, // display wall to the table
  backClearance: 1.0,
  aisle: 0.95, // space behind a chair
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
} as const;

export const defaultPlan: Plan = {
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
  displays: 1,
  displaySize: null,
  readability: 0.5,
  speakers: 'front',
  speakerCones: false,
  listeningPlane: false,
  mics: 'ceiling',
  micCoverage: false,
  cameras: 'one',
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

// Clamps and repairs a plan, so anything that arrives from the address bar is safe to use.
export function normalizePlan(input: Partial<Record<keyof Plan, unknown>> = {}): Plan {
  const d = defaultPlan;
  const shape = oneOf(input.shape, ['rect', 'round'] as const, d.shape);
  const seats = Math.round(num(input.seats, limits.seats[0], limits.seats[1], d.seats));
  return {
    unit: oneOf(input.unit, ['m', 'ft'] as const, d.unit),
    length: round2(num(input.length, limits.length[0], limits.length[1], d.length)),
    width: round2(num(input.width, limits.width[0], limits.width[1], d.width)),
    height: round2(num(input.height, limits.height[0], limits.height[1], d.height)),
    ceiling: bool(input.ceiling, d.ceiling),
    shape,
    seats: shape === 'round' ? clamp(seats, 3, 14) : seats,
    position: oneOf(input.position, ['center', 'back', 'front'] as const, d.position),
    endChairs: bool(input.endChairs, d.endChairs),
    presenter: bool(input.presenter, d.presenter),
    displays: input.displays === 2 ? 2 : 1,
    displaySize:
      typeof input.displaySize === 'number' && (rules.sizes as readonly number[]).includes(input.displaySize)
        ? input.displaySize
        : null,
    readability: round2(num(input.readability, 0, 1, d.readability)),
    speakers: oneOf(input.speakers, ['none', 'soundbar', 'front', 'ceiling'] as const, d.speakers),
    speakerCones: bool(input.speakerCones, d.speakerCones),
    listeningPlane: bool(input.listeningPlane, d.listeningPlane),
    mics: oneOf(input.mics, ['none', 'integrated', 'table', 'ceiling'] as const, d.mics),
    micCoverage: bool(input.micCoverage, d.micCoverage),
    cameras: oneOf(input.cameras, ['none', 'one', 'two', 'four'] as const, d.cameras),
    cameraView: bool(input.cameraView, d.cameraView),
    tablePanels: bool(input.tablePanels, d.tablePanels),
    control: oneOf(input.control, ['none', 'table', 'wall'] as const, d.control),
    system: oneOf(input.system, ['byod', 'teams', 'zoom', 'webex', 'meet'] as const, d.system),
  };
}

// ---------------------------------------------------------------- table, chairs and where they stand

export type Seat = { x: number; z: number; rot: number };
export type Layout = {
  table: { shape: TableShape; x: number; z: number; length: number; width: number };
  seats: Seat[];
  endChairs: boolean;
  fits: boolean;
};

export function tableSize(shape: TableShape, seats: number, endChairs: boolean) {
  if (shape === 'round') {
    const d = round2(Math.max(1.2, (seats * rules.seatPitch) / Math.PI));
    return { length: d, width: d };
  }
  const regular = Math.max(1, seats - (endChairs ? 2 : 0));
  const perSide = Math.ceil(regular / 2);
  return {
    length: round2(Math.max(1.4, perSide * rules.seatPitch + 0.2)),
    width: seats <= 8 ? 1.2 : seats <= 14 ? 1.4 : 1.6,
  };
}

const facing = (dx: number, dz: number) => Math.atan2(dx, dz);

export function computeLayout(plan: Plan): Layout {
  const { length: L, width: W } = plan;
  const ends = plan.shape === 'rect' && plan.endChairs && plan.seats >= 4;
  const dim = tableSize(plan.shape, plan.seats, ends);
  const endExtra = ends ? 0.7 : 0;
  const zMin = -L / 2 + rules.frontClearance + endExtra + dim.length / 2;
  const zMax = L / 2 - rules.backClearance - endExtra - dim.length / 2;
  const fitsLength = zMin <= zMax;
  const fits = fitsLength && dim.width + 2 * rules.aisle <= W;
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
    const side = (count: number, x: number, rot: number) => {
      for (let i = 0; i < count; i++) {
        seats.push({ x: round2(x), z: round2(tz - dim.length / 2 + ((i + 0.5) * dim.length) / count), rot });
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
  return {
    table: { shape: plan.shape, x: 0, z: round2(tz), length: dim.length, width: dim.width },
    seats,
    endChairs: ends,
    fits,
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
  const lo = rules.displayBottomMin + height / 2;
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

export type CameraSpec = { pos: Vec3; target: Vec3; hfov: number; vfov: number };
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
    const nx = Math.max(1, Math.ceil(zoneW / spacing));
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
    for (let i = 0; i < n; i++) mics.push([0, 0.78, round2(t.z + ((i + 0.5) / n - 0.5) * t.length)]);
  } else if (plan.mics === 'integrated') {
    micRadius = 4.5;
  }

  const target: Vec3 = [0, 1.1, t.z];
  const cameras: CameraSpec[] = [];
  const camY = Math.min(H - 0.3, displayTop + 0.14);
  if (plan.cameras === 'one') {
    cameras.push({ pos: [0, round2(camY), frontZ + 0.12], target, hfov: 110, vfov: 65 });
  } else if (plan.cameras === 'two') {
    for (const sx of [-1, 1]) {
      cameras.push({
        pos: [round2(sx * (totalW / 2 + 0.55)), round2(Math.min(H - 0.3, 2.0)), frontZ + 0.12],
        target: [0, 1.1, round2(t.z + t.length * 0.2)],
        hfov: 80,
        vfov: 50,
      });
    }
  } else if (plan.cameras === 'four') {
    for (const sx of [-1, 1]) {
      cameras.push({
        pos: [round2(sx * (W / 2 - 0.25)), round2(Math.min(H - 0.3, 2.1)), frontZ + 0.15],
        target: [0, 1.1, t.z],
        hfov: 85,
        vfov: 55,
      });
    }
    cameras.push({ pos: [0, round2(H - 0.1), t.z], target: [0, 0.8, t.z], hfov: 100, vfov: 70 });
    cameras.push({
      pos: [0, round2(Math.min(H - 0.3, 2.0)), L / 2 - 0.15],
      target: [0, 1.5, frontZ + 0.5],
      hfov: 85,
      vfov: 55,
    });
  }

  const panels: Vec3[] = [];
  if (plan.tablePanels) {
    const n = Math.max(1, Math.ceil(t.length / rules.panelEvery));
    for (let i = 0; i < n; i++) panels.push([0, 0.765, round2(t.z + ((i + 0.5) / n - 0.5) * t.length)]);
  }
  let control: Vec3 | null = null;
  if (plan.control === 'table') control = [0.35, 0.78, round2(t.z - t.length / 2 + 0.4)];
  if (plan.control === 'wall') control = [-W / 2 + 0.04, 1.35, round2(L / 2 - 1.0)];

  return { speakers, speakerTargets, speakerRadius, soundbar, mics, micRadius, cameras, panels, control };
}

// ---------------------------------------------------------------- the equipment list and warnings

export type Item = { name: string; qty: number; note?: string };
const systemName: Record<RoomSystem, string> = {
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
  if (plan.mics === 'ceiling') items.push({ name: 'Ceiling microphone array', qty: gear.mics.length });
  if (plan.mics === 'table') items.push({ name: 'Table microphones', qty: gear.mics.length });
  if (plan.mics === 'integrated') items.push({ name: 'Microphones built into the bar or camera', qty: 1 });
  const ceilingDevices =
    (plan.speakers === 'ceiling' ? gear.speakers.length : 0) + (plan.mics === 'ceiling' ? gear.mics.length : 0);
  if (plan.mics === 'ceiling' || plan.mics === 'table' || plan.speakers === 'ceiling') {
    items.push({ name: 'Audio processor (echo cancellation and mixing)', qty: 1 });
  }
  if (ceilingDevices > 0) items.push({ name: 'Network switch with PoE for ceiling devices', qty: 1 });
  if (plan.cameras === 'one') items.push({ name: 'Wide-angle conferencing camera', qty: 1 });
  if (plan.cameras === 'two') items.push({ name: 'Conferencing cameras with automatic switching', qty: 2 });
  if (plan.cameras === 'four')
    items.push({
      name: 'Cameras with automatic switching',
      qty: 4,
      note: 'Two front corners, one above the table, one at the back.',
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

export function applyPreset(plan: Plan, preset: Preset): Plan {
  const base = {
    ...plan,
    displaySize: null,
    speakerCones: false,
    micCoverage: false,
    cameraView: false,
    listeningPlane: false,
  };
  if (preset === 'essential') {
    return normalizePlan({
      ...base,
      displays: 1,
      speakers: 'soundbar',
      mics: 'integrated',
      cameras: 'one',
      tablePanels: false,
      control: 'none',
    });
  }
  if (preset === 'standard') {
    return normalizePlan({
      ...base,
      displays: 1,
      speakers: 'front',
      mics: 'ceiling',
      cameras: 'two',
      tablePanels: true,
      control: 'table',
    });
  }
  return normalizePlan({
    ...base,
    displays: 2,
    speakers: 'ceiling',
    mics: 'ceiling',
    cameras: 'four',
    tablePanels: true,
    control: 'table',
  });
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

// A short text for the request form. The plan link goes first so it survives the form's length limit.
export function planSummary(plan: Plan, link: string): string {
  const a = analyze(plan);
  const u = plan.unit;
  const lines = [
    `Room planner (pilot): ${link}`,
    `Room ${formatLength(plan.length, u)} x ${formatLength(plan.width, u)}, ceiling ${formatLength(plan.height, u)}.`,
    `Table: ${plan.shape === 'round' ? 'round' : 'rectangular'}, ${plan.seats} seats.`,
    ...a.items.filter((i) => !i.name.startsWith('Installation')).map((i) => `${i.qty} x ${i.name}`),
  ];
  return lines.join('\n').slice(0, 900);
}
