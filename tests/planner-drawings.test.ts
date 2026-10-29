import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDrawings, type Drawing, type Prim } from '../lib/planner/drawings.ts';
import {
  analyze,
  applyPreset,
  applyRoomType,
  defaultPlan,
  formatLength,
  normalizePlan,
  roomTypes,
  rules,
} from '../lib/planner/model.ts';

const base = normalizePlan(defaultPlan);
const rooms = (['huddle', 'conference', 'boardroom', 'training'] as const).flatMap((type) =>
  roomTypes[type].shapes.flatMap((shape) =>
    (['essential', 'standard', 'premium'] as const).map((preset) => ({
      label: `${type} ${shape} ${preset}`,
      plan: normalizePlan({ ...applyPreset(applyRoomType(base, type), preset), shape }),
    })),
  ),
);
const texts = (d: Drawing) => d.prims.filter((p): p is Extract<Prim, { k: 'text' }> => p.k === 'text').map((p) => p.t);
const count = (d: Drawing, style: string, kind?: string) =>
  d.prims.filter((p) => 's' in p && p.s === style && (!kind || p.k === kind)).length;
const get = (all: Drawing[], id: string) => all.find((d) => d.id === id) as Drawing;

test('every drawing of every kind of room is complete and sane', () => {
  for (const { label, plan } of rooms) {
    const all = buildDrawings(plan, analyze(plan));
    assert.deepEqual(
      all.map((d) => d.id),
      ['floor', 'ceiling', 'front', 'side'],
      label,
    );
    for (const d of all) {
      assert.ok(d.width > 200 && d.width < 1000 && d.height > 200 && d.height < 800, `${label} ${d.id} size`);
      for (const p of d.prims) {
        const numbers = Object.values(p).filter((v) => typeof v === 'number') as number[];
        assert.ok(numbers.every(Number.isFinite), `${label} ${d.id} has only real numbers`);
        if (p.k === 'poly') assert.ok(p.pts.flat().every(Number.isFinite), `${label} ${d.id} polygon`);
      }
      assert.ok(texts(d).length >= 4 && count(d, 'dim') >= 2, `${label} ${d.id} has dimensions`);
      assert.ok(
        texts(d).some((t) => t.includes('Indicative sketch')),
        `${label} ${d.id} has the disclaimer`,
      );
    }
  }
});

test('the plans show the room size and a chair for every seat', () => {
  for (const { label, plan } of rooms) {
    const a = analyze(plan);
    const all = buildDrawings(plan, a);
    const floor = get(all, 'floor');
    assert.equal(count(floor, 'chair'), a.layout.seats.length, `${label} chairs`);
    assert.equal(count(floor, 'furniture'), a.layout.tables.length, `${label} tables`);
    for (const id of ['floor', 'ceiling']) {
      const t = texts(get(all, id));
      assert.ok(t.includes(formatLength(plan.width, plan.unit)), `${label} ${id} width`);
      assert.ok(t.includes(formatLength(plan.length, plan.unit)), `${label} ${id} length`);
    }
    const front = texts(get(all, 'front'));
    assert.ok(
      front.includes(formatLength(plan.width, plan.unit)) && front.includes(formatLength(plan.height, plan.unit)),
    );
    const side = texts(get(all, 'side'));
    assert.ok(
      side.includes(formatLength(plan.length, plan.unit)) && side.includes(formatLength(plan.height, plan.unit)),
    );
  }
});

test('the ceiling plan has every ceiling device, with the microphone arrays at their real size', () => {
  const plan = normalizePlan({ ...applyPreset(applyRoomType(base, 'conference'), 'premium'), micShape: 'square' });
  const a = analyze(plan);
  const ceiling = get(buildDrawings(plan, a), 'ceiling');
  assert.equal(count(ceiling, 'speaker', 'circle'), a.gear.speakers.length);
  assert.equal(count(ceiling, 'mic'), a.gear.mics.length);
  const room = ceiling.prims.find((p) => p.k === 'rect' && p.s === 'wall') as Extract<Prim, { k: 'rect' }>;
  const array = ceiling.prims.find((p) => p.k === 'rect' && p.s === 'mic') as Extract<Prim, { k: 'rect' }>;
  assert.ok(Math.abs(array.w / room.w - rules.micArray.square.size / plan.width) < 0.002, 'square array to scale');
  assert.equal(array.w, array.h);
  assert.ok(texts(ceiling).includes('24 in (604 mm)'));
  const round = normalizePlan({ ...plan, micShape: 'round' });
  const circle = get(buildDrawings(round, analyze(round)), 'ceiling').prims.find(
    (p) => p.k === 'circle' && p.s === 'mic',
  ) as Extract<Prim, { k: 'circle' }>;
  assert.ok(Math.abs((circle.r * 2) / room.w - rules.micArray.round.size / plan.width) < 0.002, 'round array to scale');
  const none = normalizePlan({ ...plan, speakers: 'front', mics: 'integrated' });
  const empty = get(buildDrawings(none, analyze(none)), 'ceiling');
  assert.equal(count(empty, 'mic'), 0);
  assert.equal(count(empty, 'speaker', 'circle'), 0);
});

test('a classroom is dimensioned by desk and row', () => {
  const plan = applyRoomType(base, 'training');
  const t = texts(get(buildDrawings(plan, analyze(plan)), 'floor'));
  assert.ok(t.includes('1.8 m'), 'desk width');
  assert.ok(t.includes('1.3 m'), 'row pitch');
  assert.ok(t.includes('2.2 m'), 'clear space for the presenter');
});

test('the display wall and the section carry the camera and display heights', () => {
  const plan = applyPreset(applyRoomType(base, 'conference'), 'standard');
  const a = analyze(plan);
  const all = buildDrawings(plan, a);
  const bottom = a.displays.centerY - a.displays.height / 2;
  const front = texts(get(all, 'front'));
  assert.ok(front.includes(`bottom ${formatLength(bottom, 'm')}`));
  assert.equal(count(get(all, 'front'), 'camera'), a.gear.cameras.filter((c) => c.pos[2] < 0).length);
  const side = texts(get(all, 'side'));
  assert.ok(side.includes(`display centre ${formatLength(a.displays.centerY, 'm')}`));
  assert.ok(side.some((t) => t.startsWith('seated ear height')));
  assert.equal(count(get(all, 'side'), 'camera'), a.gear.cameras.length);
});

test('drawings follow the chosen unit', () => {
  const plan = normalizePlan({ ...base, unit: 'ft' });
  const all = buildDrawings(plan, analyze(plan));
  assert.ok(texts(get(all, 'floor')).some((t) => t.endsWith(' ft')));
  assert.ok(!texts(get(all, 'floor')).some((t) => t.endsWith(' m')));
});
