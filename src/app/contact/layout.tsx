// src/app/contact/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Lagos Optical Store, Eyewear & Lens Support - McDaves',
  description:
    'Get in touch with McDaves Optical in Lagos, Nigeria. Inquire about Sightly eyeglasses, prescription lens replacement, wholesale lab supplies, or chat directly on WhatsApp.',
  alternates: {
    canonical: 'https://mcdaves.com.ng/contact',
  },
  openGraph: {
    title: 'Contact Us | Lagos Optical Store, Eyewear & Lens Support - McDaves',
    description:
      'Get in touch with McDaves Optical in Lagos, Nigeria. Inquire about eyeglasses, lens replacement, or wholesale supplies.',
    url: 'https://mcdaves.com.ng/contact',
  },
};

const contactSchemaJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  '@id': 'https://mcdaves.com.ng/contact#webpage',
  url: 'https://mcdaves.com.ng/contact',
  name: 'Contact McDaves Optical',
  description: 'Customer and wholesale contact page for McDaves Optical in Lagos, Nigeria.',
  mainEntity: {
    '@type': 'Optician',
    name: 'McDaves Optical',
    telephone: '+2348152346649',
    email: 'mcdavesopticals@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '4, Nnamdi Azikwe Street',
      addressLocality: 'Lagos',
      addressRegion: 'Lagos State',
      addressCountry: 'NG',
    },
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchemaJsonLd) }}
      />
      {children}
    </>
  );
}
