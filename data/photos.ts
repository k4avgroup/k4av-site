// Real field photos, graded dark to match the site. Files live in public/images/site/ (3:2).
// Alt text describes what is visible; keep it factual.
export type Photo = { src: string; alt: string };

const p = (name: string, alt: string): Photo => ({ src: `/images/site/${name}.webp`, alt });
// Room photos edited at 2400px (public/images/integration/room-*.webp).
const r = (code: string, alt: string): Photo => ({ src: `/images/integration/room-${code}.webp`, alt });

export const photos = {
  ballroomGreen: p('ev-9547', 'Audio and video control position at the back of a large hotel ballroom lit in green'),
  consoleBigScreen: p('ev-6583', 'Digital mixing console facing a large LED screen at a conference'),
  consoleRedStage: p('ev-1003', 'Audio console and laptops facing a ballroom stage with red-lit screens'),
  consoleStageView: p('ev-0987', 'Mixing surface and laptop meters with a corporate stage in the background'),
  cameraSunset: p('ev-6785', 'Camera monitor and stage lighting at an evening event by the water'),
  faderGlow: p('ev-1006', 'Close view of a mixing console with green and orange lit buttons and knobs'),
  faderDetail: p('ev-6561', 'Close view of console faders and colored buttons'),
  consoleSales: p('ev-7142', 'Audio console and camera operator facing a corporate sales meeting stage'),
  wirelessMics: p('ev-6483', 'Wireless microphone receivers, handheld microphone and console at an event'),
  liveBand: p('ev-0517', 'Stage lit in blue with saxophone, drums and microphones at a live music show'),
  ballroomConsole: p('ev-0445', 'Console and laptop in front of a chandelier-lit ballroom with a large stage'),
  racksBlue: p('int-0474', 'AV equipment racks with labeled network patching during system build'),
  rackSurge: p('int-1816', 'Installed equipment rack with power conditioner, network switch and audio processors'),
  rackCables: p('int-0805', 'Equipment rack with amplifiers and network cabling'),
  rackQsys: p('int-0966', 'Rack with Q-SYS core, network switch and audio equipment'),
  ballroomWide: p('ev-0480', 'Mixing console in front of a packed hotel ballroom with a large stage and video screens'),
  galaDinner: p('ev-0578', 'Gala dinner ballroom with decorative lighting, a podium and a projection screen'),
  outdoorStage: p('ev-1322', 'Outdoor stage with truss, monitors and a live band at a community event'),
  outdoorConsole: p('ev-1210', 'Compact digital mixer and laptops set up at an outdoor event with seating'),
  softwareTable: p('int-2673', 'Wireless microphone frequency coordination software on a monitor'),
  roomRound: r('0762', 'Small collaboration room with a round table, touch panel and wall display'),
  roomConf: r('0753', 'Conference room with a large table, touch panel and wall display'),
  roomConfPortrait: r('0731', 'Conference room with a long light wood table and a display at the far wall'),
  roomConfWide: r('0729', 'Conference room with a light wood table and a display with a video bar'),
  roomBoard: r('1949', 'Executive boardroom with a long dark table and a display'),
  roomBoardView: r('1948', 'Boardroom with a dark oval table, leather chairs and a wall display'),
  roomGrand: r('1041', 'Large boardroom with a long table, leather chairs and a big wall display'),
  roomMeeting: r('1163', 'Meeting room with a long table, ceiling microphone and a wide display'),
  roomTraining: r('1870', 'Training room with rows of tables and displays under a slatted ceiling'),
  roomLab: r('0978', 'Computer training lab with rows of workstations and a projector'),
  roomPresent: r('1536', 'Large presentation room with a wide screen and rows of chairs'),
  roomEventRoom: r('2235', 'Meeting room set with round tables and two projection screens'),
  roomHuddle: r('0769', 'Small meeting room with a round table, display and whiteboard'),
  roomLectern: r('0338', 'Lectern with a laptop and wall displays in a classroom'),
  roomControl: r('0333', 'Table with a touch panel, remotes and a laptop in front of a wall display'),
  roomTower: r('0707', 'Long conference room with a video wall and city views'),
  founderOnSite: r('1782', 'Founder on site in a conference room with a wall display and a long table'),
  founderConsole: p('team-9922', 'Founder at the audio console with a headset before a large conference session'),
} satisfies Record<string, Photo>;

// Slow-scrolling strip near the end of the home and About pages.
export const gallery: Photo[] = [
  photos.consoleBigScreen,
  photos.racksBlue,
  photos.consoleRedStage,
  photos.rackQsys,
  photos.ballroomGreen,
  photos.faderGlow,
  photos.consoleSales,
  photos.rackSurge,
  photos.cameraSunset,
  photos.wirelessMics,
  photos.liveBand,
  photos.rackCables,
];
