/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to enable API routes - FORCE STANDARD NEXT.JS BUILD
  trailingSlash: true,
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
    localeDetection: true,
  },
  // Bundle analyzer (uncomment for analysis)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //     };
  //   }
  //   return config;
  // },
}

module.exports = nextConfig
