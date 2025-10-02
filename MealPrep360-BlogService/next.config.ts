import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Ensure Next.js generates a standalone server (for Docker)
  output: 'standalone',
}

export default nextConfig
