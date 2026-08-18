// src/components/commerce/VariantSelector.tsx
/**
 * Variant Selector for McDaves Eyewear
 * Industry-standard color & SKU switcher with live stock badges and price/spec updates.
 */

'use client';

import React from 'react';
import {
  ResolvedProduct,
  ResolvedProductVariant,
} from '@/lib/commerce/types';
import { Badge } from '@/components/ui';

export interface VariantSelectorProps {
  product: ResolvedProduct;
  selectedVariant: ResolvedProductVariant;
  onSelectVariant: (variant: ResolvedProductVariant) => void;
}

export function VariantSelector({
  product,
  selectedVariant,
  onSelectVariant,
}: VariantSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
          Color Variant:{' '}
          <span className="text-neutral-900 font-extrabold capitalize">
            {selectedVariant.colorName}
          </span>
        </span>

        <span className="text-[11px] font-mono text-neutral-400">
          SKU: {selectedVariant.sku}
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {product.variants.map((variant) => {
          const isSelected = variant.id === selectedVariant.id;
          const isLowStock = variant.stockLevel === 'low';
          const isOutOfStock = !variant.inStock || variant.stockLevel === 'out';

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelectVariant(variant)}
              disabled={isOutOfStock}
              title={`${variant.name} (${variant.colorName})`}
              aria-label={`Select ${variant.colorName} variant`}
              aria-pressed={isSelected}
              className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm ring-2 ring-neutral-900/10 scale-102'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50'
              } ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-neutral-100/80 border-dashed' : ''}`}
            >
              {/* Color Swatch Circle */}
              <span
                className={`w-4 h-4 rounded-full border border-black/20 flex-shrink-0 shadow-inner relative overflow-hidden`}
                style={{ backgroundColor: variant.colorHex }}
              >
                {isOutOfStock && (
                  <span className="absolute inset-0 bg-red-500/40 transform rotate-45 border-t border-red-500" />
                )}
              </span>

              {/* Variant Name */}
              <span className={`text-xs font-semibold ${isOutOfStock ? 'line-through text-neutral-500' : ''}`}>
                {variant.colorName}
              </span>

              {isOutOfStock && (
                <span className="text-[9px] font-bold text-neutral-400 uppercase">
                  (Sold Out)
                </span>
              )}

              {/* Low stock dot */}
              {isLowStock && !isSelected && !isOutOfStock && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VariantSelector;
