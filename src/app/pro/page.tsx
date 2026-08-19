import React from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Boxes, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  Truck,
  ExternalLink,
  Droplets,
} from 'lucide-react';
import { ORDERING_SYSTEM_URL } from '@/data/b2b-products';
import { urlConfig } from '@/config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wholesale Optical Supplies & Lens Blanks | Nigeria B2B | McDaves',
  description:
    'Wholesale ophthalmic lens catalog for optical practices, surfacing laboratories, and workshops in Nigeria. Finished single vision, semi-finished blanks, and optical accessories.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/pro`,
  },
  openGraph: {
    title: 'Wholesale Optical Supplies & Lens Blanks | Nigeria B2B | McDaves',
    description:
      'Wholesale ophthalmic lens catalog for optical practices, surfacing laboratories, and workshops in Nigeria.',
    url: `${urlConfig.productionBaseUrl}/pro`,
  },
};

export default function ProHubPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 pb-16">
      {/* ── 1. Hero Section ── */}
      <section className="relative pt-14 pb-20 overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="container-main relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span>Optical Materials Catalog</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-6">
              Lenses and Optical Materials for Your Practice
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed mb-8">
              Browse our catalog of finished lenses, semi-finished blanks, and optical care supplies. When you are ready to configure prescriptions and order, proceed directly to our online ordering system.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                href="/pro/catalog"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-all shadow-md active:scale-[0.98]"
              >
                <Boxes className="w-4 h-4" />
                <span>Browse Products</span>
              </Link>

              <a
                href={ORDERING_SYSTEM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-all border border-neutral-700 active:scale-[0.98]"
              >
                <span>Order Online</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-800/80">
              <div>
                <p className="text-lg font-bold text-white">60+ Optical Lines</p>
                <p className="text-[11px] text-neutral-400">Single vision, bifocal, progressive & blanks</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">Direct Online Ordering</p>
                <p className="text-[11px] text-neutral-400">Stock availability and prescription routing</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">Nationwide Distribution</p>
                <p className="text-[11px] text-neutral-400">Reliable logistics across Nigeria</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Services Breakdown ── */}
      <section className="py-16 border-b border-neutral-800">
        <div className="container-main">
          <div className="max-w-2xl mb-12">
            <span className="text-caption font-semibold uppercase tracking-wider text-brand-400 block mb-2">
              Optical Materials & Care
            </span>
            <h2 className="text-2xl font-bold text-white">What We Supply</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="text-base font-bold text-white">Finished Lenses</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Stock single vision, blue cut, anti-reflective, and photochromic lenses ready for immediate edging and insertion.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="text-base font-bold text-white">Semi-Finished Blanks</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                High-quality surfacing blanks for prescription laboratories, including bifocal, progressive, and specialized index materials.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="text-base font-bold text-white">Optical Care & Accessories</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Lens cleaning sprays, microfiber cloths, cases, and everyday dispensing essentials for your practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Ordering CTA Banner ── */}
      <section className="py-16 bg-neutral-900/40">
        <div className="container-main text-center max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Place an Order?</h2>
          <p className="text-xs text-neutral-300 mb-6 leading-relaxed">
            Specify powers, check live stock availability, and place orders directly through our online ordering system.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={ORDERING_SYSTEM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-all shadow-md"
            >
              <span>Order Online</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <Link
              href="/pro/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-all border border-neutral-700"
            >
              <span>Browse Catalog</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
