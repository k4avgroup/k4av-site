import { SecondaryNav } from '@/components/secondary-nav';

export default function IntegrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="division" data-division="integration">
      <SecondaryNav division="integration" />
      {children}
    </div>
  );
}
