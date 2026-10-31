import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyze,
  applyPreset,
  applyRoomType,
  applyScenario,
  defaultPlan,
  normalizePlan,
  scenarios,
  type Plan,
  type RoomType,
} from '../lib/planner/model.ts';
import { cablingPlan, displayWall, floorPlan, scheduleDrawing, wrapText, type Prim } from '../lib/planner/drawings.ts';
import { deviceSchedule, heightText, rackLayout } from '../lib/planner/schedule.ts';
import { buildSheet, buildSheets, imperialScales, metricScales, pointsPerMetre } from '../lib/planner/sheet.ts';

const room = (type: RoomType, preset: 'essential' | 'standard' | 'premium', over: Record<string, unknown> = {}) =>
  normalizePlan({ ...applyPreset(applyRoomType(defaultPlan, type), preset), ...over });
const texts = (d: { prims: Prim[] }) =>
  d.prims.filter((p): p is Extract<Prim, { k: 'text' }> => p.k === 'text').map((p) => p.t);
const rows = (p: Plan) => deviceSchedule(p, analyze(p)).flatMap((g) => g.rows);
const today = '2026-10-31';

const everyRoom: { label: string; plan: Plan }[] = [
  ...(['m', 'ft'] as const).flatMap((unit) =>
    (['huddle', 'conference', 'boardroom', 'training'] as const).flatMap((type) =>
      (['essential', 'standard', 'premium'] as const).flatMap((preset) =>
        (['behind', 'room', 'outside', 'none'] as const).map((rack) => ({
          label: `${unit} ${type} ${preset} rack ${rack}`,
          plan: room(type, preset, { unit, rack, length: 9, width: 7 }),
        })),
      ),
    ),
  ),
  ...scenarios.map((s) => ({ label: `scenario ${s.id}`, plan: applyScenario(defaultPlan, s.id) })),
];

test('heights are written the way a drawing writes them', () => {
  assert.equal(heightText(1.57, 'm'), '1570 mm');
  assert.equal(heightText(2.2, 'm'), '2200 mm');
  assert.equal(heightText(1.35, 'ft'), '4\'-5"');
  assert.equal(heightText(0.3048, 'ft'), '1\'-0"');
});

test('the schedule lists what the room has, once, with the tags of the drawings', () => {
  for (const { label, plan } of everyRoom) {
    const a = analyze(plan);
    const list = rows(plan);
    assert.ok(list.length > 0, label);
    for (const r of list) {
      assert.ok(r.tag && r.name && r.where, `${label}: ${JSON.stringify(r)}`);
      assert.ok(Number.isInteger(r.qty) && r.qty > 0, `${label}: ${r.tag} quantity`);
    }
    // a tag appears once, so a drawing can point at one row
    const tags = list.map((r) => r.tag);
    assert.equal(new Set(tags).size, tags.length, `${label}: tags are unique (${tags.join(' ')})`);
    // what the plans show is what the schedule counts
    const byTag = (tag: string) => list.find((r) => r.tag === tag);
    assert.equal(byTag('CS')?.qty ?? 0, a.gear.speakers.length, `${label}: ceiling speakers`);
    assert.equal(byTag('WS')?.qty ?? 0, a.gear.wallSpeakers.length, `${label}: wall speakers`);
    assert.equal(byTag('DS')?.qty, plan.displayType === 'led' ? 1 : a.displays.count, `${label}: displays`);
    const mics = ['MIC', 'TM', 'GM'].map(byTag).find(Boolean);
    assert.equal(mics?.qty ?? 0, a.gear.mics.length, `${label}: microphones`);
    assert.equal(byTag('WM') ? 1 : 0, a.gear.credenza ? 1 : 0, `${label}: the microphone cabinet`);
    assert.equal(byTag('TP') ? 1 : 0, a.gear.control ? 1 : 0, `${label}: the touch panel`);
    assert.equal(byTag('WP')?.qty ?? 0, a.gear.pucks.length, `${label}: wireless sharing buttons`);
    const cams = list.filter((r) => /^C\d+$/.test(r.tag));
    assert.deepEqual(
      cams.map((r) => r.tag),
      a.gear.cameras.map((_, i) => `C${i + 1}`),
      `${label}: cameras are numbered as on the plans`,
    );
  }
});

