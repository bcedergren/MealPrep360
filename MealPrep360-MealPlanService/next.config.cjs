/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
        net: false,
        TLS: false,
        crypto: false,
        child_process: false,
        'fs/promises': false,
      }
    }
    return config
  },
}

module.exports = nextConfig
