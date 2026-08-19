// src/config/urls.ts
/**
 * Canonical URL & Domain Configuration Single Source of Truth (SSOT).
 * Prevents hardcoding of production domains, staging leaks, and provides URL utilities.
 */

export const urlConfig = {
  // Production Base Domain
  productionBaseUrl: 'https://mcdaves.com.ng',

  // Current Active App Base URL (supports local dev & custom env overrides)
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://mcdaves.com.ng',

  // B2B Ordering System Portal (OptiSource / Trade Portal)
  b2bOrderingSystemUrl: process.env.NEXT_PUBLIC_B2B_ORDERING_URL || 'https://optisource-two.vercel.app/',

  // Admin Portal URL
  adminPortalUrl: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://iamadmin.mcdaves.com.ng',
} as const;

/**
 * Returns a canonical full URL for a given relative path.
 * Example: getCanonicalUrl('/shop') -> 'https://mcdaves.com.ng/shop'
 */
export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${urlConfig.productionBaseUrl}${cleanPath === '/' ? '' : cleanPath}`;
}
