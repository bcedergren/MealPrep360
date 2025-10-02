/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,

	// Force all pages to be dynamic
	trailingSlash: false,

	// Disable static optimization for pages that need client-side rendering
	experimental: {
		missingSuspenseWithCSRBailout: false,
	},

	// Force dynamic rendering for all pages to avoid static generation issues
	output: 'standalone',

	// Environment variables that can be used in the browser
	env: {
		API_URL: process.env.API_URL || 'https://api.mealprep360.com',
	},

	// CORS headers for API routes
	async headers() {
		return [
			{
				source: '/api/:path*',
				headers: [
					{ key: 'Access-Control-Allow-Credentials', value: 'true' },
					{
						key: 'Access-Control-Allow-Origin',
						value: process.env.FRONTEND_URL || '*',
					},
					{
						key: 'Access-Control-Allow-Methods',
						value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
					},
					{
						key: 'Access-Control-Allow-Headers',
						value:
							'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
					},
				],
			},
		];
	},

	// Generate buildId to avoid caching issues
	generateBuildId: async () => {
		return `build-${Date.now()}`;
	},

	// Ignore build errors for deployment
	typescript: {
		ignoreBuildErrors: false,
	},

	eslint: {
		ignoreDuringBuilds: false,
	},

	// Webpack configuration to handle module resolution issues
	webpack: (config, { dev, isServer }) => {
		// Handle client-side fallbacks for server-side modules
		if (!dev && !isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				net: false,
				tls: false,
			};
		}

		return config;
	},

	// Disable static optimization for error pages
	async rewrites() {
		return [];
	},
};

module.exports = nextConfig;
