import { PageIntro, CTA } from '@/components/ui';
import { ServicesSection, ProcessTimeline } from '@/components/sections';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('AV Services', 'Commissioning, programming, installation support, troubleshooting and live-event technical services in Seattle and Puget Sound.', '/services');
export default function Services() { return <><PageIntro eyebrow="Engineering / Field support / Live production" title="Technical expertise. Where you need it." text="From installed systems to live productions, get focused support for the work that makes AV perform."/><ServicesSection /><ProcessTimeline /><CTA /></>; }
