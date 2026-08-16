import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mcdaves.com.ng';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/checkout/', '/payment/', '/pro/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
