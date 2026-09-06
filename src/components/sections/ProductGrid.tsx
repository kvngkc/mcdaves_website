// src/components/sections/ProductGrid.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { siteConfig } from '@/data/site-config';
import { ProductCard } from '@/components/cards/ProductCard';
import { TryOnModal } from '@/components/sections/TryOnModal';
import { useCart } from '@/hooks/useCart';
import { useVTOPreload } from '@/vto-lab/hooks/useVTOPreload';

export interface ProductGridProps {
  products: Product[];
  columns?: number;
  showTryOn?: boolean;
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'slider';
}

export function ProductGrid({
  products,
  columns = 4,
  showTryOn = true,
  title = 'Sightly Eyewear Collection',
  subtitle = siteConfig.sightly.description,
  layout = 'slider',
}: ProductGridProps) {
  const { addItem, openDrawer } = useCart();
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Preload VTO assets in the background during user browse time
  useVTOPreload(products.map((p) => p.glbModel).filter(Boolean) as string[]);

  // Limit products if slider
  const displayProducts = layout === 'slider' ? products.slice(0, 12) : products;

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [displayProducts]);

  const scrollBy = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth > 640 ? clientWidth / 2 : clientWidth;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const gridColClass =
    columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="py-12 lg:py-16 bg-neutral-50 relative">
      <div className="container-main">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-h2 text-neutral-900 mb-3">{title}</h2>
          {subtitle && <p className="text-body text-neutral-600">{subtitle}</p>}
        </div>

        {/* Products Grid or Slider */}
        {displayProducts && displayProducts.length > 0 ? (
          layout === 'slider' ? (
            <div className="relative group">
              {/* Navigation Arrows */}
              <button
                onClick={() => scrollBy('left')}
                disabled={!canScrollLeft}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-lg border border-neutral-100 text-neutral-900 transition-all hover:bg-neutral-50 hover:scale-105 disabled:opacity-0 disabled:pointer-events-none hidden md:flex items-center justify-center"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-6 no-scrollbar scroll-smooth"
              >
                {displayProducts.map((product) => (
                  <div key={product.id} className="snap-center shrink-0 w-[85vw] sm:w-[350px]">
                    <ProductCard
                      product={product}
                      showTryOn={showTryOn}
                      onAddToCart={(prod) => {
                        addItem(prod, prod.id, prod.id, 1, prod.colors?.[0]?.name);
                        openDrawer();
                      }}
                      onTryOn={(prod) => setTryOnProduct(prod)}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollBy('right')}
                disabled={!canScrollRight}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-lg border border-neutral-100 text-neutral-900 transition-all hover:bg-neutral-50 hover:scale-105 disabled:opacity-0 disabled:pointer-events-none hidden md:flex items-center justify-center"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className={`grid gap-6 ${gridColClass}`}>
              {displayProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showTryOn={showTryOn}
                  onAddToCart={(prod) => {
                    addItem(prod, prod.id, prod.id, 1, prod.colors?.[0]?.name);
                    openDrawer();
                  }}
                  onTryOn={(prod) => setTryOnProduct(prod)}
                />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
            <p className="text-body text-neutral-500 font-medium">No products found.</p>
          </div>
        )}

        {/* Bottom Link (Only show on slider / homepage) */}
        {layout === 'slider' && (
          <div className="mt-10 sm:mt-12 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition shadow-lg shadow-neutral-900/20 active:scale-95 text-sm"
            >
              <span>Shop Full Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
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
