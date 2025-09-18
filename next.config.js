/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable API routes for static export
  experimental: {
    outputFileTracingRoot: undefined,
  },
}

module.exports = nextConfig
