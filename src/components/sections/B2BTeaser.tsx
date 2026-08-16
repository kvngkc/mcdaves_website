// src/components/sections/B2BTeaser.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export function B2BTeaser() {
  return (
    <section className="relative py-20 lg:py-28 bg-brand-900 text-white overflow-hidden">
      {/* Background overlay texture/gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500 via-transparent to-transparent" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#c9a227_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

      <div className="container-main relative z-10 text-center max-w-3xl mx-auto">
        <span className="inline-block text-caption font-semibold uppercase tracking-wider text-accent-gold mb-4">
          McDaves Optical Supplies
        </span>

        <h2 className="text-h2 sm:text-hero font-semibold text-white mb-6 text-balance">
          Supplying Nigerian Optical Practices & Stores
        </h2>

        <p className="text-body text-brand-100 mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
          Finished lenses, surfacing blanks, and optical care supplies. Trusted by
          optical practitioners for over two decades.
        </p>

        <div className="flex justify-center">
          <Link
            href="/pro/catalog"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-accent-gold text-brand-900 font-bold text-body-sm hover:bg-accent-warm transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] min-h-[48px] w-full sm:w-auto"
          >
            Explore Optical Catalog & Order Online ↗
          </Link>
        </div>
      </div>
    </section>
  );
}

export default B2BTeaser;
