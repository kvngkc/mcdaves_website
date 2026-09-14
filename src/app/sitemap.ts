import type { MetadataRoute } from 'next';
import { getLiveStorefrontProducts } from '@/lib/commerce/storefront-catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mcdaves.com.ng';
  const now = new Date();

  const staticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/shop', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/try-on', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/services/lens-replacement', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/our-story', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/contact', priority: 0.75, changeFrequency: 'monthly' as const },
    { path: '/pro', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/pro/catalog', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/pro/how-it-works', priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  let products: Awaited<ReturnType<typeof getLiveStorefrontProducts>> = [];
  try {
    products = await getLiveStorefrontProducts();
  } catch (error) {
    console.warn('[Sitemap] Live catalog unavailable; returning static routes only.', error);
  }

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/shop/${product.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
  ];
}
