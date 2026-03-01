/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['convex'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'arxiv.org' },
      { protocol: 'https', hostname: '*.arxiv.org' },
    ]
  }
}

module.exports = nextConfig
