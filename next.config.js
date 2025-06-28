/** @type {import('next').NextConfig} */
const nextConfig = {
  // If you decide to use 'export' later, be aware that rewrites might not work
  // output: 'export',

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true
  },

  // OPTIONAL: Rewrites for API proxying during development or if Vercel handles proxying
  // This can simplify your frontend fetch calls (e.g., fetch('/api/data'))
  // but remember, the backend still needs proper CORS for truly direct cross-origin calls
  // or if this rewrite isn't used in production.
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Any request to /api/* from your frontend
        // This destination should point to your deployed backend URL
        destination: process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/:path*` : 'https://auriga-racing-backend.onrender.com/:path*',
      },
    ];
  },
};

module.exports = nextConfig;