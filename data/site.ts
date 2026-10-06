import type { Layer } from '@/types/domain';
import { photos, type Photo } from './photos';

export const site = {
  name: 'K4 AV Group',
  description:
    'K4 AV Group is a founder-led AV company in Seattle: commercial AV integration and commissioning, live event production and equipment rentals across the Greater Seattle area.',
  area: 'Seattle / Bellevue / Greater Seattle Area',
  email: 'info@k4av.com' as string | null,
  phone: null as string | null,
  // TODO(owner): street or mailing address, shown on the Contact page when set.
  address: null as string | null,
  socials: [] as { label: string; url: string }[],
  hero: {
    images: [
      '/images/hero/hero-1-ballroom.webp',
      '/images/hero/hero-2-boardroom.webp',
      '/images/hero/hero-3-console.webp',
      '/images/hero/hero-4-screen-room.webp',
      '/images/hero/hero-5-stage.webp',
      '/images/hero/hero-6-conference.webp',
    ],
    video: null as string | null,
  },
};

// TODO(owner): confirm before launch. Shown on the home page, About page and hero.
export const experienceYears = '20+';

// Footer links. The header uses the two division tabs in data/division.ts.
// Every link has an explicit address; hidden sections are kept out of this list, not deleted (see `features`).
export const navigation = [
  { label: 'AV Integration', href: '/integration' },
  { label: 'Live Events', href: '/events' },
  { label: 'Rentals', href: '/events/rentals' },
  { label: 'About', href: '/integration/about' },
  { label: 'Contact', href: '/integration/contact' },
];

// Switches for sections that exist in the code but are hidden from the public site for now.
// Set a flag to true to bring the section back into the sitemap and footer.
// (Also add its link to `navigation` above, and remove `robots: { index: false }` from its page.)
export const features = {
  shop: false,
  clientLogin: false,
  sampleProjects: false,
  serviceDetailPages: false,
};

export type Pillar = {
  slug: string;
  title: string;
  href: string;
  cta: string;
  summary: string;
  items: string[];
  photo: Photo;
};

// The three things K4 AV Group sells right now.
export const pillars: Pillar[] = [
  {
    photo: photos.rackQsys,
    slug: 'commercial-av',
    title: 'Commercial AV',
    href: '/integration',
    cta: 'Commercial AV',
    summary: 'Integration, commissioning and support for installed AV systems.',
    items: [
      'Integration',
      'Commissioning',
      'Programming',
      'System configuration',
      'DSP',
      'Control systems',
      'Networked AV',
      'Testing',
      'Troubleshooting',
      'Documentation',
      'Client handoff',
    ],
  },
  {
    photo: photos.consoleBigScreen,
    slug: 'live-events',
    title: 'Live Events',
    href: '/events',
    cta: 'Live Production',
    summary: 'Technical production for corporate events and live programs.',
    items: [
      'Corporate events',
      'Audio',
      'Video',
      'Projection',
      'Playback',
      'Presentation systems',
      'Technical direction',
      'A1 / A2',
      'V1 / V2',
      'Event engineering',
      'Production support',
    ],
  },
  {
    photo: photos.wirelessMics,
    slug: 'rentals',
    title: 'Equipment Rentals',
    href: '/events/rentals',
    cta: 'View Rental Equipment',
    summary: 'AV equipment for events and projects. Our inventory is growing.',
    items: ['Projectors', 'Displays / screens', 'Video equipment', 'Audio equipment', 'AV accessories'],
  },
];

// Kept for the hidden layer-entry section (components/sections.tsx).
export const layers: Record<Layer, { title: string; href: string; summary: string }> = {
  integration: { title: 'AV Integration', href: '/integration', summary: pillars[0].summary },
  events: { title: 'Live Events', href: '/events', summary: pillars[1].summary },
};

export const whyPoints = [
  {
    title: `${experienceYears} years of experience`,
    text: 'Hands-on audio and AV work, from recording studios to corporate stages.',
  },
  {
    title: 'Enterprise AV experience',
    text: 'Experience supporting projects and events for major enterprise organizations.',
  },
  {
    title: 'Engineering and live production',
    text: 'We understand the systems and the show, so problems get solved in the room.',
  },
  {
    title: 'Flexible project support',
    text: 'From a single technical assignment to a complete production, depending on scope.',
  },
];

export const founderPath: { title: string; photo: Photo }[] = [
  { title: 'Recording and live sound', photo: photos.liveBand },
  { title: 'Corporate live events', photo: photos.ballroomConsole },
  { title: 'AV systems and commissioning', photo: photos.racksBlue },
  { title: 'K4 AV Group', photo: photos.founderConsole },
];

// TODO(owner): confirm each name. Shown as experience ("supporting projects and events for"), never as logos
// and never as K4 AV Group clients. "UDAP" and the universities were mentioned but not spelled out yet.
// Role shown next to the founder photo on About. Add the name here when the owner wants it published.
export const founder = { name: null as string | null, role: 'Founder and lead AV engineer' };

