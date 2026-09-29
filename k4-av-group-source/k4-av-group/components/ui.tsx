import Link from 'next/link';
import { ArrowUpRight, AudioLines, Cable, CircleCheck, Code2, SlidersHorizontal, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';
export function Button({ href, children, secondary = false }: {
    href: string;
    children: ReactNode;
    secondary?: boolean;
}) { return <Link href={href} className={`button ${secondary ? 'secondary' : ''}`}>{children}<ArrowUpRight size={17} aria-hidden="true"/></Link>; }
export function SectionHeading({ eyebrow, title, text, action }: {
    eyebrow: string;
    title: string;
    text?: string;
    action?: {
        href: string;
        label: string;
    };
}) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>{action && <Link className="text-link" href={action.href}>{action.label}<ArrowUpRight size={18}/></Link>}</div>; }
export function PageIntro({ eyebrow, title, text }: {
    eyebrow: string;
    title: string;
    text: string;
}) { return <section className="page-intro container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></section>; }
export function ServiceIcon({ index }: {
    index: number;
}) { const Icon = [SlidersHorizontal, Code2, Cable, Wrench, AudioLines, CircleCheck][index % 6]; return <Icon size={29} strokeWidth={1.4} aria-hidden="true"/>; }
export function CTA() { return <section className="cta-band"><div className="container cta-inner"><div><span className="eyebrow">Let’s talk technical.</span><h2>Your next project.<br />Our next conversation.</h2></div><Button href="/quote">Request a quote</Button></div></section>; }
