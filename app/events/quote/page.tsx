import { QuotePage } from '@/components/pages';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Plan an Event',
  'Tell K4 AV Group about your event: date, venue, attendance and technical needs, in Seattle and the Greater Seattle area.',
  '/events/quote',
);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; context?: string }>;
}) {
  const params = await searchParams;
  return <QuotePage division="events" service={params.service} context={params.context} />;
}