export const experienceOrgs = ['Microsoft', 'Amazon', 'Apple', 'Airbnb', 'Sound Transit', 'Expedia', 'Boeing'];

// Rental categories we plan to offer. Add real equipment to `equipment` in data/catalog.ts.
export const rentalCategories = [
  'Projectors',
  'Video switching and processing',
  'Audio',
  'Displays / screens',
  'Accessories',
];

// Platforms we work with. This is a list of work areas, not manufacturer authorization.
export const platforms = ['Q-SYS', 'Biamp', 'Extron', 'Crestron', 'Dante / AES67', 'Shure', 'NETGEAR AV'];
export const industries: { name: string; description: string; layers: Layer[] }[] = [
  {
    name: 'Corporate',
    description: 'Clear communication, from the boardroom to the all-hands.',
    layers: ['integration', 'events'],
  },
  { name: 'Enterprise', description: 'Consistent AV performance across connected spaces.', layers: ['integration'] },
  { name: 'Education', description: 'Technology that supports teaching and collaboration.', layers: ['integration'] },
  {
    name: 'Houses of Worship',
    description: 'Audio and video that serve the message.',
    layers: ['integration', 'events'],
  },
  { name: 'Government', description: 'Practical technical support for public-sector spaces.', layers: ['integration'] },
  { name: 'Conferences', description: 'Reliable presentations and hybrid collaboration.', layers: ['events'] },
  {
    name: 'Live Productions',
    description: 'Technical coordination from load-in to the final cue.',
    layers: ['events'],
  },
];

export const process = [
  { title: 'Consult', text: 'Understand the space, the people and the technical brief.' },
  { title: 'Plan', text: 'Define scope, system requirements and a clear path forward.' },
  { title: 'Deploy', text: 'Coordinate equipment, field work and system bring-up.' },
  { title: 'Commission', text: 'Test signal paths, verify operation and document results.' },
  { title: 'Support', text: 'Help keep systems and productions running reliably.' },
];

export const whyUs = [
  { title: 'Engineering-focused approach', text: 'Understand the system, isolate the issue and validate the result.' },
  {
    title: 'Flexible technical support',
    text: 'Support across commercial AV environments, field work and live events.',
  },
  { title: 'Clear communication', text: 'Clear scope, practical next steps and useful technical documentation.' },
  { title: 'Reliable systems', text: 'Attention to configuration, signal integrity and repeatable operation.' },
];

// Add real client reviews here, with permission. Nothing is shown until an entry exists.
export const testimonials: { quote: string; author: string; company: string }[] = [];

// Only credentials confirmed by a certificate or verification letter from the owner. No certificate
// numbers or scans are published. `kind` separates industry certifications from safety training.
export const credentials: {
  name: string;
  issuer: string;
  detail: string;
  kind: 'certification' | 'training';
  verified: boolean;
  // the main qualifications, shown large; the rest are grouped by manufacturer
  featured?: boolean;
}[] = [
  {
    name: 'Certified Technology Specialist (CTS)',
    issuer: 'AVIXA',
    detail: 'Valid through January 2029',
    kind: 'certification',
    verified: true,
    featured: true,
  },
  {
    name: 'Dante Certified, Level 3',
    issuer: 'Audinate',
    detail: 'Valid through January 2028',
    kind: 'certification',
    verified: true,
    featured: true,
  },
  {
    name: 'Dante Certified, Level 2',
    issuer: 'Audinate',
    detail: 'Valid through November 2027',
    kind: 'certification',
    verified: true,
  },
  {
    name: 'Q-SYS Certified, Level 1',
    issuer: 'QSC',
    detail: 'Valid through August 2028',
    kind: 'certification',
    verified: true,
    featured: true,
  },
  {
    name: 'Q-SYS VisionSuite ACPR Commissioning, Level 1',
    issuer: 'QSC',
    detail: 'Certified June 2025',
    kind: 'certification',
    verified: true,
  },
  { name: 'Q-SYS Level Zero', issuer: 'QSC', detail: 'Valid through June 2027', kind: 'certification', verified: true },
  {
    name: 'Tesira Software Programming, Levels 1 and 2',
    issuer: 'Biamp',
    detail: 'Completed 2025',
    kind: 'certification',
    verified: true,
  },
  {
    name: 'Extron Certified AV Associate',
    issuer: 'Extron',
    detail: 'Certified November 2025',
    kind: 'certification',
    verified: true,
  },
  {
    name: 'NETGEAR AV Level 1 and Managed Switches',
    issuer: 'NETGEAR',
    detail: 'Certified November 2025',
    kind: 'certification',
    verified: true,
  },
  {
    name: 'OSHA 10-Hour Construction',
    issuer: 'OSHA Outreach Training Program',
    detail: 'Completed June 2025',
    kind: 'training',
    verified: true,
  },
];
