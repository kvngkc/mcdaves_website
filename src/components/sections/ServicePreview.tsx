// src/components/sections/ServicePreview.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Glasses, Sparkles, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

export function ServicePreview() {
  const services = [
    {
      title: 'Frames',
      desc: 'Quality eyewear frames for everyday wear.',
      icon: Glasses,
      cta: 'Shop Frames',
      href: '/shop',
    },
    {
      title: 'Prescription Lenses',
      desc: 'Single vision, blue cut, photochromic, progressive and more.',
      icon: Sparkles,
      cta: 'Explore Lenses',
      href: '/pro/catalog',
    },
    {
      title: 'Lens Replacement',
      desc: 'Replace old or damaged lenses while keeping your existing frame.',
      icon: RefreshCw,
      cta: 'Learn More',
      href: '/services/lens-replacement',
    },
    {
      title: 'Lens Fitting',
      desc: 'We arrange professional lens fitting and finishing for your glasses.',
      icon: CheckCircle2,
      cta: 'View Fitting Service',
      href: '/services/lens-replacement#fitting',
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white border-b border-neutral-100">
      <div className="container-main">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 lg:mb-16">
          <span className="text-caption font-semibold uppercase tracking-wider text-brand-700 block mb-2">
            Our Services
          </span>
          <h2 className="text-h2 text-neutral-900 mb-3">What We Do</h2>
          <p className="text-body text-neutral-600">
            Precision optical products and customer-focused lens services.
          </p>
        </div>

        {/* 4-Card Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(({ title, desc, icon: Icon, cta, href }) => (
            <div
              key={title}
              className="bg-brand-50/50 hover:bg-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between border border-brand-100/80 hover:border-brand-300 transition-all hover:shadow-card-hover group"
            >
              <div>
                <div className="p-3.5 rounded-xl bg-white group-hover:bg-brand-50 text-brand-700 w-fit shadow-xs mb-5 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-h4 text-neutral-900 font-bold mb-2">
                  {title}
                </h3>
                <p className="text-body-sm text-neutral-600 leading-relaxed mb-6">
                  {desc}
                </p>
              </div>

              <div className="pt-4 border-t border-brand-200/50">
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 text-body-sm font-semibold text-brand-700 group-hover:text-brand-800 transition-colors min-h-[44px]"
                >
                  <span>{cta}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicePreview;
