import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyze,
  applyPreset,
  applyRoomType,
  applyScenario,
  computeLayout,
  decodePlan,
  defaultPlan,
  encodePlan,
  moveRack,
  normalizePlan,
  rackItems,
  rules,
  scenarios,
  snapToWall,
  type Plan,
  type RoomType,
} from '../lib/planner/model.ts';
import { filterFlow, signalFlow } from '../lib/planner/flow.ts';
import { buildAllDrawings, cablingPlan, rackElevation } from '../lib/planner/drawings.ts';

const plan = (over: Record<string, unknown> = {}) => normalizePlan({ ...defaultPlan, ...over });
const room = (type: RoomType, preset: 'essential' | 'standard' | 'premium', over: Record<string, unknown> = {}) =>
  normalizePlan({ ...applyPreset(applyRoomType(defaultPlan, type), preset), ...over });
const texts = (d: { prims: { k: string }[] }) =>
  d.prims.filter((p) => p.k === 'text').map((p) => (p as unknown as { t: string }).t);

test('a semi-round table is half a disc on the display wall, with everyone around the curve facing it', () => {
  for (const [type, seats] of [
    ['huddle', 3],
    ['huddle', 5],
    ['huddle', 6],
    ['conference', 8],
  ] as const) {
    const p = normalizePlan({ roomType: type, shape: 'semi', seats, length: 5.5, width: 5.5 });
    assert.equal(p.shape, 'semi');
    assert.equal(p.seats, seats);
    const layout = computeLayout(p);
    const r = layout.table.length;
    assert.equal(layout.seats.length, seats);
    assert.equal(layout.fits, true, `${type} ${seats}`);
    // the flat side is on the wall, and the table does not reach past it
    assert.ok(Math.abs(layout.table.z - r / 2 - -p.length / 2) < 0.011, 'flat side on the wall');
    for (const s of layout.seats) {
      const out = Math.hypot(s.x, s.z + p.length / 2) - r;
      assert.ok(Math.abs(out - rules.chairOffset) < 0.03, `a chair-width from the curve: ${out.toFixed(2)}`);
      assert.ok(s.z >= -p.length / 2, 'in the room');
      // it faces the middle of the flat side, where the display is
      assert.ok(Math.abs(Math.sin(s.rot) * Math.hypot(s.x, s.z + p.length / 2) + s.x) < 0.02, 'faces the wall centre');
    }
  }
  // the other tables are offered where they should be
  assert.equal(normalizePlan({ roomType: 'boardroom', shape: 'semi' }).shape, 'boat');
  assert.equal(normalizePlan({ roomType: 'training', shape: 'semi' }).shape, 'rect');
  assert.ok(planFits('huddle', 4, 3.5, 4));
});
function planFits(type: RoomType, seats: number, width: number, length: number) {
  const p = normalizePlan({ roomType: type, shape: 'semi', seats, width, length });
  return computeLayout(p).fits;
}

test('a huddle table takes one chair at the end, facing the display', () => {
  const four = computeLayout(plan({ roomType: 'huddle', seats: 4, length: 4, width: 3.5, endChairs: false }));
  const five = computeLayout(plan({ roomType: 'huddle', seats: 5, length: 4.5, width: 3.5, endChairs: true }));
  assert.equal(four.seats.length, 4);
  assert.equal(five.seats.length, 5);
  assert.equal(five.endChairs, true);
  const end = five.seats.find((s) => s.x === 0);
  assert.ok(end, 'one chair on the centre line');
  assert.ok(end.z > five.table.z + five.table.length / 2, 'beyond the far end of the table');
  assert.ok(Math.abs(end.rot - Math.PI) < 1e-6, 'looking at the display');
  assert.equal(five.seats.filter((s) => s.x === 0).length, 1, 'only one');
  assert.equal(
    computeLayout(plan({ roomType: 'conference', shape: 'rect', endChairs: true, seats: 8 })).seats.filter(
      (s) => s.x === 0,
    ).length,
    2,
  );
});

