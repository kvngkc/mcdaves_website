// src/app/try-on/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, Sparkles, ShieldCheck, ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { Product } from '@/lib/types';
import { VTOModal } from '@/components/try-on/VTOModal';
import { OrderIntentModal } from '@/components/commerce/OrderIntentModal';
import { ResolvedProduct, ResolvedProductVariant } from '@/lib/commerce/types';
import { useVTOPreload } from '@/vto-lab/hooks/useVTOPreload';

function resolveClientProduct(p: Product | null): { product: ResolvedProduct | null; variant: ResolvedProductVariant | null } {
  if (!p) return { product: null, variant: null };

  const defaultVariant: ResolvedProductVariant = {
    id: `var-${p.id}`,
    productId: p.id,
    slug: p.colors[0]?.imageSuffix || 'default',
    name: p.colors[0]?.name || 'Standard',
    sku: `${p.id}-STD`,
    colorName: p.colors[0]?.name || 'Standard',
    colorHex: p.colors[0]?.hex || '#000000',
    inStock: p.inStock,
    stockLevel: p.stockLevel,
    unitsInStock: 10,
    hideWhenOutOfStock: false,
    sortOrder: 0,
    status: 'ACTIVE',
    effectivePrice: p.price,
    effectiveOriginalPrice: p.originalPrice,
    effectiveMaterial: p.material,
    effectiveWeight: p.weight || '22g',
    effectiveSpecifications: {
      frameWidthMm: 140,
      lensWidthMm: 52,
      bridgeWidthMm: 18,
      templeLengthMm: 140,
      frameSize: p.frameSize || '52□18-140',
    },
    effectiveDescription: p.description,
    media: (p.images || []).map((url, idx) => ({
      id: `m-${p.id}-${idx}`,
      productId: p.id,
      url,
      altText: p.name,
      type: (idx === 0 ? 'front' : idx === 1 ? 'side' : 'lifestyle') as 'front' | 'side' | 'lifestyle',
      isPrimary: idx === 0,
      sortOrder: idx,
    })),
    hasPriceOverride: false,
    hasSpecOverride: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const resolved: ResolvedProduct = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    collection: 'sightly',
    category: p.category,
    description: p.description,
    features: p.features || [],
    faceShape: p.faceShape || ['round', 'oval'],
    defaultPrice: p.price,
    defaultOriginalPrice: p.originalPrice,
    defaultMaterial: p.material,
    defaultWeight: p.weight || '22g',
    defaultSpecifications: {
      frameWidthMm: 140,
      lensWidthMm: 52,
      bridgeWidthMm: 18,
      templeLengthMm: 140,
      frameSize: p.frameSize || '52□18-140',
    },
    prescriptionRequired: p.prescriptionRequired,
    tryOnAvailable: p.tryOnAvailable,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variants: [defaultVariant],
    defaultVariant,
    media: defaultVariant.media,
  };

  return { product: resolved, variant: defaultVariant };
}

export default function StandaloneTryOnPage() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [intentModalOpen, setIntentModalOpen] = useState(false);

  useEffect(() => {
    async function loadLive() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const mapped: Product[] = (data.products || []).map((p: any) => {
            const activeVariants = p.variants || [];
            const colors = activeVariants.map((v: any) => ({
              name: v.colorName,
              hex: v.colorHex,
              imageSuffix: v.slug,
            }));
            const primaryGlb = activeVariants.find((v: any) => v.glbPath)?.glbPath;
            const totalUnits = activeVariants.reduce(
              (sum: number, v: any) => sum + (v.unitsInStock ?? (v.inStock ? 10 : 0)),
              0,
            );

            return {
              id: p.id,
              slug: p.slug,
              name: p.name,
              collection: 'sightly' as const,
              category: p.category || 'unisex',
              price: Number(p.defaultPrice) || 35000,
              originalPrice: p.defaultOriginalPrice ? Number(p.defaultOriginalPrice) : undefined,
              colors: colors.length > 0 ? colors : [{ name: 'Standard', hex: '#000000', imageSuffix: 'default' }],
              sizes: p.defaultSpecifications?.frameSize || '52□18-140',
              material: p.defaultMaterial || 'Acetate',
              description: p.description || '',
              features: Array.isArray(p.features) ? p.features : [],
              images: [
                `/images/products/sightly/${p.slug}/front.webp`,
                `/images/products/sightly/${p.slug}/side.webp`,
                `/images/products/sightly/${p.slug}/lifestyle.webp`,
              ],
              inStock: totalUnits > 0,
              stockLevel: totalUnits === 0 ? 'out' : totalUnits <= 3 ? 'low' : 'high',
              prescriptionRequired: p.prescriptionRequired ?? true,
              tryOnAvailable: p.tryOnAvailable ?? true,
              glbModel: primaryGlb,
              frameSize: p.defaultSpecifications?.frameSize || '52□18-140',
              weight: p.defaultWeight || '22g',
              faceShape: Array.isArray(p.faceShape) ? p.faceShape : ['round', 'oval'],
            };
          });
          setLiveProducts(mapped);
        } else {
          setLiveProducts([]);
        }
      } catch {
        setLiveProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadLive();
  }, []);

  const handleOpenTryOn = (product: Product) => {
    setSelectedProduct(product);
    setIsTryOnOpen(true);
  };

  const handleOpenIntent = (product: Product) => {
    setSelectedProduct(product);
    setIntentModalOpen(true);
  };
