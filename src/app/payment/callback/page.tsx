// src/app/payment/callback/page.tsx
// ─── Payment Callback Page ─────────────────────────────────────────────────────
// Paystack redirects here after a payment attempt.
// Reads ?reference= from URL, verifies via /api/pay/verify, shows result & order reference.
'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  MessageCircle,
  RefreshCcw,
  ShoppingBag,
  ShieldCheck,
  Receipt,
  PackageCheck,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button, Price } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

interface ExtendedVerifyResult {
  status: 'success' | 'failed' | 'pending';
  reference: string;
  amount: number;
  paidAt?: string;
  channel?: string;
  orderId?: string;
  customerId?: string;
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center text-center px-4 py-16 gap-6 animate-pulse">
      <div className="w-20 h-20 rounded-full bg-neutral-200 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-neutral-400 animate-spin" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        <div className="h-6 bg-neutral-200 rounded-lg w-48 mx-auto" />
        <div className="h-4 bg-neutral-100 rounded-lg w-64 mx-auto" />
      </div>
      <p className="text-body-sm text-neutral-500">Verifying your payment with Paystack…</p>
    </div>
  );
}

// ─── Success View ──────────────────────────────────────────────────────────────
interface SuccessViewProps {
  result: ExtendedVerifyResult;
}

function SuccessView({ result }: SuccessViewProps) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || siteConfig.whatsappNumber;
  const whatsappMsg = encodeURIComponent(
    `Hi McDaves! I just completed my payment.\nOrder Ref: ${result.orderId || result.reference}\nPayment Ref: ${result.reference}\nPlease confirm my optical order dispatch. Thank you!`,
  );

  return (
    <div className="flex flex-col items-center text-center gap-6 px-4 py-12">
      {/* Icon */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
        <div className="relative w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-14 h-14 text-green-600" aria-hidden="true" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 mb-2">
          Payment Confirmed!
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-sm">
          Your official order has been created. Our optical team is preparing your frames.
        </p>
      </div>

      {/* Order details card */}
      <div className="w-full max-w-sm bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden text-left shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-200/80 bg-white">
          <Receipt className="w-4 h-4 text-brand-600" aria-hidden="true" />
          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Official Receipt & Order Summary
          </span>
        </div>
        <div className="px-5 py-4 space-y-3 text-xs">
          {result.orderId && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Order Reference</span>
              <span className="font-mono font-black text-brand-700 text-sm">
                {result.orderId}
              </span>
            </div>
          )}

          {result.customerId && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">McDaves Customer ID</span>
              <span className="font-mono font-bold text-neutral-900">
                {result.customerId}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-neutral-500 font-medium">Paystack Reference</span>
            <span className="font-mono font-medium text-neutral-700 text-[11px]">
              {result.reference}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60">
            <span className="text-neutral-500 font-medium">Amount Paid</span>
            <Price amount={result.amount} size="sm" />
          </div>

          {result.channel && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Payment Method</span>
              <span className="capitalize font-semibold text-neutral-800">
                {result.channel.replace('_', ' ')}
              </span>
            </div>
          )}

          {result.paidAt && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Date & Time</span>
              <span className="text-neutral-800">
                {new Date(result.paidAt).toLocaleString('en-NG', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <a
          id="callback-whatsapp-btn"
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button
            variant="whatsapp"
            size="lg"
            fullWidth
            leadingIcon={<MessageCircle className="w-4 h-4" />}
          >
            Track Order on WhatsApp
          </Button>
        </a>

        <Link href="/shop/" className="w-full">
          <Button
            id="callback-continue-shopping"
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={<ShoppingBag className="w-4 h-4" />}
          >
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Trust footer */}
      <p className="flex items-center gap-1.5 text-xs text-neutral-400">
        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
        Verified and secured by Paystack. Reference saved for your records.
      </p>
    </div>
  );
}

// ─── Failure View ──────────────────────────────────────────────────────────────
function FailureView({ reference }: { reference?: string }) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || siteConfig.whatsappNumber;
  const whatsappMsg = encodeURIComponent(
    'Hi McDaves! I had trouble completing my online payment. Can you assist me with bank transfer or another method?',
  );

  return (
    <div className="flex flex-col items-center text-center gap-6 px-4 py-12">
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
        <XCircle className="w-14 h-14 text-red-500" aria-hidden="true" />
      </div>

      <div>
        <h1 className="text-2xl font-black text-neutral-900 mb-2">
          Payment Not Completed
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-sm">
          Your payment was not successful or was cancelled. No charges were made to your account.
        </p>
        {reference && (
          <p className="text-xs text-neutral-400 mt-2 font-mono">
            Ref: {reference}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <a
          id="callback-whatsapp-pay-btn"
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button
            variant="whatsapp"
            size="lg"
            fullWidth
            leadingIcon={<MessageCircle className="w-4 h-4" />}
          >
            Pay via WhatsApp Consultation
          </Button>
        </a>

        <Link href="/shop/" className="w-full">
          <Button id="callback-shop-link" variant="secondary" size="lg" fullWidth>
            Return to Eyewear Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
type PageState = 'loading' | 'success' | 'failed' | 'error';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const reference =
    searchParams.get('reference') ??
    searchParams.get('trxref') ??
    (typeof window !== 'undefined' ? sessionStorage.getItem('mcdaves_pending_ref') : null) ??
    undefined;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [result, setResult] = useState<ExtendedVerifyResult | null>(null);

  const verify = useCallback(async () => {
    if (!reference) {
      setPageState('failed');
      return;
    }

    try {
      const res = await fetch(`/api/pay/verify?reference=${encodeURIComponent(reference)}`);
      if (!res.ok) throw new Error('Verification request failed');

      const data = (await res.json()) as ExtendedVerifyResult;
      setResult(data);

      if (data.status === 'success') {
        clearCart();
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('mcdaves_pending_ref');
          sessionStorage.removeItem('mcdaves_pending_total');
        }
        setPageState('success');
      } else {
        setPageState('failed');
      }
    } catch {
      setPageState('error');
    }
  }, [reference, clearCart]);

  useEffect(() => {
    verify();
  }, [verify]);

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black text-neutral-900 tracking-tight">
              McDaves
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden">
          {pageState === 'loading' && <LoadingSkeleton />}
          {pageState === 'success' && result && <SuccessView result={result} />}
          {(pageState === 'failed' || pageState === 'error') && (
            <FailureView reference={reference} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
