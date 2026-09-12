// src/app/services/lens-replacement/page.tsx
import React from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Truck,
  Layers,
  Glasses,
  Zap,
} from 'lucide-react';
import { siteConfig } from '@/data/site-config';
import { ORDERING_SYSTEM_URL } from '@/data/b2b-products';
import { businessIdentity, urlConfig, serviceConfig } from '@/config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prescription Lens Replacement & Reglazing | Blue Cut, Photochromic | McDaves Nigeria',
  description:
    'Put new prescription, blue cut, or photochromic lenses into your existing frames. Precision optical measurement, edging, and fitting in Lagos with nationwide delivery.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/services/lens-replacement`,
  },
  openGraph: {
    title: 'Prescription Lens Replacement & Reglazing | Blue Cut, Photochromic | McDaves Nigeria',
    description:
      'Put new prescription, blue cut, or photochromic lenses into your existing frames. Precision optical measurement, edging, and fitting in Lagos with nationwide delivery.',
    url: `${urlConfig.productionBaseUrl}/services/lens-replacement`,
  },
};

const serviceSchemaJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${urlConfig.productionBaseUrl}/services/lens-replacement#service`,
  name: 'Prescription Lens Replacement & Reglazing',
  serviceType: 'Optical Glazing & Lens Fitting',
  provider: {
    '@type': 'Optician',
    name: businessIdentity.tradeName,
    url: urlConfig.productionBaseUrl,
    telephone: `+${businessIdentity.contact.rawPhone}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessIdentity.contact.address.streetAddress,
      addressLocality: businessIdentity.contact.address.addressLocality,
      addressRegion: businessIdentity.contact.address.addressRegion,
      addressCountry: businessIdentity.contact.address.addressCountry,
    },
  },
  areaServed: {
    '@type': 'Country',
    name: 'Nigeria',
  },
  description:
    'Custom prescription lens replacement for existing optical frames. Single vision, blue light filter, light-adaptive photochromic, and progressive lenses fitted with precision in Lagos.',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'NGN',
    price: '15000',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '15000',
      priceCurrency: 'NGN',
      name: 'Starting price for Single Vision Clear lenses',
    },
  },
};

export default function LensReplacementB2CPage() {
  const lensOptions = serviceConfig.lensReplacement.tiers.map((tier) => ({
    name: tier.name,
    desc: tier.desc,
    badge: tier.badge,
    price: 'Custom Quote',
  }));

  const steps = [
    {
      step: '01',
      title: 'Send or Bring Your Frame',
      desc: 'Send us your favorite frame via courier or drop it off at our Lagos office.',
    },
    {
      step: '02',
      title: 'Choose Your Lens Options',
      desc: 'Share your prescription and choose your preferred lens material, index, and coatings (Anti-Reflective, Blue Cut, Photochromic).',
    },
    {
      step: '03',
      title: 'Professional Lens Fitting',
      desc: 'We arrange precision edging and lens mounting with experienced optical lab partners.',
    },
    {
      step: '04',
      title: 'Delivered Ready to Wear',
      desc: 'Your refreshed eyewear is carefully inspected and delivered directly to your doorstep across Nigeria.',
    },
  ];

  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    "Hi McDaves! I'd like to replace or fit lenses in my frame.",
  )}`;

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchemaJsonLd) }}
      />
      {/* ── 1. Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 bg-gradient-to-b from-brand-50 via-white to-brand-50/30 border-b border-neutral-200">
        <div className="container-main max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider mb-6">
            <RefreshCw className="w-4 h-4 text-brand-600" />
            <span>Eyewear Reglazing & Lens Service</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-neutral-950 tracking-tight mb-6 text-balance">
            Keep Your Favorite Frame. Get Fresh Lenses.
          </h1>

          <p className="text-base sm:text-lg text-neutral-700 max-w-2xl mx-auto leading-relaxed mb-8 text-balance">
            Upgrade your eyewear with precision prescription, blue cut, or photochromic lenses. We handle the measurement, edging, and professional fitting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-body-sm transition-all shadow-md active:scale-[0.98] w-full sm:w-auto"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Chat with us on WhatsApp</span>
            </a>

            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-body-sm transition-all w-full sm:w-auto"
            >
              <Glasses className="w-4 h-4" />
              <span>Browse New Frames</span>
            </Link>
          </div>

          {/* Quick highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 mt-10 border-t border-brand-200/60 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <span className="text-xs font-medium text-neutral-700">Precision Prescription Fitting</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <span className="text-xs font-medium text-neutral-700">Fast 2–5 Day Turnaround</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <span className="text-xs font-medium text-neutral-700">Doorstep Delivery Nationwide</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. How It Works (4 Simple Steps) ─────────────────────────────────── */}
      <section className="py-16 bg-neutral-50 border-b border-neutral-200">
        <div className="container-main max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-caption font-semibold uppercase tracking-wider text-brand-700 block mb-2">
              Simple 4-Step Process
            </span>
            <h2 className="text-h2 font-bold text-neutral-900">How Lens Replacement Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc }) => (
              <div
                key={step}
                className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-card flex flex-col justify-between"
              >
                <div>
                  <span className="text-2xl font-black text-brand-700 font-mono block mb-3">
                    {step}
                  </span>
                  <h3 className="text-body font-bold text-neutral-900 mb-2">{title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Lens Options & Pricing ───────────────────────────────────────── */}
      <section className="py-16 bg-white border-b border-neutral-200">
        <div className="container-main max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-caption font-semibold uppercase tracking-wider text-brand-700 block mb-2">
              Lens Choices
            </span>
            <h2 className="text-h2 font-bold text-neutral-900 mb-2">Available Lens Treatments</h2>
            <p className="text-body-sm text-neutral-600">
              We fit all types of optical prescriptions. Select what fits your daily lifestyle.
            </p>
          </div>

          <div className="space-y-4">
            {lensOptions.map((opt, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-body-md font-bold text-neutral-900">{opt.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 max-w-lg leading-relaxed">{opt.desc}</p>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <span className="text-xs font-bold text-brand-800 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 inline-block">
                    {opt.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Professional Lens Fitting Section ────────────────────────────── */}
      <section id="fitting" className="py-16 bg-brand-50/40 border-b border-neutral-200">
        <div className="container-main max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
            <span>Fitting & Workmanship</span>
          </div>

          <h2 className="text-h2 font-bold text-neutral-900">
            Professional Lens Fitting Service
          </h2>

          <p className="text-body-sm text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            Every pair of glasses requires precise pupillary distance (PD) measurement, optical center alignment, and frame bevel fitting. We coordinate with established optical finishing laboratories to ensure your lenses fit securely and comfortably in your frames.
          </p>
        </div>
      </section>

      {/* ── 5. Bottom Call to Action ────────────────────────────────────────── */}
      <section className="py-16 bg-white text-center">
        <div className="container-main max-w-xl space-y-6">
          <h2 className="text-h3 font-bold text-neutral-900">Ready to Reglaze Your Glasses?</h2>
          <p className="text-body-sm text-neutral-600">
            Send us a message with your frame details and prescription to get an instant quote and instructions.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-body-sm transition-all shadow-md active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Chat with us on WhatsApp</span>
          </a>
        </div>
      </section>
    </div>
  );
}
