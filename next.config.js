/** @type {import('next').NextConfig} */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co https://api.paystack.co",
  "frame-src https://challenges.cloudflare.com",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/vto-models/:path*',
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uijncyzhguftcdonkcdg.supabase.co'}/storage/v1/object/public/vto-models/:path*`,
      },
      {
        source: '/product-media/:path*',
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uijncyzhguftcdonkcdg.supabase.co'}/storage/v1/object/public/product-media/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Step 3.9 (expand): observe violations before enforcing.
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
