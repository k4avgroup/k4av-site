import { PageIntro } from '@/components/ui';
import { CertificationsSection } from '@/components/sections';
import { AffiliationsSection, PressSection } from '@/components/recognition';
import { FounderPath, FinalCTA } from '@/components/home';
import { SelectedWork, Shot } from '@/components/photos';
import { InquiryForm } from '@/components/inquiry-form';
import { photos } from '@/data/photos';
import { divisions, type Division } from '@/data/division';
import { experienceYears, experienceOrgs, founder } from '@/data/site';

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
          <h2>From music to AV systems.</h2>
          <p className="founder-role">
            {founder.name ? `${founder.name}, ` : ''}
            {founder.role}
          </p>
          <p className="lead">
            Ihor came to audiovisual technology from music, not from IT or construction. Performing, recording and live
            sound built the ear. Corporate events and enterprise commissioning built the engineering.
          </p>
          <p>
            Over {experienceYears} years in audio and music, that grew into corporate event production with Encore
            Global in Washington State, then into enterprise AV commissioning with AVI-SPL: commissioning, DSP, control,
            networking and troubleshooting. Understanding how audio, video and control systems work together, and how a
            live show runs, means fewer surprises for you.
          </p>
          <p>
            The experience includes supporting projects and events for organizations including{' '}
            {experienceOrgs.join(', ')} and public universities. It was gained in previous professional roles and does
            not describe K4 AV Group client projects.
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
      <section className="section container" id="approach">
        <div className="intro-split">
          <div>
            <span className="eyebrow">Our approach</span>
            <h2>From taste to repeatability.</h2>
          </div>
          <div>
            <p className="lead">
              A good ear matters. A professional system also has to work for another operator, another presenter and
              another call tomorrow.
            </p>
            <ul className="check-list">
              <li>Does every microphone behave the same way every time?</li>
              <li>Does speech stay clear in the room and for the people on the far end?</li>
              <li>Can another engineer reproduce the result from the documentation?</li>
            </ul>
          </div>
        </div>
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