test('the rack is listed unit by unit, in the order and the unit numbers of the elevation', () => {
  for (const { label, plan } of everyRoom) {
    const a = analyze(plan);
    const rack = a.gear.rack;
    const list = rows(plan);
    if (!rack) {
      assert.ok(!list.some((r) => r.tag === 'AVR' || r.tag === 'EB'), `${label}: no rack, no rack rows`);
      continue;
    }
    const layout = rackLayout(rack);
    const units = layout.filter((r) => r.item.kind !== 'blank');
    assert.equal(units.length, rack.items.length, label);
    // numbered from the bottom, with no gaps from the top unit down to 1
    assert.equal(
      layout[0].top,
      Math.max(
        rack.u,
        rack.items.reduce((s, i) => s + i.u, 0),
      ),
      label,
    );
    layout.forEach((r, i) => {
      assert.equal(r.bottom, r.top - r.item.u + 1, label);
      if (i > 0) assert.equal(r.top, layout[i - 1].bottom - 1, `${label}: units follow one another`);
    });
    assert.equal(layout[layout.length - 1].bottom, 1, `${label}: down to unit 1`);
    // the schedule lists the same units, once each, after the rack itself
    const start = list.findIndex((r) => r.tag === 'AVR' || r.tag === 'EB');
    assert.ok(start >= 0, `${label}: the rack row`);
    assert.deepEqual(
      list.slice(start + 1).map((r) => r.tag),
      units.map((r) => r.label),
      label,
    );
    assert.equal((rack.mode === 'behind' ? 'EB' : 'AVR') === list[start].tag, true, label);
  }
});

test('the wireless receiver does not share its tag with the microphone cabinet', () => {
  const p = room('conference', 'premium', { rack: 'room' });
  const list = rows(p);
  assert.ok(
    list.some((r) => r.tag === 'WM'),
    'the cabinet',
  );
  assert.ok(
    list.some((r) => r.tag === 'WR-01'),
    'the receiver in the rack',
  );
});

test('the room system says where it runs, and the laptop keeps its place in the rack', () => {
  const byod = room('conference', 'standard', { rack: 'room', system: 'byod' });
  assert.match(rows(byod).find((r) => r.tag === 'RS')?.where ?? '', /laptop/);
  const teams = room('huddle', 'premium', { system: 'teams', engine: true, rack: 'room' });
  const pc = rows(teams).find((r) => r.tag.startsWith('PC-'));
  assert.ok(pc, 'a room computer');
  assert.equal(rows(teams).find((r) => r.tag === 'RS')?.where, `Runs on ${pc?.tag}`);
  assert.ok(rows(room('conference', 'standard', { rack: 'room' })).some((r) => r.tag === 'LAPTOP'));
});

test('the schedule is a table whose text stays inside its cells, in every room', () => {
  for (const { label, plan } of everyRoom) {
    const a = analyze(plan);
    const d = scheduleDrawing(plan, a);
    assert.equal(d.id, 'schedule');
    assert.ok(Number.isFinite(d.width) && Number.isFinite(d.height) && d.width > 400 && d.height > 100, label);
    const words = texts(d);
    for (const head of ['TAG', 'DEVICE', 'QTY', 'LOCATION', 'MOUNTING']) assert.ok(words.includes(head), label);
    assert.ok(words.includes('Device schedule'), label);
    for (const r of rows(plan)) assert.ok(words.includes(r.tag), `${label}: ${r.tag} is in the table`);
    for (const q of d.prims) {
      const nums = Object.values(q).filter((v) => typeof v === 'number') as number[];
      assert.ok(nums.every(Number.isFinite), `${label}: finite ${q.k}`);
      if (q.k === 'text') assert.ok(q.y <= d.height && q.x <= d.width, `${label}: text on the page`);
    }
  }
});

test('long names break at spaces and no line is longer than it may be', () => {
  assert.deepEqual(wrapText('one two three', 20), ['one two three']);
  assert.deepEqual(wrapText('Video bar (camera, microphones, speakers)', 20), [
    'Video bar (camera,',
    'microphones,',
    'speakers)',
  ]);
  assert.deepEqual(wrapText('', 10), ['']);
  for (const line of wrapText('Cabinet with the charger and 4 wireless microphones', 24)) assert.ok(line.length <= 24);
});

test('the camera numbers on the display wall are the ones on the plans', () => {
  // a bar and a camera on the wall: the bar is C1, so the wall camera is C2 on every drawing
  const p = normalizePlan({ ...defaultPlan, roomType: 'conference', bar: 'large', cameras: 'one' });
  const a = analyze(p);
  const front = a.gear.cameras.findIndex((c) => c.kind === 'front');
  if (front > 0) {
    assert.ok(texts(displayWall(p, a)).includes(`C${front + 1}`));
    assert.ok(texts(floorPlan(p, a)).includes(`C${front + 1}`));
  }
  for (const { label, plan } of everyRoom.slice(0, 40)) {
    const b = analyze(plan);
    const wall = texts(displayWall(plan, b)).filter((t) => /^C\d+$/.test(t));
    const onWall = b.gear.cameras.map((c, i) => (c.kind === 'front' ? `C${i + 1}` : '')).filter(Boolean);
    assert.deepEqual(wall.sort(), onWall.sort(), label);
  }
});

