// src/app/services/page.tsx
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Sparkles, Glasses, Wrench, ArrowRight, ShieldCheck } from 'lucide-react';
import { urlConfig, serviceConfig } from '@/config';

export const metadata: Metadata = {
  title: 'Optical Services — Lens Replacement, Fitting & Repairs | McDaves Nigeria',
  description:
    'Expert optical services by McDaves in Lagos. Precision prescription lens replacement, frame reglazing, repairs, and bespoke fitting.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/services`,
  },
};

export default function ServicesPage() {
  const services = [
    {
      title: 'Precision Lens Replacement',
      slug: '/services/lens-replacement',
      description: 'Keep your favorite frame and upgrade the optics. Single vision, progressive, blue-light blocking, and photochromic lenses.',
      turnaround: serviceConfig.lensReplacement.turnaround.standard,
      icon: <Glasses className="w-8 h-8 text-brand-600" />,
      features: ['Turnaround 2–5 business days', 'Anti-reflective coating included', 'Free frame realignment & ultrasonic cleaning'],
    },
    {
      title: 'Frame Repairs & Realignment',
      slug: '/services/repairs',
      description: 'Professional optical repairs for bent hinges, broken screws, loose temple arms, and bridge adjustments.',
      turnaround: '1–2 business days',
      icon: <Wrench className="w-8 h-8 text-brand-600" />,
      features: ['Hinge tightening & screw replacement', 'Nose pad replacement', 'Ultrasonic deep clean'],
    },
    {
      title: 'How It Works',
      slug: '/services/how-it-works',
      description: 'Simple 3-step process to get your glasses serviced or relensed with nationwide doorstep pickup & delivery.',
      turnaround: 'Seamless experience',
      icon: <Sparkles className="w-8 h-8 text-brand-600" />,
      features: ['Book online or via WhatsApp', 'Doorstep pickup in Lagos', 'Safe return shipping nationwide'],
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 py-12 md:py-16">
      <div className="container-main max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            Two Decades of Optical Precision
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
            Professional Optical Services
          </h1>
          <p className="text-neutral-600 text-base md:text-lg">
            Master craftsmanship in prescription lens replacement, frame repairs, and precision fitting in Lagos, Nigeria.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {services.map((s) => (
            <div
              key={s.slug}
              className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-neutral-50 rounded-xl w-fit mb-4 border border-neutral-100">
                  {s.icon}
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">{s.title}</h2>
                <p className="text-neutral-600 text-sm mb-4 leading-relaxed">{s.description}</p>
                <div className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md w-fit mb-4">
                  Turnaround: {s.turnaround}
                </div>
                <ul className="space-y-2 mb-6">
                  {s.features.map((f, i) => (
                    <li key={i} className="text-xs text-neutral-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={s.slug}
                className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
