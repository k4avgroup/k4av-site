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
  displaySizes,
  encodePlan,
  normalizePlan,
  ptzCameras,
  rules,
  type Plan,
  type RoomType,
} from '../lib/planner/model.ts';
import { signalFlow } from '../lib/planner/flow.ts';
import { buildDrawings } from '../lib/planner/drawings.ts';

const plan = (over: Record<string, unknown> = {}) => normalizePlan({ ...defaultPlan, ...over });
const room = (type: RoomType, preset: 'essential' | 'standard' | 'premium', over: Record<string, unknown> = {}) =>
  normalizePlan({ ...applyPreset(applyRoomType(defaultPlan, type), preset), ...over });
const kinds = (p: Plan) => analyze(p).gear.cameras.map((c) => c.kind);
const count = (list: string[], kind: string) => list.filter((k) => k === kind).length;
const names = (p: Plan) => analyze(p).items.map((i) => i.name);

test('a huddle is a video bar and a touch panel; the packages add sharing, a computer, a microphone and a table camera', () => {
  const essential = room('huddle', 'essential');
  const standard = room('huddle', 'standard');
  const premium = room('huddle', 'premium');
  for (const p of [essential, standard, premium]) {
    assert.equal(p.bar, 'compact');
    assert.equal(p.control, 'table', 'a touch panel on the table, always');
    assert.equal(p.dsp, false, 'no audio processor in a huddle');
    assert.equal(p.speakers, 'none', 'the bar has the speakers');
    assert.equal(p.displays, 1);
    assert.deepEqual([p.presenter, p.wallCameras, p.backCameras, p.wireless], [false, 0, 0, 0]);
    assert.ok(!names(p).some((n) => /Ceiling|Audio processor/.test(n)), 'no ceiling parts');
  }
  assert.deepEqual(
    [essential.sharing, essential.engine, essential.mics, essential.tableCamera],
    ['none', false, 'none', false],
  );
  assert.deepEqual([standard.sharing, standard.tablePanels, standard.engine], ['cable', true, false]);
  assert.deepEqual([premium.engine, premium.mics, premium.tableCamera], [true, 'table', true]);
  assert.equal(analyze(premium).gear.mics.length, 1, 'one table microphone');
  assert.deepEqual(kinds(premium), ['bar', 'table']);
  // whatever is asked for, a huddle keeps to its own kind of room
  const forced = normalizePlan({
    roomType: 'huddle',
    speakers: 'ceiling',
    mics: 'ceiling',
    dsp: true,
    presenter: true,
    wallCameras: 2,
    backCameras: 1,
    wireless: 4,
    displayType: 'led',
    displays: 2,
  });
  assert.deepEqual(
    [
      forced.speakers,
      forced.mics,
      forced.dsp,
      forced.presenter,
      forced.wallCameras,
      forced.backCameras,
      forced.wireless,
    ],
    ['front', 'none', false, false, 0, 0, 0],
  );
  assert.deepEqual([forced.displayType, forced.displays], ['flat', 1]);
});

test('a conference room goes from one larger bar, to separate parts, to more cameras and denser audio', () => {
  const essential = room('conference', 'essential');
  assert.deepEqual(
    [essential.bar, essential.cameras, essential.speakers, essential.mics],
    ['large', 'none', 'none', 'none'],
  );
  assert.deepEqual(
    [essential.sharing, essential.tablePanels, essential.control, essential.dsp],
    ['cable', true, 'table', false],
  );
  const standard = room('conference', 'standard', { seats: 8, length: 8, width: 6 });
  const s = analyze(standard);
  assert.deepEqual([standard.bar, standard.cameras, standard.cameraSpot], ['none', 'one', 'above']);
  assert.deepEqual(
    [standard.mics, standard.speakers, standard.dsp, standard.wireless, standard.engine],
    ['ceiling', 'both', true, 2, true],
  );
  assert.equal(s.gear.mics.length, 1, 'one ceiling microphone for eight');
  assert.equal(s.gear.speakers.length, 4, 'four ceiling speakers for eight');
  assert.equal(s.gear.wallSpeakers.length, 2, 'and a pair in front');
  const premium = room('conference', 'premium', { seats: 8, length: 8, width: 6 });
  const p = analyze(premium);
  assert.equal(p.gear.speakers.length, 6, 'six ceiling speakers for eight');
  assert.deepEqual(kinds(premium), ['front', 'wall', 'wall', 'presenter']);
  assert.deepEqual([premium.wireless, premium.sharing, premium.displays], [4, 'both', 2]);
});

