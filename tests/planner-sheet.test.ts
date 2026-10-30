import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDrawings, roomLabel, type Prim } from '../lib/planner/drawings.ts';
import {
  analyze,
  applyPreset,
  applyRoomType,
  applyScenario,
  defaultPlan,
  normalizePlan,
  roomTypes,
  scenarios,
} from '../lib/planner/model.ts';
import {
  buildSheet,
  imperialScales,
  metricScales,
  papers,
  placeDrawings,
  pointsPerMetre,
} from '../lib/planner/sheet.ts';

const base = normalizePlan(defaultPlan);
const rooms = (['m', 'ft'] as const).flatMap((unit) =>
  (['huddle', 'conference', 'boardroom', 'training'] as const).flatMap((type) =>
    roomTypes[type].shapes.flatMap((shape) =>
      (['essential', 'premium'] as const).map((preset) => ({
        label: `${unit} ${type} ${shape} ${preset}`,
        plan: normalizePlan({ ...applyPreset(applyRoomType(base, type), preset), shape, unit }),
      })),
    ),
  ),
);
const today = '2026-10-28';

test('a point on the sheet is a real length: one metre is the scale of 1 to N', () => {
  const mmPerMetre = (ratio: number) => (pointsPerMetre(ratio) / 72) * 25.4 * ratio;
  for (const ratio of [20, 50, 100, 200]) assert.ok(Math.abs(mmPerMetre(ratio) - 1000) < 1e-6);
  const feet = (ratio: number) => (pointsPerMetre(ratio) * 0.3048 * ratio) / 72; // inches on paper per foot... times ratio
  assert.ok(Math.abs(feet(48) - 12) < 1e-6, 'a foot at 1/4 inch to the foot is a quarter inch');
});

test('every sheet holds its four drawings inside the frame at the largest scale that fits', () => {
  for (const { label, plan } of rooms) {
    const a = analyze(plan);
    const sheet = buildSheet(plan, a, today);
    assert.equal(sheet.paper, plan.unit === 'm' ? papers.metric : papers.imperial, label);
    assert.equal(sheet.fits, true, `${label}: fits at ${sheet.scale.label}`);
    assert.deepEqual(
      sheet.placed.map((p) => p.drawing.id),
      ['floor', 'ceiling', 'front', 'side'],
      label,
    );
    const { frame } = sheet;
    for (const { drawing, x, y } of sheet.placed) {
      assert.ok(x >= frame.x && x + drawing.width <= frame.x + frame.w + 1e-6, `${label} ${drawing.id} across`);
      assert.ok(y >= frame.y && y + drawing.height <= sheet.rule + 1e-6, `${label} ${drawing.id} down`);
      assert.ok(Math.abs(drawing.scale - sheet.pointsPerMetre) < 1e-9, `${label}: one scale for every drawing`);
    }
    // the floor plan's walls are the room, to scale
    const floor = sheet.placed[0].drawing;
    const wall = floor.prims.find((p) => p.k === 'rect' && p.s === 'wall') as Extract<Prim, { k: 'rect' }>;
    assert.ok(Math.abs(wall.w / sheet.pointsPerMetre - plan.width) < 0.01, `${label}: room width to scale`);
    assert.ok(Math.abs(wall.h / sheet.pointsPerMetre - plan.length) < 0.01, `${label}: room length to scale`);
    // no larger standard scale would have fitted
    const sizes = (plan.unit === 'm' ? metricScales : imperialScales).map((s) => s.ratio);
    const at = sizes.indexOf(sheet.scale.ratio);
    assert.ok(at >= 0, `${label}: a standard scale`);
    if (at > 0) {
      const area = { x: frame.x + 6, y: frame.y + 6, w: frame.w - 12, h: sheet.rule - frame.y - 12 };
      const bigger = buildDrawings(plan, a, { scale: pointsPerMetre(sizes[at - 1]), bare: true });
      assert.equal(placeDrawings(bigger, area), null, `${label}: 1:${sizes[at - 1]} would not have fitted`);
    }
  }
});

test('the scale is written the way people read it', () => {
  const metric = buildSheet(base, analyze(base), today);
  assert.match(metric.scale.label, /^1:\d+$/);
  const feet = normalizePlan({ ...base, unit: 'ft' });
  const imperial = buildSheet(feet, analyze(feet), today);
  assert.match(imperial.scale.label, /^\d+\/\d+" = 1'-0"$/);
  assert.equal(imperial.paper.w, 17 * 72);
  assert.equal(imperial.paper.h, 11 * 72);
  assert.ok(Math.abs((metric.paper.w / 72) * 25.4 - 420) < 0.01);
});

test('the title block names the room, the scale and the date', () => {
  for (const { plan } of rooms.slice(0, 6)) {
    const sheet = buildSheet(plan, analyze(plan), today);
    const text = sheet.block.lines.map((l) => l.text).join('\n');
    assert.ok(text.includes('K4 AV GROUP'));
    assert.ok(text.includes(roomLabel(plan)));
    assert.ok(text.includes(sheet.scale.label));
    assert.ok(text.includes(today));
    assert.ok(sheet.block.x >= sheet.frame.x && sheet.block.x + sheet.block.w <= sheet.frame.x + sheet.frame.w);
    assert.ok(sheet.block.y >= sheet.rule && sheet.block.y + sheet.block.h <= sheet.frame.y + sheet.frame.h);
  }
});

test('the scale bar is as long on paper as the length it names', () => {
  for (const { label, plan } of rooms) {
    const sheet = buildSheet(plan, analyze(plan), today);
    const { bar } = sheet;
    assert.equal(bar.unit, plan.unit, label);
    const perUnit = plan.unit === 'm' ? sheet.pointsPerMetre : sheet.pointsPerMetre * 0.3048;
    assert.ok(Math.abs(bar.width - bar.total * perUnit) < 0.02, `${label}: bar length`);
    assert.equal(bar.ticks.length, 3);
    assert.equal(bar.ticks[0].label, '0');
    assert.ok(bar.width <= 220 && bar.width > 40, `${label}: a bar that reads well`);
    assert.ok(bar.x + bar.width < sheet.block.x, `${label}: clear of the title block`);
  }
});

test('drawings for a sheet leave out the lines the title block carries', () => {
  const a = analyze(base);
  const bare = buildDrawings(base, a, { scale: 40, bare: true });
  const full = buildDrawings(base, a, { scale: 40 });
  const texts = (d: { prims: Prim[] }) => d.prims.filter((p) => p.k === 'text').map((p) => (p as { t: string }).t);
  for (let i = 0; i < 4; i++) {
    assert.ok(texts(full[i]).some((t) => t.includes('Indicative sketch')));
    assert.ok(!texts(bare[i]).some((t) => t.includes('Indicative sketch')));
    assert.ok(!texts(bare[i]).includes(roomLabel(base)));
    assert.ok(bare[i].height < full[i].height);
  }
});

test('every ready-made room prints on one sheet at a sensible scale', () => {
  for (const unit of ['m', 'ft'] as const) {
    for (const s of scenarios) {
      const p = applyScenario(normalizePlan({ ...base, unit }), s.id);
      const sheet = buildSheet(p, analyze(p), today);
      assert.equal(sheet.fits, true, `${unit} ${s.id}`);
      const largest = unit === 'm' ? 100 : 96;
      assert.ok(sheet.scale.ratio <= largest, `${unit} ${s.id}: ${sheet.scale.label} is not too small to read`);
    }
  }
});
