'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { currentDivision, divisionPath } from '@/data/division';
import { features, navigation } from '@/data/site';

// The two link columns of the footer. About, Contact and the quote form exist once per division, each in its own theme,
// so these links follow the division the visitor is in instead of dropping them into the other theme.
export function FooterLinks() {
  const division = currentDivision(usePathname());
  return (
    <>
      <div>
        <span className="eyebrow">Explore</span>
        <div className="footer-links">
          {navigation.map(({ label, href, page }) => (
            <Link key={label} href={page ? divisionPath(division, page) : href}>
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <span className="eyebrow">Start a conversation</span>
        <Link className="text-link" href={divisionPath(division, 'quote')}>
          Request a Quote ↗
        </Link>
        <Link href={divisionPath(division, 'contact')}>Contact us</Link>
        {features.clientLogin && <Link href="/login">Client login</Link>}
      </div>
    </>
  );
}
