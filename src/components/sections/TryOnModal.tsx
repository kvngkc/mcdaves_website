// src/components/sections/TryOnModal.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { ResolvedProduct } from '@/lib/commerce/types';
import type { Product as StorefrontProduct } from '@/lib/types';

const DynamicVTOModal = dynamic(
  () => import('@/components/try-on/VTOModal').then((mod) => mod.VTOModal),
  { ssr: false },
);

export interface TryOnModalProps {
  open: boolean;
  onClose: () => void;
  product: ResolvedProduct | StorefrontProduct | null;
  onOrderIntent?: () => void;
}

export function TryOnModal({ open, onClose, product, onOrderIntent }: TryOnModalProps) {
  if (!open || !product) return null;

  const isResolvedProduct = 'defaultPrice' in product;
  const variant = isResolvedProduct ? product.defaultVariant : undefined;
  const price = isResolvedProduct ? variant?.effectivePrice ?? product.defaultPrice : product.price;
  const glbPath = isResolvedProduct ? variant?.glbPath : product.glbModel;
  const frameSize = isResolvedProduct ? variant?.effectiveSpecifications?.frameSize || product.defaultSpecifications.frameSize : product.frameSize || product.sizes;
  const variantName = isResolvedProduct ? variant?.colorName || 'Standard' : product.colors?.[0]?.name || 'Standard';
  const variantSlug = isResolvedProduct ? variant?.slug || 'default' : product.colors?.[0]?.imageSuffix || 'default';

  return (
    <DynamicVTOModal
      open={open}
      onClose={onClose}
      productId={product.id}
      productSlug={product.slug}
      productName={product.name}
      variantName={variantName}
      variantSlug={variantSlug}
      price={price}
      glbPath={glbPath}
      frameSize={frameSize || '52□18-140'}
      onOrderIntent={onOrderIntent}
    />
  );
}

export default TryOnModal;
