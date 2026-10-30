import { needsSwitch, type Analysis, type Plan, type RoomSystem } from './model.ts';

// Short names, so the titles fit their boxes.
const systemTitle: Record<RoomSystem, string> = {
  byod: 'BYOD gateway',
  teams: 'Teams Rooms system',
  zoom: 'Zoom Rooms system',
  webex: 'Webex room system',
  meet: 'Meet room system',
};

// A signal flow sketch: what connects to what, with which kind of signal and cable. Cables have no direction here.
// Colour tells what travels (video, audio, control); a dashed line is analog, a solid one is digital or network.
export type Signal = 'video' | 'audio' | 'control';
export type FlowNode = { id: string; column: 0 | 1 | 2 | 3; title: string; detail?: string };
export type FlowLink = { from: string; to: string; label: string; signal: Signal; analog: boolean };
export type Flow = { nodes: FlowNode[]; links: FlowLink[] };

export const signalNames: Record<Signal, string> = { video: 'Video', audio: 'Audio', control: 'Control' };

const many = (n: number, word: string) => `${n}× ${word}${n > 1 ? 's' : ''}`;

// Columns: 0 sources, 1 network and audio processing, 2 the room system, 3 what people see and hear.
export function signalFlow(plan: Plan, a: Analysis): Flow {
  const { gear, displays } = a;
  const nodes: FlowNode[] = [];
  const links: FlowLink[] = [];
  const has = (id: string) => nodes.some((n) => n.id === id);
  const link = (from: string, to: string, label: string, signal: Signal, analog = false) => {
    if (has(from) && has(to)) links.push({ from, to, label, signal, analog });
  };

  if (gear.cameras.length) {
    nodes.push({
      id: 'cameras',
      column: 0,
      title: many(gear.cameras.length, 'PTZ camera'),
      detail: plan.presenter ? 'one follows the presenter' : undefined,
    });
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
  if (plan.presenter) {
    nodes.push({ id: 'presenterMic', column: 0, title: 'Wireless presenter mic', detail: 'receiver in the rack' });
  }
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

  // two or more network devices share a PoE switch; a single one plugs into the room's network point
  if (needsSwitch(plan, gear))
    nodes.push({ id: 'switch', column: 1, title: 'PoE network switch', detail: 'power and data' });
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

  // cameras and ceiling microphones are network devices: data and power over one cable
  link('cameras', 'switch', 'PoE', 'video');
  if (plan.mics === 'ceiling') link('mics', 'switch', 'PoE', 'audio');
  if (has('cameras')) {
    const via = has('switch') ? 'switch' : 'cameras';
    link(via, 'system', has('switch') ? 'video' : 'USB / net', 'video');
    link(via, 'system', 'PTZ control', 'control');
  }
  if (processor) {
    link('mics', 'processor', plan.mics === 'ceiling' ? 'network audio' : 'audio', 'audio', plan.mics === 'table');
    link('presenterMic', 'processor', 'audio', 'audio', true);
    link('processor', 'system', 'USB audio', 'audio');
  } else {
    link('presenterMic', 'system', 'audio', 'audio', true);
  }
  // a soundbar is fed by the room system over USB or HDMI; other speakers hang on the processor, or on the system if
  // there is none, with an analog line
  if (plan.speakers === 'soundbar') link('system', 'speakers', 'USB / HDMI', 'audio');
  else if (processor) link('processor', 'speakers', 'audio', 'audio', true);
  else link('system', 'speakers', 'audio', 'audio', true);
  link('laptops', 'system', 'HDMI / USB-C', 'video');
  link('touch', 'system', 'USB / net', 'control');
  link('system', 'displays', 'HDMI', 'video');
  return { nodes, links };
}
