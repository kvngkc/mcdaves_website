// src/app/privacy/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { urlConfig, businessIdentity } from '@/config';

export const metadata: Metadata = {
  title: 'Privacy Policy | McDaves Nigeria',
  description: 'Privacy Policy and data protection standards for McDaves Optical and Sightly Eyewear.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-50 py-12 md:py-16">
      <div className="container-main max-w-3xl mx-auto px-4 bg-white p-8 md:p-12 rounded-2xl border border-neutral-200">
        <h1 className="text-3xl font-bold text-neutral-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-8">Last updated: August 2026</p>
        
        <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">1. Information We Collect</h2>
            <p>
              At {businessIdentity.tradeName}, we collect personal information necessary to process eyewear orders, provide prescription lens replacement, and deliver products across Nigeria. This includes your name, phone number, delivery address, prescription documents, and contact preferences.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">2. Camera & Virtual Try-On Data</h2>
            <p>
              Our 3D Virtual Try-On technology uses real-time computer vision landmarks to render frames on your face. All facial landmark processing occurs locally inside your web browser. We do not store, record, or transmit raw camera video or facial biometric data to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">3. How We Use Your Information</h2>
            <p>
              Your data is strictly used to fulfill eyewear orders, calibrate prescription lens specifications, coordinate logistics, and provide customer support via WhatsApp or email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">4. Contact Us</h2>
            <p>
              For inquiries regarding data privacy, contact us at {businessIdentity.contact.email} or visit our practice at {businessIdentity.contact.address.fullAddress}.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
