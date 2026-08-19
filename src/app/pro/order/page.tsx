// src/app/pro/order/page.tsx
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ExternalLink, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';
import { ORDERING_SYSTEM_URL } from '@/data/b2b-products';
import { urlConfig, businessIdentity } from '@/config';

export const metadata: Metadata = {
  title: 'Order Ophthalmic Supplies & Lenses | McDaves Pro',
  description: 'Place B2B wholesale orders for optical lenses, blanks, and edging materials.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/pro/order`,
  },
};

export default function ProOrderPage() {
  return (
    <main className="min-h-screen bg-neutral-50 py-12 md:py-16">
      <div className="container-main max-w-2xl mx-auto px-4 text-center">
        <div className="bg-white rounded-2xl p-8 md:p-12 border border-neutral-200 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            B2B Optical Ordering Portal
          </h1>

          <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
            Registered optometrists, dispensaries, and optical laboratories can place batch orders, check live inventory, and track shipments through the dedicated OptiSource B2B trade portal.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={ORDERING_SYSTEM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors shadow-sm"
            >
              <span>Launch Ordering Portal</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/pro/catalog"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 text-neutral-800 font-semibold hover:bg-neutral-200 transition-colors"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
