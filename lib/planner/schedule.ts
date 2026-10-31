import { rules, speakerSizeLabel, systemName, type Analysis, type Plan, type RackItem, type Wall } from './model.ts';

// The device schedule: what is in the room, with the tag it carries on the drawings, how many, where it is and how
// high it is mounted. Names are by function, not by brand. The tags are the ones on the plans (C1, CS, MIC, WM, AVR)
// and on the rack elevation (PDU-01, DSP-01).

export type ScheduleRow = { tag: string; name: string; qty: number; where: string; mount: string };
export type ScheduleGroup = { title: string; rows: ScheduleRow[] };

// Brand-free tags for the units of the rack, like the tags on an AV drawing: PDU-01, DSP-01, SW-01.
export const rackTag = (name: string) => {
  const starts: [string, string][] = [
    ['Control processor', 'CU'],
    ['Video matrix', 'SW'],
    ['Video switcher', 'SW'],
    ['Video transmitter', 'TX'],
    ['Video receiver', 'RX'],
    ['Wireless presentation', 'AP'],
    ['Room computer', 'PC'],
    ["Client's laptop", 'LAPTOP'],
    ['Audio processor', 'DSP'],
    ['Power amplifier', 'PA'],
    ['Wireless microphone', 'WR'],
    ['Network switch', 'NET'],
    ['Power distribution', 'PDU'],
  ];
  return starts.find(([start]) => name.startsWith(start))?.[1] ?? '';
};

// The units of the rack from the top down, numbered from the bottom as in a real rack, with any space left over as a
// blank panel. A box that holds more than its units shows all of them; the warning tells the owner to use a rack.
export type RackRow = { item: RackItem; label: string; top: number; bottom: number };
export function rackLayout(rack: { u: number; items: RackItem[] }): RackRow[] {
  const used = rack.items.reduce((sum, i) => sum + i.u, 0);
  const units = Math.max(rack.u, used);
  const items = [
    ...rack.items,
    ...(units > used ? [{ name: 'Blank panel', u: units - used, kind: 'blank' as const }] : []),
  ];
  const counts = new Map<string, number>();
  let top = units;
  return items.map((item) => {
    const tag = item.kind === 'blank' ? '' : rackTag(item.name);
    const n = (counts.get(tag) ?? 0) + 1;
    counts.set(tag, n);
    const label = !tag ? '' : item.kind === 'laptop' ? tag : `${tag}-${String(n).padStart(2, '0')}`;
    const row = { item, label, top, bottom: top - item.u + 1 };
    top -= item.u;
    return row;
  });
}

// A height above the finished floor, the way a drawing writes it: 1570 mm, or 5'-2".
export function heightText(m: number, unit: Plan['unit']) {
  if (unit === 'ft') {
    const inches = Math.round(m / 0.0254);
    return `${Math.floor(inches / 12)}'-${inches % 12}"`;
  }
  return `${Math.round(m * 100) * 10} mm`;
}

const wallName: Record<Wall, string> = {
  front: 'display wall',
  back: 'back wall',
  left: 'left wall',
  right: 'right wall',
};

