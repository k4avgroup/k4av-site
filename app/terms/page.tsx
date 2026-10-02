import { PageIntro } from '@/components/ui';
import { pageMetadata } from '@/lib/metadata';
export const metadata = {
  ...pageMetadata(
    'Terms',
    'Information about K4 AV Group website inquiries, sample equipment and rental requests.',
    '/terms',
  ),
  robots: { index: false, follow: true },
};
export default function Terms() {
  return (
    <>
      <PageIntro eyebrow="Website information" title="Terms" text="Draft for owner review before public launch." />
      <article className="container legal page-content">
        <div className="notice">
          The business must approve final service, rental and purchase terms before accepting bookings or sales.
        </div>
        <h2>Inquiries and quotes</h2>
        <p>
          Submitting a form requests a conversation. It does not create a service agreement, confirm a booking or
          guarantee availability. Scope, pricing and dates must be confirmed separately.
        </p>
        <h2>Equipment and sample content</h2>
        <p>
          Items marked as sample or demo demonstrate the website’s functionality. They do not represent verified stock,
          prices or completed client work. Actual equipment specifications, condition, accessories and compatibility are
          confirmed for each request.
        </p>
        <h2>Rental and sales</h2>
        <p>
          No payment is collected through this Phase 1 website. Rental periods, pickup or delivery, deposits,
          cancellation terms, returns and purchase conditions require a separate agreement.
        </p>
        <h2>Questions</h2>
        <p>Use the contact form for questions about a request or the information on this website.</p>
      </article>
    </>
  );
}
