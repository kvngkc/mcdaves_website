// src/components/sections/HowItWorks.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Truck, Sparkles, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: Package,
    title: 'You Order',
    description: 'Choose frames or lens replacement online.',
  },
  {
    number: '2',
    icon: Truck,
    title: 'You Mail',
    description: 'Send us your frame with our free packaging guide.',
  },
  {
    number: '3',
    icon: Sparkles,
    title: 'We Craft & Return',
    description: 'Expert fitting. 5–7 day turnaround. Nationwide delivery.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 lg:py-24 bg-white border-y border-neutral-100">
      <div className="container-main">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-h2 text-neutral-900 mb-3">How It Works</h2>
          <p className="text-body text-neutral-600">No store? No problem.</p>
        </div>

        {/* 3-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-white rounded-xl border border-neutral-200 p-6 flex flex-col items-start transition-shadow hover:shadow-card-hover"
              >
                {/* Header row: Number badge & Icon */}
                <div className="flex items-center justify-between w-full mb-6">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-800 text-white font-semibold text-caption">
                    {step.number}
                  </div>
                  <div className="p-3 rounded-lg bg-brand-50 text-brand-700">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-h4 text-neutral-900 font-semibold mb-2">
                  {step.title}
                </h3>
                <p className="text-body-sm text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10 lg:mt-12">
          <Link
            href="/services/how-it-works/"
            className="inline-flex items-center gap-2 text-body-sm font-semibold text-brand-700 hover:text-brand-800 group transition-colors"
          >
            <span>Learn More</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
