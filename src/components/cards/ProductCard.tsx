// src/components/cards/ProductCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { Button, Badge, Price } from '@/components/ui';

export interface ProductCardProps {
  product: Product;
  showTryOn?: boolean;
  onAddToCart?: (product: Product) => void;
  onTryOn?: (product: Product) => void;
  className?: string;
}

export function ProductCard({
  product,
  showTryOn = true,
  onAddToCart,
  onTryOn,
  className = '',
}: ProductCardProps) {
  const imageUrl = product.images?.[0] || '/images/brand/og-image.jpg';

  return (
    <div
      className={`bg-white border border-neutral-200 hover:border-brand-300 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-card hover:shadow-card-hover group ${className}`}
    >
      <div>
        {/* Product Image & Badge */}
        <Link href={`/shop/${product.slug}`} className="block relative aspect-[4/3] bg-neutral-50 rounded-xl overflow-hidden mb-4 group/img">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover/img:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {product.frameSize && (
            <div className="absolute top-2.5 right-2.5">
              <Badge variant="gold" size="sm">
                {product.frameSize}
              </Badge>
            </div>
          )}
        </Link>

        {/* Metadata & Price */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider">
            {product.material || product.category}
          </span>
          <Price amount={product.price} size="sm" />
        </div>

        {/* Title */}
        <Link href={`/shop/${product.slug}`} className="block group-hover:text-brand-700 transition-colors">
          <h3 className="text-body-md font-semibold text-neutral-900 line-clamp-1 mb-1">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-caption text-neutral-500 line-clamp-2 mb-4 leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-neutral-100 space-y-2">
        {showTryOn && product.tryOnAvailable && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center"
            leadingIcon={<Camera className="w-4 h-4 text-brand-600" />}
            onClick={() => onTryOn?.(product)}
          >
            Virtual Try-On
          </Button>
        )}

        <Button
          variant="primary"
          size="sm"
          className="w-full justify-center"
          leadingIcon={<ShoppingBag className="w-4 h-4" />}
          onClick={() => onAddToCart?.(product)}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}

export default ProductCard;
