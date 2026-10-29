import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyze,
  applyPreset,
  applyRoomType,
  computeLayout,
  decodePlan,
  defaultPlan,
  encodePlan,
  keepClear,
  normalizePlan,
  planSummary,
  presenterSpot,
  presetText,
  rules,
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
  assert.equal(analyze(plan({ tablePanels: false })).gear.panels.length, 0);
  assert.ok(analyze(plan({ tablePanels: true, seats: 14 })).gear.panels.length >= 2);
  assert.equal(analyze(plan({ control: 'none' })).gear.control, null);
  assert.ok(analyze(plan({ control: 'wall' })).gear.control);
});

test('the equipment list adds an audio processor and a PoE switch where the design needs them', () => {
  const ceiling = analyze(plan({ speakers: 'ceiling', mics: 'ceiling' })).items.map((i) => i.name);
  assert.ok(ceiling.some((n) => n.startsWith('Audio processor')));
  assert.ok(ceiling.some((n) => n.startsWith('Network switch')));
  const simple = analyze(plan({ speakers: 'soundbar', mics: 'integrated' })).items.map((i) => i.name);
  assert.ok(!simple.some((n) => n.startsWith('Audio processor')));
  assert.ok(simple.some((n) => n.startsWith('Installation')));
});

test('warnings point out designs that cannot work for a hybrid meeting', () => {
  const w = analyze(plan({ system: 'teams', mics: 'none', cameras: 'none', speakers: 'none' })).warnings;
  assert.ok(w.some((x) => x.includes('no microphones')));
  assert.ok(w.some((x) => x.includes('no camera')));
  assert.ok(w.some((x) => x.includes('No speakers')));
  assert.equal(
    analyze(plan({ system: 'byod', mics: 'none', cameras: 'none', speakers: 'soundbar' })).warnings.length,
    0,
  );
});

test('packages are complete starting points that keep the room and the table', () => {
  const room = plan({ length: 9, width: 6.5, seats: 12 });
  const essential = applyPreset(room, 'essential');
  const premium = applyPreset(room, 'premium');
  assert.equal(essential.length, 9);
  assert.equal(essential.seats, 12);
  assert.equal(essential.cameras, 'one');
  assert.equal(premium.cameras, 'three');
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

test('old links with four cameras open with three', () => {
  assert.equal(normalizePlan({ cameras: 'four' }).cameras, 'three');
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
  for (const cameras of ['none', 'one', 'two', 'three']) {
    for (const speakers of ['none', 'soundbar', 'front', 'ceiling']) {
      for (const mics of ['none', 'integrated', 'table', 'ceiling']) {
        for (const tablePanels of [true, false]) {
          for (const control of ['none', 'table', 'wall']) {
            const p = plan({ cameras, speakers, mics, tablePanels, control });
            const { nodes, links } = signalFlow(p, analyze(p));
            const label = JSON.stringify({ cameras, speakers, mics, tablePanels, control });
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
  for (const type of ['huddle', 'conference', 'training'] as const) {
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
  for (const type of ['huddle', 'conference', 'training'] as const) {
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
  const old = JSON.parse(atob(encodePlan(plan()).replace(/-/g, '+').replace(/_/g, '/') + '=='));
  assert.equal(decodePlan(btoa(JSON.stringify(old.slice(0, 23)))?.replace(/=+$/, '') ?? '')?.roomType, 'conference');
  assert.ok(planSummary(training, 'x').includes('Training room'));
  assert.ok(planSummary(huddle, 'x').includes('Huddle room'));
});