test('camera numbers on the plans never print on top of each other', () => {
  for (const { label, plan } of everyRoom) {
    const a = analyze(plan);
    for (const scale of [undefined, pointsPerMetre(100), pointsPerMetre(150)]) {
      for (const d of [floorPlan(plan, a, { scale }), cablingPlan(plan, a, { scale })]) {
        const marks = d.prims.filter((p): p is Extract<Prim, { k: 'text' }> => p.k === 'text' && /^C\d+$/.test(p.t));
        marks.forEach((m, i) =>
          marks.slice(i + 1).forEach((o) => {
            const apart = Math.abs(m.x - o.x) >= 12 || Math.abs(m.y - o.y) >= 9;
            assert.ok(apart, `${label} ${d.id}: ${m.t} and ${o.t} overlap`);
          }),
        );
      }
    }
  }
});

test('the printed set is three sheets: the four drawings, the cabling plan, the schedule with the rack', () => {
  for (const { label, plan } of everyRoom) {
    const a = analyze(plan);
    const sheets = buildSheets(plan, a, today);
    assert.equal(sheets.length, 3, label);
    assert.deepEqual(
      sheets.map((s) => s.placed.map((p) => p.drawing.id)),
      [['floor', 'ceiling', 'front', 'side'], ['cabling'], a.gear.rack ? ['schedule', 'rack'] : ['schedule']],
      label,
    );
    sheets.forEach((s, i) => {
      const text = s.block.lines.map((l) => l.text).join('\n');
      assert.ok(text.includes(`Sheet ${i + 1} of 3`), `${label}: ${text}`);
      assert.ok(text.includes(today) && text.includes('K4 AV GROUP'), label);
      // everything is inside the frame, above the strip with the title block
      for (const { drawing, x, y, k = 1 } of s.placed) {
        assert.ok(
          x >= s.frame.x - 1e-6 && x + drawing.width * k <= s.frame.x + s.frame.w + 1e-6,
          `${label} ${drawing.id} across`,
        );
        assert.ok(y >= s.frame.y - 1e-6 && y + drawing.height * k <= s.rule + 1e-6, `${label} ${drawing.id} down`);
        assert.ok(k > 0.5 && k <= 1, `${label} ${drawing.id}: shrunk by ${k}, still readable`);
      }
    });
    assert.equal(sheets[0].scale?.label, buildSheet(plan, a, today).scale.label, label);
  }
});

test('the cabling sheet is at the largest standard scale that fits, with a true scale bar', () => {
  for (const { label, plan } of everyRoom) {
    const a = analyze(plan);
    const sheet = buildSheets(plan, a, today)[1];
    const scales = plan.unit === 'm' ? metricScales : imperialScales;
    const at = scales.findIndex((s) => s.ratio === sheet.scale?.ratio);
    assert.ok(at >= 0, `${label}: a standard scale`);
    const { drawing } = sheet.placed[0];
    assert.ok(Math.abs(drawing.scale - pointsPerMetre(scales[at].ratio)) < 1e-9, `${label}: drawn at that scale`);
    assert.ok(sheet.bar && sheet.bar.width > 40 && sheet.bar.width <= 220, `${label}: a scale bar`);
    const area = { w: sheet.frame.w - 12, h: sheet.rule - sheet.frame.y - 12 };
    assert.ok(drawing.width <= area.w + 1e-6 && drawing.height <= area.h + 1e-6, `${label}: it fits`);
    if (at > 0) {
      const bigger = cablingPlan(plan, a, { scale: pointsPerMetre(scales[at - 1].ratio), bare: true });
      assert.ok(
        bigger.width > area.w || bigger.height > area.h,
        `${label}: ${scales[at - 1].label} would not have fitted`,
      );
    }
  }
});

test('the sheet with the schedule has no scale bar, because nothing on it is to scale', () => {
  const sheet = buildSheets(room('conference', 'standard'), analyze(room('conference', 'standard')), today)[2];
  assert.equal(sheet.scale, null);
  assert.equal(sheet.bar, null);
  assert.ok(
    sheet.block.lines
      .map((l) => l.text)
      .join('\n')
      .includes('Not to scale'),
  );
});
