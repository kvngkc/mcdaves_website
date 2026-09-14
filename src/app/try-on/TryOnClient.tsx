// src/app/try-on/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Camera, Sparkles, ShieldCheck, MessageCircle } from 'lucide-react';
import { Product } from '@/lib/types';
import { VTOModal } from '@/components/try-on/VTOModal';
import { OrderIntentModal } from '@/components/commerce/OrderIntentModal';
import { ResolvedProduct, ResolvedProductVariant } from '@/lib/commerce/types';

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
            const colors = activeVariants.map((v: any) => ({ name: v.colorName, hex: v.colorHex, imageSuffix: v.slug }));
            const primaryGlb = activeVariants.find((v: any) => v.glbPath)?.glbPath;
            const totalUnits = activeVariants.reduce((sum: number, v: any) => sum + (v.unitsInStock ?? (v.inStock ? 10 : 0)), 0);

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

  const { product: resolvedProduct, variant: activeVariant } = useMemo(() => resolveClientProduct(selectedProduct), [selectedProduct]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-50/50 pb-16">
      <section className="pt-12 pb-16 bg-gradient-to-b from-brand-100/60 to-brand-50/50 border-b border-brand-200/60">
        <div className="container-main text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600 text-white text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" /><span>Sightly 3D AR Fitting Room</span>
          </div>
          <h1 className="text-h1 sm:text-hero font-bold text-neutral-900 tracking-tight mb-4 text-balance">Virtual Glasses Fitting Room</h1>
          <p className="text-body text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-8">Experience our premium Sightly eyewear collection live on your face using high-precision 3D AR tracking. Instant, private, and fully on your device.</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-600 font-medium">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-600" /><span>Fully Private (No video recorded or uploaded)</span></div>
            <div className="flex items-center gap-2"><Camera className="w-4 h-4 text-brand-600" /><span>Real-time Metric 6-DOF 3D Tracking</span></div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-main">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-h2 text-neutral-900 font-bold mb-3">Choose a Frame to Try On</h2>
            <p className="text-body-sm text-neutral-600">Select any frame from our Sightly Collection below to launch the live camera AR fitting room.</p>
          </div>

          {isLoading ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 no-scrollbar">
              {[1, 2, 3].map((i) => <div key={i} className="snap-center shrink-0 w-[85vw] sm:w-[350px]"><div className="bg-white border border-neutral-200 rounded-2xl p-6 min-h-[480px] animate-pulse"><div className="aspect-[4/3] bg-neutral-100 rounded-xl mb-6" /><div className="h-3 bg-neutral-200 rounded w-1/3 mb-4" /><div className="h-6 bg-neutral-200 rounded w-3/4 mb-4" /><div className="h-4 bg-neutral-100 rounded w-full mb-2" /><div className="h-4 bg-neutral-100 rounded w-5/6" /></div></div>)}
            </div>
          ) : liveProducts.length === 0 ? (
            <div className="text-center py-16 text-neutral-500">The live catalog is currently unavailable.</div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 no-scrollbar">
              {liveProducts.map((product) => (
                <div key={product.id} className="snap-center shrink-0 w-[85vw] sm:w-[350px]">
                  <div className="bg-white border border-neutral-200 hover:border-brand-300 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-card hover:shadow-card-hover group h-full">
                    <div>
                      <div className="relative aspect-[4/3] bg-neutral-100 rounded-xl overflow-hidden mb-6 flex items-center justify-center">
                        <Image src={product.images[0]} alt={product.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-800 text-white text-[10px] font-bold">{product.frameSize}</div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-2"><span className="text-caption font-semibold text-brand-700 uppercase tracking-wider">{product.material}</span><span className="text-body-sm font-bold text-neutral-900">₦{product.price.toLocaleString()}</span></div>
                      <h3 className="text-h4 text-neutral-900 font-semibold mb-2 group-hover:text-brand-700 transition-colors">{product.name}</h3>
                      <p className="text-body-sm text-neutral-600 line-clamp-2 mb-4 leading-relaxed">{product.description}</p>
                    </div>
                    <div className="pt-4 border-t border-neutral-100 space-y-2 mt-auto">
                      <button onClick={() => handleOpenTryOn(product)} className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-body-sm font-semibold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"><Camera className="w-4 h-4" /><span>Try On {product.name}</span></button>
                      <button onClick={() => handleOpenIntent(product)} className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition flex items-center justify-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-emerald-600" /><span>Buy / Inquire on WhatsApp</span></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {isTryOnOpen && selectedProduct && (
        <VTOModal
          open={isTryOnOpen}
          onClose={() => setIsTryOnOpen(false)}
          productId={selectedProduct.id}
          productSlug={selectedProduct.slug}
          productName={selectedProduct.name}
          variantName={selectedProduct.colors[0]?.name || 'Standard'}
          variantSlug={selectedProduct.colors[0]?.imageSuffix || 'default'}
          price={selectedProduct.price}
          glbPath={selectedProduct.glbModel}
          frameSize={selectedProduct.frameSize || '52□18-140'}
          onOrderIntent={() => { setIsTryOnOpen(false); setIntentModalOpen(true); }}
        />
      )}

      {intentModalOpen && resolvedProduct && activeVariant && (
        <OrderIntentModal open={intentModalOpen} onClose={() => setIntentModalOpen(false)} product={resolvedProduct} variant={activeVariant} quantity={1} />
      )}
    </div>
  );
}
