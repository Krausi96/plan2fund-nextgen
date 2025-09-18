/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to enable API routes - FORCE STANDARD NEXT.JS BUILD
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Enable API routes for Vercel deployment
  experimental: {
    outputFileTracingRoot: undefined,
  },
}

module.exports = nextConfig
