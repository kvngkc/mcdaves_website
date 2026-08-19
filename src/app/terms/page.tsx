// src/app/terms/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { urlConfig, businessIdentity } from '@/config';

export const metadata: Metadata = {
  title: 'Terms of Service | McDaves Nigeria',
  description: 'Terms of service and commercial policies for McDaves Optical and Sightly Eyewear.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/terms`,
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 py-12 md:py-16">
      <div className="container-main max-w-3xl mx-auto px-4 bg-white p-8 md:p-12 rounded-2xl border border-neutral-200">
        <h1 className="text-3xl font-bold text-neutral-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-neutral-500 mb-8">Last updated: August 2026</p>
        
        <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing and purchasing from {businessIdentity.tradeName}, you agree to abide by these Terms of Service. All orders for prescription lenses are custom crafted based on submitted optical prescriptions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">2. Prescription Verification</h2>
            <p>
              Customers ordering prescription eyewear confirm that their submitted prescription is valid and prescribed by a licensed optometrist or ophthalmologist.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">3. Payments & Currency</h2>
            <p>
              All prices are displayed in Nigerian Naira (NGN, ₦). Payments are processed securely via Paystack or direct corporate bank transfer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">4. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
