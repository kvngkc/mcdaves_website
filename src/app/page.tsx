// src/app/page.tsx
import { getLiveStorefrontProducts } from '@/lib/commerce/storefront-catalog';
import {
  HeroSection,
  HowItWorks,
  ProductGrid,
  ServicePreview,
  B2BTeaser,
  TrustSignals,
} from '@/components/sections';

export const dynamic = 'force-dynamic';

/**
 * Home Page — McDaves
 */
export default async function HomePage() {
  const liveProducts = await getLiveStorefrontProducts();

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. How It Works */}
      <HowItWorks />

      {/* 3. Product Grid (Dynamic Live Supabase Catalog) */}
      <ProductGrid products={liveProducts} columns={4} showTryOn={true} />

      {/* 4. Services Preview */}
      <ServicePreview />

      {/* 5. B2B Wholesale Teaser */}
      <B2BTeaser />

      {/* 6. Trust Signals */}
      <TrustSignals />
    </div>
  );
}
