import { QuotePage } from '@/components/pages';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Request an AV Consultation',
  'Request an AV consultation from K4 AV Group for integration, commissioning, programming or troubleshooting in Seattle and the Greater Seattle area.',
  '/integration/quote',
);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; context?: string }>;
}) {
  const params = await searchParams;
  return <QuotePage division="integration" service={params.service} context={params.context} />;
}
