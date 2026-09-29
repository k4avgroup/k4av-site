import { PageIntro } from '@/components/ui';
import { InquiryForm } from '@/components/inquiry-form';
import { site } from '@/data/site';
import { contentRepository } from '@/services/content';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('Contact', 'Contact K4 AV Group for AV engineering, technical support, live events and equipment inquiries in Seattle and Puget Sound.', '/contact');
export default async function Contact({ searchParams }: {
    searchParams: Promise<{
        item?: string;
    }>;
}) { const { item: id } = await searchParams; const item = contentRepository.shop().find(x => x.id === id && x.status !== 'Sold'); return <><PageIntro eyebrow="Seattle / Bellevue / Puget Sound" title={item ? `Let’s talk about the ${item.model.toLowerCase()}.` : 'Let’s connect.'} text="Have a technical question or a project in mind? Tell us a little about it."/><section className="container page-content contact-layout"><div>{id && !item && <div className="notice">That item is no longer open for inquiries. You can send a general message below.</div>}{item && <div className="notice">Item: {item.model} · {item.sample ? 'Sample listing · ' : ''}{item.status}</div>}<InquiryForm kind={item ? 'shop' : 'contact'} shopItemId={item?.id} context={item ? `I am interested in the ${item.model}. Please share condition, compatibility and pricing details.` : ''}/></div><aside className="contact-aside"><div><h3>Service area</h3><p>{site.area}<br />Broader travel available for projects.</p></div><div><h3>Email</h3>{site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : <p>Business email pending owner confirmation. Use the inquiry form.</p>}</div><div><h3>Phone</h3>{site.phone ? <a href={`tel:${site.phone}`}>{site.phone}</a> : <p>Business phone pending owner confirmation.</p>}</div><div><h3>Social</h3>{site.socials.length ? site.socials.map(x => <a key={x.url} href={x.url} rel="noopener noreferrer">{x.label}</a>) : <p>Official profiles will be added here.</p>}</div></aside></section></>; }
