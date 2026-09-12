// src/app/shop/ShopFilterClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Product } from '@/lib/types';
import { ProductGrid } from '@/components/sections/ProductGrid';

export interface ShopFilterClientProps {
  products: Product[];
}

export function ShopFilterClient({ products }: ShopFilterClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  const categories = [
    { id: 'all', label: 'All Frames' },
    { id: 'men', label: 'Men' },
    { id: 'women', label: 'Women' },
    { id: 'unisex', label: 'Unisex' },
    { id: 'sunglasses', label: 'Sunglasses' },
  ];

  return (
    <div className="flex flex-col">
      {/* Filter Tabs */}
      <div className="container-main mb-8">
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar justify-start lg:justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-neutral-900 text-white shadow-md'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout Product Grid */}
      <ProductGrid
        products={filteredProducts}
        layout="grid"
        columns={4}
        title=""
        subtitle={`Explore ${filteredProducts.length} premium frame${filteredProducts.length === 1 ? '' : 's'}.`}
      />
    </div>
  );
}
