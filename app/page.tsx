import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { WhyUs, FinalCTA } from '@/components/home';
import { photos } from '@/data/photos';
import { divisions } from '@/data/division';

export const metadata: Metadata = {
  title: { absolute: 'K4 AV Group | AV Integration and Live Event Production in Seattle' },
  alternates: { canonical: '/' },
};

const choices = [
  {
    key: 'integration',
    title: 'AV Integration',
    text: 'Commissioning, programming and technical support for commercial AV systems.',
    cta: 'Explore AV Integration',
    photo: photos.roomGrand,
  },
  {
    key: 'events',
    title: 'Live Events',
    text: 'Technical production for corporate events, meetings and live experiences.',
    cta: 'Explore Live Events',
    photo: photos.ballroomWide,
  },
] as const;

export default function Home() {
  return (
    <>
      <section className="home-split" aria-label="Choose a division">
        {choices.map((c) => (
          <Link key={c.key} href={divisions[c.key].href} className={`home-panel home-panel-${c.key}`}>
            <Image
              src={c.photo.src}
              alt={c.photo.alt}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              className="home-panel-photo"
            />
            <div className="home-panel-fade" aria-hidden="true" />
            <div className="home-panel-body">
              <span className="eyebrow">K4 AV Group</span>
              <h1>{c.title}</h1>
              <p>{c.text}</p>
              <span className="button">
                {c.cta}
                <ArrowUpRight size={17} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </section>
      <WhyUs />
      <FinalCTA />
    </>
  );
}
