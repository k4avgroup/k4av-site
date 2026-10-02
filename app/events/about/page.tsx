import { AboutPage } from '@/components/pages';
import { pageMetadata } from '@/lib/metadata';

// Same content as the AV Integration version; the canonical points there to avoid duplicates.
export const metadata = pageMetadata(
  'About',
  'K4 AV Group is a founder-led AV engineering and production company in the Seattle area: commercial AV commissioning, live event production and equipment rentals.',
  '/integration/about',
);

export default function Page() {
  return <AboutPage division="events" />;
}
