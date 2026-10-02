'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { secondaryNav, type Division, type NavItem } from '@/data/division';

function hashOf(href: string) {
  const i = href.indexOf('#');
  return i === -1 ? '' : href.slice(i + 1);
}

export function SecondaryNav({ division }: { division: Division }) {
  const pathname = usePathname();
  const { main, side } = secondaryNav[division];
  const [section, setSection] = useState('');

  // Highlight the link of the section currently on screen.
  useEffect(() => {
    const ids = main.map((item) => hashOf(item.href)).filter(Boolean);
    const targets = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setSection(entry.target.id);
          else setSection((current) => (current === entry.target.id ? '' : current));
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [main, pathname]);

  function link(item: NavItem) {
    const hash = hashOf(item.href);
    const path = item.href.split('#')[0];
    const current = hash ? pathname === path && section === hash : pathname === path;
    return (
      <Link key={item.href} href={item.href} aria-current={current ? 'true' : undefined}>
        {item.label}
      </Link>
    );
  }

  // A thin divider before every link and after the last one, so each group reads as a row of buttons.
  function group(items: NavItem[]) {
    return (
      <>
        {items.map((item) => (
          <Fragment key={item.href}>
            <span className="nav-sep" aria-hidden="true" />
            {link(item)}
          </Fragment>
        ))}
        <span className="nav-sep" aria-hidden="true" />
      </>
    );
  }

  return (
    <nav className="secondary-nav" aria-label={`${division === 'events' ? 'Live Events' : 'AV Integration'} sections`}>
      <div className="secondary-nav-inner">
        <div className="secondary-main">{group(main)}</div>
        <div className="secondary-side">{group(side)}</div>
      </div>
    </nav>
  );
}
