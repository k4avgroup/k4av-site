import Image from 'next/image';
import type { Photo } from '@/data/photos';
import { gallery } from '@/data/photos';
import { SectionHeading } from './ui';

export function Shot({
  photo,
  sizes,
  priority = false,
  className = '',
}: {
  photo: Photo;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`shot ${className}`}>
      <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={priority} />
    </div>
  );
}

// Row of 2-4 photos for page headers and sections.
export function PhotoRow({ items }: { items: Photo[] }) {
  return (
    <div className="container photo-row" data-count={items.length}>
      {items.map((p) => (
        <Shot key={p.src} photo={p} sizes="(max-width: 700px) 100vw, 33vw" />
      ))}
    </div>
  );
}

// Slow side-scrolling strip. CSS only; pauses on hover and stops for reduced motion.
export function GalleryStrip() {
  return (
    <section className="section gallery" aria-label="Photos from our work">
      <div className="container">
        <SectionHeading eyebrow="From the field" title="Real rooms. Real systems." />
      </div>

      <div className="marquee">
        <div className="marquee-track">
          {[...gallery, ...gallery].map((p, i) => (
            <div className="marquee-item" key={i} aria-hidden={i >= gallery.length ? true : undefined}>
              <Shot photo={p} sizes="(max-width: 700px) 70vw, 360px" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// A few chosen frames with a caption each: the result, the work behind it and a live job.
export function SelectedWork({ items }: { items: { photo: Photo; caption: string }[] }) {
  return (
    <section className="section section-compact container selected-work" aria-label="Selected work">
      <SectionHeading eyebrow="Selected work" title="Real rooms. Real systems." />
      <div className="selected-grid">
        {items.map((x) => (
          <figure key={x.photo.src}>
            <Shot photo={x.photo} sizes="(max-width: 800px) 100vw, 33vw" />
            <figcaption>{x.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
