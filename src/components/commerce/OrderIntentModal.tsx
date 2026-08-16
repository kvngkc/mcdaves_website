// src/components/commerce/OrderIntentModal.tsx
/**
 * Customer Profile Capture & Order Intent Modal for McDaves
 * Anonymous until intent is expressed. Deduplicates customer by phone number.
 * Captures historical price snapshot and forwards structured non-sensitive context to WhatsApp.
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  Eye,
  FileText,
} from 'lucide-react';
import {
  ResolvedProduct,
  ResolvedProductVariant,
  LensOption,
  PrescriptionValues,
} from '@/lib/commerce/types';
import { Button, Input, Price } from '@/components/ui';

export interface OrderIntentModalProps {
  open: boolean;
  onClose: () => void;
  product: ResolvedProduct;
  variant: ResolvedProductVariant;
  quantity?: number;
}

export function OrderIntentModal({
  open,
  onClose,
  product,
  variant,
  quantity = 1,
}: OrderIntentModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Lens Preference
  const [lensOption, setLensOption] = useState<LensOption>('plano');
  const [rxSphereOD, setRxSphereOD] = useState('');
  const [rxCylOD, setRxCylOD] = useState('');
  const [rxAxisOD, setRxAxisOD] = useState('');
  const [rxSphereOS, setRxSphereOS] = useState('');
  const [rxCylOS, setRxCylOS] = useState('');
  const [rxAxisOS, setRxAxisOS] = useState('');
  const [rxPD, setRxPD] = useState('');

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIntent, setCreatedIntent] = useState<{
    customerId: string;
    intentId: string;
    whatsappUrl: string;
  } | null>(null);

  if (!open) return null;

  const totalAmount = variant.effectivePrice * quantity;
  const primaryImage =
    variant.media?.[0]?.url ||
    product.media?.[0]?.url ||
    '/images/products/placeholder.webp';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const lensRequestData =
        lensOption !== 'plano'
          ? {
              option: lensOption,
              prescriptionValues:
                lensOption === 'values'
                  ? {
                      sphereOD: rxSphereOD,
                      cylOD: rxCylOD,
                      axisOD: rxAxisOD,
                      sphereOS: rxSphereOS,
                      cylOS: rxCylOS,
                      axisOS: rxAxisOS,
                      pd: rxPD,
                    }
                  : undefined,
              customerNotes: notes,
            }
          : undefined;

      const res = await fetch('/api/order-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: fullName.trim(),
            phone: cleanPhone,
            email: email.trim() || undefined,
          },
          variantId: variant.id,
          quantity,
          source: 'whatsapp_cta',
          notes: notes.trim() || undefined,
          lensRequest: lensRequestData,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to create order intent.');
      }

      const data = await res.json();
      setCreatedIntent({
        customerId: data.customer.id,
        intentId: data.intent.id,
        whatsappUrl: data.whatsappUrl,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (createdIntent?.whatsappUrl) {
      window.open(createdIntent.whatsappUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 leading-tight">
                {createdIntent ? 'Order Intent Created' : 'Order via WhatsApp'}
              </h2>
              <p className="text-xs text-neutral-500">
                Direct sales consultation with McDaves optical specialists
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-neutral-200/60 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Product Variant Recap Card */}
          <div className="flex items-center gap-4 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80">
            <div className="relative w-16 h-16 bg-white rounded-xl overflow-hidden border border-neutral-200 flex-shrink-0">
              <Image
                src={primaryImage}
                alt={variant.name}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                Sightly Collection
              </span>
              <h3 className="text-sm font-bold text-neutral-900 truncate">
                {product.name}
              </h3>
              <p className="text-xs text-neutral-500 truncate">
                Color: <span className="font-semibold text-neutral-800">{variant.colorName}</span>
                {variant.effectiveSpecifications?.frameSize && (
                  <span> · {variant.effectiveSpecifications.frameSize}</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <Price amount={totalAmount} size="sm" />
              {quantity > 1 && (
                <p className="text-[11px] text-neutral-400">Qty: {quantity}</p>
              )}
            </div>
          </div>

          {/* SUCCESS STATE */}
          {createdIntent ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-neutral-900">
                  Ready to Connect on WhatsApp!
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  We have created your McDaves Customer Profile and Order Intent reference.
                </p>
              </div>

              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">McDaves Customer ID:</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {createdIntent.customerId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Order Intent Ref:</span>
                  <span className="font-mono font-bold text-brand-700">
                    {createdIntent.intentId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Product & Variant:</span>
                  <span className="font-medium text-neutral-800">
                    {product.name} ({variant.colorName})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Snapshot Price:</span>
                  <span className="font-bold text-neutral-900">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                id="intent-open-whatsapp-btn"
                onClick={handleOpenWhatsApp}
                className="w-full py-3.5 px-6 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 active:scale-98"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Open WhatsApp Chat Now</span>
              </button>

              <p className="text-[11px] text-neutral-400">
                A McDaves sales representative is ready to guide you through lens options, fitting, and delivery.
              </p>
            </div>
          ) : (
            /* FORM STATE */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Customer Contact Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Your Contact Information
                </h4>

                <Input
                  label="Full Name *"
                  placeholder="e.g. Adebayo Ogunlesi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  label="Phone / WhatsApp Number *"
                  placeholder="e.g. 0812 345 6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  helperText="Used to identify your order intent in WhatsApp"
                  required
                />

                <Input
                  label="Email Address (Optional)"
                  type="email"
                  placeholder="e.g. adebayo@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Lens / Prescription Options */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Prescription / Lens Preference
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLensOption('plano')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                      lensOption === 'plano'
                        ? 'border-brand-600 bg-brand-50/60 text-brand-800 font-bold'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    Frame Only / Plano
                  </button>

                  <button
                    type="button"
                    onClick={() => setLensOption('whatsapp')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                      lensOption === 'whatsapp'
                        ? 'border-brand-600 bg-brand-50/60 text-brand-800 font-bold'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    Send on WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => setLensOption('values')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                      lensOption === 'values'
                        ? 'border-brand-600 bg-brand-50/60 text-brand-800 font-bold'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    Enter Values
                  </button>
                </div>

                {/* Prescription Values Drawer */}
                {lensOption === 'values' && (
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3 animate-in fade-in">
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Enter your prescription values (Sphere, Cyl, Axis, PD):
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-0.5">OD Sph</span>
                        <input
                          type="text"
                          placeholder="-1.25"
                          value={rxSphereOD}
                          onChange={(e) => setRxSphereOD(e.target.value)}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-center font-mono bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-0.5">OD Cyl</span>
                        <input
                          type="text"
                          placeholder="-0.50"
                          value={rxCylOD}
                          onChange={(e) => setRxCylOD(e.target.value)}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-center font-mono bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-0.5">OD Axis</span>
                        <input
                          type="text"
                          placeholder="180"
                          value={rxAxisOD}
                          onChange={(e) => setRxAxisOD(e.target.value)}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-center font-mono bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-0.5">PD (mm)</span>
                        <input
                          type="text"
                          placeholder="63"
                          value={rxPD}
                          onChange={(e) => setRxPD(e.target.value)}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-center font-mono bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-0.5">OS Sph</span>
                        <input
                          type="text"
                          placeholder="-1.00"
                          value={rxSphereOS}
                          onChange={(e) => setRxSphereOS(e.target.value)}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-center font-mono bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-0.5">OS Cyl</span>
                        <input
                          type="text"
                          placeholder="-0.25"
                          value={rxCylOS}
                          onChange={(e) => setRxCylOS(e.target.value)}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-center font-mono bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-0.5">OS Axis</span>
                        <input
                          type="text"
                          placeholder="90"
                          value={rxAxisOS}
                          onChange={(e) => setRxAxisOS(e.target.value)}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-center font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Special Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                  Questions or Notes for the Optician (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Do you have anti-reflective blue light coatings?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-xl text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing WhatsApp Consultation...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Continue to WhatsApp with Ref</span>
                  </>
                )}
              </button>

              {/* Trust Signal */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>No password needed. Snapshot price locked for 7 days.</span>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

export default OrderIntentModal;