test('a boardroom has ceiling microphones from the start, and adds cameras beside the display', () => {
  const [e, s, p] = (['essential', 'standard', 'premium'] as const).map((x) => room('boardroom', x, { seats: 12 }));
  for (const x of [e, s, p]) {
    assert.equal(x.mics, 'ceiling');
    assert.equal(x.presenter, true);
    assert.equal(x.control, 'table');
    assert.ok(analyze(x).gear.mics.length >= 2, 'at least two ceiling microphones');
    assert.equal(count(kinds(x), 'presenter'), 1, 'a presenter camera');
    assert.ok(x.wireless >= 2);
  }
  assert.deepEqual([e.cameras, s.cameras, p.cameras], ['one', 'two', 'pairs']);
  assert.deepEqual([e.sharing, p.sharing, p.wireless], ['cable', 'both', 4]);
  assert.equal(analyze(p).gear.speakers.length > analyze(s).gear.speakers.length, true);
});

test('a training room has a bar and a presenter camera at first, then ceiling microphones, and never table microphones', () => {
  const e = room('training', 'essential');
  assert.deepEqual([e.bar, e.speakers, e.presenter, e.mics], ['large', 'front', true, 'none']);
  assert.deepEqual(kinds(e), ['bar', 'presenter']);
  const s = room('training', 'standard');
  assert.equal(s.mics, 'ceiling');
  assert.ok(analyze(s).gear.mics.length >= 2);
  assert.deepEqual([s.speakers, s.dsp, s.wireless], ['both', true, 2]);
  const p = room('training', 'premium');
  assert.deepEqual([p.wireless, p.sharing, p.dsp], [4, 'both', true]);
  for (const x of [e, s, p]) assert.notEqual(x.mics, 'table');
  assert.equal(normalizePlan({ roomType: 'training', mics: 'table' }).mics, 'ceiling');
  assert.equal(normalizePlan({ roomType: 'training', mics: 'gooseneck' }).mics, 'gooseneck', 'for courts and councils');
  const classroom = applyScenario(defaultPlan, 'classroom');
  assert.equal(classroom.whiteboard, true);
  assert.equal(normalizePlan({ roomType: 'conference', whiteboard: true }).whiteboard, false);
});

test('a video bar is the front camera, so it replaces the cameras at the display', () => {
  const p = plan({ bar: 'large', cameras: 'two' });
  assert.equal(p.cameras, 'none');
  const a = analyze(p);
  assert.deepEqual(kinds(p), ['bar']);
  assert.equal(ptzCameras(a.gear).length, 0, 'a bar is not a PTZ camera on the switch');
  const above = analyze(plan({ bar: 'large', cameraSpot: 'above' }));
  const below = analyze(plan({ bar: 'large', cameraSpot: 'below' }));
  const top = above.displays.centerY + above.displays.height / 2;
  const bottom = below.displays.centerY - below.displays.height / 2;
  assert.ok((above.gear.bar?.pos[1] ?? 0) > top, 'above the display');
  assert.ok((below.gear.bar?.pos[1] ?? 9) < bottom, 'below the display');
  assert.equal(below.displays.centerY, above.displays.centerY, 'the display stays; the bar moves');
  assert.equal(analyze(plan({ bar: 'compact' })).gear.bar?.width, rules.bar.compact.width);
  assert.equal(analyze(plan({ bar: 'large' })).gear.bar?.width, rules.bar.large.width);
  assert.equal(plan({ bar: 'giant' }).bar, 'none');
  // with a bar that runs the platform itself there is no computer; with one, the computer is listed
  const alone = analyze(plan({ bar: 'large', engine: false }));
  assert.ok(alone.items.find((i) => i.name.includes('Teams'))?.note?.includes('bar itself'));
  const paired = analyze(plan({ bar: 'large', engine: true }));
  assert.ok(paired.items.find((i) => i.name.includes('Teams'))?.note?.includes('room computer'));
  assert.equal(plan({ system: 'byod', bar: 'large', engine: true }).engine, false);
  assert.equal(plan({ bar: 'none', engine: false }).engine, true, 'without a bar the platform needs a computer');
});

