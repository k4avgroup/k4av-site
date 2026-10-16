import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyze,
  applyPreset,
  computeLayout,
  decodePlan,
  defaultPlan,
  encodePlan,
  normalizePlan,
  planSummary,
  presenterSpot,
  rules,
  tableSize,
} from '../lib/planner/model.ts';

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
  const here = plan({ cameras: 'three', presenter: true, presenterX: -1, presenterZ: -2 });
  const moved = plan({ cameras: 'three', presenter: true, presenterX: 1.5, presenterZ: 0 });
  const rearA = analyze(here).gear.cameras[2];
  const rearB = analyze(moved).gear.cameras[2];
  assert.equal(analyze(here).gear.cameras.length, 3);
  assert.ok(rearA.pos[2] > 0, 'on the back wall');
  assert.equal(rearA.target[0], -1);
  assert.equal(rearA.target[2], -2);
  assert.equal(rearB.target[0], 1.5);
  assert.ok(rearA.hfov < two[0].hfov, 'zoomed in on the presenter');
});

test('the presenter can be moved but not through walls or into the display wall', () => {
  const beside = presenterSpot(plan(), analyze(plan()).displays);
  assert.ok(beside.x < 0 && beside.z < -2);
  const moved = plan({ presenter: true, presenterX: 1.2, presenterZ: 0.5 });
  assert.deepEqual(presenterSpot(moved, analyze(moved).displays), { x: 1.2, z: 0.5 });
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
