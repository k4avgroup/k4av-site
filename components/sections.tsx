import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Building2,
  Network,
  GraduationCap,
  Church,
  AudioLines,
  Monitor,
  Landmark,
  Play,
  PencilRuler,
  Hammer,
  CircleCheck,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react';
import { process, credentials, whyUs, testimonials, layers } from '@/data/site';
import { contentRepository } from '@/services/content';
import type { Layer, Project } from '@/types/domain';
import { Button, SectionHeading, ServiceIcon } from './ui';

const industryIcons: Record<string, LucideIcon> = {
  Corporate: Building2,
  Enterprise: Network,
  Education: GraduationCap,
  'Houses of Worship': Church,
  Government: Landmark,
  Conferences: Monitor,
  'Live Productions': AudioLines,
};

const pillars: { label: string; icon: LucideIcon }[] = [
  { label: 'Design', icon: PencilRuler },
  { label: 'Build', icon: Hammer },
  { label: 'Commission', icon: CircleCheck },
  { label: 'Support', icon: LifeBuoy },
];

export function PillarsStrip() {
  return (
    <div className="trust-strip container">
      {pillars.map(({ label, icon: Icon }) => (
        <div className="pillar" key={label}>
          <Icon size={26} strokeWidth={1.4} aria-hidden="true" />
          {label}
        </div>
      ))}
    </div>
  );
}