test('older links with a soundbar and built-in microphones open as a video bar', () => {
  const old = normalizePlan({
    roomType: 'conference',
    speakers: 'soundbar',
    mics: 'integrated',
    cameras: 'one',
    tablePanels: true,
  });
  assert.deepEqual(
    [old.bar, old.speakers, old.mics, old.cameras, old.sharing],
    ['large', 'none', 'none', 'none', 'cable'],
  );
  assert.equal(normalizePlan({ roomType: 'huddle', speakers: 'soundbar' }).bar, 'compact');
  // a link written before the new choices existed: they take sensible values
  const link = JSON.parse(atob(encodePlan(plan()).replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(3).slice(0, 0)));
  const written = btoa(JSON.stringify(link.slice(0, 29))).replace(/=+$/, '');
  const decoded = decodePlan(written);
  assert.ok(decoded);
  assert.deepEqual(
    [decoded.bar, decoded.wallCameras, decoded.backCameras, decoded.wireless, decoded.displayType],
    ['none', 0, 0, 0, 'flat'],
  );
  assert.equal(decoded.speakers, plan().speakers);
});

test('table microphones, gooseneck and microphones on cords are counted from the seats and the table', () => {
  const tableMics = (p: Record<string, unknown>) => analyze(plan({ mics: 'table', ...p })).gear.mics.length;
  assert.equal(tableMics({ roomType: 'huddle', seats: 6 }), 1, 'a huddle has one');
  assert.equal(tableMics({ seats: 8 }), 2);
  assert.equal(tableMics({ roomType: 'boardroom', seats: 12 }), 3);
  assert.equal(tableMics({ roomType: 'boardroom', seats: 14 }), 4);
  for (const seats of [4, 8, 9, 14]) {
    assert.equal(analyze(plan({ mics: 'gooseneck', seats })).gear.mics.length, Math.ceil(seats / 2), `${seats} seats`);
  }
  const flush = analyze(plan({ mics: 'ceiling' })).gear;
  const hung = analyze(plan({ mics: 'pendant' })).gear;
  assert.equal(flush.micDrop, 0);
  assert.equal(hung.micDrop, rules.pendantDrop);
  assert.equal(hung.mics.length, flush.mics.length);
  assert.ok(hung.mics[0][1] < flush.mics[0][1], 'lowered on cords');
  assert.ok(hung.micRadius < flush.micRadius, 'closer to the people, so it hears a smaller area');
  assert.ok(analyze(plan({ roomType: 'boardroom', mics: 'pendant', seats: 8 })).gear.mics.length >= 2);
  const arrays = names(plan({ mics: 'pendant' })).find((n) => n.startsWith('Pendant'));
  assert.ok(arrays, 'listed');
  assert.ok(names(plan({ mics: 'gooseneck' })).some((n) => n.startsWith('Gooseneck')));
});

test('gooseneck and table microphones stand on the tabletop, whatever the table', () => {
  const distance = (
    px: number,
    pz: number,
    t: { x: number; z: number; length: number; width: number; shape: string },
  ) =>
    t.shape === 'round'
      ? Math.max(0, Math.hypot(px - t.x, pz - t.z) - t.width / 2)
      : Math.hypot(Math.max(Math.abs(px - t.x) - t.width / 2, 0), Math.max(Math.abs(pz - t.z) - t.length / 2, 0));
  const cases: [RoomType, string][] = [
    ['conference', 'rect'],
    ['conference', 'boat'],
    ['conference', 'round'],
    ['conference', 'u'],
    ['boardroom', 'boat'],
    ['training', 'rect'],
  ];
  for (const [roomType, shape] of cases) {
    const p = normalizePlan({ roomType, shape, seats: 12, length: 12, width: 12, mics: 'gooseneck' });
    const a = analyze(p);
    assert.ok(a.gear.mics.length >= 1, `${roomType} ${shape}`);
    for (const m of a.gear.mics) {
      assert.ok(
        Math.min(...a.layout.tables.map((t) => distance(m[0], m[2], t))) <= 0.01,
        `${roomType} ${shape}: on the table`,
      );
    }
  }
});

