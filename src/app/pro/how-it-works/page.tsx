import React from 'react';
import Link from 'next/link';
import { 
  Search, 
  Layers, 
  ExternalLink, 
  Truck, 
  CheckCircle2, 
  ShieldCheck, 
  Boxes 
} from 'lucide-react';
import { ORDERING_SYSTEM_URL } from '@/data/b2b-products';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How Optical Ordering Works | B2B Practice Orders | McDaves Nigeria',
  description:
    'Step-by-step guide for optometrists, optical labs, and store owners on discovering and ordering ophthalmic lenses and blanks with fast Lagos delivery.',
  alternates: {
    canonical: 'https://mcdaves.com.ng/pro/how-it-works',
  },
  openGraph: {
    title: 'How Optical Ordering Works | B2B Practice Orders | McDaves Nigeria',
    description:
      'Step-by-step guide for optometrists and optical labs on ordering ophthalmic lenses and blanks in Nigeria.',
    url: 'https://mcdaves.com.ng/pro/how-it-works',
  },
};

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Find What You Need',
      desc: 'Browse or search our catalog by lens type, treatment (Photochromic, Blue Cut, Anti-Reflective), or name (e.g. Single Vision Blue Cut, FUSE Photo, D-Top).',
      icon: Search,
    },
    {
      num: '02',
      title: 'Confirm Finished Lens or Blank',
      desc: 'Check whether your job requires finished ready-to-edge lenses or semi-finished blanks for surfacing.',
      icon: Layers,
    },
    {
      num: '03',
      title: 'Order Online',
      desc: 'Go directly to our online ordering system to select specific sphere/cylinder powers, base curves, check availability, and submit your order.',
      icon: ExternalLink,
    },
    {
      num: '04',
      title: 'Direct Lagos Dispatch',
      desc: 'Your lenses and materials are packed and dispatched directly from our central Lagos distribution center to your practice or lab.',
      icon: Truck,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 pb-16">
      <section className="relative pt-12 pb-16 border-b border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="container-main text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Ordering Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            How Ordering Works
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Discover products in our catalog, understand the specifications, and order through our online ordering system.
          </p>
        </div>
      </section>

      <section className="py-16 border-b border-neutral-800 bg-neutral-900/40">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {steps.map(({ num, title, desc, icon: Icon }) => (
              <div
                key={num}
                className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-brand-400 font-mono">{num}</span>
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{desc}</p>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-brand-400 font-semibold pt-3 border-t border-neutral-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Straightforward Process</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-neutral-900/50">
        <div className="container-main text-center max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Browse or Order?</h2>
          <p className="text-xs text-neutral-300 mb-6 leading-relaxed">
            Explore the catalog to see all available products, or head directly to the ordering system.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pro/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-all shadow-md"
            >
              <Boxes className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>

            <a
              href={ORDERING_SYSTEM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-all border border-neutral-700"
            >
              <span>Order Online</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
