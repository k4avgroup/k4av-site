import {
  needsSwitch,
  ptzCameras,
  rackItems,
  speakerSizeLabel,
  type Analysis,
  type Plan,
  type RoomSystem,
} from './model.ts';

// Short names, so the titles fit their boxes.
const systemTitle: Record<RoomSystem, string> = {
  byod: 'BYOD gateway',
  teams: 'Teams Rooms system',
  zoom: 'Zoom Rooms system',
  webex: 'Webex room system',
  meet: 'Meet room system',
};
const platform: Record<RoomSystem, string> = {
  byod: 'any meeting app',
  teams: 'Teams Rooms',
  zoom: 'Zoom Rooms',
  webex: 'Webex',
  meet: 'Google Meet',
};

// A signal flow sketch: what connects to what, with which kind of signal and cable. Cables have no direction here.
// Colour tells what travels (video, audio, control); a dashed line is analog, a solid one is digital or network.
export type Signal = 'video' | 'audio' | 'control' | 'power';
export type FlowNode = { id: string; column: 0 | 1 | 2 | 3; title: string; detail?: string };
export type FlowLink = { from: string; to: string; label: string; signal: Signal; analog: boolean };
export type Flow = { nodes: FlowNode[]; links: FlowLink[] };

export const signalNames: Record<Signal, string> = {
  video: 'Video',
  audio: 'Audio',
  control: 'Control',
  power: 'Power',
};

