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
  keepClear,
  normalizePlan,
  planSummary,
  roomTypes,
  seatLimits,
  presenterSpot,
  presetText,
  rules,
  scenarios,
  tableShapes,
  tableSize,
  templates,
} from '../lib/planner/model.ts';
import { signalFlow } from '../lib/planner/flow.ts';

const plan = (over: Record<string, unknown> = {}) => normalizePlan({ ...defaultPlan, ...over });

test('the table grows with the number of seats and every seat gets a chair', () => {
  assert.deepEqual(tableSize('rect', 8, false), { length: 3, width: 1.2 });
  assert.equal(tableSize('rect', 16, false).width, 1.6);
  assert.equal(tableSize('round', 8, false).width, 1.78);
  for (const seats of [2, 5, 8, 12, 24]) {
    assert.equal(computeLayout(plan({ seats })).seats.length, seats);
  }
  assert.equal(computeLayout(plan({ shape: 'round', seats: 6 })).seats.length, 6);
  assert.equal(computeLayout(plan({ endChairs: true, seats: 8 })).seats.length, 8);
});

test('the table keeps its distance from the walls and moves with its position', () => {
  const centre = computeLayout(plan({ position: 'center' }));
  const back = computeLayout(plan({ position: 'back' }));
  const front = computeLayout(plan({ position: 'front' }));
  assert.ok(front.table.z < centre.table.z && centre.table.z < back.table.z);
  assert.ok(front.table.z - front.table.length / 2 - -4 >= 1.4 - 1e-9);
  assert.ok(4 - (back.table.z + back.table.length / 2) >= 1 - 1e-9);
});

test('a table that is too big for the room is reported, not silently squeezed', () => {
  const small = analyze(plan({ length: 3, width: 3, seats: 12 }));
  assert.equal(small.layout.fits, false);
  assert.ok(small.warnings.some((w) => w.includes('do not fit')));
  assert.equal(analyze(plan()).layout.fits, true);
});

test('the recommended display grows with distance and with the need to read small text', () => {
  const near = analyze(plan({ length: 5, width: 4, seats: 4 })).displays;
  const far = analyze(plan({ length: 12, width: 8, seats: 20 })).displays;
  assert.ok(far.recommended > near.recommended);
  const low = analyze(plan({ readability: 0 })).displays;
  const high = analyze(plan({ readability: 1 })).displays;
  assert.ok(high.recommended >= low.recommended);
  const forced = analyze(plan({ displaySize: 43 })).displays;
  assert.equal(forced.size, 43);
  assert.ok(forced.maxDistance < high.maxDistance);
});

test('two displays are placed side by side and checked against the wall', () => {
  const two = analyze(plan({ displays: 2, displaySize: 98, width: 5 })).displays;
  assert.equal(two.xs.length, 2);
  assert.equal(two.wallFits, false);
  assert.equal(analyze(plan({ displays: 2 })).displays.xs.length, 2);
});

test('ceiling speakers and microphones scale with the room', () => {
  const small = analyze(plan({ speakers: 'ceiling', length: 5, width: 4, seats: 4 })).gear;
  const large = analyze(plan({ speakers: 'ceiling', length: 12, width: 8, seats: 20 })).gear;
  assert.ok(small.speakers.length >= 2);
  assert.ok(large.speakers.length > small.speakers.length);
  const arrays = analyze(plan({ mics: 'ceiling', length: 12, width: 8, seats: 20 })).gear.mics.length;
  assert.ok(arrays >= 2);
  assert.equal(analyze(plan({ mics: 'ceiling', seats: 6 })).gear.mics.length, 1);
  assert.equal(analyze(plan({ mics: 'table', seats: 9 })).gear.mics.length, 3);
});

test('cameras, panels and controls follow the choices', () => {
  assert.equal(analyze(plan({ cameras: 'none' })).gear.cameras.length, 0);
  assert.equal(analyze(plan({ cameras: 'one' })).gear.cameras.length, 1);
  assert.equal(analyze(plan({ cameras: 'two' })).gear.cameras.length, 2);
  assert.equal(analyze(plan({ cameras: 'three' })).gear.cameras.length, 3);
  assert.equal(analyze(plan({ cameras: 'pairs' })).gear.cameras.length, 4);
  assert.equal(analyze(plan({ tablePanels: false })).gear.panels.length, 0);
  assert.ok(analyze(plan({ tablePanels: true, seats: 14 })).gear.panels.length >= 2);
  assert.equal(analyze(plan({ control: 'none' })).gear.control, null);
  assert.ok(analyze(plan({ control: 'wall' })).gear.control);
});

test('the equipment list adds an audio processor and a PoE switch where the design needs them', () => {
  const ceiling = analyze(plan({ speakers: 'ceiling', mics: 'ceiling' })).items.map((i) => i.name);
  assert.ok(ceiling.some((n) => n.startsWith('Audio processor')));
  assert.ok(ceiling.some((n) => n.startsWith('Network switch')));
  const simple = analyze(plan({ bar: 'large', speakers: 'none', mics: 'none', dsp: false })).items.map((i) => i.name);
  assert.ok(!simple.some((n) => n.startsWith('Audio processor')));
  assert.ok(simple.some((n) => n.startsWith('Installation')));
});

test('warnings point out designs that cannot work for a hybrid meeting', () => {
  const w = analyze(plan({ system: 'teams', mics: 'none', cameras: 'none', speakers: 'none' })).warnings;
  assert.ok(w.some((x) => x.includes('no microphones')));
  assert.ok(w.some((x) => x.includes('no camera')));
  assert.ok(w.some((x) => x.includes('No speakers')));
  assert.deepEqual(
    analyze(plan({ system: 'byod', bar: 'large', mics: 'none', cameras: 'none', speakers: 'none', dsp: false }))
      .warnings,
    [],
    'a video bar brings its own camera, microphones and speakers',
  );
});

