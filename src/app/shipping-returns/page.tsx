// src/app/shipping-returns/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { Truck, RotateCcw, ShieldCheck, MapPin } from 'lucide-react';
import { urlConfig, deliveryConfig, serviceConfig, businessIdentity } from '@/config';

export const metadata: Metadata = {
  title: 'Shipping & Returns Policy | McDaves Nigeria',
  description: 'Delivery timelines, shipping fees, and return policies for McDaves eyewear and optical services.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/shipping-returns`,
  },
};

export default function ShippingReturnsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 py-12 md:py-16">
      <div className="container-main max-w-3xl mx-auto px-4 bg-white p-8 md:p-12 rounded-2xl border border-neutral-200">
        <h1 className="text-3xl font-bold text-neutral-900 mb-6">Shipping & Returns</h1>
        
        <div className="space-y-8 text-neutral-700 text-sm leading-relaxed">
          {/* Shipping Rates & Timelines */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-brand-600 font-bold text-base">
              <Truck className="w-5 h-5" />
              <h2>Delivery Timelines & Rates</h2>
            </div>
            <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-neutral-200">
                <span className="font-semibold text-neutral-900">Lagos Standard Delivery</span>
                <span>{deliveryConfig.timelines.lagosDelivery} (₦{deliveryConfig.standardFee.toLocaleString()})</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200">
                <span className="font-semibold text-neutral-900">Nationwide Delivery</span>
                <span>{deliveryConfig.timelines.nationwideDelivery}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200">
                <span className="font-semibold text-neutral-900">Free Delivery Threshold</span>
                <span className="font-semibold text-brand-700">Orders ₦{deliveryConfig.freeThreshold.toLocaleString()} and above</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-neutral-900">Lagos Island Practice Pickup</span>
                <span>{deliveryConfig.timelines.lagosPickup} (Free)</span>
              </div>
            </div>
          </section>

          {/* Returns & Warranty */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-brand-600 font-bold text-base">
              <RotateCcw className="w-5 h-5" />
              <h2>Returns & Optical Guarantee</h2>
            </div>
            <p>
              We stand behind every pair of handcrafted glasses and prescription lenses we craft. If you experience any visual discomfort or fitting issues, our optical team provides free adjustments and prescription verification within {serviceConfig.policies.lensRemakeDays} days of receiving your order. Unworn frames in original condition may be returned within {serviceConfig.policies.frameReturnDays} days for exchange.
            </p>
          </section>

          {/* Location */}
          <section className="space-y-2 pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-2 text-neutral-900 font-semibold">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Physical Pickup Location</span>
            </div>
            <p className="text-neutral-600">
              {businessIdentity.contact.address.fullAddress}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
