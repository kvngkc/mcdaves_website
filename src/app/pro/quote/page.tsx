import React from 'react';
import Link from 'next/link';
import { ExternalLink, Boxes, ShieldCheck } from 'lucide-react';
import { ORDERING_SYSTEM_URL } from '@/data/b2b-products';
import { urlConfig } from '@/config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Optical Supplies Online | McDaves Nigeria B2B',
  description:
    'Direct online ordering for optical practices, eye clinics, and surfacing labs in Nigeria. Select exact prescription powers and receive fast tracked delivery.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/pro/quote`,
  },
  openGraph: {
    title: 'Order Optical Supplies Online | McDaves Nigeria B2B',
    description:
      'Direct online ordering for optical practices, eye clinics, and surfacing labs in Nigeria.',
    url: `${urlConfig.productionBaseUrl}/pro/quote`,
  },
};

export default function QuoteRedirectPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 pb-16 items-center justify-center px-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-2xl flex items-center justify-center text-2xl mx-auto">
          🛒
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Online Ordering
          </h1>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Quotes are not required. You can specify exact prescription powers, check stock availability, and place orders directly on our online ordering platform.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <a
            href={ORDERING_SYSTEM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Order Online</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <Link
            href="/pro/catalog"
            className="w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-neutral-700"
          >
            <Boxes className="w-4 h-4" />
            <span>Browse Products Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
