// src/app/copyright/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { urlConfig, businessIdentity } from '@/config';

export const metadata: Metadata = {
  title: 'Copyright Policy | McDaves Nigeria',
  description: 'Copyright and Intellectual Property policy for McDaves Optical.',
  alternates: {
    canonical: `${urlConfig.productionBaseUrl}/copyright`,
  },
};

export default function CopyrightPage() {
  return (
    <main className="min-h-screen bg-neutral-50 py-12 md:py-16">
      <div className="container-main max-w-3xl mx-auto px-4 bg-white p-8 md:p-12 rounded-2xl border border-neutral-200">
        <h1 className="text-3xl font-bold text-neutral-900 mb-6">Copyright Policy</h1>
        <p className="text-sm text-neutral-500 mb-8">Last updated: August 2026</p>
        
        <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">1. Intellectual Property</h2>
            <p>
              All content on this website, including but not limited to text, graphics, logos, images, audio clips, digital downloads, data compilations, and software (including our 3D Virtual Try-On models), is the property of {businessIdentity.tradeName} or its content suppliers and is protected by Nigerian and international copyright laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">2. Limited License</h2>
            <p>
              {businessIdentity.tradeName} grants you a limited, non-exclusive, non-transferable, and revocable license to access and use the website and its content for personal, non-commercial purposes. You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our website without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">3. Trademarks</h2>
            <p>
              {businessIdentity.tradeName}, Sightly Eyewear, and all related names, logos, product and service names, designs, and slogans are trademarks of {businessIdentity.tradeName} or its affiliates or licensors. You must not use such marks without our prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">4. Contact Information</h2>
            <p>
              If you believe that any content on this website infringes your intellectual property rights, please contact us immediately at {businessIdentity.contact.email} with a detailed description of the alleged infringement.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