test('ceiling speakers follow their size and how they hang, and the ceiling height is checked', () => {
  const base = { roomType: 'conference', speakers: 'ceiling', mics: 'none', length: 8, width: 6, seats: 8, height: 3 };
  const n = (over: Record<string, unknown>) => analyze(plan({ ...base, ...over })).gear.speakers.length;
  const sizes = [4, 7, 8, 10].map((speakerSize) => n({ speakerSize }));
  for (let i = 1; i < sizes.length; i++) assert.ok(sizes[i] <= sizes[i - 1], `bigger cones cover more: ${sizes}`);
  assert.ok(sizes[0] > sizes[3], 'a 4 in speaker needs more of them than a 10 in one');
  assert.equal(plan({ speakerSize: 5 }).speakerSize, 7);
  assert.equal(plan({ speakerMount: 'floating' }).speakerMount, 'flush');
  const pendant = analyze(plan({ ...base, speakerMount: 'pendant', height: 4.5 })).gear;
  const flush = analyze(plan({ ...base, height: 4.5 })).gear;
  assert.equal(pendant.speakerDrop, rules.pendantDrop);
  assert.ok(pendant.speakers[0][1] < flush.speakers[0][1], 'hung below the ceiling');
  assert.ok(pendant.speakerRadius < flush.speakerRadius);
  assert.ok(pendant.speakers.length >= flush.speakers.length);
  const heightWarning = (over: Record<string, unknown>) =>
    analyze(plan({ ...base, ...over })).warnings.some((w) => w.includes('Choose larger speakers'));
  assert.equal(heightWarning({ speakerSize: 4, height: 3 }), false);
  assert.equal(heightWarning({ speakerSize: 4, height: 3.6 }), true, 'too high for small speakers');
  assert.equal(heightWarning({ speakerSize: 10, height: 3.6 }), false);
  assert.equal(heightWarning({ speakerSize: 7, height: 4.5 }), true);
  assert.equal(heightWarning({ speakerSize: 7, height: 4.5, speakerMount: 'pendant' }), true, 'still tall');
  assert.equal(heightWarning({ speakerSize: 7, height: 3.9, speakerMount: 'pendant' }), false, 'cords bring them down');
  assert.equal(heightWarning({ speakerSize: 7, height: 3.9 }), true);
  const item = analyze(plan({ ...base, speakerSize: 8, speakerMount: 'pendant' })).items.find((i) =>
    i.name.startsWith('Ceiling'),
  );
  assert.ok(item?.name.includes('8 in') && item.name.includes('cords'));
  const ceilingNoDsp = analyze(plan({ ...base, dsp: false })).warnings;
  assert.ok(ceilingNoDsp.some((w) => w.includes('audio processor')));
});

test('speakers can be a wall pair, ceiling speakers, or both', () => {
  const gear = (speakers: string) => analyze(plan({ speakers })).gear;
  assert.deepEqual([gear('none').speakers.length, gear('none').wallSpeakers.length], [0, 0]);
  assert.deepEqual([gear('front').speakers.length, gear('front').wallSpeakers.length], [0, 2]);
  assert.ok(gear('ceiling').speakers.length >= 2 && gear('ceiling').wallSpeakers.length === 0);
  assert.ok(gear('both').speakers.length >= 2 && gear('both').wallSpeakers.length === 2);
  assert.equal(plan({ speakers: 'loud' }).speakers, defaultPlan.speakers);
});

