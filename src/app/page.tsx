// src/app/page.tsx
import { products } from '@/data/products';
import {
  HeroSection,
  HowItWorks,
  ProductGrid,
  ServicePreview,
  B2BTeaser,
  TrustSignals,
} from '@/components/sections';

/**
 * Home Page — McDaves
 */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. How It Works */}
      <HowItWorks />

      {/* 3. Product Grid */}
      <ProductGrid products={products} columns={4} showTryOn={true} />

      {/* 4. Services Preview */}
      <ServicePreview />

      {/* 5. B2B Wholesale Teaser */}
      <B2BTeaser />

      {/* 6. Trust Signals */}
      <TrustSignals />
    </div>
  );
}