test('packages are complete starting points that keep the room and the table', () => {
  const room = plan({ length: 9, width: 6.5, seats: 12 });
  const essential = applyPreset(room, 'essential');
  const premium = applyPreset(room, 'premium');
  assert.equal(essential.length, 9);
  assert.equal(essential.seats, 12);
  assert.equal(essential.bar, 'large', 'the first package of a conference room is a larger video bar');
  assert.equal(premium.cameras, 'one');
  assert.equal(premium.wallCameras, 2);
  assert.equal(premium.presenter, true, 'the top package has a presenter, so a presenter camera');
  assert.equal(premium.displays, 2);
  assert.ok(analyze(premium).items.length > analyze(essential).items.length - 1);
});

test('a plan survives the trip through a link, and bad links are repaired or refused', () => {
  const original = plan({
    unit: 'ft',
    length: 10.5,
    seats: 14,
    shape: 'round',
    speakers: 'ceiling',
    displaySize: 75,
    presenterX: 1.25,
    presenterZ: -1.5,
    cameraSpot: 'below',
    micShape: 'round',
  });
  assert.deepEqual(decodePlan(encodePlan(original)), original);
  assert.equal(decodePlan('not a plan'), null);
  assert.equal(decodePlan(encodePlan(defaultPlan) + 'zzzz'), null);
  const hostile = normalizePlan({ length: 1e9, seats: -5, shape: 'hexagon', speakers: '<script>', displaySize: 3 });
  assert.equal(hostile.length, 12);
  assert.equal(hostile.seats, 2);
  assert.equal(hostile.shape, 'rect');
  assert.equal(hostile.speakers, defaultPlan.speakers);
  assert.equal(hostile.displaySize, null);
});

test('the request summary starts with the link and stays short', () => {
  const text = planSummary(plan(), 'https://k4av.com/integration/planner#p=abc');
  assert.ok(text.startsWith('Room planner (pilot): https://k4av.com/integration/planner#p=abc'));
  assert.ok(text.length <= 900);
  assert.ok(text.includes('display'));
});

test('one camera sits on the centre line, above the display or below it at eye level', () => {
  const above = analyze(plan({ cameras: 'one', cameraSpot: 'above' }));
  const below = analyze(plan({ cameras: 'one', cameraSpot: 'below' }));
  const top = above.displays.centerY + above.displays.height / 2;
  assert.equal(above.gear.cameras.length, 1);
  assert.equal(above.gear.cameras[0].pos[0], 0);
  assert.ok(above.gear.cameras[0].pos[1] > top);
  const bottom = below.displays.centerY - below.displays.height / 2;
  assert.equal(below.gear.cameras[0].pos[0], 0);
  assert.ok(below.gear.cameras[0].pos[1] < bottom);
  assert.ok(below.gear.cameras[0].pos[1] >= 1 && below.gear.cameras[0].pos[1] <= 1.3, 'near seated eye level');
  assert.ok(below.displays.centerY > above.displays.centerY, 'the display is raised to make room');
});

test('two cameras flank the display; a third at the back follows the presenter', () => {
  const twoPlan = analyze(plan({ cameras: 'two' }));
  const two = twoPlan.gear.cameras;
  assert.equal(two.length, 2);
  assert.equal(two[0].pos[0], -two[1].pos[0]);
  assert.ok(Math.abs(two[1].pos[0]) > twoPlan.displays.width / 2);
  const here = plan({ cameras: 'three', presenter: true, presenterX: -2, presenterZ: -3.2 });
  const moved = plan({ cameras: 'three', presenter: true, presenterX: 2.2, presenterZ: -3.2 });
  const rearA = analyze(here).gear.cameras[2];
  const rearB = analyze(moved).gear.cameras[2];
  assert.equal(analyze(here).gear.cameras.length, 3);
  assert.ok(rearA.pos[2] > 0, 'on the back wall');
  assert.equal(rearA.target[0], -2);
  assert.equal(rearA.target[2], -3.2);
  assert.equal(rearB.target[0], 2.2);
  assert.ok(rearA.hfov < two[0].hfov, 'zoomed in on the presenter');
});

test('the presenter can be moved but not through walls or into the display wall', () => {
  const beside = presenterSpot(plan(), analyze(plan()).displays);
  assert.ok(beside.x < 0 && beside.z < -2);
  const moved = plan({ presenter: true, presenterX: 2.2, presenterZ: 0.5 });
  assert.deepEqual(presenterSpot(moved, analyze(moved).displays), { x: 2.2, z: 0.5 });
  const wild = plan({ presenterX: 99, presenterZ: -99 });
  assert.equal(wild.presenterX, 2.7);
  assert.equal(wild.presenterZ, -3.6);
  assert.equal(plan({ presenterX: 'left' }).presenterX, null);
  const small = plan({ width: 3, length: 3, presenterX: 2, presenterZ: 2 });
  assert.equal(small.presenterX, 1.2);
  assert.equal(small.presenterZ, 1.2);
});

test('ceiling microphone arrays are sized like the Shure MXA920, square or round', () => {
  const find = (shape: string) =>
    analyze(plan({ mics: 'ceiling', micShape: shape })).items.find((i) => i.name.includes('microphone'));
  assert.ok(find('square')?.name.includes('square') && find('square')?.name.includes('604 mm'));
  assert.ok(find('round')?.name.includes('round') && find('round')?.name.includes('635 mm'));
  assert.equal(rules.micArray.square.size, 0.604);
  assert.equal(rules.micArray.round.size, 0.635);
  assert.equal(normalizePlan({ micShape: 'hexagon' }).micShape, 'square');
});

test('no ceiling speaker hangs where the microphone array is', () => {
  for (const seats of [4, 8, 14, 20]) {
    for (const [length, width] of [
      [6, 5],
      [8, 6],
      [11, 8],
    ]) {
      const gear = analyze(plan({ speakers: 'ceiling', mics: 'ceiling', seats, length, width })).gear;
      assert.ok(
        gear.speakers.every((s) => Math.abs(s[0]) > 0.4),
        `${seats} seats in ${length} x ${width}`,
      );
    }
  }
});

