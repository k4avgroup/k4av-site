import { PageIntro } from '@/components/ui';
import { RentalCatalog } from '@/components/rental-catalog';
import { contentRepository } from '@/services/content';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('Equipment Rental', 'Build a rental request for audio, microphones, mixers, speakers, projectors, lenses, video, lighting and AV accessories.', '/rental');
export default function Rental() { return <><PageIntro eyebrow="Equipment / Technical support" title="Gear for the job. Support for the details." text="Build your equipment list. Tell us your dates. We’ll confirm the package, availability and pricing with you."/><section className="container page-content"><RentalCatalog equipment={contentRepository.equipment()}/></section></>; }
