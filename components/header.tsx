'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { divisions, type Division } from '@/data/division';
import { Logo } from './logo';

function currentDivision(pathname: string): Division | null {
  if (pathname === '/integration' || pathname.startsWith('/integration/')) return 'integration';
  if (pathname === '/events' || pathname.startsWith('/events/')) return 'events';
  return null;
}

export function Header() {
  const pathname = usePathname();
  const active = currentDivision(pathname);
  const cta = active ? divisions[active] : null;
  const ref = useRef<HTMLElement>(null);

  // The section navigation sticks right under the header, so publish the header height as a CSS variable.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={ref}
      className={pathname === '/' ? 'site-header is-home' : 'site-header'}
      data-division={active ?? undefined}
    >
      <div className="site-header-inner">
        <Logo />
        <nav className="divtabs" aria-label="Divisions">
          {(Object.keys(divisions) as Division[]).map((key) => (
            <Link
              key={key}
              href={divisions[key].href}
              className={`divtab divtab-${key}`}
              aria-current={active === key ? 'page' : undefined}
            >
              <span className="tab-full">{divisions[key].label}</span>
              <span className="tab-short">{divisions[key].short}</span>
            </Link>
          ))}
        </nav>
        <Link className="button header-cta" href={cta ? cta.quote : '/quote'}>
          <span className="cta-full">{cta ? cta.cta : 'Request a Quote'}</span>
          <span className="cta-short">{cta ? cta.ctaShort : 'Quote'}</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