export function deviceSchedule(plan: Plan, a: Analysis): ScheduleGroup[] {
  const { displays, gear } = a;
  const u = plan.unit;
  const aff = (m: number) => `${heightText(m, u)} AFF`;
  const groups: ScheduleGroup[] = [];
  const group = (title: string, rows: ScheduleRow[]) => {
    if (rows.length) groups.push({ title, rows });
  };
  const rackRows = gear.rack ? rackLayout(gear.rack) : [];
  const pc = rackRows.find((r) => r.label.startsWith('PC-'));

  // displays
  const shown: ScheduleRow[] = [];
  const centre = `centre ${aff(displays.centerY)}`;
  if (plan.displayType === 'led') {
    shown.push({ tag: 'DS', name: `LED video wall, ${displays.size}"`, qty: 1, where: 'Display wall', mount: centre });
  } else if (plan.displayType === 'projector') {
    shown.push({
      tag: 'DS',
      name: `Retractable screen, ${displays.size}"`,
      qty: displays.count,
      where: displays.count === 2 ? 'Display wall, side by side' : 'Display wall, centre',
      mount: centre,
    });
    if (displays.projector) {
      shown.push({
        tag: 'PROJ',
        name: displays.projector.short ? 'Short-throw projector' : 'Projector',
        qty: displays.count,
        where: 'Ceiling, in front of the screen',
        mount: `on the ceiling, ${aff(displays.projector.pos[1])}`,
      });
    }
  } else {
    shown.push({
      tag: 'DS',
      name: `${displays.size}" display`,
      qty: displays.count,
      where: displays.count === 2 ? 'Display wall, side by side' : 'Display wall, centre',
      mount: centre,
    });
  }
  if (displays.whiteboard) {
    shown.push({
      tag: 'WB',
      name: 'Interactive whiteboard, 86"',
      qty: 1,
      where: `Display wall, ${displays.whiteboard.x < 0 ? 'left' : 'right'} of the display`,
      mount: `centre ${aff(displays.whiteboard.centerY)}`,
    });
  }
  group('Displays', shown);

  // cameras, numbered as on the plans
  const cameras: ScheduleRow[] = gear.cameras.map((cam, i) => {
    const x = cam.pos[0];
    const side = Math.abs(x) < 0.05 ? 'centre' : x < 0 ? 'left' : 'right';
    const above = cam.pos[1] < displays.centerY ? 'below' : 'above';
    const row = { tag: `C${i + 1}`, qty: 1, mount: aff(cam.pos[1]) };
    if (cam.kind === 'bar') {
      return {
        ...row,
        name: 'Video bar (camera, microphones, speakers)',
        where: `Display wall, centre, ${above} the display`,
        mount: `centre ${aff(cam.pos[1])}`,
      };
    }
    if (cam.kind === 'front') {
      return {
        ...row,
        name: 'PTZ camera, 12x zoom',
        where:
          side === 'centre' ? `Display wall, centre, ${above} the display` : `Display wall, ${side} of the display`,
      };
    }
    if (cam.kind === 'wall')
      return { ...row, name: 'PTZ camera, 12x zoom', where: `${cam.wall === 'left' ? 'Left' : 'Right'} side wall` };
    if (cam.kind === 'presenter')
      return { ...row, name: 'PTZ presenter camera, 20x zoom', where: 'Back wall, follows the presenter' };
    if (cam.kind === 'back') return { ...row, name: 'PTZ camera', where: 'Back wall' };
    return { ...row, name: 'Table camera, all round (360°)', where: 'Table, in the middle', mount: 'on the table' };
  });
  group('Video', cameras);

  // sound: speakers, microphones and the cabinet for the wireless ones
  const audio: ScheduleRow[] = [];
  if (gear.wallSpeakers.length) {
    audio.push({
      tag: 'WS',
      name: 'Slim wall speaker (line array)',
      qty: gear.wallSpeakers.length,
      where: 'Display wall, each side of the display',
      mount: `centre ${aff(gear.wallSpeakers[0][1])}`,
    });
  }
  if (gear.speakers.length) {
    audio.push({
      tag: 'CS',
      name: `Ceiling speaker, ${speakerSizeLabel[plan.speakerSize]}, ${plan.speakerCoverage} coverage`,
      qty: gear.speakers.length,
      where: 'Ceiling, over the seating',
      mount: gear.speakerDrop > 0 ? `on cords, ${aff(plan.height - gear.speakerDrop)}` : 'flush in the ceiling',
    });
  }
  if (plan.mics === 'ceiling' || plan.mics === 'pendant') {
    audio.push({
      tag: 'MIC',
      name:
        plan.mics === 'pendant'
          ? 'Pendant microphone array'
          : `Ceiling microphone array, ${plan.micShape === 'round' ? 'round 25 in' : 'square 24 in'}`,
      qty: gear.mics.length,
      where: 'Ceiling, over the table',
      mount: gear.micDrop > 0 ? `on cords, ${aff(plan.height - gear.micDrop)}` : 'flush in the ceiling',
    });
  } else if (plan.mics === 'table') {
    audio.push({
      tag: 'TM',
      name: 'Table microphone',
      qty: gear.mics.length,
      where: 'On the table',
      mount: 'on the table',
    });
  } else if (plan.mics === 'gooseneck') {
    audio.push({
      tag: 'GM',
      name: 'Gooseneck microphone',
      qty: gear.mics.length,
      where: 'On the table, at every second seat',
      mount: 'on the table',
    });
  }
  if (gear.credenza) {
    audio.push({
      tag: 'WM',
      name: `Cabinet with the charger and ${plan.wireless} wireless microphones`,
      qty: 1,
      where: `Against the ${wallName[gear.credenza.wall]}`,
      mount: `on the floor, ${heightText(rules.credenza.height, u)} high`,
    });
  }
  group('Audio', audio);

  // control, sharing and the room system
  const control: ScheduleRow[] = [];
  if (gear.control) {
    control.push({
      tag: 'TP',
      name: 'Touch panel',
      qty: 1,
      where: plan.control === 'table' ? 'On the table' : 'Left wall, towards the back',
      mount: plan.control === 'table' ? 'on the table' : `centre ${aff(gear.control[1])}`,
    });
  }
  if (gear.panels.length) {
    control.push({
      tag: 'TB',
      name: 'Table connection panel (HDMI, USB-C)',
      qty: gear.panels.length,
      where: 'In the table top',
      mount: 'flush in the table',
    });
  } else if (gear.laptopInputs.length) {
    control.push({
      tag: 'LI',
      name: 'Laptop connection (HDMI and USB-C)',
      qty: gear.laptopInputs.length,
      where: 'In the table top',
      mount: 'flush in the table',
    });
  }
  if (gear.pucks.length) {
    control.push({
      tag: 'WP',
      name: 'Wireless sharing button',
      qty: gear.pucks.length,
      where: 'On the table',
      mount: 'on the table',
    });
  }
  control.push({
    tag: 'RS',
    name: systemName[plan.system],
    qty: 1,
    where:
      plan.system === 'byod'
        ? 'Any meeting app, from the laptop'
        : plan.engine
          ? `Runs on ${pc ? pc.label : 'the room computer'}`
          : gear.bar
            ? 'Runs on the video bar'
            : 'Runs on the room computer',
    mount: '',
  });
  group('Control, sharing and room system', control);

  // the rack, and the units in it from the top down
  if (gear.rack) {
    const rack = gear.rack;
    const behind = rack.mode === 'behind';
    const home = behind ? 'Box behind the display' : 'AVR rack';
    const units = rackRows.filter((r) => r.item.kind !== 'blank');
    const rows: ScheduleRow[] = [
      behind
        ? {
            tag: 'EB',
            name: `Equipment box, ${rack.u} U`,
            qty: 1,
            where: 'Display wall, behind the display',
            mount: centre,
          }
        : {
            tag: 'AVR',
            name: `AV equipment rack, ${rack.u} U`,
            qty: 1,
            where: rack.outside
              ? 'Outside the room, location to be confirmed'
              : `Against the ${rack.wall ? wallName[rack.wall] : 'wall'}`,
            mount: `on the floor, ${heightText(rack.height, u)} high`,
          },
      ...units.map((r) => ({
        tag: r.label,
        name: r.item.kind === 'laptop' ? "Space kept free for the client's laptop" : r.item.name,
        qty: 1,
        where: `${home}, ${r.item.u > 1 ? `U${r.bottom} to U${r.top}` : `U${r.top}`}`,
        mount: `${r.item.u} U`,
      })),
    ];
    group('AV equipment', rows);
  }
  return groups;
}
