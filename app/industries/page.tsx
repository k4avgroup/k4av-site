import { PageIntro, CTA } from '@/components/ui';
import { IndustriesSection } from '@/components/sections';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('Industries', 'AV technical support for corporate, enterprise, education, worship, live events, meeting spaces and government environments.', '/industries');
export default function Industries() { return <><PageIntro eyebrow="Industries we support" title="Built around your environment." text="The room, the audience and the application shape the technical brief. We help connect those requirements to practical AV systems and support."/><IndustriesSection all/><CTA /></>; }
