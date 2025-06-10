/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Handle file uploads and performance
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Enable compression
  compress: true,
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // Enable response caching
  async headers() {
    return [
      {
        source: '/api/tests',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/api/admin/leaderboard',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=120, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/api/files/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Ensure proper API route handling
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
