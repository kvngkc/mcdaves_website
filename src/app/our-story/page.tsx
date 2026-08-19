// src/app/our-story/page.tsx
import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, Layers, Users, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/data/site-config';
import { businessIdentity, urlConfig } from '@/config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Story — Two Generations of Optical Precision | McDaves Nigeria',
  description:
    'Learn about McDaves optical heritage in Lagos, Nigeria. Over two decades of master craftsmanship supplying ophthalmic materials, prescription lenses, and Sightly handcrafted eyewear.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/our-story`,
  },
  openGraph: {
    title: 'Our Story — Two Generations of Optical Precision | McDaves Nigeria',
    description:
      'Learn about McDaves optical heritage in Lagos, Nigeria. Over two decades of master craftsmanship supplying ophthalmic materials, prescription lenses, and Sightly handcrafted eyewear.',
    url: `${urlConfig.productionBaseUrl}/our-story`,
  },
};

const aboutSchemaJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${urlConfig.productionBaseUrl}/our-story#webpage`,
  url: `${urlConfig.productionBaseUrl}/our-story`,
  name: 'Our Story — Two Generations of Optical Precision',
  description: 'History and optical craftsmanship heritage of McDaves Optical in Lagos, Nigeria.',
  mainEntity: {
    '@type': 'Optician',
    name: businessIdentity.tradeName,
    foundingDate: String(businessIdentity.foundedYear),
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessIdentity.contact.address.streetAddress,
      addressLocality: businessIdentity.contact.address.addressLocality,
      addressRegion: businessIdentity.contact.address.addressRegion,
      addressCountry: businessIdentity.contact.address.addressCountry,
    },
  },
};

export default function OurStoryPage() {
  const milestones = [
    {
      year: '1990s',
      title: 'Foundations in Lagos',
      desc: 'Established in the heart of Lagos at Nnamdi Azikwe Street, supplying local opticians with quality prescription lenses and replacement frame parts.',
    },
    {
      year: '2000s',
      title: 'Laboratory Supply Expansion',
      desc: 'Expanded wholesale distribution to supply surfacing laboratories across Nigeria with semi-finished lens blanks, CR-39 resins, and edging tools.',
    },
    {
      year: '2010s',
      title: 'Craftsmanship & Lens Fitting',
      desc: 'Pioneered custom prescription glazing services and precision lens fitting for independent optical practices and eye clinics.',
    },
    {
      year: 'Present',
      title: 'Digital Catalog & Eyewear Launch',
      desc: 'Launched the Sightly handcrafted eyewear line alongside McDaves Optical Supplies — Nigeria’s direct optical catalog and online ordering platform.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchemaJsonLd) }}
      />
      
      {/* ── 1. Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 bg-gradient-to-b from-neutral-950 via-brand-950 to-neutral-900 text-white overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,rgba(201,162,39,0.15),transparent_60%)]" />
        <div className="container-main relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-900/80 text-accent-gold text-xs font-bold uppercase tracking-wider mb-6 border border-accent-gold/30 shadow-sm backdrop-blur-sm">
            <Award className="w-4 h-4 text-accent-gold" />
            <span>Est. {siteConfig.foundedYear} • Lagos, Nigeria</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 text-balance drop-shadow-sm">
            Two Generations of Optical Precision
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-neutral-200 max-w-2xl mx-auto leading-relaxed text-balance">
            For over two decades, McDaves has been trusted by Nigerian optical professionals for precision materials and by consumers for premium eyewear.
          </p>
        </div>
      </section>

      {/* ── 2. Timeline Milestones ───────────────────────────────────────────── */}
      <section className="py-20 border-b border-neutral-100 bg-brand-50/40">
        <div className="container-main max-w-4xl">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-caption font-semibold uppercase tracking-wider text-brand-700 block mb-2">Our Journey</span>
            <h2 className="text-h2 font-bold text-neutral-900">Over Two Decades of Excellence</h2>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:left-8 sm:before:left-1/2 before:-ml-px before:w-0.5 before:bg-brand-200">
            {milestones.map(({ year, title, desc }, idx) => (
              <div
                key={year}
                className={`relative flex flex-col sm:flex-row items-start ${
                  idx % 2 === 0 ? 'sm:flex-row-reverse text-left' : 'text-left'
                }`}
              >
                <div className="w-full sm:w-1/2 p-6 bg-white rounded-2xl border border-neutral-200 shadow-card hover:shadow-card-hover transition-shadow">
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-800 font-mono text-xs font-bold mb-3">
                    {year}
                  </span>
                  <h3 className="text-h4 font-semibold text-neutral-900 mb-2">{title}</h3>
                  <p className="text-body-sm text-neutral-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 3. Dual Track Core Pillars ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-main">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-h2 font-bold text-neutral-900 mb-3">Two Tracks, One Standard of Excellence</h2>
            <p className="text-body-sm text-neutral-600">Built to serve both retail consumers and wholesale trade professionals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Retail Pillar */}
            <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between">
              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-brand-700 block mb-2">B2C Retail Collection</span>
                <h3 className="text-h3 font-bold text-neutral-900 mb-3">Sightly Eyewear</h3>
                <p className="text-body-sm text-neutral-600 leading-relaxed mb-6">
                  Hand-finished acetate and stainless steel frames designed for style, durability, and comfort. Includes virtual AR try-on and instant Paystack checkout.
                </p>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-body-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                <span>Browse Sightly Frames</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Optical Supplies Pillar */}
            <div className="p-8 rounded-2xl bg-neutral-900 text-white flex flex-col justify-between">
              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-brand-400 block mb-2">Optical Supplies Track</span>
                <h3 className="text-h3 font-bold text-white mb-3">McDaves Optical Supplies</h3>
                <p className="text-body-sm text-neutral-300 leading-relaxed mb-6">
                  Direct supply catalog providing finished lenses, surfacing blanks, and optical care materials to practices, labs, and opticians across Nigeria.
                </p>
              </div>
              <Link
                href="/pro/catalog"
                className="inline-flex items-center gap-2 text-body-sm font-semibold text-brand-400 hover:text-brand-300"
              >
                <span>Explore Optical Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
