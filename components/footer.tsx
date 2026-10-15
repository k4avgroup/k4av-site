import Link from 'next/link';
import { site } from '@/data/site';
import { FooterLinks } from './footer-links';
import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div>
          <Logo />
          <p>
            Technical expertise.
            <br />
            From system design intent to show time.
          </p>
          <span className="muted">
            {site.area}
            <br />
            Travel available for projects.
          </span>
        </div>
        <FooterLinks />
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} K4 AV Group</span>
        <span>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
        </span>
        <span>Engineered for the real world.</span>
      </div>
    </footer>
  );
}
