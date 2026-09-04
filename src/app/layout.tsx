import type { Metadata, Viewport } from 'next';
import './globals.css';
import NextTopLoader from 'nextjs-toploader';
import { SiteShell } from '@/components/layout/SiteShell';
import { CartProvider } from '@/context/CartContext';
import { businessIdentity, urlConfig } from '@/config';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

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
  metadataBase: new URL(urlConfig.productionBaseUrl),
  alternates: {
    canonical: urlConfig.productionBaseUrl,
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
    url: urlConfig.productionBaseUrl,
    siteName: businessIdentity.tradeName,
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
      '@id': `${urlConfig.productionBaseUrl}/#organization`,
      name: businessIdentity.tradeName,
      alternateName: `${businessIdentity.brandName} Eyewear & Optical Supplies`,
      url: urlConfig.productionBaseUrl,
      logo: `${urlConfig.productionBaseUrl}/images/brand/og-image.jpg`,
      image: `${urlConfig.productionBaseUrl}/images/brand/og-image.jpg`,
      description:
        'Two generations of optical precision in Lagos, Nigeria. Nigerian optical materials supplier, Sightly handcrafted eyewear, and prescription lens replacement.',
      telephone: `+${businessIdentity.contact.rawPhone}`,
      email: businessIdentity.contact.email,
      priceRange: '₦₦',
      currenciesAccepted: 'NGN',
      paymentAccepted: 'Cash, Debit Card, Bank Transfer, Paystack',
      address: {
        '@type': 'PostalAddress',
        streetAddress: businessIdentity.contact.address.streetAddress,
        addressLocality: businessIdentity.contact.address.addressLocality,
        addressRegion: businessIdentity.contact.address.addressRegion,
        addressCountry: businessIdentity.contact.address.addressCountry,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: businessIdentity.contact.geo.latitude,
        longitude: businessIdentity.contact.geo.longitude,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: businessIdentity.hours.regular.daysOfWeek,
          opens: businessIdentity.hours.regular.opens,
          closes: businessIdentity.hours.regular.closes,
        },
      ],
      sameAs: [
        businessIdentity.social.instagram,
        businessIdentity.social.facebook,
        businessIdentity.social.whatsapp,
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${urlConfig.productionBaseUrl}/#website`,
      url: urlConfig.productionBaseUrl,
      name: businessIdentity.brandName,
      publisher: {
        '@id': `${urlConfig.productionBaseUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${urlConfig.productionBaseUrl}/shop?search={search_term_string}`,
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
    <html lang="en" className="h-full w-full overflow-x-hidden" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Global JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchemaJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full w-full antialiased bg-white text-neutral-900 selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
        <NextTopLoader color="#d97706" height={3} showSpinner={false} />
        <CartProvider>
          <div className="flex flex-col min-h-screen w-full relative overflow-x-hidden">
            <SiteShell>{children}</SiteShell>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
