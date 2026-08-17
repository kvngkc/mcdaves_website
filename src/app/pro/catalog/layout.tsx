// src/app/pro/catalog/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Optical Supplies Catalog & Surfacing Blanks | McDaves B2B Nigeria',
  description:
    'Search and filter finished single vision lenses, blue cut, photochromic, bifocals, progressive lenses, and surfacing blanks for Nigerian optical practices.',
  alternates: {
    canonical: 'https://mcdaves.com.ng/pro/catalog',
  },
  openGraph: {
    title: 'Optical Supplies Catalog & Surfacing Blanks | McDaves B2B Nigeria',
    description:
      'Search and filter finished single vision lenses, blue cut, photochromic, and surfacing blanks for Nigerian optical practices.',
    url: 'https://mcdaves.com.ng/pro/catalog',
  },
};

export default function ProCatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