test('a presenter dropped on the table or the chairs is moved to the nearest free floor', () => {
  for (const shape of ['rect', 'round']) {
    for (const endChairs of [false, true]) {
      const p = plan({ shape, endChairs, seats: 8 });
      const layout = computeLayout(p);
      const t = layout.table;
      const spot = keepClear(p, layout, t.x, t.z);
      const reach = 0.42 + 0.33;
      if (shape === 'rect') {
        const outsideX = Math.abs(spot.x - t.x) >= t.width / 2 + reach - 0.011;
        const outsideZ = Math.abs(spot.z - t.z) >= t.length / 2 + (endChairs ? reach : 0.35) - 0.011;
        assert.ok(outsideX || outsideZ, `${shape} ${endChairs}`);
      } else {
        assert.ok(Math.hypot(spot.x - t.x, spot.z - t.z) >= t.width / 2 + reach - 0.011);
      }
    }
  }
  const p = plan();
  assert.deepEqual(keepClear(p, computeLayout(p), -2.5, -3.2), { x: -2.5, z: -3.2 });
  const dropped = plan({ presenter: true, presenterX: 0, presenterZ: -1.1 });
  const spot = presenterSpot(dropped, analyze(dropped).displays);
  assert.notDeepEqual(spot, { x: 0, z: -1.1 });
  assert.deepEqual(keepClear(dropped, computeLayout(dropped), spot.x, spot.z), spot, 'a free spot stays where it is');
});

test('the signal flow connects every device, always from left to right', () => {
  for (const cameras of ['none', 'one', 'two', 'pairs', 'three']) {
    for (const speakers of ['none', 'front', 'ceiling', 'both']) {
      for (const mics of ['none', 'table', 'ceiling', 'pendant', 'gooseneck']) {
        for (const tablePanels of [true, false]) {
          for (const control of ['none', 'table', 'wall']) {
            const extra = [
              { bar: 'none', dsp: true, sharing: 'cable' },
              { bar: 'compact', dsp: false, sharing: 'wireless', engine: true, tableCamera: true, wireless: 2 },
              { bar: 'large', dsp: true, sharing: 'both', engine: false, whiteboard: true },
            ][(speakers.length + mics.length + control.length) % 3];
            const p = plan({ cameras, speakers, mics, tablePanels, control, ...extra });
            const { nodes, links } = signalFlow(p, analyze(p));
            const label = JSON.stringify({ cameras, speakers, mics, tablePanels, control, ...extra });
            const column = new Map(nodes.map((n) => [n.id, n.column]));
            assert.equal(column.size, nodes.length, `unique ids ${label}`);
            for (const l of links) {
              assert.ok(column.has(l.from) && column.has(l.to), `known ends ${label}`);
              assert.ok(
                (column.get(l.from) ?? 9) < (column.get(l.to) ?? 0),
                `left to right ${label} ${l.from}-${l.to}`,
              );
            }
            for (const n of nodes) {
              const linked = links.some((l) => l.from === n.id || l.to === n.id);
              const quiet = n.id === 'system' || n.id === 'displays';
              assert.ok(linked || quiet, `${n.id} is connected ${label}`);
            }
            assert.ok(
              links.some((l) => l.from === 'system' && l.to === 'displays'),
              `display is fed ${label}`,
            );
          }
        }
      }
    }
  }
});

test('the signal flow describes the chosen room', () => {
  const p = plan({ cameras: 'three', speakers: 'ceiling', mics: 'ceiling', micShape: 'round', system: 'zoom' });
  const { nodes, links } = signalFlow(p, analyze(p));
  const title = (id: string) => nodes.find((n) => n.id === id)?.title;
  assert.equal(title('cameras'), '3× PTZ cameras');
  assert.equal(title('system'), 'Zoom Rooms system');
  assert.ok(title('mics')?.includes('microphone array'));
  assert.ok(links.some((l) => l.from === 'mics' && l.to === 'processor'));
  assert.ok(links.some((l) => l.from === 'cameras' && l.to === 'switch'));
});

test('each kind of room keeps to its own size and seat limits', () => {
  const huddle = normalizePlan({ roomType: 'huddle', length: 12, width: 12, seats: 20 });
  assert.equal(huddle.length, 5.5);
  assert.equal(huddle.width, 5.5);
  assert.equal(huddle.seats, 6);
  const training = normalizePlan({ roomType: 'training', length: 1, width: 1, seats: 99, shape: 'round' });
  assert.equal(training.length, 4);
  assert.equal(training.seats, 40);
  assert.equal(training.shape, 'rect', 'classrooms have desks, not round tables');
  assert.equal(normalizePlan({ roomType: 'nonsense' }).roomType, 'conference');
  assert.equal(normalizePlan({ roomType: 'huddle', displays: 2, cameras: 'three', presenter: true }).displays, 1);
  assert.equal(normalizePlan({ roomType: 'huddle', cameras: 'three' }).cameras, 'two');
  assert.equal(normalizePlan({ roomType: 'huddle', presenter: true }).presenter, false);
  const room = normalizePlan({ roomType: 'training', tablePanels: true, control: 'table', mics: 'table' });
  assert.equal(room.tablePanels, false);
  assert.equal(room.control, 'wall');
  assert.equal(room.mics, 'ceiling');
});

test('a huddle table fits a small room that a conference table would not', () => {
  const huddle = plan({ roomType: 'huddle', length: 3.5, width: 3, seats: 4 });
  assert.equal(computeLayout(huddle).fits, true);
  assert.equal(computeLayout(huddle).seats.length, 4);
  const crowded = plan({ roomType: 'conference', length: 3.5, width: 3, seats: 4 });
  assert.equal(computeLayout(crowded).fits, false);
});

