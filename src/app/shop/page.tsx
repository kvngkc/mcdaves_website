// src/app/shop/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { products } from '@/data/products';
import { ProductGrid } from '@/components/sections/ProductGrid';

export const metadata: Metadata = {
  title: 'Shop Sightly Eyewear | McDaves Optical',
  description: 'Explore the Sightly collection of handcrafted acetate and stainless steel frames by McDaves. Prescription-ready, virtual try-on available.',
};

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pt-8 pb-16">
      <ProductGrid
        products={products}
        title="Shop Sightly Eyewear"
        subtitle="Handcrafted frames for discerning individuals. All frames are prescription-ready with virtual try-on available."
      />
    </main>
  );
}
