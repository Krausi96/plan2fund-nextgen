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
  },
  // Enable API routes for Vercel deployment
  experimental: {
    // outputFileTracingRoot removed - not recognized in this Next.js version
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
  // Redirects for reorganized user pages
  async redirects() {
    return [
      // Redirect legacy routes to flattened structure
      { source: '/app/user/dashboard', destination: '/dashboard', permanent: true },
      { source: '/app/user/editor', destination: '/editor', permanent: true },
      { source: '/app/user/reco', destination: '/reco', permanent: true },
      { source: '/app/user/export', destination: '/editor', permanent: true },
      { source: '/app/user/preview', destination: '/editor', permanent: true },
      // Redirect marketing/legal routes
      { source: '/marketing/about', destination: '/about', permanent: true },
      { source: '/marketing/faq', destination: '/faq', permanent: true },
      { source: '/legal/privacy', destination: '/privacy', permanent: true },
      { source: '/legal/terms', destination: '/terms', permanent: true },
    ];
  },
  // Bundle analyzer (uncomment for analysis)
  webpack: (config, { isServer }) => {
    // Add path aliases for webpack (must match tsconfig.json paths)
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/features': path.resolve(__dirname, 'features'),
      '@/shared': path.resolve(__dirname, 'shared'),
      '@templates': path.resolve(__dirname, 'features/editor/lib/templates.ts'),
    };

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
        dns: false,
      };
    } else {
      // Server-side: Allow TypeScript files from scraper-lite
      config.resolve.extensionAlias = {
        '.js': ['.ts', '.tsx', '.js', '.jsx'],
        '.jsx': ['.tsx', '.jsx'],
      };
    }
    return config;
  },
}

module.exports = nextConfig
