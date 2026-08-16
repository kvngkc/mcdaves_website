// src/app/try-on/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, Sparkles, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { products, Product } from '@/data/products';
import { VTOModal } from '@/components/try-on/VTOModal';
import { OrderIntentModal } from '@/components/commerce/OrderIntentModal';
import { commerceRepository } from '@/lib/commerce/repository';

export default function StandaloneTryOnPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [intentModalOpen, setIntentModalOpen] = useState(false);

  const handleOpenTryOn = (product: Product) => {
    setSelectedProduct(product);
    setIsTryOnOpen(true);
  };

  const handleOpenIntent = (product: Product) => {
    setSelectedProduct(product);
    setIntentModalOpen(true);
  };

  // Find resolved variant for selected product if needed
  const resolvedProduct = selectedProduct
    ? commerceRepository.getProductBySlug(selectedProduct.slug)
    : null;
  const activeVariant = resolvedProduct?.defaultVariant;

  return (
    <div className="flex flex-col min-h-screen bg-brand-50/50 pb-16">
      
      {/* ── 1. Hero Banner ─────────────────────────────────────────────────── */}
      <section className="pt-12 pb-16 bg-gradient-to-b from-brand-100/60 to-brand-50/50 border-b border-brand-200/60">
        <div className="container-main text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600 text-white text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Sightly 3D AR Fitting Room</span>
          </div>

          <h1 className="text-h1 sm:text-hero font-bold text-neutral-900 tracking-tight mb-4 text-balance">
            Virtual Glasses Fitting Room
          </h1>

          <p className="text-body text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Experience our hand-crafted Sightly eyewear collection live on your face using high-precision 3D AR tracking. Instant, private, and 100% on your device.
          </p>

          {/* Privacy & Tech Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-600 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>100% Private (No video recorded or uploaded)</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-brand-600" />
              <span>Real-time Metric 6-DOF 3D Tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Select Frame to Try On ─────────────────────────────────────── */}
      <section className="py-16">
        <div className="container-main">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-h2 text-neutral-900 font-bold mb-3">Choose a Frame to Try On</h2>
            <p className="text-body-sm text-neutral-600">Select any frame from our Sightly Collection below to launch the live camera AR fitting room.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-neutral-200 hover:border-brand-300 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-card hover:shadow-card-hover group"
              >
                <div>
                  <div className="relative aspect-[4/3] bg-neutral-100 rounded-xl overflow-hidden mb-6 flex items-center justify-center">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-800 text-white text-[10px] font-bold">
                      {product.frameSize}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-caption font-semibold text-brand-700 uppercase tracking-wider">
                      {product.material}
                    </span>
                    <span className="text-body-sm font-bold text-neutral-900">
                      ₦{product.price.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-h4 text-neutral-900 font-semibold mb-2 group-hover:text-brand-700 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-body-sm text-neutral-600 line-clamp-2 mb-4 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <button
                    onClick={() => handleOpenTryOn(product)}
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-body-sm font-semibold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Try On {product.name}</span>
                  </button>

                  <Link
                    href={`/shop/${product.slug}`}
                    className="w-full py-2 text-xs font-semibold text-neutral-500 hover:text-brand-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>View Product Details & Specs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 3. Canonical Virtual Try-On Modal ───────────────────────────────── */}
      {selectedProduct && (
        <VTOModal
          open={isTryOnOpen}
          onClose={() => setIsTryOnOpen(false)}
          productName={selectedProduct.name}
          variantName={activeVariant?.colorName || selectedProduct.colors?.[0]?.name}
          price={selectedProduct.price}
          glbPath={activeVariant?.glbPath || selectedProduct.glbModel || '/models/glasses.glb'}
          frameSize={activeVariant?.effectiveSpecifications?.frameSize || selectedProduct.frameSize || '52□18-140'}
          onOrderIntent={() => {
            setIsTryOnOpen(false);
            setIntentModalOpen(true);
          }}
        />
      )}

      {/* ── 4. Order Intent Modal ───────────────────────────────────────────── */}
      {selectedProduct && activeVariant && (
        <OrderIntentModal
          open={intentModalOpen}
          onClose={() => setIntentModalOpen(false)}
          product={resolvedProduct!}
          variant={activeVariant}
        />
      )}

    </div>
  );
}
