// src/components/try-on/VTOExpressCheckoutDrawer.tsx
/**
 * Express In-Fitting Checkout Drawer for Virtual Try-On.
 * Reduces friction by allowing direct purchase & Paystack payment right inside the fitting room session.
 */

'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Truck,
  Check,
  MessageCircle,
  X,
  Sparkles,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';
import { deliveryConfig, serviceConfig } from '@/config/services';

export type LensOption = 'frame_only' | 'blue_light' | 'prescription';

interface LensConfig {
  id: LensOption;
  label: string;
  priceDelta: number;
  description: string;
  badge?: string;
  isCustomQuote?: boolean;
}

const LENS_CONFIGS: LensConfig[] = [
  {
    id: 'frame_only',
    label: 'Frame Only',
    priceDelta: 0,
    description: 'Standard clear demo lenses (prescription ready)',
    isCustomQuote: false,
  },
  {
    id: 'blue_light',
    label: serviceConfig.lensReplacement.tiers.find(t => t.id === 'blue_cut')?.name || 'Anti-Blue Light Shield',
    priceDelta: 0,
    description: 'Zero-power screen protection. (Billed later)',
    badge: 'Popular',
    isCustomQuote: true,
  },
  {
    id: 'prescription',
    label: 'Prescription Lenses',
    priceDelta: 0,
    description: 'Custom optical lenses. (Billed later based on prescription)',
    isCustomQuote: true,
  },
];

const DELIVERY_ZONES = deliveryConfig.zones;

export interface VTOExpressCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  productSlug: string;
  productName: string;
  variantName?: string;
  variantSlug?: string;
  variantId?: string;
  basePrice: number;
  onSuccess?: () => void;
}

import { Turnstile } from '@marsidev/react-turnstile';

export function VTOExpressCheckoutDrawer({
  isOpen,
  onClose,
  productId,
  productSlug,
  productName,
  variantName,
  variantSlug,
  variantId,
  basePrice,
}: VTOExpressCheckoutDrawerProps) {
  const [selectedLens, setSelectedLens] = useState<LensOption>('frame_only');
  const [selectedZone, setSelectedZone] = useState<string>(DELIVERY_ZONES[0].id);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentLensConfig = LENS_CONFIGS.find((l) => l.id === selectedLens) || LENS_CONFIGS[0];
  const currentZoneConfig = DELIVERY_ZONES.find((z) => z.id === selectedZone) || DELIVERY_ZONES[0];

  const lensFee = currentLensConfig.priceDelta;
  const shippingFee = currentZoneConfig.fee;
  const grandTotal = basePrice + lensFee + shippingFee;

  const handlePaystackCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMessage('Please fill in all delivery details.');
      return;
    }

    if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setErrorMessage('Please complete the security check.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Initialize Paystack Transaction via /api/pay/initialize
      const res = await fetch('/api/pay/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail.trim(),
          amount: grandTotal,
          currency: 'NGN',
          callbackUrl: `${window.location.origin}/payment/callback`,
          turnstileToken,
          metadata: {
            source: 'VTO_DIRECT_CHECKOUT',
            productId,
            productSlug,
            productName,
            variantName,
            variantSlug,
            variantId,
            lensType: selectedLens,
            lensLabel: currentLensConfig.label,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            deliveryAddress: deliveryAddress.trim(),
            deliveryZone: currentZoneConfig.label,
            shippingFee,
            grandTotal,
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.authorizationUrl) {
        // Direct redirect to Paystack secure checkout
        window.location.href = data.authorizationUrl;
      } else {
        setErrorMessage(data.error || 'Unable to start Paystack checkout. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage('Network error initiating payment. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  const whatsappInquiryUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    `Hello McDaves! I am trying on "${productName}${variantName ? ` (${variantName})` : ''}" in your 3D VTO and would like to ask a question before ordering.`,
  )}`;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Express Checkout
              </h3>
              <p className="text-[11px] text-neutral-400">
                {productName} {variantName ? `• ${variantName}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handlePaystackCheckout} className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* 1. Lens Selection */}
          <div className="space-y-2">
            <label className="text-neutral-300 font-bold block">
              1. Choose Lens Option
            </label>
            <div className="grid grid-cols-1 gap-2">
              {LENS_CONFIGS.map((lens) => {
                const isSelected = selectedLens === lens.id;
                return (
                  <button
                    key={lens.id}
                    type="button"
                    onClick={() => setSelectedLens(lens.id)}
                    className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-600/15 text-white ring-1 ring-brand-500'
                        : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{lens.label}</span>
                        {lens.badge && (
                          <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 text-[9px] font-extrabold rounded-full">
                            {lens.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400">{lens.description}</p>
                    </div>
                    <span className="font-mono font-bold text-brand-400 whitespace-nowrap">
                      {lens.isCustomQuote ? 'Custom Quote' : (lens.priceDelta === 0 ? 'Included' : `+₦${lens.priceDelta.toLocaleString()}`)}
                    </span>
                  </button>
                );
              })}
            </div>
            {currentLensConfig.isCustomQuote && (
              <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-200 text-[11px] leading-relaxed mt-2">
                <strong>Important:</strong> Because prescriptions vary by complexity, we don't charge for lenses upfront. You are only paying to secure your frame today. Our optical team will review your prescription and send a secure invoice for your custom lenses separately.
              </div>
            )}
          </div>

          {/* 2. Customer Delivery Details */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <label className="text-neutral-300 font-bold block">
              2. Delivery & Contact Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="Full Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-brand-500"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number (WhatsApp) *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-brand-500"
              />
            </div>

            <input
              type="email"
              required
              placeholder="Email Address (for Paystack receipt) *"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-brand-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-brand-500"
              >
                {DELIVERY_ZONES.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.label} (₦{zone.fee.toLocaleString()})
                  </option>
                ))}
              </select>

              <input
                type="text"
                required
                placeholder="Street Address, Lagos *"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-brand-500"
              />
            </div>
          </div>

          {/* 3. Summary & Paystack Action */}
          <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
            <div className="flex justify-between text-neutral-400 text-xs">
              <span>Frame ({productName})</span>
              <span className="font-mono text-white">₦{basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-400 text-xs">
              <span>{currentLensConfig.label}</span>
              <span className="font-mono text-white">
                {currentLensConfig.isCustomQuote ? 'Custom Quote (Billed Later)' : (lensFee > 0 ? `+₦${lensFee.toLocaleString()}` : 'Included')}
              </span>
            </div>
            <div className="flex justify-between text-neutral-400 text-xs">
              <span>Delivery Fee</span>
              <span className="font-mono text-white">+₦{shippingFee.toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-neutral-800 flex justify-between items-center">
              <span className="font-bold text-white text-sm">Total Amount</span>
              <span className="font-mono font-extrabold text-brand-400 text-base">
                ₦{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
            <div className="flex justify-center mt-2 mb-2">
              <Turnstile 
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setErrorMessage('Security check failed. Please refresh.')}
              />
            </div>
          )}

          {/* Checkout Button */}
          <button
            type="submit"
            disabled={isSubmitting || (!turnstileToken && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:bg-neutral-800 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-900/30 flex items-center justify-center gap-2 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Redirecting to Paystack...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-brand-300" />
                <span>Pay ₦{grandTotal.toLocaleString()} with Paystack</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Secure via Paystack
            </span>
            <span>•</span>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-green-400 flex items-center gap-1 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-green-400" />
              Questions? Chat on WhatsApp
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VTOExpressCheckoutDrawer;
