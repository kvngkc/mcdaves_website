/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'mcdaves.com.ng',
      },
    ],
  },
};

// Add rewrites for Vercel Edge Compression of GLB models
nextConfig.rewrites = async () => {
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
};

module.exports = nextConfig;
