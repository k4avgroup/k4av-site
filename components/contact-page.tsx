import Link from 'next/link';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { PageIntro } from '@/components/ui';
import { InquiryForm } from '@/components/inquiry-form';
import { divisions } from '@/data/division';
import { site } from '@/data/site';
import { photos } from '@/data/photos';
import { Shot } from '@/components/photos';

// One contact page for both divisions: general questions, partnerships and offers, with the form first.
// Project and event requests have their own forms, linked from the two cards below.
export function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Get in touch."
        text="A question, an idea or something to offer? Send a message and we’ll reply."
      />

      <section className="container page-content contact-layout">
        <div>
          <h2 className="contact-subhead">Send us a message</h2>
          <p className="contact-subtext">
            Questions, partnerships, services you’d like to offer, or anything else. Pick a topic and tell us more.
          </p>
          <InquiryForm kind="contact" />
        </div>
        <aside className="contact-aside">
          <Shot photo={photos.founderOnSite} sizes="(max-width: 900px) 100vw, 40vw" className="aside-shot" />
          <div>
            <h3>
              <Mail size={18} aria-hidden="true" /> Email
            </h3>
            {site.email ? (
              <a href={`mailto:${site.email}`}>{site.email}</a>
            ) : (
              <p>Use the form and we’ll reply by email.</p>
            )}
          </div>
          <div>
            <h3>
              <Phone size={18} aria-hidden="true" /> Phone
            </h3>
            {site.phone ? <a href={`tel:${site.phone}`}>{site.phone}</a> : <p>Phone number coming soon.</p>}
          </div>
          <div>
            <h3>
              <MapPin size={18} aria-hidden="true" /> Where we work
            </h3>
            <p>
              {site.address && (
                <>
                  {site.address}
                  <br />
                </>
              )}
              {site.area}
              <br />
              Travel available for projects in the Pacific Northwest.
            </p>
          </div>
          {site.socials.length > 0 && (
            <div>
              <h3>Social</h3>
              {site.socials.map((x) => (
                <a key={x.url} href={x.url} rel="noopener noreferrer">
                  {x.label}
                </a>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="container contact-choice-section contact-choice-last" aria-labelledby="project-heading">
        <h2 id="project-heading" className="contact-subhead">
          Planning a project or an event?
        </h2>
        <p className="contact-subtext">Use one of these requests so we can scope the technical side properly.</p>
        <div className="contact-choice">
          <article className="choice-card choice-integration">
            <span className="eyebrow">AV Integration</span>
            <h3>Systems for rooms and buildings</h3>
            <p>Commissioning, programming, troubleshooting and technical support for commercial AV.</p>
            <Link className="button" href={divisions.integration.quote}>
              Request an AV Consultation
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </article>
          <article className="choice-card choice-events">
            <span className="eyebrow">Live Events</span>
            <h3>Production for the day of the event</h3>
            <p>Audio, video and technical production for corporate events, meetings and presentations.</p>
            <Link className="button" href={divisions.events.quote}>
              Plan an Event
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
