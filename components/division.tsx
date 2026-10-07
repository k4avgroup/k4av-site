import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Photo } from '@/data/photos';
import type { Tile } from '@/data/division';
import { Button, SectionHeading } from './ui';
import { Shot } from './photos';

type Action = { href: string; label: string };

export function DivisionHero({
  eyebrow,
  lead,
  accent,
  text,
  primary,
  secondary,
  photo,
}: {
  eyebrow: string;
  lead: string;
  accent: string;
  text: string;
  primary: Action;
  secondary: Action;
  photo: Photo;
}) {
  return (
    <section className="dhero">
      <div className="dhero-photo">
        <Image src={photo.src} alt={photo.alt} fill priority sizes="(max-width: 900px) 100vw, 70vw" />
      </div>
      <div className="dhero-fade" aria-hidden="true" />
      <div className="container dhero-content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>
          <span>{lead}</span>
          <span className="accent-text">{accent}</span>
        </h1>
        <p>{text}</p>
        <div className="button-row">
          <Button href={primary.href}>{primary.label}</Button>
          <Button href={secondary.href} secondary>
            {secondary.label}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function QuickFacts({ items }: { items: { title: string; note: string }[] }) {
  return (
    <div className="container quick-facts">
      {items.map((x) => (
        <div key={x.title}>
          <strong>{x.title}</strong>
          <span>{x.note}</span>
        </div>
      ))}
    </div>
  );
}

export function TileGrid({
  id,
  eyebrow,
  title,
  text,
  tiles,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  text?: string;
  tiles: Tile[];
}) {
  return (
    <section className="section container" id={id}>
      <SectionHeading eyebrow={eyebrow} title={title} text={text} />
      <ul className="tile-grid">
        {tiles.map((t) => (
          <li key={t.label}>
            <Shot photo={t.photo} sizes="(max-width: 700px) 50vw, 25vw" />
            <strong>{t.label}</strong>
            {t.note && <span>{t.note}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GroupCards({
  id,
  eyebrow,
  title,
  text,
  groups,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  text?: string;
  groups: { title: string; items: string[] }[];
}) {
  return (
    <section className="section container" id={id}>
      <SectionHeading eyebrow={eyebrow} title={title} text={text} />
      <div className="group-cards" data-count={groups.length}>
        {groups.map((g) => (
          <article key={g.title}>
            <h3>{g.title}</h3>
            <ul>
              {g.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

// One large, well-photographed example with a short caption: more convincing than several equal cards.
export function FeaturedCase({
  photo,
  eyebrow,
  title,
  text,
}: {
  photo: Photo;
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <section className="section section-compact container featured-case">
      <figure>
        <Shot photo={photo} sizes="(max-width: 1300px) 100vw, 1280px" className="case-shot" />
        <figcaption>
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <p>{text}</p>
        </figcaption>
      </figure>
    </section>
  );
}

// Short services as plain columns: they are read, not compared, so they do not need cards.
export function ServiceList({
  id,
  eyebrow,
  title,
  text,
  groups,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  text?: string;
  groups: { title: string; items: string[] }[];
}) {
  return (
    <section className="section section-compact container" id={id}>
      <SectionHeading eyebrow={eyebrow} title={title} text={text} />
      <div className="service-columns">
        {groups.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            <ul>
              {g.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
export function Steps({
  id,
  eyebrow,
  title,
  text,
  steps,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  text?: string;
  steps: string[];
}) {
  return (
    <section className="section container" id={id}>
      <SectionHeading eyebrow={eyebrow} title={title} text={text} />
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <strong>{s}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Split({
  id,
  eyebrow,
  title,
  photo,
  reverse = false,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  photo: Photo;
  reverse?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="section container" id={id}>
      <div className={reverse ? 'split reverse' : 'split'}>
        <div className="split-text">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          {children}
        </div>
        <Shot photo={photo} sizes="(max-width: 900px) 100vw, 50vw" />
      </div>
    </section>
  );
}

export function WidePhoto({ photo, caption }: { photo: Photo; caption?: string }) {
  return (
    <figure className="container wide-photo">
      <Shot photo={photo} sizes="100vw" className="wide-shot" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function DetailTrio({ items }: { items: { photo: Photo; label: string }[] }) {
  return (
    <div className="container detail-trio">
      {items.map((x) => (
        <figure key={x.label}>
          <Shot photo={x.photo} sizes="(max-width: 700px) 100vw, 33vw" />
          <figcaption>{x.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="chips">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

export function ExperienceCards({
  id,
  title,
  items,
  note,
}: {
  id?: string;
  title: string;
  items: { title: string; text: string }[];
  note: ReactNode;
}) {
  return (
    <section className="section container" id={id}>
      <SectionHeading eyebrow="Selected professional experience" title={title} />
      <div className="group-cards" data-count={items.length}>
        {items.map((x) => (
          <article key={x.title}>
            <h3>{x.title}</h3>
            <p>{x.text}</p>
          </article>
        ))}
      </div>
      <p className="exp-note">{note}</p>
    </section>
  );
}

export function DivisionCTA({ title, text, action }: { title: string; text: string; action: Action }) {
  return (
    <section className="cta-band">
      <div className="container cta-inner">
        <div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        <Link className="button" href={action.href}>
          {action.label}
        </Link>
      </div>
    </section>
  );
}
