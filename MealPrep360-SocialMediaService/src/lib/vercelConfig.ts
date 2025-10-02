// Cache configuration
export const CACHE_CONFIG = {
	// Time-to-live for different types of data
	ttl: {
		userProfile: 60 * 5, // 5 minutes
		post: 60 * 2, // 2 minutes
		feed: 60, // 1 minute
	},
	// Maximum number of items to cache
	maxItems: {
		userProfile: 1000,
		post: 5000,
		feed: 100,
	},
};

// Rate limit configuration
export const RATE_LIMIT_CONFIG = {
	// Different limits for different endpoints
	limits: {
		default: {
			windowMs: 60 * 1000, // 1 minute
			maxRequests: 100,
		},
		auth: {
			windowMs: 60 * 1000,
			maxRequests: 5,
		},
		feed: {
			windowMs: 60 * 1000,
			maxRequests: 30,
		},
		search: {
			windowMs: 60 * 1000,
			maxRequests: 20,
		},
	},
};

// Feature flags
export const FEATURE_FLAGS = {
	async isEnabled(feature: string): Promise<boolean> {
		// In development, all features are enabled by default
		if (process.env.NODE_ENV === 'development') {
			return true;
		}

		// In production, use Edge Config if available
		if (process.env.EDGE_CONFIG) {
			try {
				const { createClient } = await import('@vercel/edge-config');
				const config = createClient(process.env.EDGE_CONFIG);
				return (await config.get(feature)) || false;
			} catch {
				return false;
			}
		}

		return false;
	},
};

// Environment-specific configuration
export const ENV_CONFIG = {
	isProduction: process.env.NODE_ENV === 'production',
	isDevelopment: process.env.NODE_ENV === 'development',
	isTest: process.env.NODE_ENV === 'test',
};

// Performance monitoring configuration
export const MONITORING_CONFIG = {
	enabled: ENV_CONFIG.isProduction,
	sampleRate: 0.1, // Sample 10% of requests
	ignorePaths: ['/api/health', '/api/metrics'],
};
