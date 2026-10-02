import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { pillars, whyPoints, founderPath, rentalCategories, experienceYears, experienceOrgs } from '@/data/site';
import { photos } from '@/data/photos';
import { Button, SectionHeading } from './ui';
import { PhotoRow, Shot } from './photos';

// Sits right under the hero: who we are and why hire us.
export function WhyUs() {
  return (
    <section className="section container" id="why-us">
      <div className="why-us">
        <div>
          <span className="eyebrow">Why K4 AV Group</span>
          <h2>Enterprise-level experience. Small-company rates.</h2>
        </div>
        <div>
          <p className="lead">
            Our founder has spent {experienceYears} years working at the top of the AV industry, supporting events and
            systems for Fortune 500 companies.
          </p>
          <p>
            Now we’re building our own company. We’re new, ambitious and keeping our prices fair, so you get the quality
            you’d expect from a large integrator without the large-company price tag.
          </p>
          <p className="org-list">
            Experience supporting projects and events for organizations including {experienceOrgs.join(', ')} and public
            universities.
          </p>
        </div>
      </div>
      <PhotoRow items={[photos.consoleRedStage, photos.racksBlue, photos.ballroomGreen]} />
    </section>
  );
}

export function CorePillars() {
  return (
    <section className="section container" id="services">
      <SectionHeading eyebrow="Services" title="What we do" text="Three ways we can support your project." />
      <div className="pillar-grid">
        {pillars.map((p) => (
          <article className="pillar-card" key={p.slug}>
            <Shot photo={p.photo} sizes="(max-width: 900px) 100vw, 33vw" className="pillar-shot" />
            <div className="pillar-body">
              <h3>{p.title}</h3>
              <p>{p.summary}</p>
              <ul className="check-list">
                {p.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <Link className="text-link" href={p.href}>
                {p.cta}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function WhyK4() {
  return (
    <section className="section container" id="why-k4">
      <SectionHeading
        eyebrow="How we work"
        title="Technical experience without unnecessary overhead."
        text="We support anything from an individual technical assignment to a complete production, depending on the scope of your project."
      />
      <div className="feature-list">
        {whyPoints.map((x) => (
          <article key={x.title}>
            <h3>{x.title}</h3>
            <p>{x.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function FounderPath() {
  return (
    <ol className="path-cards" aria-label="Career path">
      {founderPath.map((step, i) => (
        <li key={step.title}>
          <Shot photo={step.photo} sizes="(max-width: 700px) 100vw, 25vw" />
          <span className="path-step">0{i + 1}</span>
          <h3>{step.title}</h3>
        </li>
      ))}
    </ol>
  );
}

export function FounderStory() {
  return (
    <section className="section container" id="founder">
      <SectionHeading
        eyebrow="Our founder"
        title="Built on hands-on experience."
        text={`${experienceYears} years in audio and AV, from recording and live sound to complex corporate events and commercial AV systems.`}
      />
      <FounderPath />
      <div className="founder-note">
        <p>
          That includes commissioning, DSP, control, networking and troubleshooting on installed systems, and technical
          production for corporate events. When you work with K4, you work with someone who understands the systems.
        </p>
        <Button href="/about" secondary>
          About K4 AV Group
        </Button>
      </div>
    </section>
  );
}

export function RentalPreview() {
  return (
    <section className="section container" id="rentals">
      <SectionHeading
        eyebrow="Equipment rentals"
        title="Equipment for your event or project."
        text="Our rental inventory is growing. Tell us what you need and we will confirm availability."
        action={{ href: '/events/rentals', label: 'Browse rentals' }}
      />
      <div className="rental-tiles">
        {rentalCategories.map((c) => (
          <Link href="/events/rentals" key={c}>
            {c}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FinalCTA({ href = '/quote' }: { href?: string }) {
  return (
    <section className="cta-band">
      <div className="container cta-inner">
        <div>
          <h2>Have a project coming up?</h2>
          <p>Tell us what you need and we’ll help determine the right technical approach.</p>
        </div>
        <Button href={href}>Request a Quote</Button>
      </div>
    </section>
  );
}
