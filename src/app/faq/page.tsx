
// src/app/faq/page.tsx
import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowRight, ShieldCheck, PhoneCall } from 'lucide-react';
import { siteConfig } from '@/data/site-config';
import { urlConfig } from '@/config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | Eyewear & Lenses | McDaves Nigeria',
  description:
    'Find answers to common questions about Sightly frames, 3D virtual try-on, delivery in Nigeria, prescription lenses, payment via Paystack, and returns.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/faq`,
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) | Eyewear & Lenses | McDaves Nigeria',
    description:
      'Find answers to common questions about Sightly frames, 3D virtual try-on, delivery in Nigeria, prescription lenses, and returns.',
    url: `${urlConfig.productionBaseUrl}/faq`,
  },
};

export default function FAQPage() {
  const categories = [
    {
      title: 'Sightly Eyewear & Virtual Try-On',
      items: [
        {
          q: 'How does the Virtual Try-On camera fitting work?',
          a: 'Our Virtual Try-On uses high-precision MediaPipe Face Landmarker 3D facial tracking directly in your web browser. Grant camera permission when prompted, and the glasses will track onto your face in real-time. It is 100% private and runs locally on your device.',
        },
        {
          q: 'What materials are Sightly frames made from?',
          a: 'Our frames are hand-crafted from premium cellulose acetate, grade 316 stainless steel, and lightweight TR90 polymer. All frames feature durable multi-barrel or spring hinges for maximum comfort.',
        },
        {
          q: 'Are Sightly frames prescription-ready?',
          a: 'Yes. All Sightly optical frames arrive ready for prescription lens fitting. You can order frames directly or select lens replacement servicing.',
        },
      ],
    },
    {
      title: 'Ordering, Payments & Delivery',
      items: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept instant card payments, bank transfers, USSD, and Apple Pay via Paystack secure checkout.',
        },
        {
          q: 'How long does delivery take within Nigeria?',
          a: 'Orders within Lagos are delivered within 2 to 5 business days. Orders nationwide take 5 to 10 business days.',
        },
        {
          q: 'Can I exchange a frame if it does not fit my face shape?',
          a: 'Yes. We offer a 7-day hassle-free exchange policy for unworn retail frames in original packaging.',
        },
      ],
    },
    {
      title: 'Optical Supplies & Practice Ordering',
      items: [
        {
          q: 'Do you supply optical lenses and materials to practices?',
          a: 'Yes. We supply optical practices, laboratories, and workshops across Nigeria with finished stock lenses, semi-finished surfacing blanks, and optical care materials.',
        },
        {
          q: 'Where do I find optical specifications and order online?',
          a: 'You can explore our full product specifications in the McDaves Optical Catalog (/pro/catalog) and place orders directly on our online ordering system.',
        },
      ],
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: categories.flatMap((cat) =>
      cat.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    ),
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-50/40 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <section className="pt-12 pb-16 bg-white border-b border-neutral-200">
        <div className="container-main text-center max-w-2xl">
          <span className="text-caption font-semibold uppercase tracking-wider text-brand-700 block mb-2">
            Help & Support
          </span>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-body-sm text-neutral-600">
            Find answers to common questions regarding retail eyewear, virtual fitting, delivery, and optical supplies.
          </p>
        </div>
      </section>

      {/* ── FAQ Categories ─────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container-main max-w-4xl space-y-12">

          {categories.map((cat, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-card">
              <h2 className="text-h3 font-bold text-neutral-900 mb-6 border-b border-neutral-100 pb-3">
                {cat.title}
              </h2>

              <div className="space-y-6">
                {cat.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="space-y-2">
                    <h3 className="text-body-md font-semibold text-neutral-900 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                      <span>{item.q}</span>
                    </h3>
                    <p className="text-body-sm text-neutral-600 pl-6 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom Trade Callout */}
          <div className="p-8 bg-neutral-900 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-caption font-semibold uppercase tracking-wider text-brand-400 block mb-1">
                Optical Professional or Practice?
              </span>
              <h3 className="text-h3 font-bold text-white mb-2">
                Looking for Lenses, Blanks & Materials?
              </h3>
              <p className="text-body-sm text-neutral-300">
                Explore our optical catalog for technical specifications and direct online ordering.
              </p>
            </div>
            <Link
              href="/pro/catalog"
              className="px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-body-sm font-semibold whitespace-nowrap shadow-md"
            >
              Optical Catalog →
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
