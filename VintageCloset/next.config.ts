import type { NextConfig } from "next";

// Main domain (same default as src/lib/site.ts); the old Vercel address forwards to it
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vintagecloset.app').replace(/\/$/, '');
const VERCEL_HOST = 'vintagecloset.vercel.app';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Forward the old Vercel address to the main domain; /api stays so Stripe webhooks keep working
  async redirects() {
    if (!SITE_URL || new URL(SITE_URL).host === VERCEL_HOST) return [];
    return [
      {
        source: '/:path((?!api/).*)',
        has: [{ type: 'host', value: VERCEL_HOST }],
        destination: `${SITE_URL}/:path`,
        permanent: true,
      },
    ];
  },
  // Basic security headers for every page (no CSP, so Stripe and Supabase keep working)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