test('the display stays put when the camera or the bar goes below it', () => {
  const heights = (over: Record<string, unknown>) => analyze(plan(over)).displays.centerY;
  assert.equal(heights({ cameras: 'one', cameraSpot: 'below' }), heights({ cameras: 'one', cameraSpot: 'above' }));
  assert.equal(heights({ bar: 'large', cameraSpot: 'below' }), heights({ bar: 'large', cameraSpot: 'above' }));
});

test('a laptop cable runs from the table to the wall and up to the bar; a wireless room has buttons instead', () => {
  const cabled = analyze(room('huddle', 'standard'));
  assert.equal(cabled.gear.laptopInputs.length, 1);
  const laptop = cabled.gear.cables.find((c) => c.kind === 'laptop');
  assert.ok(laptop);
  const pts = laptop.points;
  assert.ok(pts[0][1] > 0.7, 'starts at the tabletop');
  assert.ok(
    pts.some((p) => p[1] < 0.02),
    'runs along the floor',
  );
  const last = pts[pts.length - 1];
  assert.ok(Math.abs(last[2] - -2) < 0.2, 'ends at the display wall');
  assert.equal(last[0], cabled.gear.bar?.pos[0], 'into the bar');
  assert.ok(last[1] > 0.5, 'up the wall');
  assert.equal(cabled.gear.pucks.length, 0);
  const wireless = analyze(room('huddle', 'standard', { sharing: 'wireless' }));
  assert.equal(wireless.gear.cables.filter((c) => c.kind === 'laptop').length, 0, 'no cable to the panel');
  assert.equal(wireless.gear.laptopInputs.length, 0);
  assert.equal(wireless.gear.pucks.length, 1);
  assert.equal(analyze(room('conference', 'standard', { sharing: 'wireless', seats: 10 })).gear.pucks.length, 2);
  const both = analyze(room('conference', 'standard', { sharing: 'both' }));
  assert.ok(both.gear.pucks.length >= 1 && both.gear.laptopInputs.length >= 1);
  // a table touch panel gets a control cable; a wall panel does not
  assert.ok(
    analyze(room('conference', 'standard', { control: 'table' })).gear.cables.some((c) => c.kind === 'control'),
  );
  assert.ok(
    !analyze(room('conference', 'standard', { control: 'wall' })).gear.cables.some((c) => c.kind === 'control'),
  );
  // with a rack in the room the cables go to the rack, and the rack feeds the display
  const racked = analyze(room('conference', 'standard'));
  const rackAt = racked.gear.rack?.pos;
  assert.ok(rackAt);
  const toRack = racked.gear.cables.find((c) => c.kind === 'laptop')?.points.at(-1);
  assert.ok(toRack && Math.abs(toRack[0] - rackAt[0]) < 0.01 && Math.abs(toRack[2] - rackAt[2]) < 0.01);
  assert.ok(racked.gear.cables.some((c) => c.kind === 'display'));
  for (const c of racked.gear.cables) for (const p of c.points) assert.ok(p.every(Number.isFinite));
});

test('wireless sharing buttons stand on the table, off the connection panels and on the tabletop', () => {
  for (const shape of ['rect', 'boat', 'round', 'semi', 'u'] as const) {
    const p = plan({ roomType: 'conference', shape, seats: 10, length: 10, width: 10, sharing: 'both' });
    const a = analyze(p);
    assert.ok(a.gear.pucks.length >= 1, shape);
    for (const k of a.gear.pucks) {
      const on = a.layout.tables.some((t) =>
        t.shape === 'round'
          ? Math.hypot(k[0] - t.x, k[2] - t.z) <= t.width / 2
          : t.shape === 'semi'
            ? Math.hypot(k[0] - t.x, k[2] - (t.z - t.length / 2)) <= t.length && k[2] >= t.z - t.length / 2
            : Math.abs(k[0] - t.x) <= t.width / 2 && Math.abs(k[2] - t.z) <= t.length / 2,
      );
      assert.ok(on, `${shape}: a button on the table at ${k}`);
    }
  }
});

