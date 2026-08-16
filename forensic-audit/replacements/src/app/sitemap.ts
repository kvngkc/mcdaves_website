import type { MetadataRoute } from 'next';
import { products } from '@/data/products';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mcdaves.com.ng';
  const now = new Date();

  const staticRoutes = [
    '/',
    '/shop/',
    '/try-on/',
    '/faq/',
    '/contact/',
    '/our-story/',
    '/services/repairs/',
    '/services/lens-replacement/',
    '/services/how-it-works/',
    '/pro/',
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: route === '/' ? 1 : 0.7,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/shop/${product.slug}/`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
