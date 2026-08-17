// src/app/shop/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { getLiveStorefrontProducts } from '@/lib/commerce/storefront-catalog';
import { ProductGrid } from '@/components/sections/ProductGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop Sightly Eyewear & Designer Frames | McDaves Nigeria',
  description:
    'Explore the Sightly collection of handcrafted acetate, titanium, and stainless steel eyewear frames by McDaves. Precision prescription fitting, virtual try-on, nationwide delivery.',
  alternates: {
    canonical: 'https://mcdaves.com.ng/shop',
  },
  openGraph: {
    title: 'Shop Sightly Eyewear & Designer Frames | McDaves Nigeria',
    description:
      'Explore the Sightly collection of handcrafted acetate, titanium, and stainless steel eyewear frames by McDaves. Precision prescription fitting, virtual try-on, nationwide delivery.',
    url: 'https://mcdaves.com.ng/shop',
  },
};

export default async function ShopPage() {
  const liveProducts = await getLiveStorefrontProducts();

  return (
    <main className="min-h-screen bg-neutral-50 pt-8 pb-16">
      <ProductGrid
        products={liveProducts}
        title="Shop Sightly Eyewear"
        subtitle="Handcrafted frames for discerning individuals. All frames are prescription-ready with virtual try-on available."
      />
    </main>
  );
}