test('a classroom puts every seat at a desk, in rows facing the display', () => {
  for (const seats of [4, 5, 9, 16, 24, 31, 40]) {
    for (const width of [5, 8, 12]) {
      const p = plan({ roomType: 'training', length: 12, width, seats });
      const layout = computeLayout(p);
      assert.equal(layout.seats.length, seats, `${seats} seats in ${width} m`);
      assert.equal(layout.tables.length, layout.rows?.desks);
      assert.ok(layout.tables.length >= Math.ceil(seats / 2));
      for (const s of layout.seats) {
        assert.equal(s.rot, Math.PI, 'faces the display');
        assert.ok(
          layout.tables.some((t) => Math.abs(s.x - t.x) <= t.width / 2 && s.z > t.z),
          'sits behind a desk',
        );
      }
      for (const t of layout.tables) assert.ok(t.z - t.length / 2 >= -6 + 2.2 - 1e-9, 'the front row is clear');
    }
  }
  const room = computeLayout(plan({ roomType: 'training', length: 10, width: 8, seats: 24 }));
  assert.equal(room.fits, true);
  assert.equal(room.rows?.count, 4);
  assert.equal(computeLayout(plan({ roomType: 'training', length: 4, width: 4, seats: 40 })).fits, false);
});

test('a classroom block stands in for the table everywhere else', () => {
  const p = plan({ roomType: 'training', length: 10, width: 8, seats: 24, speakers: 'ceiling', mics: 'ceiling' });
  const a = analyze(p);
  const t = a.layout.table;
  for (const d of a.layout.tables) {
    assert.ok(Math.abs(d.x) + d.width / 2 <= t.width / 2 + 1e-9);
    assert.ok(d.z - d.length / 2 >= t.z - t.length / 2 - 1e-9 && d.z + d.length / 2 <= t.z + t.length / 2 + 1e-9);
  }
  assert.ok(a.gear.mics.length >= 1 && a.gear.speakers.length >= 2);
  const spot = presenterSpot({ ...p, presenterX: 0, presenterZ: t.z }, a.displays);
  assert.ok(
    Math.abs(spot.x) > t.width / 2 || spot.z < t.z - t.length / 2 || spot.z > t.z + t.length / 2,
    'off the desks',
  );
});

test('choosing a kind of room applies its template and keeps what is personal', () => {
  const mine = plan({ unit: 'ft', system: 'zoom', ceiling: false });
  for (const type of ['huddle', 'conference', 'boardroom', 'training'] as const) {
    const next = applyRoomType(mine, type);
    assert.equal(next.roomType, type);
    assert.equal(next.unit, 'ft');
    assert.equal(next.system, 'zoom');
    assert.equal(next.ceiling, false);
    assert.equal(next.length, templates[type].length);
    assert.equal(next.seats, templates[type].seats);
    assert.equal(next.presenterX, null);
    assert.equal(computeLayout(next).fits, true, `${type} template fits its room`);
    assert.equal(analyze(next).warnings.filter((w) => w.includes('do not fit')).length, 0);
  }
});

test('every package suits every kind of room', () => {
  for (const type of ['huddle', 'conference', 'boardroom', 'training'] as const) {
    const base = applyRoomType(plan(), type);
    for (const preset of ['essential', 'standard', 'premium'] as const) {
      const p = applyPreset(base, preset);
      assert.equal(p.roomType, type);
      assert.equal(typeof presetText[type][preset], 'string');
      const a = analyze(p);
      assert.ok(a.items.length >= 4, `${type} ${preset}`);
      assert.ok(a.gear.cameras.length >= 1, `${type} ${preset} has a camera`);
      assert.ok(!a.warnings.some((w) => w.includes('do not fit')), `${type} ${preset} fits`);
    }
    assert.ok(
      analyze(applyPreset(base, 'premium')).items.length >= analyze(applyPreset(base, 'essential')).items.length,
    );
  }
});

test('the room type travels in the link, and old links without it are conference rooms', () => {
  const huddle = applyRoomType(plan(), 'huddle');
  assert.deepEqual(decodePlan(encodePlan(huddle)), huddle);
  const training = applyRoomType(plan(), 'training');
  assert.deepEqual(decodePlan(encodePlan(training)), training);
  const b64 = encodePlan(plan()).replace(/-/g, '+').replace(/_/g, '/');
  const old = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
  assert.equal(decodePlan(btoa(JSON.stringify(old.slice(0, 23)))?.replace(/=+$/, '') ?? '')?.roomType, 'conference');
  assert.ok(planSummary(training, 'x').includes('Training room'));
  assert.ok(planSummary(huddle, 'x').includes('Huddle room'));
});

const kinds = ['huddle', 'conference', 'boardroom', 'training'] as const;
const distanceTo = (px: number, pz: number, t: { x: number; z: number; length: number; width: number }) => {
  const dx = Math.max(Math.abs(px - t.x) - t.width / 2, 0);
  const dz = Math.max(Math.abs(pz - t.z) - t.length / 2, 0);
  return Math.hypot(dx, dz);
};

test('each kind of room offers the tables that make sense for it', () => {
  assert.deepEqual(roomTypes.huddle.shapes, ['rect', 'round']);
  assert.deepEqual(roomTypes.training.shapes, ['rect']);
  assert.deepEqual([...roomTypes.conference.shapes].sort(), ['boat', 'rect', 'round', 'u']);
  assert.deepEqual([...roomTypes.boardroom.shapes].sort(), ['boat', 'rect', 'round', 'u']);
  assert.equal(normalizePlan({ roomType: 'huddle', shape: 'u' }).shape, 'rect');
  assert.equal(normalizePlan({ roomType: 'training', shape: 'boat' }).shape, 'rect');
  assert.equal(normalizePlan({ roomType: 'boardroom', shape: 'hexagon' }).shape, 'boat');
  for (const shape of ['rect', 'boat', 'round', 'u'] as const) {
    assert.equal(normalizePlan({ roomType: 'conference', shape }).shape, shape);
    assert.ok(tableShapes[shape].label.length > 0);
  }
  assert.deepEqual(seatLimits('boardroom', 'round'), [8, 14]);
  assert.deepEqual(seatLimits('conference', 'u'), [6, 24]);
  assert.deepEqual(seatLimits('conference', 'boat'), [4, 20]);
  assert.deepEqual(seatLimits('huddle', 'round'), [3, 6]);
});

