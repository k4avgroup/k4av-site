import { PageIntro } from '@/components/ui';
import { InquiryForm } from '@/components/inquiry-form';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('Request a Quote', 'Tell K4 AV Group about your commercial AV, commissioning, programming, event or equipment rental project.', '/quote');
export default async function Quote({ searchParams }: {
    searchParams: Promise<{
        service?: string;
        context?: string;
    }>;
}) { const params = await searchParams; return <><PageIntro eyebrow="Let’s define the scope" title="Start with a conversation." text="Tell us what you’re working on, what you need and when you need it. We’ll use those details to discuss the right technical approach."/><section className="container page-content contact-layout"><InquiryForm kind="quote" defaultService={params.service} context={params.context?.slice(0, 1000)}/><aside className="contact-aside"><div><span className="eyebrow">A useful starting point</span><h3>Give us the technical picture.</h3><p>System type, current issues, venue details and desired outcomes help us understand the scope.</p></div><div><h3>Seattle & beyond</h3><p>Seattle, Bellevue and the Greater Puget Sound. Travel available for project work.</p></div><div><h3>What happens next</h3><p>Your request is reviewed so we can clarify scope, availability and pricing. Submission is not a booking or a binding quote.</p></div></aside></section></>; }
