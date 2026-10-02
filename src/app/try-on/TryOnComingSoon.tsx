// src/app/try-on/TryOnComingSoon.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

export default function TryOnComingSoon() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden px-4 py-20">
      {/* Background glow effects for luxury feel */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-900/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-accent-gold/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl">
            <Sparkles className="w-8 h-8 text-brand-400" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Virtual Try-On
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Our 3D fitting experience is currently undergoing maintenance as we upgrade to a higher standard of precision. We&apos;ll be back soon with an even better experience.
          </p>
        </div>

        <div className="pt-8">
          <Link href="/shop" className="inline-block">
            <Button
              variant="primary"
              size="lg"
              className="px-8 shadow-lg shadow-brand-900/20 active:scale-95 transition-all bg-white text-neutral-950 hover:bg-neutral-100 border-none"
              leadingIcon={<ArrowLeft className="w-5 h-5" />}
            >
              Return to Collection
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
