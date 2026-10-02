import type { ReactNode } from 'react';
import { Button, SectionHeading } from './ui';

export function CapabilityList({
  eyebrow,
  title,
  text,
  items,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  items: string[];
}) {
  return (
    <section className="section container">
      <SectionHeading eyebrow={eyebrow} title={title} text={text} />
      <ul className="capability-list">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </section>
  );
}

export function ServiceArea({
  id,
  title,
  text,
  items,
  cta,
}: {
  id: string;
  title: string;
  text: string;
  items: string[];
  cta: ReactNode;
}) {
  return (
    <section className="section container service-area" id={id}>
      <div>
        <h2>{title}</h2>
        <p className="lead">{text}</p>
        {cta}
      </div>
      <ul className="capability-list">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </section>
  );
}

export function QuoteBand({ service, title = 'Tell us about your project.' }: { service: string; title?: string }) {
  return (
    <section className="cta-band">
      <div className="container cta-inner">
        <div>
          <h2>{title}</h2>
          <p>We’ll help determine the right technical approach.</p>
        </div>
        <Button href={`/quote?service=${encodeURIComponent(service)}`}>Request a Quote</Button>
      </div>
    </section>
  );
}
