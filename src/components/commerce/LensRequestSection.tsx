// src/components/commerce/LensRequestSection.tsx
/**
 * Lens & Prescription Educational Guide for McDaves Eyewear
 * Explains prescription lens options clearly without hardcoding an internal B2B lab catalog.
 */

'use client';

import React from 'react';
import { Eye, ShieldCheck, Check, Sparkles, MessageCircle } from 'lucide-react';

export function LensRequestSection() {
  const lensTypes = [
    {
      title: 'Plano (Zero Power)',
      desc: 'Clear fashion lenses with UV protection, or use as a frame for later lens fitting.',
      badge: 'Immediate Dispatch',
    },
    {
      title: 'Blue Light Blocking',
      desc: 'Filters high-energy blue rays from screens, laptops, and mobile phones to reduce eye fatigue.',
      badge: 'Popular for Office',
    },
    {
      title: 'Prescription Single Vision',
      desc: 'Custom distance or reading lenses surfaced to your exact optical prescription values.',
      badge: 'Custom Surfaced',
    },
    {
      title: 'Photochromic (Transition)',
      desc: 'Lenses that automatically darken in sunlight and turn crystal clear indoors.',
      badge: 'All-Day Outdoor',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-neutral-900 mb-1">
          Prescription & Lens Options
        </h3>
        <p className="text-xs text-neutral-500">
          McDaves optical specialists calibrate lenses to your exact verified prescription after consultation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lensTypes.map((lens, i) => (
          <div
            key={i}
            className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-neutral-900">{lens.title}</h4>
              <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60">
                {lens.badge}
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {lens.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Verification Notice */}
      <div className="p-4 bg-neutral-900 text-white rounded-2xl flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-neutral-100">
            Professional Optical Verification Guarantee
          </p>
          <p className="text-neutral-300 leading-relaxed">
            All customer-submitted prescriptions are verified by licensed McDaves optometrists before lab surfacing. If your doctor&apos;s prescription card is on paper or your phone, simply snap a picture and send it in our WhatsApp sales consultation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LensRequestSection;
