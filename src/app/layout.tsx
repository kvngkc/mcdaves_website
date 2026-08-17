import type { Metadata } from 'next';
import './globals.css';
import { SiteShell } from '@/components/layout/SiteShell';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: {
    default: 'McDaves | Eyeglasses, Prescription Lenses & Optical Supplies | Nigeria',
    template: '%s | McDaves Optical',
  },
  description:
    'Two generations of optical precision in Lagos, Nigeria. Handcrafted Sightly eyeglasses, blue-cut & progressive prescription lens replacement, and wholesale optical materials.',
  keywords: [
    'eyeglasses Nigeria',
    'prescription lenses Lagos',
    'optical supplies Nigeria',
    'Sightly frames',
    'lens replacement Lagos',
    'optical lab materials Nigeria',
    'designer frames Lagos',
    'blue cut lenses Nigeria',
    'photochromic lenses Nigeria',
    'progressive lenses Nigeria',
  ],
  authors: [{ name: 'McDaves Optical' }],
  creator: 'McDaves Optical',
  metadataBase: new URL('https://mcdaves.com.ng'),
  alternates: {
    canonical: 'https://mcdaves.com.ng',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://mcdaves.com.ng',
    siteName: 'McDaves Optical',
    title: 'McDaves | Eyeglasses, Prescription Lenses & Optical Supplies | Nigeria',
    description:
      'Two generations of optical precision in Lagos, Nigeria. Handcrafted Sightly eyeglasses, prescription lens replacement, and wholesale optical materials.',
    images: [
      {
        url: '/images/brand/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'McDaves Optical — Two Generations of Optical Precision in Nigeria',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'McDaves | Eyeglasses, Prescription Lenses & Optical Supplies | Nigeria',
    description:
      'Two generations of optical precision in Lagos, Nigeria. Handcrafted Sightly eyeglasses, prescription lens replacement, and wholesale optical materials.',
    images: ['/images/brand/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const globalSchemaJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Optician',
      '@id': 'https://mcdaves.com.ng/#organization',
      name: 'McDaves Optical',
      alternateName: 'McDaves Eyewear & Optical Supplies',
      url: 'https://mcdaves.com.ng',
      logo: 'https://mcdaves.com.ng/images/brand/og-image.jpg',
      image: 'https://mcdaves.com.ng/images/brand/og-image.jpg',
      description:
        'Two generations of optical precision in Lagos, Nigeria. Nigerian optical materials supplier, Sightly handcrafted eyewear, and prescription lens replacement.',
      telephone: '+2348152346649',
      email: 'mcdavesopticals@gmail.com',
      priceRange: '₦₦',
      currenciesAccepted: 'NGN',
      paymentAccepted: 'Cash, Debit Card, Bank Transfer, Paystack',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '4, Nnamdi Azikwe Street',
        addressLocality: 'Lagos',
        addressRegion: 'Lagos State',
        addressCountry: 'NG',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 6.4531,
        longitude: 3.3894,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '17:00',
        },
      ],
      sameAs: [
        'https://instagram.com/mcdavesoptical',
        'https://facebook.com/mcdavesoptical',
        'https://wa.me/2348152346649',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://mcdaves.com.ng/#website',
      url: 'https://mcdaves.com.ng',
      name: 'McDaves',
      publisher: {
        '@id': 'https://mcdaves.com.ng/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://mcdaves.com.ng/shop?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchemaJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <CartProvider>
          <SiteShell>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
