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
  // Currently redirecting to WhatsApp as OptiSource is incomplete
  b2bOrderingSystemUrl: process.env.NEXT_PUBLIC_B2B_ORDERING_URL || 'https://wa.me/2348152346649?text=Hello%2C%20I%20am%20interested%20in%20McDaves%20B2B%20optical%20supply.%20Please%20provide%20me%20with%20your%20wholesale%20catalog%20and%20pricing%20details.',

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