test('the cabinet for the wireless microphones stands against a wall and can be put against another', () => {
  const none = analyze(plan({ wireless: 0, presenter: false }));
  assert.equal(none.gear.credenza, null);
  const two = analyze(plan({ wireless: 2 })).gear.credenza;
  const four = analyze(plan({ wireless: 4 })).gear.credenza;
  assert.deepEqual(two?.mics, ['handheld', 'lapel']);
  assert.deepEqual(four?.mics, ['handheld', 'handheld', 'lapel', 'lapel']);
  const W = 6;
  const L = 8;
  const near = (v: number, e: number) => Math.abs(Math.abs(v) - e) < 0.21 + 1e-6;
  assert.ok(near(two!.pos[2], L / 2) || near(two!.pos[0], W / 2), 'against a wall by default');
  // dragged to the back left corner it ends against a wall, facing the room
  const moved = analyze(plan({ wireless: 2, credenzaX: -2.8, credenzaZ: 3.8 })).gear.credenza;
  assert.ok(moved);
  assert.ok(['left', 'back'].includes(moved.wall));
  assert.ok(moved.pos[0] < 0 && moved.pos[2] > 0);
  const s = snapToWall({ width: 6, length: 8 }, -2.9, 0, rules.credenza.depth);
  assert.deepEqual([s.wall, s.rot], ['left', Math.PI / 2]);
  assert.equal(s.x, -3 + rules.credenza.depth / 2);
  assert.equal(snapToWall({ width: 6, length: 8 }, 0, 3.9, 0.4).wall, 'back');
  assert.equal(snapToWall({ width: 6, length: 8 }, 0, -3.9, 0.4).rot, 0);
  // and it stays in the room, whatever the link says
  const wild = plan({ credenzaX: 99, credenzaZ: -99 });
  assert.ok(Math.abs(wild.credenzaX ?? 0) <= 2.75 && Math.abs(wild.credenzaZ ?? 0) <= 3.75);
});

test('the rack holds the devices the room needs, by function, with room kept free for the client laptop', () => {
  const names = (p: Plan) => rackItems(p, { networked: 2 }).map((i) => i.name);
  assert.ok(names(plan()).includes('Power distribution unit (PDU)'), 'every rack has power');
  assert.ok(names(plan({ dsp: true })).includes('Audio processor (DSP)'));
  assert.ok(!names(plan({ dsp: false })).includes('Audio processor (DSP)'));
  assert.ok(names(plan({ speakers: 'ceiling' })).includes('Power amplifier'));
  assert.ok(!names(plan({ speakers: 'display' })).includes('Power amplifier'));
  assert.ok(names(plan({ wireless: 2 })).includes('Wireless microphone receiver'));
  assert.ok(names(plan({ sharing: 'cable', rack: 'room' })).includes("Client's laptop shelf (space kept free)"));
  assert.ok(!names(plan({ sharing: 'wireless', rack: 'room' })).includes("Client's laptop shelf (space kept free)"));
  assert.ok(
    !names(plan({ sharing: 'cable', rack: 'behind' })).some((n) => n.startsWith("Client's laptop")),
    'not behind the display',
  );
  assert.ok(names(plan({ displays: 2 })).includes('Video matrix switcher'));
  assert.ok(names(plan({ sharing: 'cable', displays: 1 })).includes('Video switcher (HDMI and USB-C)'));
  assert.ok(names(plan({ displayType: 'projector' })).includes('Video transmitter'));
  assert.ok(names(plan({ system: 'byod', control: 'table', engine: false })).includes('Control processor'));
  assert.ok(names(plan({ engine: true })).includes('Room computer'));
  // no brand names anywhere
  for (const type of ['huddle', 'conference', 'boardroom', 'training'] as const) {
    for (const preset of ['essential', 'standard', 'premium'] as const) {
      for (const item of analyze(room(type, preset)).gear.rack?.items ?? []) {
        assert.ok(!/extron|crestron|shure|biamp|qsc|netgear|furman|middle atlantic/i.test(item.name), item.name);
      }
    }
  }
});

