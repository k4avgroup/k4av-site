import { ContactPage } from '@/components/contact-page';
import { pageMetadata } from '@/lib/metadata';

// Same page as the AV Integration version (shown in the Live Events theme); canonical points there.
export const metadata = pageMetadata(
  'Contact',
  'Contact K4 AV Group in Seattle: questions, partnerships and offers. Planning a project or event? Use the AV consultation or event request.',
  '/integration/contact',
);

export default function Page() {
  return <ContactPage />;
}
