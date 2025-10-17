/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to enable API routes - FORCE STANDARD NEXT.JS BUILD
  trailingSlash: false,
  // Temporarily disable ESLint during build to focus on TypeScript errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable API routes for Vercel deployment
  experimental: {
    outputFileTracingRoot: undefined,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // i18n configuration
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  // Bundle analyzer (uncomment for analysis)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