test('cameras: two on each side of the display, on the side walls, at the back and on the table', () => {
  const pairs = analyze(plan({ cameras: 'pairs' }));
  const front = pairs.gear.cameras.filter((c) => c.kind === 'front');
  assert.equal(front.length, 4);
  assert.equal(front.filter((c) => c.pos[0] < 0).length, 2);
  assert.equal(front.filter((c) => c.pos[0] > 0).length, 2);
  const left = front.filter((c) => c.pos[0] < 0).map((c) => Math.abs(c.pos[0]));
  assert.ok(Math.min(...left) > pairs.displays.width / 2, 'clear of the display');
  assert.ok(Math.max(...front.map((c) => Math.abs(c.pos[0]))) <= 3 - 0.3 + 1e-9, 'inside the room');
  assert.equal(plan({ cameras: 'pairs', cameraSpot: 'both' }).cameraSpot, 'sides');

  const side = analyze(plan({ wallCameras: 3 }));
  const walls = side.gear.cameras.filter((c) => c.kind === 'wall');
  assert.equal(walls.length, 3);
  assert.equal(walls.filter((c) => c.wall === 'left').length, 2);
  assert.equal(walls.filter((c) => c.wall === 'right').length, 1);
  for (const c of walls) {
    assert.equal(Math.abs(c.pos[0]), 3 - 0.12, 'on the side wall');
    assert.ok(c.pos[1] <= 3 - 0.3, 'under the ceiling');
    assert.ok(Math.sign(c.target[0]) === -Math.sign(c.pos[0]), 'looks across the room');
    assert.ok(c.pos[2] > -4 && c.pos[2] < 4);
  }
  assert.equal(analyze(plan({ wallCameras: 9 })).gear.cameras.filter((c) => c.kind === 'wall').length, 4);

  const two = analyze(plan({ backCameras: 2 }));
  const backs = two.gear.cameras.filter((c) => c.wall === 'back');
  assert.equal(backs.length, 2);
  assert.deepEqual(
    backs.map((c) => c.pos[0]).sort((a, b) => a - b),
    [-1.5, 1.5],
  );
  assert.ok(backs.every((c) => c.pos[2] === 4 - 0.15));
  assert.equal(plan({ presenter: true, backCameras: 0 }).backCameras, 1, 'a presenter needs the camera at the back');
  const both = analyze(plan({ presenter: true, backCameras: 2 }));
  assert.equal(
    count(
      both.gear.cameras.map((c) => c.kind),
      'presenter',
    ),
    1,
  );
  assert.equal(
    count(
      both.gear.cameras.map((c) => c.kind),
      'back',
    ),
    1,
  );

  const onTable = analyze(plan({ tableCamera: true }));
  const cam = onTable.gear.cameras.find((c) => c.kind === 'table');
  assert.ok(cam);
  assert.ok(Math.abs(cam.pos[2] - onTable.layout.table.z) <= onTable.layout.table.length / 2, 'on the table');
  assert.ok(cam.pos[1] > 0.76 && cam.pos[1] < 1);
  assert.equal(plan({ roomType: 'training', tableCamera: true }).tableCamera, false);
  assert.equal(ptzCameras(onTable.gear).length, 1, 'a table camera is not on the PoE switch');
  assert.ok(names(plan({ tableCamera: true })).some((n) => n.startsWith('Table camera')));
});

test('wireless microphones come in twos and fours, and a presenter always has some', () => {
  assert.equal(plan({ wireless: 4 }).wireless, 4);
  assert.equal(plan({ wireless: 3 }).wireless, 0);
  assert.equal(plan({ presenter: true, wireless: 0 }).wireless, 2);
  assert.equal(plan({ presenter: false, wireless: 0 }).wireless, 0);
  assert.equal(plan({ roomType: 'huddle', wireless: 4 }).wireless, 0);
  const item = analyze(plan({ wireless: 4, presenter: false })).items.find((i) =>
    i.name.startsWith('Wireless microphones'),
  );
  assert.equal(item?.qty, 4);
  assert.ok(!names(plan({ wireless: 0, presenter: false })).some((n) => n.startsWith('Wireless microphones')));
});

