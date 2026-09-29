'use client';
import Image from 'next/image';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { site } from '@/data/site';
import { Button } from './ui';
function canAnimate() { const connection = (navigator as Navigator & {
    connection?: {
        saveData?: boolean;
        effectiveType?: string;
    };
}).connection; return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType || '') && window.innerWidth > 900; }
function subscribe(callback: () => void) { const motion = window.matchMedia('(prefers-reduced-motion: reduce)'); window.addEventListener('resize', callback); motion.addEventListener('change', callback); return () => { window.removeEventListener('resize', callback); motion.removeEventListener('change', callback); }; }
export function Hero() { const [slide, setSlide] = useState(0); const [failed, setFailed] = useState(false); const [paused, setPaused] = useState(false); const allow = useSyncExternalStore(subscribe, canAnimate, () => false); const video = allow && !paused && !failed; useEffect(() => { if (!allow || paused)
    return; const id = setInterval(() => setSlide(x => (x + 1) % site.hero.images.length), 8000); return () => clearInterval(id); }, [paused, allow]); return <section className="hero"><div className="hero-media">{site.hero.images.map((src, i) => <Image key={src} src={src} alt="" fill sizes="100vw" priority={i === 0} className={slide === i ? 'hero-image active' : 'hero-image'}/>)}{video && site.hero.video && <video autoPlay muted loop playsInline preload="none" poster={site.hero.images[0]} onError={() => setFailed(true)}><source src={site.hero.video} type="video/mp4"/></video>}</div><div className="hero-shade"/><div className="container hero-content"><span className="eyebrow">SEATTLE & PUGET SOUND / AVAILABLE FOR TRAVEL</span><h1><span>AV SYSTEMS. </span><span className="hero-engineered">ENGINEERED. </span><span>READY FOR THE </span><span>REAL WORLD.</span></h1><p>Commercial AV commissioning, programming and technical support. Live-event expertise. Equipment ready for your next production.</p><div className="button-row"><Button href="/quote">Request a quote</Button><Button href="/services" secondary>View services</Button></div></div><div className="container hero-bottom"><span>FROM SIGNAL PATH TO SHOW TIME</span><div><span>Illustrative equipment imagery</span><button aria-label={paused ? 'Play background slideshow' : 'Pause background slideshow'} onClick={() => setPaused(!paused)}>{paused ? 'Play' : 'Pause'}</button><span>0{slide + 1} / {String(site.hero.images.length).padStart(2, '0')}</span></div></div></section>; }
