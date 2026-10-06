import Link from 'next/link';
import {
  DivisionHero,
  TileGrid,
  GroupCards,
  WidePhoto,
  DetailTrio,
  ExperienceCards,
  DivisionCTA,
} from '@/components/division';
import { SectionHeading } from '@/components/ui';
import { Shot } from '@/components/photos';
import { photos } from '@/data/photos';
import { eventTypes, eventScale, eventServices, eventExperience, divisions } from '@/data/division';
import { HowItWorks } from '@/components/how-it-works';
import { experienceOrgs } from '@/data/site';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Live Event and Corporate Event Production in Seattle',
  'Technical production for corporate events, meetings and presentations in Seattle: audio, video, projection, A1/A2, V1/V2, technical direction and equipment.',
  '/events',
);

export default function Events() {
  return (
    <>
      <DivisionHero
        eyebrow="Live event production"
        lead="Live Production, engineered for"
        accent="the moment."
        text="Technical production for corporate events, meetings, presentations, celebrations and live experiences across the Seattle area."
        primary={{ href: divisions.events.quote, label: 'Plan an Event' }}
        secondary={{ href: '#services', label: 'Explore Event Services' }}
        photo={photos.ballroomWide}
      />

      <section className="section container" id="who-we-are">
        <div className="intro-split">
          <div>
            <span className="eyebrow">Who we are</span>
            <h2>Live production with an engineer’s understanding.</h2>
          </div>
          <div>
            <p className="lead">
              We combine live production experience with engineering-level technical knowledge, so audio, video and
              presentation systems work the first time.
            </p>
            <p>We can support one technician, a technical department or a complete AV production.</p>
            <Link className="text-link" href="/about">
              About the founder
            </Link>
          </div>
        </div>
      </section>

      <TileGrid
        id="event-types"
        eyebrow="Event types"
        title="Events we can support"
        text="From intimate gatherings to large corporate productions."
        tiles={eventTypes}
      />

      <section className="section container" id="scale">
        <SectionHeading
          eyebrow="Event scale"
          title="Scalable for any event."
          text="We scale equipment, crew and production resources to the size of your event. We provide equipment directly and source additional equipment and crew through production partners when needed."
        />
        <div className="scale-grid">
          {eventScale.map((s) => (
            <article key={s.size}>
              <Shot photo={s.photo} sizes="(max-width: 700px) 100vw, 33vw" />
              <h3>{s.size}</h3>
              <ul>
                {s.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <GroupCards id="services" eyebrow="Event services" title="What we do on show day." groups={eventServices} />

      <WidePhoto photo={photos.consoleBigScreen} caption="Front-of-house at a large corporate conference." />

      <DetailTrio
        items={[
          { photo: photos.faderGlow, label: 'Audio console' },
          { photo: photos.wirelessMics, label: 'Wireless microphones' },
          { photo: photos.cameraSunset, label: 'Video and camera' },
        ]}
      />

      <HowItWorks division="events" id="how-we-work" />

      <ExperienceCards
        id="experience"
        title="Experience behind the work."
        items={eventExperience}
        note={
          <>
            Experience gained in previous professional roles supporting corporate events and productions, including for
            organizations such as {experienceOrgs.join(', ')}. These are not K4 AV Group client projects.
          </>
        }
      />

      <section className="section container" id="rentals">
        <SectionHeading
          eyebrow="Rentals"
          title="Equipment for your event."
          text="Our rental inventory is growing. Request availability and we’ll confirm what we can provide."
          action={{ href: '/events/rentals', label: 'Browse rentals' }}
        />
      </section>

      <DivisionCTA
        title="Have an event coming up?"
        text="Tell us the date, venue and what you need, and we’ll help plan the technical side."
        action={{ href: divisions.events.quote, label: 'Plan an Event' }}
      />
    </>
  );
}
