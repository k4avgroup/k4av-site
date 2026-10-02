import { photos, type Photo } from './photos';

export type Division = 'integration' | 'events';

export const divisions: Record<
  Division,
  { label: string; short: string; href: string; cta: string; ctaShort: string; quote: string }
> = {
  integration: {
    label: 'AV Integration',
    short: 'Integration',
    href: '/integration',
    cta: 'Request an AV Consultation',
    ctaShort: 'Consult',
    quote: '/integration/quote',
  },
  events: {
    label: 'Live Events',
    short: 'Events',
    href: '/events',
    cta: 'Plan an Event',
    ctaShort: 'Plan',
    quote: '/events/quote',
  },
};

export type NavItem = { label: string; href: string };

// Second navigation row under the division tabs. `main` links jump to sections of the division page
// (Rentals is its own page and goes last); `side` links are separate pages shown on the right.
export const secondaryNav: Record<Division, { main: NavItem[]; side: NavItem[] }> = {
  integration: {
    main: [
      { label: 'Solutions', href: '/integration#solutions' },
      { label: 'Commissioning', href: '/integration#commissioning' },
      { label: 'Experience', href: '/integration#experience' },
    ],
    side: [
      { label: 'About', href: '/integration/about' },
      { label: 'Contact', href: '/integration/contact' },
    ],
  },
  events: {
    main: [
      { label: 'Event Types', href: '/events#event-types' },
      { label: 'Services', href: '/events#services' },
      { label: 'Experience', href: '/events#experience' },
      { label: 'Rentals', href: '/events/rentals' },
    ],
    side: [
      { label: 'About', href: '/events/about' },
      { label: 'Contact', href: '/events/contact' },
    ],
  },
};

export type Tile = { label: string; note?: string; photo: Photo };

// Spaces we support. Only spaces with real photos of our own.
export const spaces: Tile[] = [
  { label: 'Conference Rooms', note: 'Meeting and collaboration', photo: photos.roomConf },
  { label: 'Boardrooms', note: 'Executive spaces', photo: photos.roomGrand },
  { label: 'Meeting Rooms', note: 'Everyday collaboration', photo: photos.roomMeeting },
  { label: 'Executive Spaces', note: 'Boardroom-level systems', photo: photos.roomBoardView },
  { label: 'Collaboration Spaces', note: 'Small rooms', photo: photos.roomRound },
  { label: 'Huddle Rooms', note: 'Quick, simple meetings', photo: photos.roomHuddle },
  { label: 'Training Rooms', note: 'Classrooms', photo: photos.roomTraining },
  { label: 'Computer Labs', note: 'Instruction and workstations', photo: photos.roomLab },
];

export const serviceGroups: { title: string; items: string[] }[] = [
  {
    title: 'Integration',
    items: [
      'AV system integration',
      'Rack integration',
      'Cable management',
      'Signal routing',
      'Video distribution',
      'AV over IP',
    ],
  },
  {
    title: 'Audio and networking',
    items: ['Audio systems', 'DSP configuration', 'Dante / AES67', 'Networked AV'],
  },
  {
    title: 'Control and displays',
    items: [
      'Programming',
      'Control systems',
      'System configuration',
      'Video conferencing',
      'Display systems',
      'Projection',
    ],
  },
  {
    title: 'Commissioning and support',
    items: [
      'Commissioning',
      'System testing',
      'Troubleshooting',
      'Documentation',
      'Client training',
      'System acceptance',
      'Technical support',
    ],
  },
];

export const commissioningSteps = [
  'Design review',
  'Point-to-point verification',
  'Device configuration',
  'Network, DSP and control',
  'Functional testing',
  'Troubleshooting',
  'Documentation and handoff',
];

// TODO(owner): confirm each platform is one you have worked with professionally.
export const platformList = ['Q-SYS', 'Biamp Tesira', 'Extron', 'Crestron', 'Dante', 'AES67', 'Shure', 'Sennheiser'];

export const integrationExperience = [
  {
    title: 'Enterprise conference rooms',
    text: 'Commissioning and troubleshooting meeting spaces on corporate campuses.',
  },
  { title: 'Networked audio and DSP', text: 'Configuring Dante, DSP and control so rooms behave the same every time.' },
  {
    title: 'Rack builds and handover',
    text: 'Point-to-point testing, cable management and documentation for a clean handoff.',
  },
];

export const eventTypes: Tile[] = [
  { label: 'Corporate Meetings', photo: photos.ballroomConsole },
  { label: 'Conferences', photo: photos.consoleBigScreen },
  { label: 'General Sessions', photo: photos.consoleStageView },
  { label: 'Luncheons and Dinners', photo: photos.consoleRedStage },
  { label: 'Galas and Celebrations', photo: photos.galaDinner },
  { label: 'Hybrid and Streaming', photo: photos.cameraSunset },
  { label: 'Live Music and Private Events', photo: photos.liveBand },
  { label: 'Community Events', photo: photos.outdoorStage },
];

export const eventScale: { size: string; items: string[]; photo: Photo }[] = [
  { size: 'Small', items: ['Private events', 'Meetings', 'Breakout rooms'], photo: photos.outdoorConsole },
  {
    size: 'Medium',
    items: ['Corporate presentations', 'Luncheons', 'Company meetings'],
    photo: photos.consoleStageView,
  },
  {
    size: 'Large',
    items: ['General sessions', 'Multi-room events', 'Large corporate productions'],
    photo: photos.ballroomWide,
  },
];

export const eventServices: { title: string; items: string[] }[] = [
  { title: 'Audio', items: ['FOH', 'A1 / A2', 'Wireless microphones', 'Playback', 'System deployment'] },
  {
    title: 'Video',
    items: [
      'V1 / V2',
      'Projection',
      'Displays',
      'Switching',
      'Playback',
      'Presentation systems',
      'Confidence monitors',
    ],
  },
  {
    title: 'Technical production',
    items: [
      'Signal flow',
      'System design',
      'Technical direction',
      'Show operation',
      'Crew coordination',
      'Equipment sourcing',
    ],
  },
];

export const eventSteps = [
  'Tell us about the event',
  'Technical plan',
  'Equipment and crew',
  'Setup and testing',
  'Show',
  'Strike',
];

export const eventExperience = [
  {
    title: 'Enterprise corporate production',
    text: 'Audio and technical support for large corporate meetings and general sessions.',
  },
  { title: 'From load-in to show', text: 'Setting up, testing and running systems so the day runs to plan.' },
  { title: 'High-stakes live audio', text: 'FOH mixing and RF coordination where there is no second take.' },
  {
    title: 'Complex corporate AV',
    text: 'Coordinating audio, video and presentation systems across multi-room events.',
  },
];
