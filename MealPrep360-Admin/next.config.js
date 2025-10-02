/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output so Docker can use .next/standalone
  output: 'standalone',
  images: {
    domains: ['placehold.co', 'oaidalleapiprodscus.blob.core.windows.net'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      recharts: 'recharts/lib/index.js',
    }

    // Fix MUI module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Add module resolution paths for monorepo setups
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      require('path').resolve(__dirname, 'node_modules'),
      require('path').resolve(__dirname, '../node_modules'),
    ]

    return config
  },
  experimental: {
    esmExternals: 'loose',
  },
}

module.exports = nextConfig
