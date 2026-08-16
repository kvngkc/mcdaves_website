// src/components/sections/TrustSignals.tsx
'use client';

import React from 'react';

const signals = [
  {
    value: 'Over two decades',
    label: 'Years of Expertise',
  },
  {
    value: 'All 36 States',
    label: 'Nationwide Delivery',
  },
  {
    value: 'Fast Response',
    label: 'WhatsApp Support',
  },
  {
    value: '30 Days',
    label: 'Workmanship Guarantee',
  },
];

export function TrustSignals() {
  return (
    <section className="py-12 lg:py-16 bg-white border-t border-neutral-200">
      <div className="container-main">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
          {signals.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-5 bg-neutral-50/80 rounded-xl border border-neutral-200/80 transition-all hover:border-brand-200"
            >
              <span className="text-h4 sm:text-h3 font-bold text-brand-800 tracking-tight mb-1">
                {item.value}
              </span>
              <span className="text-caption text-neutral-600 font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustSignals;