// Only the links that carry one kind of signal, and the boxes they join: a flow of video, of audio, of control or of power.
export function filterFlow(flow: Flow, signal: Signal | 'all'): Flow {
  if (signal === 'all') return flow;
  const links = flow.links.filter((l) => l.signal === signal);
  const used = new Set(links.flatMap((l) => [l.from, l.to]));
  return { nodes: flow.nodes.filter((n) => used.has(n.id)), links };
}

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

  const parts = gear.rack?.items ?? rackItems(plan, { networked: gear.mics.length + ptzCameras(gear).length });
  const inRack = (text: string) => parts.some((i) => i.name.startsWith(text));

  // A video bar that runs the meeting platform by itself is the room system; next to a room computer it is a device
  // of the room, with the camera, microphones and speakers inside it.
  const barIsSystem = plan.bar !== 'none' && !plan.engine;
  if (plan.bar !== 'none' && plan.engine) {
    nodes.push({ id: 'bar', column: 0, title: 'Video bar', detail: 'camera, mics, speakers' });
  }

  const ptz = ptzCameras(gear);
  if (ptz.length) {
    nodes.push({
      id: 'cameras',
      column: 0,
      title: many(ptz.length, 'PTZ camera'),
      detail: plan.presenter ? 'one follows the presenter' : undefined,
    });
  }
  if (plan.tableCamera) nodes.push({ id: 'tableCamera', column: 0, title: 'Table camera', detail: 'small and round' });
  if (plan.mics === 'ceiling') {
    nodes.push({
      id: 'mics',
      column: 0,
      title: many(gear.mics.length, 'ceiling microphone array'),
      detail: `${plan.micShape} array`,
    });
  }
  if (plan.mics === 'pendant') {
    nodes.push({ id: 'mics', column: 0, title: many(gear.mics.length, 'pendant microphone'), detail: 'on cords' });
  }
  if (plan.mics === 'table') nodes.push({ id: 'mics', column: 0, title: many(gear.mics.length, 'table microphone') });
  if (plan.mics === 'gooseneck') {
    nodes.push({
      id: 'mics',
      column: 0,
      title: many(gear.mics.length, 'gooseneck microphone'),
      detail: 'conference system',
    });
  }
  if (plan.wireless > 0) {
    nodes.push({ id: 'wireless', column: 0, title: `${plan.wireless}× wireless mics`, detail: 'receiver in the rack' });
  }
  if (plan.sharing === 'cable' || plan.sharing === 'both' || plan.tablePanels) {
    nodes.push({
      id: 'laptops',
      column: 0,
      title: plan.tablePanels ? 'Laptops at the table' : 'Laptop on a cable',
      detail: plan.tablePanels ? many(gear.panels.length, 'connection panel') : undefined,
    });
  }
  nodes.push({ id: 'pdu', column: 0, title: 'Power distribution', detail: 'mains, in the rack' });
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
  if (plan.dsp) nodes.push({ id: 'processor', column: 1, title: 'Audio processor', detail: 'echo control, mixing' });
  if (inRack('Video switcher') || inRack('Video matrix')) {
    nodes.push({
      id: 'vswitch',
      column: 1,
      title: inRack('Video matrix') ? 'Video matrix switcher' : 'Video switcher',
    });
  }
  if (inRack('Control processor'))
    nodes.push({ id: 'controller', column: 1, title: 'Control processor', detail: 'runs the touch panel' });
  const amp = plan.dsp && (plan.speakers === 'front' || plan.speakers === 'ceiling' || plan.speakers === 'both');
  if (plan.sharing === 'wireless' || plan.sharing === 'both') {
    nodes.push({ id: 'gateway', column: 1, title: 'Wireless sharing', detail: 'presentation gateway' });
  }
  nodes.push(
    barIsSystem
      ? { id: 'system', column: 2, title: 'Video bar', detail: `runs ${platform[plan.system]}` }
      : {
          id: 'system',
          column: 2,
          title: systemTitle[plan.system],
          detail: plan.bar !== 'none' ? 'room computer' : undefined,
        },
  );

  if (amp) nodes.push({ id: 'amp', column: 2, title: 'Power amplifier', detail: 'drives the speakers' });
  const unit = displays.count === 1 ? '' : 's';
  if (plan.displayType === 'led') {
    nodes.push({ id: 'displays', column: 3, title: `LED wall, ${displays.size}"` });
  } else if (plan.displayType === 'projector') {
    nodes.push({
      id: 'displays',
      column: 3,
      title: `${displays.count}× projector${unit}`,
      detail: `with ${displays.size}" screen${unit}`,
    });
  } else {
    nodes.push({ id: 'displays', column: 3, title: `${displays.count}× ${displays.size}" display${unit}` });
  }
  if (plan.whiteboard) nodes.push({ id: 'whiteboard', column: 3, title: 'Interactive whiteboard' });
  if (plan.speakers === 'front' || plan.speakers === 'both') {
    nodes.push({ id: 'wallSpeakers', column: 3, title: '2× wall speakers' });
  }
  if (plan.speakers === 'ceiling' || plan.speakers === 'both') {
    nodes.push({
      id: 'speakers',
      column: 3,
      title: many(gear.speakers.length, 'ceiling speaker'),
      detail: `${speakerSizeLabel[plan.speakerSize]}, ${plan.speakerMount === 'pendant' ? 'on cords' : 'flush'}`,
    });
  }

  // a bar next to a room computer hands it the camera and the microphones, and takes the sound back
  link('bar', 'system', 'USB', 'video');
  link('bar', 'system', 'USB audio', 'audio');
  // cameras and ceiling microphones are network devices: data and power over one cable
  link('cameras', 'switch', 'PoE', 'video');
  if (plan.mics === 'ceiling' || plan.mics === 'pendant') link('mics', 'switch', 'PoE', 'audio');
  if (has('cameras')) {
    const via = has('switch') ? 'switch' : 'cameras';
    link(via, 'system', has('switch') ? 'video' : 'USB / net', 'video');
    link(via, 'system', 'PTZ control', 'control');
  }
  link('tableCamera', 'system', 'USB', 'video');

  const networked = plan.mics === 'ceiling' || plan.mics === 'pendant';
  if (plan.dsp) {
    link(
      'mics',
      'processor',
      networked ? 'network audio' : 'audio',
      'audio',
      plan.mics === 'table' || plan.mics === 'gooseneck',
    );
    link('wireless', 'processor', 'audio', 'audio', true);
    link('processor', 'system', 'USB audio', 'audio');
  } else {
    link('mics', 'system', networked ? 'network audio' : 'audio', 'audio', !networked);
    link('wireless', 'system', 'audio', 'audio', true);
  }
  // speakers hang on the amplifier fed by the processor, or on the room system if there is no processor
  if (amp) {
    link('processor', 'amp', 'line out', 'audio', true);
    link('amp', 'wallSpeakers', 'speaker cable', 'audio', true);
    link('amp', 'speakers', '70 V loop', 'audio', true);
  } else {
    link('system', 'wallSpeakers', 'audio', 'audio', true);
    link('system', 'speakers', 'audio', 'audio', true);
  }
  if (has('vswitch')) {
    link('laptops', 'vswitch', 'HDMI / USB-C', 'video');
    link('vswitch', 'system', 'HDMI / USB', 'video');
  } else {
    link('laptops', 'system', 'HDMI / USB-C', 'video');
  }
  link('gateway', 'displays', 'HDMI', 'video');
  if (has('controller')) {
    link('touch', 'controller', 'network', 'control');
    link('controller', 'system', 'USB / net', 'control');
    link('controller', 'displays', 'display control', 'control');
  } else {
    link('touch', 'system', 'USB / net', 'control');
  }
  link('system', 'displays', 'HDMI', 'video');
  link('system', 'whiteboard', 'HDMI / USB', 'video');

  // power: the mains through the distribution unit, and PoE from the switch to the cameras and microphones
  link('cameras', 'switch', 'PoE power', 'power');
  if (plan.mics === 'ceiling' || plan.mics === 'pendant') link('mics', 'switch', 'PoE power', 'power');
  for (const [id, label] of [
    ['system', 'mains'],
    ['switch', 'mains'],
    ['processor', 'mains'],
    ['vswitch', 'mains'],
    ['controller', 'mains'],
    ['gateway', 'mains'],
    ['amp', 'mains'],
    ['displays', 'mains'],
  ] as const) {
    // only the first run says "mains", so the labels do not pile up
    link('pdu', id, links.some((l) => l.from === 'pdu') ? '' : label, 'power');
  }
  return { nodes, links };
}
