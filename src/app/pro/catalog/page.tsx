// src/app/pro/catalog/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Layers,
  Search,
  ExternalLink,
  Info,
  ShieldCheck,
  PackageCheck,
  X,
  Sparkles,
  Droplets,
  Sparkle,
} from 'lucide-react';
import { b2bProducts, B2BProduct, ORDERING_SYSTEM_URL, TINT_COLORS } from '@/data/b2b-products';
import { formatCustomerFacingProductName } from '@/lib/commerce/display-names';

const FILTER_CHIPS = [
  { label: 'All', query: '' },
  { label: 'Photochromic', query: 'photo' },
  { label: 'Blue Cut', query: 'blue' },
  { label: 'Anti-Reflective', query: 'ar' },
  { label: 'Clear / White', query: 'white' },
  { label: 'Polycarbonate', query: 'poly' },
  { label: 'Single Vision', query: 'single vision' },
  { label: 'Bifocal', query: 'bifocal' },
  { label: 'Progressive', query: 'progressive' },
];

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'finished' | 'blanks' | 'utilities'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<B2BProduct | null>(null);

  // Search filtering logic
  const searchResults = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery) return null;

    const tokens = rawQuery.replace(/[^\w\s/+-.]/g, ' ').split(/\s+/).filter(Boolean);

    const matches = b2bProducts.filter((product) => {
      const corpus = [
        product.productName.toLowerCase(),
        product.productClass.toLowerCase(),
        product.family.toLowerCase(),
        product.treatment.toLowerCase(),
        product.lensType.toLowerCase(),
        product.treatmentLabel.toLowerCase(),
        (product.material || '').toLowerCase(),
        (product.description || '').toLowerCase(),
        ...(product.aliases || []).map((a) => a.toLowerCase()),
      ].join(' ');

      return tokens.every((token) => {
        if (corpus.includes(token)) return true;
        const unslashed = token.replace('/', '');
        if (unslashed && corpus.includes(unslashed)) return true;
        return false;
      });
    });

    const finished = matches.filter((p) => p.productClass === 'Finished Lens');
    const blanks = matches.filter((p) => p.productClass === 'Semi-finished (blanks)');
    const utilities = matches.filter((p) => p.productClass === 'Utilities');

    return {
      total: matches.length,
      finished,
      blanks,
      utilities,
      all: matches,
    };
  }, [searchQuery]);

  // Browse list when not searching
  const browseProducts = useMemo(() => {
    if (activeTab === 'finished') {
      return b2bProducts.filter((p) => p.productClass === 'Finished Lens');
    }
    if (activeTab === 'blanks') {
      return b2bProducts.filter((p) => p.productClass === 'Semi-finished (blanks)');
    }
    if (activeTab === 'utilities') {
      return b2bProducts.filter((p) => p.productClass === 'Utilities');
    }
    return b2bProducts;
  }, [activeTab]);

  const counts = useMemo(() => ({
    all: b2bProducts.length,
    finished: b2bProducts.filter((p) => p.productClass === 'Finished Lens').length,
    blanks: b2bProducts.filter((p) => p.productClass === 'Semi-finished (blanks)').length,
    utilities: b2bProducts.filter((p) => p.productClass === 'Utilities').length,
  }), []);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 pb-20">
      {/* ── 1. Header Banner ── */}
      <section className="relative pt-10 pb-10 border-b border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="container-main">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>McDaves Optical Catalog</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                Lenses & Materials
              </h1>
              <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
                Browse our catalog of finished lenses, semi-finished blanks, and optical care items. When you are ready to specify powers and order, proceed directly to our online ordering system.
              </p>
            </div>

            <div>
              <a
                href={ORDERING_SYSTEM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98]"
              >
                <span>Order Online</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Search Bar & Filter Chips ── */}
      <section className="sticky top-16 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 py-4 shadow-lg">
        <div className="container-main flex flex-col gap-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search lenses (e.g. 'Photo', 'Blue Cut', 'Single Vision', 'Fused White', 'AR')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500 transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Browse Tabs (Active when not searching) */}
            {!searchQuery && (
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
                {[
                  { id: 'all', label: 'All Products', count: counts.all },
                  { id: 'finished', label: 'Finished Lenses', count: counts.finished },
                  { id: 'blanks', label: 'Blanks', count: counts.blanks },
                  { id: 'utilities', label: 'Utilities & Care', count: counts.utilities },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={[
                      'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                      activeTab === tab.id
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-700/60',
                    ].join(' ')}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-neutral-800/60 text-xs">
            <span className="text-[11px] font-semibold text-neutral-400 mr-1">Quick Filters:</span>
            {FILTER_CHIPS.map((chip) => {
              const active = searchQuery.toLowerCase() === chip.query.toLowerCase();
              return (
                <button
                  key={chip.label}
                  onClick={() => setSearchQuery(chip.query)}
                  className={[
                    'text-[11px] px-2.5 py-1 rounded-lg border transition-all',
                    active
                      ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-semibold'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white',
                  ].join(' ')}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. Main Catalog View ── */}
      <main className="py-8">
        <div className="container-main space-y-8">
          {/* SEARCH RESULTS VIEW */}
          {searchResults !== null ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-neutral-800">
                <span>
                  Found <strong className="text-white font-bold">{searchResults.total}</strong> products matching "{searchQuery}"
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-brand-400 hover:text-brand-300 font-semibold"
                >
                  Clear search
                </button>
              </div>

              {searchResults.total === 0 ? (
                <div className="text-center py-16 bg-neutral-900/40 rounded-2xl border border-neutral-800 p-8 space-y-3">
                  <Boxes className="w-10 h-10 text-neutral-600 mx-auto" />
                  <h3 className="text-lg text-white font-bold">No products found</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Try searching for terms like "Photo", "Blue Cut", "Single Vision", "Fused White", or "AR".
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-neutral-800 text-xs font-semibold text-white rounded-xl border border-neutral-700 hover:bg-neutral-700"
                  >
                    View All Products
                  </button>
                </div>
              ) : (
                <>
                  {/* Finished Lenses Section */}
                  {searchResults.finished.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          Finished Lenses ({searchResults.finished.length})
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {searchResults.finished.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onOpenDetails={setSelectedProduct}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blanks Section */}
                  {searchResults.blanks.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-neutral-850">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          Semi-Finished Blanks ({searchResults.blanks.length})
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {searchResults.blanks.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onOpenDetails={setSelectedProduct}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Utilities Section (if any matched) */}
                  {searchResults.utilities.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-neutral-850">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          Care & Utilities ({searchResults.utilities.length})
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {searchResults.utilities.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onOpenDetails={setSelectedProduct}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : activeTab === 'utilities' ? (
            /* GROUPED UTILITIES VIEW */
            <div className="space-y-6">
              <div className="text-xs text-neutral-400">
                <span>Showing optical dyes and care accessories</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Grouped Tints Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-neutral-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Utility · Optical Dyes
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">Lens Tints (7 Shades)</h3>
                    <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                      Professional optical dye solutions for tinting CR-39 and resin lenses to uniform or gradient depths.
                    </p>

                    <div>
                      <span className="block text-[11px] font-semibold text-neutral-400 mb-2">Available Colors:</span>
                      <div className="flex flex-wrap gap-2">
                        {TINT_COLORS.map((color) => (
                          <span
                            key={color}
                            className="px-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 font-medium"
                          >
                            {color} Tint
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-800/80">
                    <a
                      href={ORDERING_SYSTEM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Order Online</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 2. Grouped Cleaning & Care Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-neutral-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Utility · Care & Cleaning
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">Cleaning & Care Supplies</h3>
                    <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                      Essential lens maintenance accessories for optical practices and laboratory surfacing care.
                    </p>

                    <div className="space-y-2">
                      <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-850">
                        <h4 className="text-xs font-bold text-white">Microfiber Cloth</h4>
                        <p className="text-[11px] text-neutral-400">High-density lint-free optical cleaning cloth.</p>
                      </div>
                      <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-850">
                        <h4 className="text-xs font-bold text-white">Liquid Lens Cleaner</h4>
                        <p className="text-[11px] text-neutral-400">Anti-static optical spray formula safe for all AR coatings.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-800/80">
                    <a
                      href={ORDERING_SYSTEM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Order Online</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* DEFAULT BROWSE GRID */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-neutral-800">
                <span>
                  Showing <strong className="text-white font-bold">{browseProducts.length}</strong> products
                </span>
                <span>Select a product to view details or order online</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {browseProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenDetails={setSelectedProduct}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── 4. Lightweight Product Details Modal ── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={[
                    'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                    selectedProduct.productClass === 'Finished Lens'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : selectedProduct.productClass === 'Semi-finished (blanks)'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800',
                  ].join(' ')}
                >
                  {selectedProduct.productClass === 'Semi-finished (blanks)' ? 'Blank' : selectedProduct.productClass}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {formatCustomerFacingProductName(selectedProduct.productName)}
              </h2>
              {formatCustomerFacingProductName(selectedProduct.productName) !== selectedProduct.productName && (
                <span className="text-xs font-mono text-neutral-500 block mt-0.5">
                  Canonical: {selectedProduct.productName}
                </span>
              )}
              <p className="text-xs text-neutral-400 mt-1">
                {selectedProduct.lensType} · {selectedProduct.treatmentLabel}
              </p>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/70 p-4 rounded-2xl border border-neutral-850">
              {selectedProduct.description}
            </p>

            {/* Key Properties Grid */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-850 text-xs">
              <div>
                <span className="block text-[11px] text-neutral-500 font-medium">Type</span>
                <span className="font-semibold text-neutral-200">{selectedProduct.productClass}</span>
              </div>
              <div>
                <span className="block text-[11px] text-neutral-500 font-medium">Lens Design</span>
                <span className="font-semibold text-neutral-200">{selectedProduct.lensType}</span>
              </div>
              <div className="pt-1.5 border-t border-neutral-850">
                <span className="block text-[11px] text-neutral-500 font-medium">Coating / Treatment</span>
                <span className="font-semibold text-neutral-200">{selectedProduct.treatmentLabel}</span>
              </div>
              <div className="pt-1.5 border-t border-neutral-850">
                <span className="block text-[11px] text-neutral-500 font-medium">Material Substrate</span>
                <span className="font-semibold text-neutral-200">{selectedProduct.material || 'Optical Resin'}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <a
                href={ORDERING_SYSTEM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <span>Order Online</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Clean Product Card Component (Zero SKU Exposure) ──
function ProductCard({
  product,
  onOpenDetails,
}: {
  product: B2BProduct;
  onOpenDetails: (p: B2BProduct) => void;
}) {
  const isBlank = product.productClass === 'Semi-finished (blanks)';
  const isFinished = product.productClass === 'Finished Lens';
  const customerFacingName = formatCustomerFacingProductName(product.productName);

  return (
    <div
      className={[
        'bg-neutral-900 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl group',
        isBlank
          ? 'border-emerald-950/80 hover:border-emerald-700/60'
          : isFinished
          ? 'border-blue-950/80 hover:border-blue-700/60'
          : 'border-neutral-800 hover:border-neutral-700',
      ].join(' ')}
    >
      <div>
        {/* Class Badge (Zero SKU/ID) */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className={[
              'px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5',
              isBlank
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : isFinished
                ? 'bg-blue-950 text-blue-300 border-blue-800'
                : 'bg-amber-950 text-amber-300 border-amber-800',
            ].join(' ')}
          >
            <span
              className={[
                'w-1.5 h-1.5 rounded-full',
                isBlank ? 'bg-emerald-400' : isFinished ? 'bg-blue-400' : 'bg-amber-400',
              ].join(' ')}
            />
            {isBlank ? 'Blank' : product.productClass}
          </span>
        </div>

        {/* Customer-Facing Product Name */}
        <h3 className="text-xl font-black text-white group-hover:text-brand-300 transition-colors mb-1 tracking-tight leading-snug">
          {customerFacingName}
        </h3>

        {/* Plain Language Subtitle */}
        <p className="text-xs text-neutral-400 font-medium mb-3">
          {product.lensType} · {product.treatmentLabel}
        </p>

        {/* 1-Line Description */}
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
          {product.description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-neutral-800/80 flex items-center gap-2">
        <button
          onClick={() => onOpenDetails(product)}
          className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold border border-neutral-700 transition-colors"
        >
          Details
        </button>
        <a
          href={ORDERING_SYSTEM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm text-center"
        >
          <span>Order Online</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
