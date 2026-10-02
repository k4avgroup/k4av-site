import { SecondaryNav } from '@/components/secondary-nav';

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="division" data-division="events">
      <SecondaryNav division="events" />
      {children}
    </div>
  );
}
