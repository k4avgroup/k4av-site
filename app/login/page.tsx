import { LockKeyhole } from 'lucide-react';
import { PageIntro, Button } from '@/components/ui';
import { pageMetadata } from '@/lib/metadata';
export const metadata = {
  ...pageMetadata(
    'Client Portal',
    'The K4 AV Group client portal is coming soon. Contact us for project, quote and rental support.',
    '/login',
  ),
  robots: { index: false, follow: true },
};
export default function Login() {
  return (
    <>
      <PageIntro
        eyebrow="Client access"
        title="Your projects. One connected place."
        text="The K4 AV Group client portal is coming soon."
      />
      <section className="container">
        <div className="portal-panel">
          <LockKeyhole size={36} />
          <h2>A clearer view of your work.</h2>
          <p>
            We’re preparing a secure space for project updates and documents. In the meantime, contact us directly for
            help with your project or rental request.
          </p>
          <div className="portal-list">
            {['Project status', 'Quotes & approvals', 'Rental requests', 'Invoices & documents'].map((x) => (
              <span key={x}>{x} · Planned</span>
            ))}
          </div>
          <Button href="/contact">Contact us</Button>
        </div>
      </section>
    </>
  );
}