test('the display can be a flat panel, an LED wall, or a projector with a retractable screen', () => {
  const flat = analyze(plan({ displayType: 'flat' })).displays;
  assert.equal(flat.projector, null);
  const led = analyze(plan({ displayType: 'led', displays: 2 }));
  assert.equal(led.displays.count, 1, 'an LED wall is one wall');
  assert.ok(displaySizes('led').includes(led.displays.size));
  assert.ok(names(plan({ displayType: 'led' })).some((n) => n.startsWith('LED video wall')));
  assert.equal(plan({ displayType: 'led', displaySize: 75 }).displaySize, null, 'a 75 in panel is not an LED size');
  assert.equal(plan({ displayType: 'led', displaySize: 165 }).displaySize, 165);
  assert.equal(plan({ displayType: 'hologram' }).displayType, 'flat');

  const long = analyze(plan({ displayType: 'projector', length: 10, width: 7, displaySize: 120 })).displays;
  assert.ok(long.projector && !long.projector.short, 'a standard lens in a long room');
  assert.ok(long.projector.pos[1] < 3 && long.projector.pos[1] > 2.5, 'near the ceiling');
  assert.ok(long.projector.pos[2] > -5 && long.projector.pos[2] < 5, 'inside the room');
  const short = analyze(plan({ displayType: 'projector', length: 5, width: 4.5, seats: 4, displaySize: 150 })).displays;
  assert.equal(short.projector?.short, true, 'short-throw when the room is short');
  assert.ok((short.projector?.throw ?? 9) < (long.projector?.throw ?? 0));
  const items = analyze(plan({ displayType: 'projector', displays: 2, displaySize: 100, width: 8 })).items;
  assert.equal(items.find((i) => i.name === 'Projector')?.qty, 2);
  assert.equal(items.find((i) => i.name.startsWith('Retractable screen'))?.qty, 2);
  assert.ok(displaySizes('projector').length >= 4 && displaySizes('flat').includes(98));
});

test('an interactive whiteboard stands beside the display in a classroom and must fit the wall', () => {
  const p = room('training', 'standard', { whiteboard: true, length: 10, width: 8 });
  const a = analyze(p);
  assert.ok(a.displays.whiteboard);
  assert.ok(a.displays.whiteboard.x > a.displays.width / 2, 'to the right of the display');
  assert.equal(a.displays.wallFits, true);
  assert.ok(a.gear.wallSpeakers[1][0] > a.displays.whiteboard.x, 'the right speaker moves out beyond it');
  assert.ok(names(p).includes('Interactive whiteboard, 86"'));
  const tight = analyze(room('training', 'standard', { whiteboard: true, length: 10, width: 5, displaySize: 86 }));
  assert.equal(tight.displays.wallFits, false);
  assert.ok(tight.warnings.some((w) => w.includes('whiteboard')));
  assert.equal(analyze(room('training', 'standard', { whiteboard: false })).displays.whiteboard, null);
});

test('sharing from laptops can be a cable, a wireless gateway, both or neither', () => {
  const list = (sharing: string) => names(plan({ sharing }));
  assert.ok(list('cable').some((n) => n.startsWith('Laptop sharing cable')));
  assert.ok(!list('cable').some((n) => n.startsWith('Wireless presentation')));
  assert.ok(list('wireless').some((n) => n.startsWith('Wireless presentation')));
  assert.ok(!list('wireless').some((n) => n.startsWith('Laptop sharing')));
  assert.ok(
    list('both').some((n) => n.startsWith('Wireless presentation')) && list('both').some((n) => n.startsWith('Laptop')),
  );
  assert.ok(!list('none').some((n) => n.startsWith('Wireless presentation') || n.startsWith('Laptop sharing')));
  assert.equal(normalizePlan({ roomType: 'conference', tablePanels: false }).sharing, 'none');
  assert.equal(normalizePlan({ roomType: 'conference', tablePanels: true }).sharing, 'cable');
  const p = plan({ sharing: 'wireless' });
  const { links } = signalFlow(p, analyze(p));
  assert.ok(links.some((l) => l.from === 'gateway' && l.to === 'displays' && l.signal === 'video'));
});

