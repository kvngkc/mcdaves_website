// src/app/checkout/components/ReviewStep.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ShieldCheck,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { Button, Price } from '@/components/ui';
import { CartItem } from '@/lib/types';
import { CustomerDetails, DeliveryDetails } from './types';

interface ReviewStepProps {
  items: CartItem[];
  customer: CustomerDetails;
  delivery: DeliveryDetails;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paying: boolean;
  payError: string | null;
  onPay: () => void;
  onBack: () => void;
}

export function ReviewStep({
  items,
  customer,
  delivery,
  subtotal,
  deliveryFee,
  total,
  paying,
  payError,
  onPay,
  onBack,
}: ReviewStepProps) {
  return (
    <section className="space-y-4" aria-labelledby="step3-heading">
      {/* Order Summary card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/60">
          <h2 id="step3-heading" className="text-h4 font-semibold text-neutral-900">
            Order Summary
          </h2>
        </div>

        <ul className="divide-y divide-neutral-100 px-6">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.variantId ?? item.color ?? 'default'}`}
              className="py-4 flex gap-4"
            >
              {/* Image */}
              <div className="relative w-16 h-16 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="font-semibold text-body-sm text-neutral-900 truncate">
                  {item.name}
                </p>
                {item.color && (
                  <p className="text-caption text-neutral-500">Color: {item.color}</p>
                )}
                <p className="text-caption text-neutral-500">Qty: {item.quantity}</p>
              </div>

              {/* Price */}
              <div className="flex-shrink-0 flex items-center">
                <Price amount={item.price * item.quantity} size="sm" />
              </div>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="border-t border-neutral-100 bg-neutral-50/60 px-6 py-5 space-y-2.5">
          <div className="flex justify-between text-body-sm text-neutral-600">
            <span>Subtotal</span>
            <Price amount={subtotal} size="sm" />
          </div>
          <div className="flex justify-between text-body-sm text-neutral-600">
            <span>Delivery</span>
            <span>
              {deliveryFee === 0 ? (
                <span className="font-semibold text-brand-700">Free</span>
              ) : (
                <Price amount={deliveryFee} size="sm" />
              )}
            </span>
          </div>
          <div className="flex justify-between text-body font-semibold text-neutral-900 pt-2 border-t border-neutral-200">
            <span>Total</span>
            <Price amount={total} size="md" />
          </div>
        </div>
      </div>

      {/* Delivery & Contact recap */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm px-6 py-5 space-y-3">
        <h3 className="text-caption font-semibold text-neutral-700 uppercase tracking-wide">
          Delivery Details
        </h3>
        <div className="text-body-sm text-neutral-700 space-y-1">
          <p><span className="font-medium">Name:</span> {customer.fullName}</p>
          <p><span className="font-medium">Email:</span> {customer.email}</p>
          <p><span className="font-medium">Phone:</span> {customer.phone}</p>
          <p>
            <span className="font-medium">Address:</span>{' '}
            {customer.address}, {customer.city}, {customer.state}
          </p>
          <p>
            <span className="font-medium">Method:</span>{' '}
            {delivery.method === 'door' ? 'Door Delivery' : 'Pickup in Lagos'}
          </p>
          {delivery.notes && (
            <p>
              <span className="font-medium">Notes:</span> {delivery.notes}
            </p>
          )}
        </div>
      </div>

      {/* Error message */}
      {payError && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-red-50 border border-accent-rose/30 rounded-lg px-4 py-3 text-body-sm text-accent-rose"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>{payError}</p>
        </div>
      )}

      {/* Pay CTA */}
      <Button
        id="checkout-pay-btn"
        variant="primary"
        size="lg"
        fullWidth
        loading={paying}
        onClick={onPay}
        leadingIcon={!paying ? <Lock className="w-4 h-4" /> : undefined}
      >
        {paying
          ? 'Redirecting to Paystack…'
          : `Pay ₦${total.toLocaleString()} with Paystack`}
      </Button>

      {/* Trust micro-copy */}
      <div className="flex items-center justify-center gap-2 text-caption text-neutral-500">
        <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" aria-hidden="true" />
        <span>Secured by Paystack. Your payment is encrypted.</span>
      </div>

      {/* Back button */}
      <div className="flex justify-center pt-1">
        <Button
          id="checkout-back-step3"
          variant="tertiary"
          size="sm"
          onClick={onBack}
          leadingIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Back to Delivery
        </Button>
      </div>
    </section>
  );
}
