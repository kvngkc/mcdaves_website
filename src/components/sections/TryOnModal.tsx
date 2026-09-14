// src/components/sections/TryOnModal.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { VTOModalProps } from '@/components/try-on/VTOModal';
import type { ResolvedProduct } from '@/lib/commerce/types';

const DynamicVTOModal = dynamic(
  () => import('@/components/try-on/VTOModal').then((mod) => mod.VTOModal),
  { ssr: false },
);

export interface TryOnModalProps {
  open: boolean;
  onClose: () => void;
  product: ResolvedProduct | null;
  onOrderIntent?: () => void;
}

export function TryOnModal({ open, onClose, product, onOrderIntent }: TryOnModalProps) {
  if (!open || !product) return null;

  const variant = product.defaultVariant;

  return (
    <DynamicVTOModal
      open={open}
      onClose={onClose}
      productId={product.id}
      productSlug={product.slug}
      productName={product.name}
      variantName={variant?.colorName || 'Standard'}
      variantSlug={variant?.slug || 'default'}
      price={variant?.effectivePrice ?? product.defaultPrice}
      glbPath={variant?.glbPath}
      frameSize={variant?.effectiveSpecifications?.frameSize || product.defaultSpecifications.frameSize}
      onOrderIntent={onOrderIntent}
    />
  );
}

export default TryOnModal;
