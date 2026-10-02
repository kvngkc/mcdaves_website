// src/app/payment/success/page.tsx
// ─── Order Success Page ──────────────────────────────────────────────────────
// A clean, reassuring confirmation page shown after a successful payment.
// Reference can be passed via ?reference= query param or read from sessionStorage.
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ClipboardCheck,
  Settings2,
  Truck,
  PackageCheck,
  MessageCircle,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

// ─── Order Timeline ──────────────────────────────────────────────────────────
const TIMELINE = [
  {
    icon: ClipboardCheck,
    title: 'Order Confirmed',
    description: 'We\'ve received your order and payment.',
    color: 'text-brand-600 bg-brand-100',
    active: true,
  },
  {
    icon: Settings2,
    title: 'Processing',
    description: 'Our team is picking and preparing your items.',
    color: 'text-accent-gold bg-amber-100',
    active: false,
  },
  {
    icon: Truck,
    title: 'Shipping',
    description: 'Your order is on its way to you.',
    color: 'text-accent-sky bg-sky-100',
    active: false,
  },
  {
    icon: PackageCheck,
    title: 'Delivered',
    description: 'Your optical order has arrived — enjoy!',
    color: 'text-green-600 bg-green-100',
    active: false,
  },
];

// ─── Inner Component ─────────────────────────────────────────────────────────
function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const [reference] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return (
      searchParams.get('reference') ??
      sessionStorage.getItem('mcdaves_pending_ref') ??
      ''
    );
  });

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || siteConfig.whatsappNumber;
  const whatsappMsg = encodeURIComponent(
    `Hi McDaves! I just placed an order.${reference ? `\nReference: ${reference}` : ''}\nCould you let me know the estimated delivery time? Thank you!`,
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-lg mx-auto py-10 px-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-h4 font-bold text-brand-700 tracking-tight">McDaves</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Hero section */}
          <div className="flex flex-col items-center text-center px-6 py-10 gap-5 border-b border-neutral-100">
            {/* Animated checkmark */}
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-brand-100 animate-ping opacity-25" />
              <div className="relative w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-brand-600" aria-hidden="true" />
              </div>
            </div>

            <div>
              <h1 className="text-h3 font-semibold text-neutral-900 mb-2">
                Thank you for your order!
              </h1>
              <p className="text-body-sm text-neutral-500 max-w-xs">
                Your payment was confirmed. A confirmation will be sent to your email shortly.
              </p>
            </div>

            {/* Reference badge */}
            {reference && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-5 py-3 text-center">
                <p className="text-caption text-neutral-500 mb-1">Order Reference</p>
                <p className="font-mono font-bold text-brand-700 text-body-sm tracking-wide">
                  {reference}
                </p>
              </div>
            )}
          </div>

          {/* What happens next — timeline */}
          <div className="px-6 py-7">
            <h2 className="text-caption font-semibold text-neutral-700 uppercase tracking-wide mb-5">
              What happens next
            </h2>

            <ol className="relative space-y-0" aria-label="Order progress">
              {TIMELINE.map((step, idx) => {
                const Icon = step.icon;
                const isLast = idx === TIMELINE.length - 1;

                return (
                  <li key={step.title} className="flex gap-4 pb-6 last:pb-0 relative">
                    {/* Vertical connector */}
                    {!isLast && (
                      <div
                        className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-neutral-100"
                        aria-hidden="true"
                      />
                    )}

                    {/* Icon bubble */}
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${step.color} ${step.active ? 'ring-4 ring-brand-100' : ''} z-10`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 pt-1">
                      <p
                        className={`font-semibold text-body-sm ${step.active ? 'text-neutral-900' : 'text-neutral-400'}`}
                      >
                        {step.title}
                        {step.active && (
                          <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wide">
                            Current
                          </span>
                        )}
                      </p>
                      <p className={`text-caption mt-0.5 ${step.active ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {step.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* CTA footer */}
          <div className="px-6 pb-8 space-y-3 border-t border-neutral-100 pt-6">
            <a
              id="success-whatsapp-btn"
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button
                variant="whatsapp"
                size="lg"
                fullWidth
                leadingIcon={<MessageCircle className="w-4 h-4" />}
                trailingIcon={<ChevronRight className="w-4 h-4" />}
              >
                Track Order on WhatsApp
              </Button>
            </a>

            <Link href="/shop/" className="block w-full">
              <Button
                id="success-shop-more-btn"
                variant="secondary"
                size="lg"
                fullWidth
                leadingIcon={<ShoppingBag className="w-4 h-4" />}
              >
                Shop More
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-caption text-neutral-400 mt-6">
          Questions?{' '}
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline font-medium"
          >
            Chat with us on WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Exported Page Wrapped in Suspense ───────────────────────────────────────
export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
          <p className="text-body-sm text-neutral-500 font-medium animate-pulse">
            Loading order details...
          </p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