test('every table shape seats everyone one chair-width away from the table, inside the room', () => {
  for (const roomType of kinds) {
    if (roomType === 'training') continue;
    for (const shape of roomTypes[roomType].shapes) {
      const [lo, hi] = seatLimits(roomType, shape);
      for (const seats of [lo, Math.round((lo + hi) / 2), hi]) {
        const big: number = roomType === 'huddle' ? 5.5 : 12;
        const p = normalizePlan({ roomType, shape, seats, length: big, width: big });
        const layout = computeLayout(p);
        const label: string = `${roomType} ${shape} ${seats}`;
        assert.equal(layout.seats.length, p.seats, `${label}: a chair for every seat`);
        assert.ok(layout.fits, `${label} fits ${big} m`);
        for (const s of layout.seats) {
          assert.ok(Math.abs(s.x) <= p.width / 2 && Math.abs(s.z) <= p.length / 2, `${label}: chair inside the room`);
          const gap =
            shape === 'round'
              ? Math.abs(Math.hypot(s.x - layout.table.x, s.z - layout.table.z) - layout.table.width / 2)
              : Math.min(...layout.tables.map((t) => distanceTo(s.x, s.z, t)));
          assert.ok(Math.abs(gap - rules.chairOffset) < 0.05, `${label}: chair at ${gap.toFixed(2)} m from the table`);
        }
        assert.ok(layout.path.length >= 2 && layout.keepOut.length >= 1, `${label}: path and keep-out`);
      }
    }
  }
});

test('a boat-shaped table is a rounded rectangle, a little wider than a plain one', () => {
  const boat = computeLayout(plan({ shape: 'boat', seats: 10 }));
  const rect = computeLayout(plan({ shape: 'rect', seats: 10 }));
  assert.equal(boat.table.shape, 'boat');
  assert.equal(boat.tables.length, 1);
  assert.ok(boat.table.width > rect.table.width);
  assert.ok(boat.table.length > rect.table.length, 'its ends are part of the length');
  const withEnds = computeLayout(plan({ shape: 'boat', seats: 10, endChairs: true }));
  assert.equal(withEnds.seats.length, 10);
  assert.equal(withEnds.endChairs, true);
  assert.equal(plan({ roomType: 'conference', shape: 'boat', endChairs: true }).endChairs, true);
  assert.equal(plan({ roomType: 'conference', shape: 'round', endChairs: true }).endChairs, false);
  assert.equal(plan({ roomType: 'conference', shape: 'u', endChairs: true }).endChairs, false);
  assert.equal(plan({ roomType: 'huddle', endChairs: true }).endChairs, false);
});

test('a U of tables opens towards the display, with room to stand in the middle', () => {
  for (const seats of [6, 9, 12, 18, 24]) {
    const p = plan({ shape: 'u', seats, length: 12, width: 12 });
    const layout = computeLayout(p);
    assert.equal(layout.tables.length, 3, 'two arms and a base');
    const [left, right, base] = layout.tables;
    assert.equal(left.x, -right.x);
    assert.ok(base.z > left.z, 'the base is at the back');
    assert.ok(base.width > left.width * 2, 'the base spans between the arms');
    const mouth = base.width - 2 * left.width;
    assert.ok(mouth >= 1.2 - 1e-9, `${seats} seats: ${mouth} m between the arms`);
    assert.equal(layout.seats.length, seats);
    // arm chairs face the middle, back chairs face the display
    assert.ok(layout.seats.filter((s) => s.x < -base.width / 2).every((s) => Math.abs(s.rot - Math.PI / 2) < 1e-6));
    assert.ok(layout.seats.filter((s) => s.x > base.width / 2).every((s) => Math.abs(s.rot + Math.PI / 2) < 1e-6));
    assert.ok(layout.seats.filter((s) => s.z > base.z).every((s) => Math.abs(s.rot - Math.PI) < 1e-6));
    // the presenter may stand in the opening but not on the tables
    const middle = { x: 0, z: left.z };
    assert.deepEqual(keepClear(p, layout, middle.x, middle.z), middle, `${seats} seats: the opening is free`);
    const onArm = keepClear(p, layout, left.x, left.z);
    assert.ok(Math.hypot(onArm.x - left.x, onArm.z - left.z) > 0.3, 'moved off the arm');
  }
});

test('table microphones, panels and the touch panel sit on the tabletop of every shape', () => {
  for (const shape of ['rect', 'boat', 'round', 'u'] as const) {
    const p = plan({ shape, seats: 12, length: 12, width: 12, mics: 'table', tablePanels: true, control: 'table' });
    const a = analyze(p);
    const onTable = (x: number, z: number) =>
      a.layout.tables.some((t) =>
        t.shape === 'round' ? Math.hypot(x - t.x, z - t.z) <= t.width / 2 + 0.01 : distanceTo(x, z, t) <= 0.01,
      );
    assert.ok(a.gear.mics.length >= 1 && a.gear.panels.length >= 1 && a.gear.control, shape);
    for (const m of a.gear.mics) assert.ok(onTable(m[0], m[2]), `${shape}: microphone on the table`);
    for (const m of a.gear.panels) assert.ok(onTable(m[0], m[2]), `${shape}: panel on the table`);
    const c = a.gear.control as [number, number, number];
    assert.ok(onTable(c[0], c[2]), `${shape}: touch panel on the table`);
  }
});

test('the boardroom is a formal room: bigger table, two displays, ceiling audio', () => {
  const room = applyRoomType(plan(), 'boardroom');
  assert.equal(room.roomType, 'boardroom');
  assert.equal(room.shape, 'boat');
  assert.equal(room.displays, 2);
  assert.equal(room.speakers, 'both', 'wall speakers and ceiling speakers');
  assert.ok(computeLayout(room).fits);
  assert.ok(room.seats >= 8 && room.seats <= 20);
  const small = normalizePlan({ roomType: 'boardroom', seats: 2, length: 3, width: 2 });
  assert.equal(small.seats, 8);
  assert.equal(small.length, 6);
  assert.equal(normalizePlan({ roomType: 'boardroom', seats: 99 }).seats, 20);
  for (const preset of ['essential', 'standard', 'premium'] as const) {
    const p = applyPreset(room, preset);
    assert.equal(computeLayout(p).fits, true);
    assert.ok(p.cameras !== 'none');
  }
  assert.equal(applyPreset(room, 'essential').displays, 1);
  assert.equal(applyPreset(room, 'standard').cameras, 'two');
  assert.equal(applyPreset(room, 'premium').cameras, 'pairs', 'two cameras on each side of the display');
  assert.equal(applyPreset(room, 'premium').presenter, true);
  assert.ok(planSummary(room, 'x').includes('Boardroom, '));
});