test('the rack is behind the display, in the room or outside, and is sized to its devices', () => {
  const behind = analyze(room('huddle', 'standard')).gear.rack;
  assert.equal(behind?.mode, 'behind');
  assert.equal(behind?.u, 6);
  assert.ok(behind.pos[2] < -2 && behind.pos[1] > 0.5, 'a box in the wall, at the display');
  const inRoom = analyze(room('conference', 'premium')).gear.rack;
  assert.equal(inRoom?.mode, 'room');
  assert.ok(inRoom.u >= inRoom.items.reduce((n, i) => n + i.u, 0) + 1, 'a unit or more to spare');
  assert.ok([6, 10, 12, 16, 20, 24, 32, 42].includes(inRoom.u));
  assert.ok(Math.abs(inRoom.pos[0]) <= 3 && Math.abs(inRoom.pos[2]) <= 4, 'inside the room');
  const outside = analyze(room('boardroom', 'premium', { seats: 12 })).gear.rack;
  assert.equal(outside?.mode, 'outside');
  assert.equal(outside.outside, true);
  assert.ok(Math.abs(outside.pos[0]) > 3.5 || Math.abs(outside.pos[2]) > 5, 'outside the walls');
  assert.equal(analyze(plan({ rack: 'none' })).gear.rack, null);
  assert.equal(normalizePlan({ rack: 'attic' }).rack, defaultPlan.rack);
  assert.equal(normalizePlan({ roomType: 'huddle', rack: 'attic' }).rack, 'behind');
  // too much for the box behind a display
  const crowded = analyze(
    plan({ rack: 'behind', displays: 2, dsp: true, speakers: 'both', wireless: 4, sharing: 'both' }),
  );
  assert.ok(crowded.warnings.some((w) => w.includes('behind the display')));
  // items in the list
  const items = analyze(room('conference', 'standard')).items.map((i) => i.name);
  assert.ok(
    items.some((n) => n.startsWith('AV equipment rack')) && items.includes('Cabinet for the wireless microphones'),
  );
  assert.ok(analyze(room('huddle', 'standard')).items.some((i) => i.name.startsWith('Equipment box on the wall')));
});

test('a rack that is dragged lands against a wall in the room, or outside it', () => {
  const inside = { width: 6, length: 8, rack: 'room' } as const;
  const s = moveRack(inside, 2.9, 0.4);
  assert.ok(Math.abs(s.x - (3 - rules.rackBody.depth / 2)) < 0.006, 'against the right wall');
  const out = { width: 6, length: 8, rack: 'outside' } as const;
  assert.deepEqual(moveRack(out, -2, 0), { x: -4.1, z: 0 }, 'pushed out of the left wall');
  assert.deepEqual(moveRack(out, 0, 3.8), { x: 0, z: 5.1 }, 'pushed out of the back wall');
  assert.deepEqual(moveRack(out, -5, 1), { x: -5, z: 1 }, 'already outside: stays');
  const kept = plan({ rack: 'outside', rackX: 99, rackZ: -99 });
  assert.ok(
    Math.abs(kept.rackX ?? 0) <= 6 && Math.abs(kept.rackZ ?? 0) <= 7,
    'a rack cannot be dragged to the horizon',
  );
});

test('a table camera looks all round and stands in the middle; the table microphone is not on top of it', () => {
  for (const shape of ['rect', 'round', 'semi'] as const) {
    const a = analyze(room('huddle', 'premium', { shape, seats: 4 }));
    const cam = a.gear.cameras.find((c) => c.kind === 'table');
    assert.ok(cam, shape);
    assert.equal(cam.hfov, 360);
    assert.ok(Math.abs(cam.pos[0]) < 0.1, `${shape}: in the middle`);
    const mic = a.gear.mics[0];
    assert.ok(Math.hypot(mic[0] - cam.pos[0], mic[2] - cam.pos[2]) >= 0.3, `${shape}: microphone clear of the camera`);
  }
});

