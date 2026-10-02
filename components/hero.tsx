'use client';
import Image from 'next/image';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { site, experienceYears } from '@/data/site';
import { Button } from './ui';
function canAnimate() {
  const connection = (
    navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    }
  ).connection;
  return (
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !connection?.saveData &&
    !['slow-2g', '2g', '3g'].includes(connection?.effectiveType || '') &&
    window.innerWidth > 900
  );
}
function subscribe(callback: () => void) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  window.addEventListener('resize', callback);
  motion.addEventListener('change', callback);
  return () => {
    window.removeEventListener('resize', callback);
    motion.removeEventListener('change', callback);
  };
}
export function Hero() {
  const [slide, setSlide] = useState(0);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const allow = useSyncExternalStore(subscribe, canAnimate, () => false);
  const video = allow && !paused && !failed;
  useEffect(() => {
    if (!allow || paused) return;
    const id = setInterval(() => setSlide((x) => (x + 1) % site.hero.images.length), 6500);
    return () => clearInterval(id);
  }, [paused, allow]);
  return (
    <section className="hero">
      <div className="hero-media">
        {site.hero.images.map((src, i) =>
          // Only the first photo loads on phones and slow connections; the rest join when the slideshow can run.
          i === 0 || allow ? (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              loading={i === 0 ? undefined : 'eager'}
              className={slide === i ? 'hero-image active' : 'hero-image'}
            />
          ) : null,
        )}
        {video && site.hero.video && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={site.hero.images[0]}
            onError={() => setFailed(true)}
          >
            <source src={site.hero.video} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="hero-shade" />
      <div className="container hero-content">
        <span className="eyebrow">Seattle / Bellevue / Greater Seattle Area</span>
        <h1>
          <span>AV Engineering.</span>
          <span>Live Production.</span>
          <span>Equipment Rentals.</span>
        </h1>
        <p>
          Commercial AV commissioning, live event production and technical support for organizations across Seattle and
          the Pacific Northwest.
        </p>
        <p className="hero-proof">{experienceYears} years of hands-on audio and AV experience.</p>
        <div className="button-row">
          <Button href="/quote">Request a Quote</Button>
          <Button href="/services" secondary>
            Explore Services
          </Button>
        </div>
      </div>
      <div className="container hero-bottom">
        <span>Seattle, WA</span>
        <div>
          <span>Field photos</span>
          <button
            aria-label={paused ? 'Play background slideshow' : 'Pause background slideshow'}
            onClick={() => setPaused(!paused)}
          >
            {paused ? 'Play' : 'Pause'}
          </button>
          <span>
            0{slide + 1} / {String(site.hero.images.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  );
}
