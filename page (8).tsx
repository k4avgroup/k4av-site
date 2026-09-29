import Image from 'next/image';
import { notFound } from 'next/navigation';
import { contentRepository } from '@/services/content';
import { Button, PageIntro } from '@/components/ui';
import { pageMetadata } from '@/lib/metadata';
export function generateStaticParams() { return contentRepository.projects().map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params; const p = contentRepository.projects().find(x => x.slug === slug); return p ? pageMetadata(p.title, p.summary, `/projects/${slug}`) : {}; }
export default async function Project({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params; const p = contentRepository.projects().find(x => x.slug === slug); if (!p)
    notFound(); return <><PageIntro eyebrow={`${p.industry} / ${p.service}`} title={p.title} text={p.summary}/><section className="container page-content"><div className="notice">Sample project · Illustrative imagery and scenario. No customer, contract or completed outcome is represented.</div><div className="detail-grid"><div><div className="detail-image"><Image src={p.image} alt="Illustrative AV equipment, not a client installation" fill sizes="(max-width: 700px) 100vw, 50vw"/></div><p className="muted">{p.location} / {p.industry}</p></div><div>{[['The challenge', p.challenge], ['The solution', p.solution], ['Technology', p.technologies.join(' / ')], ['Result', p.result]].map(([heading, text]) => <div className="detail-section" key={heading}><h2>{heading}</h2><p>{text}</p></div>)}</div></div><div className="section"><Button href={`/quote?context=${encodeURIComponent(`I would like to discuss a project similar to ${p.title}.`)}`}>Discuss a similar project</Button></div></section></>; }
