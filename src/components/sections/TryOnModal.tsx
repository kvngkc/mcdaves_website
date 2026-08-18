// src/components/sections/TryOnModal.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { VTOModalProps } from '@/components/try-on/VTOModal';
import { Product } from '@/data/products';

const DynamicVTOModal = dynamic(
  () => import('@/components/try-on/VTOModal').then((mod) => mod.VTOModal),
  { ssr: false },
);

export interface TryOnModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onOrderIntent?: () => void;
}

export function TryOnModal({
  open,
  onClose,
  product,
  onOrderIntent,
}: TryOnModalProps) {
  if (!open || !product) return null;

  return (
    <DynamicVTOModal
      open={open}
      onClose={onClose}
      productId={product.id}
      productSlug={product.slug}
      productName={product.name}
      variantName={product.colors?.[0]?.name || 'Standard'}
      variantSlug={product.colors?.[0]?.imageSuffix || 'default'}
      price={product.price}
      glbPath={product.glbModel || '/models/glasses.glb'}
      frameSize={product.frameSize || product.sizes || '52□18-140'}
      onOrderIntent={onOrderIntent}
    />
  );
}

export default TryOnModal;
