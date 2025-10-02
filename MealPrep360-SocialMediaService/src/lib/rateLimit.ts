import { NextResponse } from 'next/server';

interface RateLimitConfig {
	windowMs: number;
	maxRequests: number;
}

interface RateLimitStore {
	[key: string]: {
		count: number;
		resetTime: number;
	};
}

const store: RateLimitStore = {};

export function rateLimit(config: RateLimitConfig) {
	return async function rateLimitMiddleware(request: Request) {
		const ip = request.headers.get('x-forwarded-for') || 'unknown';
		const key = `${ip}:${request.url}`;
		const now = Date.now();

		// Clean up expired entries
		Object.keys(store).forEach((k) => {
			if (store[k].resetTime < now) {
				delete store[k];
			}
		});

		// Initialize or get current rate limit data
		if (!store[key]) {
			store[key] = {
				count: 0,
				resetTime: now + config.windowMs,
			};
		}

		// Check if rate limit is exceeded
		if (store[key].count >= config.maxRequests) {
			return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
		}

		// Increment counter
		store[key].count++;

		return null;
	};
}

// Default rate limit configurations
export const defaultRateLimit = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	maxRequests: 100, // 100 requests per minute
});
