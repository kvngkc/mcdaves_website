// src/components/sections/HeroSection.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, ShieldCheck, Truck, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/data/site-config';

export function HeroSection() {
  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight * 0.9,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative flex flex-col justify-between min-h-screen lg:min-h-[640px] bg-gradient-to-b from-brand-50/80 via-white to-brand-50/40 pt-[calc(var(--header-height,4rem)+1.5rem)] pb-12 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
      {/* Background subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,rgba(90,158,90,0.12),transparent_70%)]" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="my-auto w-full max-w-4xl mx-auto flex flex-col items-center justify-center relative z-10 py-12">
        {/* Caption */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-brand-200/80 shadow-xs mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
          <p className="text-caption font-bold text-brand-800 uppercase tracking-widest text-[11px]">
            Est. {siteConfig.foundedYear} • Lagos, Nigeria
          </p>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-950 mb-6 tracking-tight text-balance [overflow-wrap:anywhere] break-words">
          Two Generations of Optical Precision. <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600">Now Online.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-neutral-700 max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
          From lens blanks to handcrafted finished frames. We supply Nigerian optical stores and craft luxury eyewear for discerning individuals.
        </p>

        {/* 3 CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-sm sm:max-w-none mb-12">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:scale-[1.03] active:scale-[0.98] select-none min-h-[48px] px-8 text-body bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/20 hover:from-brand-700 hover:to-brand-800 focus-visible:ring-brand-500 w-full sm:w-auto"
          >
            👓 Shop Frames
          </Link>

          <Link
            href="/services/lens-replacement"
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:scale-[1.02] active:scale-[0.98] select-none min-h-[48px] px-7 text-body bg-white text-brand-800 border border-brand-300/80 shadow-sm hover:bg-brand-50 hover:border-brand-500 focus-visible:ring-brand-500 w-full sm:w-auto backdrop-blur-sm"
          >
            🔄 Lens Replacement
          </Link>

          <Link
            href="/pro"
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:scale-[1.02] active:scale-[0.98] select-none min-h-[48px] px-7 text-body bg-brand-100/60 text-brand-900 hover:bg-brand-100 focus-visible:ring-brand-500 w-full sm:w-auto border border-brand-200/60"
          >
            📦 Optical Supplies
          </Link>
        </div>

        {/* Trust Pills */}
        <div className="w-full overflow-x-auto no-scrollbar py-2 px-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/90 border border-brand-200/70 shadow-sm text-caption font-semibold text-brand-900 backdrop-blur-md hover:border-brand-400 transition-colors">
              <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>Over two decades</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/90 border border-brand-200/70 shadow-sm text-caption font-semibold text-brand-900 backdrop-blur-md hover:border-brand-400 transition-colors">
              <Truck className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>Nationwide Delivery</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/90 border border-brand-200/70 shadow-sm text-caption font-semibold text-brand-900 backdrop-blur-md hover:border-brand-400 transition-colors">
              <MessageCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>WhatsApp Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll-down indicator */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-4">
        <button
          onClick={scrollToNext}
          aria-label="Scroll down to explore"
          className="p-2 rounded-full text-neutral-400 hover:text-brand-700 transition-colors animate-bounce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}

export default HeroSection;
