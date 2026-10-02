import { PageIntro } from '@/components/ui';
import { CertificationsSection } from '@/components/sections';
import { FounderPath, FinalCTA } from '@/components/home';
import { GalleryStrip, Shot } from '@/components/photos';
import { InquiryForm } from '@/components/inquiry-form';
import { photos } from '@/data/photos';
import { divisions, type Division } from '@/data/division';
import { experienceYears, experienceOrgs } from '@/data/site';

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
          <h2>From music to AV systems.</h2>
          <p className="lead">
            The founder’s path started in music and recording and moved into live sound and large corporate productions.
            Over {experienceYears} years, that grew into commercial AV work: commissioning, DSP, control, networking and
            troubleshooting.
          </p>
          <p>
            That mix matters. Understanding how audio, video and control systems work together, and how a live show
            runs, means fewer surprises for you. The experience includes supporting projects and events for
            organizations including {experienceOrgs.join(', ')} and public universities.
          </p>
          <p>
            K4 AV Group is small enough to be personal and experienced enough to handle serious AV work. You talk to the
            person who does the work.
          </p>
        </div>
      </section>
      <section className="container">
        <FounderPath />
      </section>
      <CertificationsSection />
      <GalleryStrip />
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

export function QuotePage({ division, service, context }: { division: Division; service?: string; context?: string }) {
  const text = quoteCopy[division];
  return (
    <>
      <PageIntro eyebrow={text.eyebrow} title={text.title} text={text.text} />
      <section className="container page-content contact-layout">
        <InquiryForm kind="quote" division={division} defaultService={service} context={context?.slice(0, 1000)} />
        <aside className="contact-aside">
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
