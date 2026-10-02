import { PageIntro, CTA } from '@/components/ui';
import { ShopItemCard } from '@/components/shop-item-card';
import { contentRepository } from '@/services/content';
import { pageMetadata } from '@/lib/metadata';
export const metadata = {
  ...pageMetadata(
    'Used AV Equipment Shop',
    'Inquire about used and open-box AV equipment. Condition, compatibility and pricing are confirmed before purchase.',
    '/shop',
  ),
  robots: { index: false, follow: false }, // hidden for now, see 'features' in data/site.ts
};
export default function Shop() {
  return (
    <>
      <PageIntro
        eyebrow="Used / Open box / AV equipment"
        title="Good equipment. Its next chapter."
        text="Explore gear for sale and ask about the details. No online payment is required; we confirm condition, compatibility and the sale directly."
      />
      <section className="container page-content">
        <div className="notice">
          Sample listings only. Inventory, prices, manufacturer details and condition reports require owner approval
          before real sales begin.
        </div>
        <div className="shop-grid">
          {contentRepository.shop().map((item) => (
            <ShopItemCard item={item} key={item.id} />
          ))}
        </div>
      </section>
      <CTA />
    </>
  );
}
