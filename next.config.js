/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['convex']
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'arxiv.org' },
      { protocol: 'https', hostname: '*.arxiv.org' },
    ]
  }
}

module.exports = nextConfig
