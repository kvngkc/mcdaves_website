// src/app/shop/[slug]/ProductDetailClient.tsx
/**
 * Conversion-Oriented Product Detail Page for McDaves Eyewear
 * Hierarchy: Select Exact Variant -> Try On (Canonical 3D VTO) -> Order via WhatsApp Intent.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Sparkles,
  MessageCircle,
  Minus,
  Plus,
  ChevronDown,
  ShieldCheck,
  Truck,
  RotateCcw,
  Camera,
} from 'lucide-react';
import {
  ResolvedProduct,
  ResolvedProductVariant,
} from '@/lib/commerce/types';
import { Badge, Button, Price } from '@/components/ui';
import { Breadcrumb } from '@/components/layout';
import { ProductGrid } from '@/components/sections';
import { VTOModal } from '@/components/try-on/VTOModal';
import {
  VariantSelector,
  SpecificationsTable,
  OrderIntentModal,
  LensRequestSection,
} from '@/components/commerce';
import { useCart } from '@/hooks/useCart';

export interface ProductDetailClientProps {
  product: ResolvedProduct;
  initialVariantSlug?: string;
  relatedProducts?: any[];
}

export default function ProductDetailClient({
  product,
  initialVariantSlug,
  relatedProducts = [],
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem, openDrawer } = useCart();

  // Find initial variant or fallback to default
  const initialVariant =
    product.variants.find((v) => v.slug === initialVariantSlug) ||
    product.defaultVariant;

  const [selectedVariant, setSelectedVariant] =
    useState<ResolvedProductVariant>(initialVariant);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Modals
  const [isVTOOpen, setIsVTOOpen] = useState(false);
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);

  // When variant changes, update selected variant
  const handleSelectVariant = (variant: ResolvedProductVariant) => {
    setSelectedVariant(variant);
    setSelectedImageIndex(0);
  };

  const isOutOfStock =
    !selectedVariant.inStock || selectedVariant.stockLevel === 'out';

  const images =
    selectedVariant.media && selectedVariant.media.length > 0
      ? selectedVariant.media.map((m) => m.url)
      : product.media && product.media.length > 0
      ? product.media.map((m) => m.url)
      : ['/images/products/placeholder.webp'];

  const currentImage = images[selectedImageIndex] || images[0];

  const stockBadge = isOutOfStock ? (
    <Badge variant="error" size="md">
      Out of Stock
    </Badge>
  ) : selectedVariant.stockLevel === 'low' ? (
    <Badge variant="warning" size="md">
      Low Stock — Ships Today
    </Badge>
  ) : (
    <Badge variant="success" size="md">
      In Stock
    </Badge>
  );

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(
      product,
      selectedVariant.id,
      selectedVariant.sku,
      quantity,
      selectedVariant.colorName,
      selectedVariant.effectivePrice,
      selectedVariant.unitsInStock,
    );
    openDrawer();
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="container-main py-4 sm:py-6">
        <Breadcrumb
          items={[
            { label: 'Shop', href: '/shop' },
            {
              label: product.collection.toUpperCase(),
              href: `/shop`,
            },
            { label: product.name },
            { label: selectedVariant.colorName },
          ]}
        />
      </div>

      {/* Main Two-Column Purchase Stage (Above the Fold) */}
      <section className="container-main pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT: Product Image Gallery */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <div className="relative aspect-[4/3] sm:aspect-[4/3] w-full rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-sm group">
              <Image
                src={currentImage}
                alt={`${product.name} - ${selectedVariant.colorName} view ${selectedImageIndex + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-contain p-4 sm:p-6 transition-all duration-300 group-hover:scale-105"
              />

              {/* Floating Collection Badge */}
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="gold" size="md">
                  Sightly by McDaves
                </Badge>
              </div>

              {/* Stock Status Badge */}
              <div className="absolute top-4 right-4 z-10">{stockBadge}</div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, i) => {
                  const isSelected = i === selectedImageIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImageIndex(i)}
                      aria-label={`View image ${i + 1}`}
                      className={`relative w-16 sm:w-20 h-16 sm:h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all bg-neutral-50 ${
                        isSelected
                          ? 'border-neutral-900 ring-2 ring-neutral-900/10 scale-102'
                          : 'border-neutral-200 hover:border-neutral-400 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} thumbnail ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Conversion Column (Title, Price, Variant, CTAs) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block mb-1">
                {selectedVariant.effectiveMaterial} · {selectedVariant.effectiveSpecifications.frameSize}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                {product.name}
              </h1>

              {/* Price with override indicator */}
              <div className="mt-3 flex items-center gap-3">
                <Price
                  amount={selectedVariant.effectivePrice}
                  originalAmount={selectedVariant.effectiveOriginalPrice}
                  size="lg"
                />
                {selectedVariant.hasPriceOverride && (
                  <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    Variant price
                  </span>
                )}
              </div>
            </div>

            {/* Variant / Color Selector */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
              <VariantSelector
                product={product}
                selectedVariant={selectedVariant}
                onSelectVariant={handleSelectVariant}
              />
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Quantity
              </span>
              <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="px-3.5 py-2 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 font-bold text-sm min-w-[2.5rem] text-center text-neutral-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                  className="px-3.5 py-2 text-neutral-600 hover:bg-neutral-200 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRIMARY CONVERSION CTAs */}
            <div id="product-primary-ctas" className="space-y-3 pt-2">
              {/* 1. VIRTUAL TRY-ON CTA */}
              {product.tryOnAvailable && selectedVariant.glbPath && (
                <button
                  type="button"
                  onClick={() => setIsVTOOpen(true)}
                  disabled={isOutOfStock}
                  className="w-full py-4 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm sm:text-base transition-all shadow-lg flex items-center justify-center gap-3 active:scale-98"
                >
                  <Camera className="w-5 h-5 text-accent-gold animate-pulse" />
                  <span>Try This Frame On (3D AR)</span>
                </button>
              )}

              {/* 2. ORDER VIA WHATSAPP (Order Intent) */}
              <button
                type="button"
                onClick={() => setIsIntentModalOpen(true)}
                disabled={isOutOfStock}
                className="w-full py-4 px-6 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-3 active:scale-98"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Order via WhatsApp</span>
              </button>

              {/* 3. Standard Add to Cart */}
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                leadingIcon={<ShoppingBag className="w-5 h-5 text-neutral-700" />}
              >
                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
              </Button>
            </div>

            {/* Trust Signal Highlights */}
            <div className="bg-neutral-50 rounded-2xl p-4 space-y-2.5 border border-neutral-200/80 text-xs text-neutral-700">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Ships across Nigeria within 2–5 business days</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>100% Genuine {selectedVariant.effectiveMaterial || product.defaultMaterial || 'Handcrafted Eyewear Materials'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>7-Day Return Guarantee for damaged or defective items</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── BELOW THE FOLD ──────────────────────────────────────────────── */}

        {/* 1. Physical Specifications Table */}
        <section className="py-12 border-t border-neutral-200 mt-12">
          <SpecificationsTable
            product={product}
            variant={selectedVariant}
          />
        </section>

        {/* 2. Lens & Prescription Guide */}
        <section className="py-12 border-t border-neutral-200">
          <LensRequestSection />
        </section>

        {/* 3. Frame Description & Features */}
        <section className="py-12 border-t border-neutral-200 space-y-6">
          <div className="max-w-3xl">
            <h3 className="text-lg font-bold text-neutral-900 mb-3">
              About the {product.name}
            </h3>
            <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
              {selectedVariant.effectiveDescription}
            </p>
          </div>

          {product.features && product.features.length > 0 && (
            <div className="pt-4">
              <h4 className="text-sm font-bold text-neutral-900 mb-4">
                Signature Frame Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {product.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs font-medium text-neutral-800"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 4. Delivery, Returns & Guarantee Accordion */}
        <section className="py-8 border-t border-neutral-200">
          <details className="group" open>
            <summary className="flex justify-between items-center cursor-pointer list-none font-bold text-neutral-900 py-2 select-none">
              <span className="text-base sm:text-lg">Delivery, Return & Guarantee Policy</span>
              <ChevronDown className="w-5 h-5 text-neutral-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-4 text-xs sm:text-body-sm text-neutral-600 space-y-3 mt-4 leading-relaxed max-w-2xl">
              <p>
                <strong className="text-neutral-900">Ready-Made Frames:</strong> Return and refund consideration is supported for damaged, defective, or incorrect items supplied upon arrival.
              </p>
              <p>
                <strong className="text-neutral-900">Custom Prescription Surfacing:</strong> Custom-tailored optical lenses are surfaced to your exact optometrist-verified parameters. Our workmanship guarantee covers remake if lenses do not match your approved prescription.
              </p>
              <p>
                <strong className="text-neutral-900">Delivery Timelines:</strong> 2–5 business days in Lagos; 5–10 business days nationwide.
              </p>
            </div>
          </details>
        </section>
      </section>

      {/* Related Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <ProductGrid
          products={relatedProducts}
          columns={3}
          title="Explore More Frames"
          subtitle="Hand-crafted optical styles from the Sightly collection."
        />
      )}

      {/* CANONICAL 3D VTO MODAL */}
      {isVTOOpen && (
        <VTOModal
          open={isVTOOpen}
          onClose={() => setIsVTOOpen(false)}
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
          variantName={selectedVariant.colorName}
          variantSlug={selectedVariant.slug}
          variantId={selectedVariant.id}
          price={selectedVariant.effectivePrice}
          glbPath={selectedVariant.glbPath || '/models/glasses.glb'}
          frameSize={selectedVariant.effectiveSpecifications.frameSize}
          onOrderIntent={() => {
            setIsVTOOpen(false);
            setIsIntentModalOpen(true);
          }}
        />
      )}

      {/* ORDER INTENT & WHATSAPP MODAL */}
      {isIntentModalOpen && (
        <OrderIntentModal
          open={isIntentModalOpen}
          onClose={() => setIsIntentModalOpen(false)}
          product={product}
          variant={selectedVariant}
          quantity={quantity}
        />
      )}
    </div>
  );
}