test('the display can be the only speaker: a screen-share room is a display and a cable', () => {
  const s = applyScenario(defaultPlan, 'screen');
  assert.deepEqual(
    [s.bar, s.system, s.speakers, s.sharing, s.control, s.engine],
    ['none', 'byod', 'display', 'cable', 'none', false],
  );
  const a = analyze(s);
  assert.deepEqual(a.warnings, []);
  assert.equal(a.gear.cameras.length, 0);
  assert.ok(a.items.find((i) => i.name.includes('display'))?.note?.includes('own speakers'));
  assert.ok(
    a.gear.cables.some((c) => c.kind === 'laptop'),
    'a cable to the table',
  );
  const flow = signalFlow(s, a);
  assert.ok(flow.links.some((l) => l.from === 'laptops' && l.signal === 'video'));
  assert.ok(
    !analyze(plan({ speakers: 'display', bar: 'none', mics: 'none', system: 'byod' })).warnings.some((w) =>
      w.includes('No speakers'),
    ),
  );
  const semi = applyScenario(defaultPlan, 'semi');
  assert.deepEqual([semi.shape, semi.seats, semi.roomType], ['semi', 5, 'huddle']);
  assert.deepEqual(analyze(semi).warnings, []);
  assert.ok(scenarios.length >= 8);
});

test('the signal flow can show video, audio, control or power alone', () => {
  const p = room('conference', 'premium');
  const flow = signalFlow(p, analyze(p));
  assert.deepEqual(filterFlow(flow, 'all'), flow);
  for (const signal of ['video', 'audio', 'control', 'power'] as const) {
    const part = filterFlow(flow, signal);
    assert.ok(part.links.length > 0, signal);
    assert.ok(
      part.links.every((l) => l.signal === signal),
      signal,
    );
    const ids = new Set(part.nodes.map((n) => n.id));
    assert.ok(
      part.links.every((l) => ids.has(l.from) && ids.has(l.to)),
      `${signal}: every link has both ends`,
    );
    assert.ok(part.nodes.length < flow.nodes.length, `${signal}: only the boxes it touches`);
  }
  // power: the mains reach the devices in the rack, and PoE reaches the cameras
  const power = filterFlow(flow, 'power');
  assert.ok(power.links.some((l) => l.from === 'pdu' && l.to === 'system'));
  assert.ok(power.links.some((l) => l.from === 'cameras' && l.to === 'switch' && l.label === 'PoE power'));
  // an amplifier sits between the processor and the speakers
  const audio = filterFlow(flow, 'audio');
  assert.ok(audio.links.some((l) => l.from === 'processor' && l.to === 'amp'));
  assert.ok(audio.links.some((l) => l.from === 'amp' && l.to === 'speakers'));
  // a control processor runs the touch panel in a room with a projector
  const projector = plan({ displayType: 'projector', control: 'table' });
  const control = filterFlow(signalFlow(projector, analyze(projector)), 'control');
  assert.ok(control.links.some((l) => l.from === 'touch' && l.to === 'controller'));
});