test('the table shape travels in the link', () => {
  for (const shape of ['rect', 'boat', 'round', 'u'] as const) {
    const p = plan({ roomType: 'boardroom', shape, seats: 12 });
    assert.deepEqual(decodePlan(encodePlan(p)), p);
  }
  assert.ok(planSummary(plan({ shape: 'u', seats: 12 }), 'x').includes('U-shaped table'));
  assert.ok(planSummary(plan({ shape: 'boat', seats: 12 }), 'x').includes('boat-shaped table'));
});

test('every ready-made room is complete, fits, and raises no warnings', () => {
  const ids = scenarios.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(scenarios.length >= 6);
  for (const s of scenarios) {
    assert.ok(s.label.length > 0 && s.about.length > 20, s.id);
    const p = applyScenario(plan(), s.id);
    const a = analyze(p);
    assert.equal(p.roomType, s.type, s.id);
    assert.equal(a.layout.fits, true, `${s.id} fits its room`);
    assert.deepEqual(a.warnings, [], `${s.id} has nothing to check`);
    assert.ok(a.gear.cameras.length >= 1 && a.items.length >= 5, s.id);
    for (const [key, value] of Object.entries(s.changes)) {
      assert.deepEqual(p[key as keyof typeof p], value, `${s.id}: ${key}`);
    }
  }
});

test('a ready-made room keeps what is personal and replaces what belongs to the room', () => {
  const mine = plan({ unit: 'ft', system: 'zoom', ceiling: false, micShape: 'round', readability: 0.9 });
  for (const s of scenarios) {
    const p = applyScenario({ ...mine, cameraView: true, presenterX: 1, presenterZ: 1, displaySize: 98 }, s.id);
    assert.equal(p.unit, 'ft', s.id);
    assert.equal(p.system, 'zoom', s.id);
    assert.equal(p.ceiling, false, s.id);
    assert.equal(p.micShape, 'round', s.id);
    assert.equal(p.cameraView, false, `${s.id}: overlays start off`);
    assert.equal(p.presenterX, null, `${s.id}: the presenter starts at the display`);
    assert.equal(p.displaySize, null, `${s.id}: the display size is recommended again`);
  }
});

test('the workshop is a U with a presenter, the classroom has rows, the round table is round', () => {
  const workshop = applyScenario(plan(), 'workshop');
  assert.equal(workshop.shape, 'u');
  assert.equal(workshop.presenter, true);
  assert.equal(computeLayout(workshop).tables.length, 3);
  const classroom = applyScenario(plan(), 'classroom');
  assert.equal(classroom.roomType, 'training');
  assert.ok((computeLayout(classroom).rows?.count ?? 0) >= 2);
  const round = applyScenario(plan(), 'roundtable');
  assert.equal(round.shape, 'round');
  assert.equal(round.cameras, 'one');
  assert.equal(applyScenario(plan(), 'boardroom').cameras, 'pairs');
  assert.equal(applyScenario(plan(), 'boardroom').presenter, true);
  assert.equal(applyScenario(plan(), 'huddle').seats, 4);
});

test('a plan is recognised as a ready-made room until it is changed', () => {
  const same = (id: (typeof scenarios)[number]['id'], p: ReturnType<typeof plan>) =>
    encodePlan(applyScenario(p, id)) === encodePlan(p);
  for (const s of scenarios) {
    const p = applyScenario(plan(), s.id);
    assert.equal(same(s.id, p), true, `${s.id} is itself`);
    assert.equal(same(s.id, normalizePlan({ ...p, seats: p.seats + 1 })), false, `${s.id} with another seat`);
  }
  assert.equal(scenarios.filter((s) => same(s.id, applyScenario(plan(), 'team'))).length, 1);
});

test('a presenter always brings a camera of their own, at the back, aimed at them', () => {
  for (const roomType of ['conference', 'boardroom', 'training'] as const) {
    for (const cameras of ['none', 'one', 'two'] as const) {
      const without = analyze(plan({ roomType, cameras, presenter: false }));
      const withPresenter = analyze(plan({ roomType, cameras, presenter: true, presenterX: -2.2, presenterZ: -3.2 }));
      const base = { none: 0, one: 1, two: 2 }[cameras];
      assert.equal(without.gear.cameras.length, base, `${roomType} ${cameras}: no presenter, no extra camera`);
      assert.equal(withPresenter.gear.cameras.length, base + 1, `${roomType} ${cameras}: one more for the presenter`);
      const back = withPresenter.gear.cameras[base];
      assert.ok(back.pos[2] > 0, 'on the back wall');
      assert.equal(back.target[0], -2.2);
      assert.equal(back.target[2], -3.2);
      assert.ok(back.hfov < 40, 'zoomed in on the presenter');
      const names = withPresenter.items.map((i) => i.name);
      assert.ok(names.includes('PTZ presenter camera, 20x zoom'), `${roomType} ${cameras}: listed`);
      assert.ok(
        names.includes('Wireless microphones, handheld or lapel (interchangeable)'),
        `${roomType} ${cameras}: microphone listed`,
      );
      assert.ok(!without.items.some((i) => i.name.includes('presenter')), `${roomType} ${cameras}: not listed`);
    }
  }
  assert.equal(
    analyze(plan({ roomType: 'huddle', presenter: true })).gear.cameras.length,
    1,
    'a huddle has no presenter',
  );
  // with only a presenter camera there is still a camera, so the room is seen
  const onlyPresenter = analyze(plan({ cameras: 'none', presenter: true }));
  assert.equal(
    onlyPresenter.warnings.some((w) => w.includes('no camera')),
    false,
  );
  assert.equal(
    analyze(plan({ cameras: 'none', presenter: false })).warnings.some((w) => w.includes('no camera')),
    true,
  );
});

