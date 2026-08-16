import type { Metadata } from 'next';
import './globals.css';
import { SiteShell } from '@/components/layout/SiteShell';
import { CartProvider } from '@/context/CartContext';

const inter = { variable: '--font-inter', className: '' };

export const metadata: Metadata = {
  title: {
    default: 'McDaves | Three Generations of Optical Precision',
    template: '%s | McDaves',
  },
  description: 'Nigerian optical materials supplier and eyewear destination. Sightly frames, lens replacement, and wholesale optical supplies.',
  keywords: ['optical', 'eyewear', 'glasses', 'lens replacement', 'optical supplies Nigeria', 'Sightly'],
  authors: [{ name: 'McDaves Optical' }],
  creator: 'McDaves Optical',
  metadataBase: new URL('https://mcdaves.com.ng'),
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://mcdaves.com.ng',
    siteName: 'McDaves',
    title: 'McDaves | Three Generations of Optical Precision',
    description: 'Nigerian optical materials supplier and eyewear destination.',
    images: ['/images/brand/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'McDaves | Three Generations of Optical Precision',
    description: 'Nigerian optical materials supplier and eyewear destination.',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <CartProvider>
          <SiteShell>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