test('the drawings include a cabling plan and a rack elevation by function, with tags and room for the laptop', () => {
  const p = room('conference', 'standard');
  const a = analyze(p);
  const all = buildAllDrawings(p, a);
  assert.deepEqual(
    all.map((d) => d.id),
    ['floor', 'ceiling', 'front', 'side', 'cabling', 'rack'],
  );
  const rack = rackElevation(p, a);
  const words = texts(rack);
  assert.ok(words.includes('AV system rack elevation'));
  assert.ok(words.includes('Power distribution unit (PDU)'));
  assert.ok(words.includes('PDU-01') && words.includes('DSP-01') && words.includes('PA-01'));
  assert.ok(
    words.some((w) => w.startsWith("Client's laptop")),
    'a place for the laptop',
  );
  assert.ok(words.includes('1') && words.includes(String(a.gear.rack?.u)), 'unit numbers');
  const cabling = cablingPlan(p, a);
  assert.ok(texts(cabling).includes('PROVIDE PULL STRING IN ALL CONDUIT'));
  assert.ok(texts(cabling).includes('AVR'));
  assert.ok(cabling.prims.some((q) => q.k === 'line' && (q as { s: string }).s === 'cable-video'));
  assert.ok(
    cabling.prims.some((q) => q.k === 'line' && (q as { s: string }).s === 'cable-audio'),
    'the speaker loop',
  );
  // the ceiling plan says where the speaker loop goes
  assert.ok(texts(all[1]).includes('TO RACK'));
  // behind the display the rack is shown on the wall
  const huddle = room('huddle', 'standard');
  const h = analyze(huddle);
  assert.ok(texts(rackElevation(huddle, h)).some((w) => w.includes('behind the display')));
  assert.ok(texts(buildAllDrawings(huddle, h)[2]).includes('equipment box behind the display'));
  // no rack: no elevation of one
  const bare = plan({ rack: 'none' });
  assert.ok(texts(rackElevation(bare, analyze(bare))).some((w) => w.startsWith('No rack')));
});

test('a rack outside the room is drawn beside the plan, not off the page', () => {
  const p = room('boardroom', 'premium', { seats: 12 });
  const a = analyze(p);
  const cabling = cablingPlan(p, a);
  const [x, y] = [a.gear.rack?.pos[0] ?? 0, a.gear.rack?.pos[2] ?? 0];
  assert.ok(Math.abs(x) > p.width / 2 || Math.abs(y) > p.length / 2);
  for (const q of cabling.prims) {
    if (q.k === 'rect') assert.ok(q.x >= -0.5 && q.x + q.w <= cabling.width + 0.5, 'a rectangle inside the page');
    if (q.k === 'line') {
      assert.ok(
        q.x1 >= -0.5 && q.x2 >= -0.5 && q.x1 <= cabling.width + 0.5 && q.x2 <= cabling.width + 0.5,
        'a line inside the page',
      );
    }
  }
  assert.ok(texts(cabling).includes('AV rack, location TBD'));
});

test('every new choice travels in the link, and every package draws all six drawings', () => {
  const samples = [
    room('huddle', 'standard', { shape: 'semi', seats: 5 }),
    room('huddle', 'standard', { endChairs: true, seats: 5 }),
    room('conference', 'premium', { rackX: 2.5, rackZ: 1, credenzaX: -2, credenzaZ: 3.6, speakerCoverage: 'full' }),
    room('boardroom', 'premium', { rackX: -5, rackZ: 2 }),
    applyScenario(defaultPlan, 'screen'),
  ];
  for (const p of samples) assert.deepEqual(decodePlan(encodePlan(p)), p);
  for (const type of ['huddle', 'conference', 'boardroom', 'training'] as const) {
    for (const preset of ['essential', 'standard', 'premium'] as const) {
      for (const extra of [
        {},
        { rack: 'outside' },
        { rack: 'none' },
        { rack: 'behind' },
        { sharing: 'both', wireless: 4 },
      ]) {
        const p = room(type, preset, { length: 10, width: 8, ...extra });
        const a = analyze(p);
        for (const d of buildAllDrawings(p, a)) {
          const label = `${type} ${preset} ${JSON.stringify(extra)} ${d.id}`;
          assert.ok(Number.isFinite(d.width) && Number.isFinite(d.height) && d.prims.length > 0, label);
          for (const q of d.prims) {
            const nums = Object.values(q).filter((v) => typeof v === 'number') as number[];
            assert.ok(nums.every(Number.isFinite), `${label}: finite ${q.k}`);
          }
        }
      }
    }
  }
});