test('ceiling speakers start at the middle package as an even grid, and the top package puts them closer', () => {
  for (const roomType of ['conference', 'boardroom', 'training'] as const) {
    const base = applyRoomType(plan(), roomType);
    const standard = applyPreset(base, 'standard');
    const premium = applyPreset(base, 'premium');
    assert.equal(standard.speakers, 'both', `${roomType} standard has wall and ceiling speakers`);
    assert.equal(standard.speakerCoverage, 'standard');
    assert.equal(premium.speakers, 'both');
    assert.equal(premium.speakerCoverage, 'dense');
    const few = analyze(standard).gear.speakers.length;
    const all = analyze(premium).gear.speakers.length;
    assert.ok(few >= 2, `${roomType}: at least a pair`);
    assert.ok(few < all, `${roomType}: ${few} speakers against ${all}`);
    assert.equal(
      analyze(applyPreset(base, 'essential')).gear.speakers.length,
      0,
      `${roomType}: none in the first package`,
    );
  }
  // a table for eight: four ceiling speakers in the middle package, six in the top one
  const eight = { roomType: 'conference', length: 8, width: 6, seats: 8, speakers: 'ceiling', mics: 'ceiling' };
  assert.equal(analyze(plan({ ...eight, speakerCoverage: 'standard' })).gear.speakers.length, 4);
  assert.equal(analyze(plan({ ...eight, speakerCoverage: 'dense' })).gear.speakers.length, 6);
  for (const [length, width, seats] of [
    [12, 8, 20],
    [10, 8, 16],
    [8, 6, 8],
  ]) {
    const p = { roomType: 'conference', length, width, seats, speakers: 'ceiling', mics: 'ceiling' };
    const few = analyze(plan({ ...p, speakerCoverage: 'standard' })).gear.speakers.length;
    const all = analyze(plan({ ...p, speakerCoverage: 'dense' })).gear.speakers.length;
    assert.ok(few >= 2 && few < all, `${length} x ${width} m: ${few} against ${all}`);
  }
  const item = analyze(applyPreset(plan(), 'standard')).items.find((i) => i.name.startsWith('Ceiling speakers'));
  assert.ok(item?.note?.startsWith('An even grid'));
  assert.equal(normalizePlan({ speakerCoverage: 'loud' }).speakerCoverage, 'standard');
  // older links called these a few ceiling speakers and a full set
  assert.equal(normalizePlan({ speakerCoverage: 'partial' }).speakerCoverage, 'standard');
  assert.equal(normalizePlan({ speakerCoverage: 'full' }).speakerCoverage, 'dense');
});

test('a long table gets two microphone arrays, a short one gets one', () => {
  const arrays = (p: Record<string, unknown>) => analyze(plan({ mics: 'ceiling', ...p })).gear.mics.length;
  assert.equal(arrays({ seats: 6 }), 1, 'a table for six');
  assert.equal(arrays({ seats: 8 }), 1, 'a table for eight, three metres');
  assert.equal(arrays({ seats: 10 }), 2, 'a table for ten, three and a half metres');
  assert.equal(arrays({ seats: 14, length: 10, width: 6 }), 2, 'a table for fourteen');
  assert.equal(arrays({ roomType: 'boardroom', shape: 'boat', seats: 14 }), 2, 'a boat-shaped table for fourteen');
  assert.equal(arrays({ seats: 24, length: 12, width: 8 }), 3, 'a very long table');
  const two = analyze(plan({ mics: 'ceiling', seats: 10 })).gear.mics;
  assert.ok(two[0][2] < two[1][2], 'one over each half');
});

test('one camera sits above or below the display, two sit beside it or above and below', () => {
  const spots = (cameras: string, cameraSpot: string) => analyze(plan({ cameras, cameraSpot })).gear.cameras;
  const a = analyze(plan({ cameras: 'two', cameraSpot: 'both' }));
  const top = a.displays.centerY + a.displays.height / 2;
  const bottom = a.displays.centerY - a.displays.height / 2;
  const [upper, lower] = a.gear.cameras;
  assert.equal(a.gear.cameras.length, 2);
  assert.equal(upper.pos[0], 0);
  assert.equal(lower.pos[0], 0);
  assert.ok(upper.pos[1] > top && lower.pos[1] < bottom, 'one above the display, one below it');
  assert.ok(
    a.displays.centerY > analyze(plan({ cameras: 'two', cameraSpot: 'sides' })).displays.centerY,
    'raised for the low one',
  );
  const sides = spots('two', 'sides');
  assert.equal(sides[0].pos[0], -sides[1].pos[0]);
  assert.notEqual(sides[0].pos[0], 0);
  // the position follows the number of cameras
  assert.equal(normalizePlan({ cameras: 'one', cameraSpot: 'both' }).cameraSpot, 'above');
  assert.equal(normalizePlan({ cameras: 'one', cameraSpot: 'sides' }).cameraSpot, 'above');
  assert.equal(normalizePlan({ cameras: 'one', cameraSpot: 'below' }).cameraSpot, 'below');
  assert.equal(normalizePlan({ cameras: 'two', cameraSpot: 'above' }).cameraSpot, 'sides');
  assert.equal(normalizePlan({ cameras: 'two', cameraSpot: 'both' }).cameraSpot, 'both');
  assert.equal(normalizePlan({ cameras: 'none', cameraSpot: 'both' }).cameraSpot, 'above');
  assert.equal(normalizePlan({ cameras: 'two' }).cameraSpot, 'sides');
  assert.equal(normalizePlan({ cameras: 'two', cameraSpot: 'sideways' }).cameraSpot, 'sides');
});

test('old links with three or four cameras open as two cameras and a presenter camera', () => {
  for (const old of ['three', 'four']) {
    const p = normalizePlan({ cameras: old });
    assert.equal(p.cameras, 'two');
    assert.equal(p.presenter, true);
    assert.equal(analyze(p).gear.cameras.length, 3);
  }
  assert.equal(normalizePlan({ roomType: 'huddle', cameras: 'three' }).presenter, false, 'a huddle has no presenter');
});

