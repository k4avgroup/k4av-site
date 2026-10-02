import Link from 'next/link';
import { ArrowUpRight, Package } from 'lucide-react';
import { PageIntro, Button } from '@/components/ui';
import { RentalCatalog } from '@/components/rental-catalog';
import { contentRepository } from '@/services/content';
import { rentalCategories } from '@/data/site';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'AV Equipment Rental in Seattle',
  'Rent AV equipment in Seattle: projectors, displays, video and audio equipment and accessories for events and projects.',
  '/events/rentals',
);

export default function Rental() {
  const equipment = contentRepository.equipment();
  return (
    <>
      <PageIntro
        eyebrow="Equipment rentals"
        title="AV equipment rentals in Seattle."
        text="Tell us what you need and when. We’ll confirm availability and pricing, and can pair equipment with technical support."
      />
      <section className="container page-content">
        {equipment.length > 0 ? (
          <RentalCatalog equipment={equipment} />
        ) : (
          <>
            <div className="notice">
              Our rental inventory is growing. If you don’t see what you need, ask. We can often source equipment for
              your project.
            </div>
            <div className="rental-tiles">
              {rentalCategories.map((c) => (
                <Link
                  href={`/events/quote?service=${encodeURIComponent('Equipment Rental')}&context=${encodeURIComponent(`Rental request: ${c}. Dates and quantity: `)}`}
                  key={c}
                >
                  <Package size={22} strokeWidth={1.4} aria-hidden="true" />
                  {c}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <div className="section">
              <Button href="/events/quote?service=Equipment%20Rental">Request Availability</Button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
