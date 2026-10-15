import { ArrowUpRight } from 'lucide-react';
import { affiliations, press } from '@/data/site';
import { SectionHeading } from './ui';

// Memberships, recognition and education, one short row each. Every entry is backed by a document
// (see `affiliations` in data/site.ts).
export function AffiliationsSection() {
  return (
    <section className="section section-compact container" id="memberships">
      <SectionHeading eyebrow="Background" title="Memberships, recognition and education." />
      <dl className="cred-groups affil-rows">
        {affiliations.map((a) => (
          <div key={a.name}>
            <dt>{a.kind}</dt>
            <dd>
              <strong>{a.name}</strong>, {a.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Articles about the founder’s work. They predate K4 AV Group, so the line under the list says so.
export function PressSection() {
  return (
    <section className="section section-compact container" id="press">
      <SectionHeading eyebrow="In the press" title="Articles about the founder’s work." />
      <ul className="press-rows">
        {press.map((p) => (
          <li key={p.url}>
            <a href={p.url} rel="noopener noreferrer">
              <span className="press-meta">
                {p.outlet} · {p.date}
              </span>
              <span className="press-title">{p.title}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <p className="exp-note">Both appeared while the founder worked at AVI-SPL and do not mention K4 AV Group.</p>
    </section>
  );
}
