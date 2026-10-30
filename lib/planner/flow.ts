import type { Analysis, Plan, RoomSystem } from './model.ts';

// Short names, so the titles fit their boxes.
const systemTitle: Record<RoomSystem, string> = {
  byod: 'BYOD gateway',
  teams: 'Teams Rooms system',
  zoom: 'Zoom Rooms system',
  webex: 'Webex room system',
  meet: 'Meet room system',
};

// A signal flow sketch: what connects to what, and with which kind of cable. Cables have no direction here.
export type FlowNode = { id: string; column: 0 | 1 | 2 | 3; title: string; detail?: string };
export type FlowLink = { from: string; to: string; label: string };
export type Flow = { nodes: FlowNode[]; links: FlowLink[] };

const many = (n: number, word: string) => `${n}× ${word}${n > 1 ? 's' : ''}`;

// Columns: 0 sources, 1 network and audio processing, 2 the room system, 3 what people see and hear.
export function signalFlow(plan: Plan, a: Analysis): Flow {
  const { gear, displays } = a;
  const nodes: FlowNode[] = [];
  const links: FlowLink[] = [];
  const has = (id: string) => nodes.some((n) => n.id === id);
  const link = (from: string, to: string, label: string) => {
    if (has(from) && has(to)) links.push({ from, to, label });
  };

  if (gear.cameras.length) {
    nodes.push({ id: 'cameras', column: 0, title: many(gear.cameras.length, 'PTZ camera') });
  }
  if (plan.mics === 'ceiling') {
    nodes.push({
      id: 'mics',
      column: 0,
      title: many(gear.mics.length, 'ceiling microphone array'),
      detail: `${plan.micShape} array`,
    });
  }
  if (plan.mics === 'table') nodes.push({ id: 'mics', column: 0, title: many(gear.mics.length, 'table microphone') });
  if (plan.tablePanels) {
    nodes.push({
      id: 'laptops',
      column: 0,
      title: 'Laptops at the table',
      detail: many(gear.panels.length, 'connection panel'),
    });
  }
  if (plan.control !== 'none') {
    nodes.push({
      id: 'touch',
      column: 0,
      title: 'Touch panel',
      detail: plan.control === 'table' ? 'on the table' : 'on the wall',
    });
  }

  const ceilingDevices =
    (plan.speakers === 'ceiling' ? gear.speakers.length : 0) + (plan.mics === 'ceiling' ? gear.mics.length : 0);
  if (gear.cameras.length + ceilingDevices > 0) {
    nodes.push({ id: 'switch', column: 1, title: 'PoE network switch', detail: 'power and data' });
  }
  const processor = plan.mics === 'ceiling' || plan.mics === 'table' || plan.speakers === 'ceiling';
  if (processor) {
    nodes.push({ id: 'processor', column: 1, title: 'Audio processor', detail: 'echo control, mixing' });
  }
  nodes.push({ id: 'system', column: 2, title: systemTitle[plan.system] });

  nodes.push({
    id: 'displays',
    column: 3,
    title: `${displays.count}× ${displays.size}" display${displays.count > 1 ? 's' : ''}`,
  });
  if (plan.speakers === 'soundbar') nodes.push({ id: 'speakers', column: 3, title: 'Soundbar' });
  if (plan.speakers === 'front') nodes.push({ id: 'speakers', column: 3, title: '2× wall speakers' });
  if (plan.speakers === 'ceiling') {
    nodes.push({ id: 'speakers', column: 3, title: many(gear.speakers.length, 'ceiling speaker') });
  }

  link('cameras', 'switch', 'PoE');
  if (plan.mics === 'ceiling') link('mics', 'switch', 'PoE');
  if (has('cameras')) link('switch', 'system', 'video');
  if (plan.speakers === 'ceiling') link('switch', 'speakers', 'PoE');
  if (processor) {
    link('mics', 'processor', 'audio');
    link('processor', 'system', 'USB audio');
    link('processor', 'speakers', 'audio');
  } else {
    link('mics', 'system', 'audio');
    link('system', 'speakers', 'audio');
  }
  link('laptops', 'system', 'HDMI / USB-C');
  link('touch', 'system', 'USB / net');
  link('system', 'displays', 'HDMI');
  return { nodes, links };
}
