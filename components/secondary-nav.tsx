'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, useState } from 'react';
import { secondaryNav, type Division, type NavItem } from '@/data/division';

function hashOf(href: string) {
  const i = href.indexOf('#');
  return i === -1 ? '' : href.slice(i + 1);
}

export function SecondaryNav({ division }: { division: Division }) {
  const pathname = usePathname();
  const { main, side } = secondaryNav[division];
  const [section, setSection] = useState('');
  const inner = useRef<HTMLDivElement>(null);
  // On narrow screens the row scrolls sideways: fade the edge that still has more links behind it.
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const update = () => {
      const left = el.scrollLeft > 4;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setEdges((e) => (e.left === left && e.right === right ? e : { left, right }));
    };
    const first = setTimeout(update, 0);
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      clearTimeout(first);
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

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
    <nav
      className="secondary-nav"
      data-fade-left={edges.left || undefined}
      data-fade-right={edges.right || undefined}
      aria-label={`${division === 'events' ? 'Live Events' : 'AV Integration'} sections`}
    >
      <div className="secondary-nav-inner" ref={inner}>
        <div className="secondary-main">{group(main)}</div>
        <div className="secondary-side">{group(side)}</div>
      </div>
    </nav>
  );
}
