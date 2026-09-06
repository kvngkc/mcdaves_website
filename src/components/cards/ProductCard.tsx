// src/components/cards/ProductCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const rawImages = product.images || [];
  const validImages = rawImages.filter(url => typeof url === 'string' && url.trim() !== '');
  const images = validImages.length > 0 ? validImages : ['/images/brand/og-image.jpg'];

  const currentImage = images[selectedImageIndex] || images[0];

  useEffect(() => {
    setSelectedImageIndex(0);
    setSwipeProgress(0);
  }, [product.id]);

  useEffect(() => {
    if (images.length <= 1) {
      setSwipeProgress(0);
      return;
    }

    const DURATION = 4000;
    const UPDATE_INTERVAL = 50;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += UPDATE_INTERVAL;
      setSwipeProgress(Math.min((elapsed / DURATION) * 100, 100));

      if (elapsed >= DURATION) {
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
        elapsed = 0;
        setSwipeProgress(0);
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [images.length, selectedImageIndex]);

  const isOutOfStock = !product.inStock || product.stockLevel === 'out';
  const isLowStock = product.stockLevel === 'low';

  return (
    <div
      className={`bg-white border border-neutral-200 hover:border-brand-300 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-card hover:shadow-card-hover group ${
        isOutOfStock ? 'opacity-75' : ''
      } ${className}`}
    >
      <div>
        {/* Product Image & Badges */}
        <Link
          href={`/shop/${product.slug}`}
          className="block relative aspect-[4/3] bg-neutral-50 rounded-xl overflow-hidden mb-4 group/img"
        >
          <Image
            src={currentImage}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover/img:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 h-1 bg-neutral-200 w-full z-10 overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-75 ease-linear"
                style={{ width: `${swipeProgress}%` }}
              />
            </div>
          )}

          {product.frameSize && (
            <div className="absolute top-2.5 right-2.5">
              <Badge variant="gold" size="sm">
                {product.frameSize}
              </Badge>
            </div>
          )}

          {isLowStock && !isOutOfStock && (
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-sm">
              🔥 Low Stock
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-neutral-800 text-white text-[10px] font-bold shadow-sm">
              Sold Out
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
        {showTryOn && product.tryOnAvailable && !isOutOfStock && (
          <Button
            variant="secondary"
            size="sm"
            className={`w-full justify-center ${!product.glbModel ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!product.glbModel}
            leadingIcon={<Camera className={`w-4 h-4 ${!product.glbModel ? 'text-neutral-400' : 'text-brand-600'}`} />}
            onClick={() => onTryOn?.(product)}
          >
            {!product.glbModel ? 'Try On (No 3D)' : 'Virtual Try-On'}
          </Button>
        )}

        <Button
          variant="primary"
          size="sm"
          disabled={isOutOfStock}
          className={`w-full justify-center ${isOutOfStock ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : ''}`}
          leadingIcon={<ShoppingBag className="w-4 h-4" />}
          onClick={() => !isOutOfStock && onAddToCart?.(product)}
        >
          {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}

export default ProductCard;
