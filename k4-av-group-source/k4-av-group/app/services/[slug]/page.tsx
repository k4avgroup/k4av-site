import { notFound } from 'next/navigation';
import { contentRepository } from '@/services/content';
import { Button, PageIntro } from '@/components/ui';
import { pageMetadata } from '@/lib/metadata';
export function generateStaticParams() { return contentRepository.services().map(s => ({ slug: s.slug })); }
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params; const s = contentRepository.services().find(x => x.slug === slug); return s ? pageMetadata(s.title, s.description, `/services/${slug}`) : {}; }
export default async function Service({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params; const s = contentRepository.services().find(x => x.slug === slug); if (!s)
    notFound(); const option = ({ commissioning: 'AV Commissioning', programming: 'AV Programming', 'installation-support': 'Installation Support', troubleshooting: 'Troubleshooting', 'live-audio': 'Live Event Audio', 'event-support': 'Event Technical Support' } as Record<string, string>)[slug] || 'Other'; return <><PageIntro eyebrow="K4 AV Group / Services" title={s.title} text={s.description}/><section className="container page-content detail-grid"><div><h2>{s.short}</h2><p>Bring us your scope, the current system state and the outcome you need. We’ll discuss the technical requirements, site conditions and a practical plan for delivery.</p><Button href={`/quote?service=${encodeURIComponent(option)}`}>Request a quote</Button></div><div><h3>How we can help</h3><ul>{s.deliverables.map(x => <li key={x}>{x}</li>)}</ul><div className="notice">Service scope and platform compatibility are confirmed for each project.</div></div></section></>; }
