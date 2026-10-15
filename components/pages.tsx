import { PageIntro } from '@/components/ui';
import { CertificationsSection } from '@/components/sections';
import { AffiliationsSection, PressSection } from '@/components/recognition';
import { FounderPath, FinalCTA } from '@/components/home';
import { SelectedWork, Shot } from '@/components/photos';
import { InquiryForm } from '@/components/inquiry-form';
import { photos } from '@/data/photos';
import { divisions, type Division } from '@/data/division';
import { experienceOrgs, founder, founderFacts } from '@/data/site';

// Pages shared by both divisions. Each division has its own route (/integration/about, /events/about, ...)
// so the header tabs, section navigation and theme stay in place.

export function AboutPage({ division }: { division: Division }) {
  return (
    <>
      <PageIntro
        eyebrow="About K4 AV Group"
        title="A founder-led AV company in the Seattle area."
        text="K4 AV Group combines AV engineering and live production experience to support commercial systems and corporate events."
      />
      <section className="section container founder">
        <div>
          <Shot photo={photos.founderConsole} sizes="(max-width: 900px) 100vw, 40vw" className="about-shot" />
        </div>
        <div>
          <span className="eyebrow">Founder</span>
          <h2>{founder.name ?? 'The founder'}</h2>
          <p className="founder-role">{founder.role}</p>
          <p className="lead">
            Audio engineer and AV commissioning specialist. He came to AV from music and builds systems that work the
            same way for every presenter, every call, every day.
          </p>
          <p>
            Before K4 AV Group: Encore Global, running corporate events across Washington State, and AVI-SPL, on
            enterprise AV commissioning. You talk to the person who does the work.
          </p>
          <dl className="founder-facts">
            {founderFacts.map((f) => (
              <div key={f.value}>
                <dt>{f.value}</dt>
                <dd>{f.label}</dd>
              </div>
            ))}
          </dl>
          <p className="org-list">
            Experience supporting projects and events for {experienceOrgs.join(', ')}. Gained in previous roles; not K4
            AV Group client projects.
          </p>
        </div>
      </section>
      <section className="container">
        <FounderPath />
      </section>
      <CertificationsSection />
      <AffiliationsSection />
      <PressSection />
      <SelectedWork
        items={[
          { photo: photos.roomGrand, caption: 'Boardroom with a wall display and table connectivity.' },
          { photo: photos.racksBlue, caption: 'Equipment racks with labeled network patching during a system build.' },
          { photo: photos.consoleBigScreen, caption: 'Front of house at a large corporate conference.' },
        ]}
      />
      <FinalCTA href={divisions[division].quote} />
    </>
  );
}

const quoteCopy = {
  integration: {
    eyebrow: 'AV Integration',
    title: 'Request an AV consultation.',
    text: 'Tell us about the system, the space and the outcome you need. We’ll follow up with the right technical approach.',
    help: 'System type, room or building, current issues and timeline help us understand the scope.',
  },
  events: {
    eyebrow: 'Live Events',
    title: 'Plan your event.',
    text: 'Share the date, venue and what you need. We’ll follow up to plan the technical side.',
    help: 'Date, venue, expected attendance and the event format help us scope crew and equipment.',
  },
} as const;

// A real photo beside each request form, until the owner picks others.
const quotePhotos = { integration: photos.roomMeeting, events: photos.galaDinner } as const;

export function QuotePage({ division, service, context }: { division: Division; service?: string; context?: string }) {
  const text = quoteCopy[division];
  return (
    <>
      <PageIntro eyebrow={text.eyebrow} title={text.title} text={text.text} />
      <section className="container page-content contact-layout">
        <InquiryForm kind="quote" division={division} defaultService={service} context={context?.slice(0, 1000)} />
        <aside className="contact-aside">
          <Shot photo={quotePhotos[division]} sizes="(max-width: 900px) 100vw, 40vw" className="aside-shot" />
          <div>
            <h3>A useful starting point</h3>
            <p>{text.help}</p>
          </div>
          <div>
            <h3>What happens next</h3>
            <p>
              We review your request and follow up to clarify scope, availability and pricing. Submitting the form is
              not a booking or a binding quote.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