test('the signal flow follows the new devices', () => {
  const p = room('conference', 'premium', {
    tableCamera: true,
    mics: 'pendant',
    speakerMount: 'pendant',
    whiteboard: false,
  });
  const { nodes, links } = signalFlow(p, analyze(p));
  const title = (id: string) => nodes.find((n) => n.id === id)?.title ?? '';
  assert.ok(title('mics').includes('pendant'));
  assert.ok(title('wireless').startsWith('4×'));
  assert.ok(title('wallSpeakers').includes('wall') && title('speakers').includes('ceiling'));
  assert.ok(nodes.find((n) => n.id === 'speakers')?.detail?.includes('cords'));
  assert.ok(links.some((l) => l.from === 'tableCamera' && l.to === 'system'));
  assert.ok(links.some((l) => l.from === 'amp' && l.to === 'wallSpeakers' && l.analog));
  assert.ok(links.some((l) => l.from === 'processor' && l.to === 'amp' && l.analog));
  const led = plan({ displayType: 'led' });
  assert.ok(
    signalFlow(led, analyze(led))
      .nodes.find((n) => n.id === 'displays')
      ?.title.startsWith('LED wall'),
  );
  const proj = plan({ displayType: 'projector', displays: 2 });
  assert.ok(
    signalFlow(proj, analyze(proj))
      .nodes.find((n) => n.id === 'displays')
      ?.title.includes('projector'),
  );
  const board = room('training', 'standard', { whiteboard: true });
  assert.ok(signalFlow(board, analyze(board)).links.some((l) => l.to === 'whiteboard'));
  // a bar with a computer of its own is a device in the flow; alone it is the system
  const paired = plan({ bar: 'large', engine: true });
  const flow = signalFlow(paired, analyze(paired));
  assert.ok(flow.nodes.some((n) => n.id === 'bar') && flow.links.some((l) => l.from === 'bar' && l.to === 'system'));
});

test('every new choice travels in the link', () => {
  const samples = [
    room('huddle', 'premium'),
    room('conference', 'premium', { speakerSize: 10, speakerMount: 'pendant', displayType: 'projector' }),
    room('boardroom', 'premium', { mics: 'gooseneck', displayType: 'led' }),
    room('training', 'premium', { whiteboard: true, wallCameras: 3, backCameras: 2, sharing: 'wireless' }),
    plan({ bar: 'large', engine: true, cameraSpot: 'below', tableCamera: true }),
  ];
  for (const p of samples) assert.deepEqual(decodePlan(encodePlan(p)), p);
});

test('every package of every room draws, lists and flows without gaps, with every optional part switched on', () => {
  const extras: Record<string, unknown>[] = [
    {},
    { displayType: 'led' },
    { displayType: 'projector', displays: 2 },
    { mics: 'pendant', speakerMount: 'pendant', speakerSize: 4 },
    { mics: 'gooseneck', speakers: 'both', wallCameras: 4, backCameras: 2, tableCamera: true },
    { bar: 'compact', cameraSpot: 'below', engine: true },
    { whiteboard: true, sharing: 'both', wireless: 4 },
  ];
  for (const type of ['huddle', 'conference', 'boardroom', 'training'] as const) {
    for (const preset of ['essential', 'standard', 'premium'] as const) {
      for (const extra of extras) {
        const p = room(type, preset, { length: 11, width: 9, ...extra });
        const a = analyze(p);
        const label = `${type} ${preset} ${JSON.stringify(extra)}`;
        assert.ok(a.items.length >= 4, label);
        for (const item of a.items) assert.ok(item.qty >= 1 && item.name.length > 0, `${label}: ${item.name}`);
        const flow = signalFlow(p, a);
        const ids = new Set(flow.nodes.map((n) => n.id));
        assert.equal(ids.size, flow.nodes.length, `${label}: unique node ids`);
        for (const l of flow.links) assert.ok(ids.has(l.from) && ids.has(l.to), `${label}: ${l.from}-${l.to}`);
        assert.equal(decodePlan(encodePlan(p))?.bar, p.bar, label);
        for (const d of buildDrawings(p, a)) {
          assert.ok(Number.isFinite(d.width) && Number.isFinite(d.height) && d.prims.length > 5, `${label}: ${d.id}`);
          for (const prim of d.prims) {
            const nums = Object.values(prim).filter((v) => typeof v === 'number') as number[];
            assert.ok(nums.every(Number.isFinite), `${label}: ${d.id} has a finite ${prim.k}`);
          }
        }
        assert.ok(computeLayout(p).seats.length === p.seats, label);
      }
    }
  }
});