export function WhyUs() {
  return (
    <section className="section container" id="why-us">
      <SectionHeading
        eyebrow="Why K4 AV Group"
        title="Focused on the work."
        text="We approach systems through signal flow, clear requirements and careful testing."
      />
      <div className="video-slot" role="img" aria-label="Company video, coming soon">
        <Play size={44} strokeWidth={1.2} aria-hidden="true" />
        <span>Company video coming soon</span>
      </div>
      <div className="feature-list">
        {whyUs.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProjectCard({ project: p }: { project: Project }) {
  return (
    <Link className="project-card" href={`/projects/${p.slug}`}>
      <div className="project-image">
        <Image
          src={p.image}
          alt={`Illustrative AV equipment for ${p.title}`}
          fill
          sizes="(max-width: 700px) 100vw, 33vw"
        />
        {p.sample && <span className="sample-label">Sample project</span>}
        <span className="project-open">
          <ArrowUpRight />
        </span>
      </div>
      <span className="eyebrow">
        {p.industry} / {p.service.split(' / ')[0]}
      </span>
      <h3>{p.title}</h3>
      <p>{p.summary}</p>
    </Link>
  );
}

export function ProjectsSection({ layer }: { layer?: Layer }) {
  const projects = contentRepository.projects(layer);
  return (
    <section className="section project-section" id="projects">
      <div className="container">
        <SectionHeading
          eyebrow="Our projects"
          title="The work behind the experience."
          text="Illustrative project profiles. Real project case studies are coming soon."
          action={layer ? undefined : { href: '/integration#projects', label: 'All projects' }}
        />
        <div className="project-grid">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="section container" id="reviews">
      <SectionHeading eyebrow="Client reviews" title="What clients say." />
      {testimonials.length > 0 ? (
        <div className="feature-list">
          {testimonials.map((t) => (
            <article key={t.author}>
              <p>“{t.quote}”</p>
              <h3>{t.author}</h3>
              <span className="muted">{t.company}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="notice">
          Reviews from our first clients will appear here. Want to be one of them?{' '}
          <Link className="text-link" href="/quote">
            Get a quote
          </Link>
        </div>
      )}
    </section>
  );
}

export function LayerEntries() {
  return (
    <section className="section container">
      <SectionHeading eyebrow="What we do" title="Two ways we work with you." />
      <div className="service-grid">
        {(Object.keys(layers) as Layer[]).map((key, i) => (
          <Link className="service-card" key={key} href={layers[key].href}>
            <div className="card-top">
              <ServiceIcon index={i * 4} />
            </div>
            <h3>{layers[key].title}</h3>
            <p>{layers[key].summary}</p>
            <ArrowUpRight className="card-arrow" size={19} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ServicesSection({ layer }: { layer: Layer }) {
  const services = contentRepository.services(layer);
  return (
    <section className="section container" id="services">
      <SectionHeading
        eyebrow="Services"
        title="Technical depth. Practical delivery."
        text="Specialist support at every stage of your project."
      />
      <div className="service-grid">
        {services.map((s, i) => (
          <Link className="service-card" key={s.slug} href={`/services/${s.slug}`}>
            <div className="card-top">
              <ServiceIcon index={i} />
              <span>0{i + 1}</span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.short}</p>
            <ArrowUpRight className="card-arrow" size={19} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function IndustriesSection({ layer }: { layer: Layer }) {
  const items = contentRepository.industries(layer);
  return (
    <section className="section industry-section" id="industries">
      <div className="container">
        <SectionHeading
          eyebrow="Industries"
          title="Different spaces. One technical standard."
          text="Support built around the way your space is used."
        />
        <div className="industry-grid">
          {items.map((item, i) => {
            const Icon = industryIcons[item.name] ?? Building2;
            return (
              <article className="industry-card" key={item.name}>
                <div className="industry-visual">
                  <Icon size={70} strokeWidth={1} />
                  <span>ENV / 0{i + 1}</span>
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <Link className="text-link" href={`/quote?service=Other&context=${encodeURIComponent(item.name)}`}>
                  Discuss your space
                  <ArrowUpRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ProcessTimeline() {
  return (
    <section className="section container">
      <SectionHeading eyebrow="How we work" title="A clear path to a working system." />
      <ol className="process-grid">
        {process.map((p, i) => (
          <li key={p.title}>
            <span className="step-number">0{i + 1}</span>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CertificationsSection() {
  const items = credentials.filter((c) => c.verified);
  if (items.length === 0) return null;
  const featured = items.filter((c) => c.featured);
  const groups = Object.entries(
    items
      .filter((c) => !c.featured)
      .reduce<Record<string, string[]>>((acc, c) => {
        (acc[c.issuer] ||= []).push(c.name);
        return acc;
      }, {}),
  );
  return (
    <section className="section section-compact container" id="certifications">
      <SectionHeading
        eyebrow="Certifications"
        title="Certified on the platforms we work with."
        text="Manufacturer and industry certifications behind our work."
      />
      <div className="cred-featured">
        {featured.map((c) => (
          <article key={c.name}>
            <span className="eyebrow">{c.issuer}</span>
            <h3>{c.name}</h3>
            <p>{c.detail}</p>
          </article>
        ))}
      </div>
      <dl className="cred-groups">
        {groups.map(([issuer, names]) => (
          <div key={issuer}>
            <dt>{issuer}</dt>
            <dd>{names.join(' · ')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
export function ExperienceSection() {
  return (
    <section className="section container expertise">
      <div>
        <span className="eyebrow">Technical foundations</span>
        <h2>
          Details matter.
          <br />
          Especially the ones
          <br />
          you don’t see.
        </h2>
      </div>
      <div>
        <p className="lead">
          Signal flow. Network configuration. Control logic. The fundamentals that make an AV system feel effortless.
        </p>
        <div className="expertise-lines">
          {[
            'Audio, video & control',
            'AV networking & system verification',
            'DSP & integrated workflows',
            'Live production & field support',
          ].map((x, i) => (
            <div key={x}>
              <span>0{i + 1}</span>
              {x}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function RentalTeaser() {
  return (
    <section className="section container">
      <div className="split-panels">
        <article className="split-panel">
          <span className="eyebrow">Equipment rental</span>
          <h2>Rent the right gear.</h2>
          <p>Audio, projection, video and lighting for events and installations, backed by technical support.</p>
          <Button href="/events/rentals">Browse rental</Button>
        </article>
        <article className="split-panel">
          <span className="eyebrow">Shop</span>
          <h2>Shop used gear.</h2>
          <p>Quality pre-owned AV equipment. Condition and compatibility confirmed before sale.</p>
          <Button href="/shop" secondary>
            Visit shop
          </Button>
        </article>
      </div>
    </section>
  );
}