test('every ready-made room and package lists its equipment without gaps', () => {
  for (const type of ['huddle', 'conference', 'boardroom', 'training'] as const) {
    for (const preset of ['essential', 'standard', 'premium'] as const) {
      const p = applyPreset(applyRoomType(plan(), type), preset);
      const a = analyze(p);
      const names = a.items.map((i) => i.name).join(' | ');
      assert.ok(a.gear.cameras.length >= 1, `${type} ${preset}: a camera`);
      assert.ok(/display/.test(names) && /system/i.test(names) && /Installation/.test(names), `${type} ${preset}`);
      if (p.presenter)
        assert.ok(
          a.gear.cameras.some((c) => c.pos[2] > 0),
          `${type} ${preset}: presenter camera`,
        );
      assert.ok(!a.warnings.some((w) => w.includes('no camera')), `${type} ${preset}`);
    }
  }
});

test('the signal flow tells video, audio and control apart, and analog from digital', () => {
  const kinds = new Set(['video', 'audio', 'control']);
  const find = (links: ReturnType<typeof signalFlow>['links'], from: string, to: string, signal?: string) =>
    links.find((l) => l.from === from && l.to === to && (!signal || l.signal === signal));
  for (const speakers of ['none', 'front', 'ceiling', 'both'] as const) {
    for (const mics of ['none', 'table', 'ceiling', 'pendant', 'gooseneck'] as const) {
      const p = plan({ speakers, mics, presenter: true, cameras: 'two', control: 'wall', tablePanels: true });
      const { links } = signalFlow(p, analyze(p));
      for (const l of links) {
        assert.ok(kinds.has(l.signal), `a known signal on ${l.from}-${l.to}`);
        assert.equal(typeof l.analog, 'boolean');
      }
      // what is on the wire follows the kind of device
      assert.equal(find(links, 'system', 'displays')?.signal, 'video');
      assert.equal(find(links, 'laptops', 'system')?.signal, 'video');
      assert.equal(find(links, 'touch', 'system')?.signal, 'control');
      assert.equal(find(links, 'cameras', 'switch')?.signal, 'video');
      assert.equal(find(links, 'switch', 'system', 'control')?.label, 'PTZ control');
      assert.equal(find(links, 'system', 'displays')?.analog, false, 'HDMI is digital');
      const wirelessLink = links.find((l) => l.from === 'wireless');
      assert.equal(wirelessLink?.signal, 'audio');
      assert.equal(wirelessLink?.analog, true, 'a wireless receiver gives an analog line');
      if (mics === 'table' || mics === 'gooseneck')
        assert.equal(find(links, 'mics', 'processor')?.analog, true, `${mics} microphones are analog`);
      if (mics === 'ceiling' || mics === 'pendant') {
        assert.equal(find(links, 'mics', 'processor')?.analog, false, 'ceiling arrays are on the network');
        assert.equal(find(links, 'mics', 'switch')?.signal, 'audio');
      }
      if (speakers === 'front' || speakers === 'both')
        assert.equal(find(links, 'processor', 'wallSpeakers')?.analog, true, 'wall speakers are fed an analog line');
      if (speakers === 'ceiling' || speakers === 'both')
        assert.equal(find(links, 'processor', 'speakers')?.analog, true);
    }
  }
  // without a presenter or wireless microphones there is no receiver, without a control device no control link
  const quiet = plan({
    presenter: false,
    cameras: 'none',
    control: 'none',
    tablePanels: false,
    sharing: 'none',
    bar: 'large',
    mics: 'none',
    speakers: 'none',
    wireless: 0,
    dsp: false,
    engine: false,
  });
  const { nodes, links } = signalFlow(quiet, analyze(quiet));
  assert.ok(!nodes.some((n) => n.id === 'wireless'));
  assert.ok(!links.some((l) => l.signal === 'control'));
  assert.equal(nodes.find((n) => n.id === 'system')?.title, 'Video bar', 'a bar that runs the platform is the system');
});

test('the signal flow shows the presenter camera and microphone', () => {
  const p = plan({ presenter: true, cameras: 'one', mics: 'ceiling', speakers: 'ceiling' });
  const { nodes } = signalFlow(p, analyze(p));
  assert.equal(nodes.find((n) => n.id === 'cameras')?.title, '2× PTZ cameras');
  assert.equal(nodes.find((n) => n.id === 'cameras')?.detail, 'one follows the presenter');
  assert.ok(nodes.some((n) => n.id === 'wireless'));
});

test('a single network device plugs into the room, two or more share a PoE switch', () => {
  // a video bar is one device with its own cable: no switch, and no separate camera in the flow
  const huddle = applyPreset(applyRoomType(plan(), 'huddle'), 'essential');
  const one = analyze(huddle);
  assert.equal(one.gear.cameras.length, 1);
  assert.ok(!one.items.some((i) => i.name.startsWith('Network switch')), 'no switch for a bar');
  const flow = signalFlow(huddle, one);
  assert.ok(!flow.nodes.some((n) => n.id === 'switch' || n.id === 'cameras'));
  // one PTZ camera plugs straight into the room's network point
  const single = plan({ cameras: 'one', mics: 'none', speakers: 'front', dsp: false });
  const alone = signalFlow(single, analyze(single));
  assert.ok(!alone.nodes.some((n) => n.id === 'switch'));
  assert.ok(alone.links.some((l) => l.from === 'cameras' && l.to === 'system' && l.signal === 'video'));
  assert.ok(alone.links.some((l) => l.from === 'cameras' && l.to === 'system' && l.signal === 'control'));
  const team = analyze(applyPreset(plan(), 'standard'));
  assert.ok(
    team.items.some((i) => i.name.startsWith('Network switch')),
    'a switch for cameras and a microphone array',
  );
  const micOnly = plan({ cameras: 'none', mics: 'ceiling', speakers: 'front' });
  assert.ok(!analyze(micOnly).items.some((i) => i.name.startsWith('Network switch')), 'one microphone array alone');
});
