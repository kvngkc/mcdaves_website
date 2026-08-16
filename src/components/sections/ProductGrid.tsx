// src/components/sections/ProductGrid.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { siteConfig } from '@/data/site-config';
import { ProductCard } from '@/components/cards/ProductCard';
import { TryOnModal } from '@/components/sections/TryOnModal';
import { useCart } from '@/hooks/useCart';

export interface ProductGridProps {
  products: Product[];
  columns?: number;
  showTryOn?: boolean;
  title?: string;
  subtitle?: string;
}

export function ProductGrid({
  products,
  columns = 4,
  showTryOn = true,
  title = 'Sightly Eyewear Collection',
  subtitle = siteConfig.sightly.description,
}: ProductGridProps) {
  const { addItem, openDrawer } = useCart();
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);

  // Grid column class mapping based on columns prop.
  // Default (4-col): single column on mobile (≥320px), 2-col from sm (640px+),
  // 4-col on lg (1024px+). Single-col on mobile gives larger product images,
  // readable titles without aggressive truncation, and generous touch targets.
  const gridColClass =
    columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="py-12 lg:py-16 bg-neutral-50">
      <div className="container-main">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-h2 text-neutral-900 mb-3">{title}</h2>
          {subtitle && <p className="text-body text-neutral-600">{subtitle}</p>}
        </div>

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className={`grid ${gridColClass} gap-4 sm:gap-6`}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showTryOn={showTryOn}
                onAddToCart={(prod) => {
                  addItem(prod, 1);
                  openDrawer();
                }}
                onTryOn={(prod) => setTryOnProduct(prod)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
            <p className="text-body text-neutral-500 font-medium">No products found.</p>
          </div>
        )}

        {/* Bottom Link */}
        <div className="text-center mt-12 lg:mt-16">
          <Link
            href="/shop/collections/sightly/"
            className="inline-flex items-center gap-2 text-body-sm font-semibold text-brand-700 hover:text-brand-800 group transition-colors"
          >
            <span>Shop Full Collection</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Try On Modal */}
      <TryOnModal
        open={Boolean(tryOnProduct)}
        onClose={() => setTryOnProduct(null)}
        product={tryOnProduct}
      />
    </section>
  );
}

export default ProductGrid;
