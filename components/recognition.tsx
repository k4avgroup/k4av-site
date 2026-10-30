import { ArrowUpRight } from 'lucide-react';
import { affiliations, press } from '@/data/site';
import { SectionHeading } from './ui';

// Memberships, recognition and education. Every entry is backed by a document (see `affiliations` in data/site.ts).
export function AffiliationsSection() {
  return (
    <section className="section section-compact container" id="memberships">
      <SectionHeading
        eyebrow="Background"
        title="Memberships, recognition and education."
        text="The professional community and training behind the founder’s work."
      />
      <div className="affil-grid">
        {affiliations.map((a) => (
          <article key={a.name}>
            <span className="eyebrow">{a.kind}</span>
            <h3>{a.name}</h3>
            <p>{a.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// Articles about the founder’s work. They predate K4 AV Group, so the note under the cards says so.
export function PressSection() {
  return (
    <section className="section section-compact container" id="press">
      <SectionHeading
        eyebrow="In the press"
        title="Coverage of the founder’s work."
        text="Two articles on enterprise AV, speech capture and the move from music into corporate audio."
      />
      <div className="press-list">
        {press.map((p) => (
          <a key={p.url} href={p.url} rel="noopener noreferrer">
            <span className="eyebrow">
              {p.outlet} · {p.date}
            </span>
            <h3>{p.title}</h3>
            <p>{p.summary}</p>
            <span className="press-more">
              Read the article <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
      <p className="exp-note">
        Both articles appeared while the founder worked at AVI-SPL and do not mention K4 AV Group.
      </p>
    </section>
  );
}
