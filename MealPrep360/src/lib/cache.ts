interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

class MemoryCache {
	private cache = new Map<string, CacheEntry<any>>();
	private maxSize: number;

	constructor(maxSize: number = 100) {
		this.maxSize = maxSize;
	}

	set<T>(key: string, data: T, ttlSeconds: number = 300): void {
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl: ttlSeconds * 1000,
		};

		this.cache.set(key, entry);
		this.cleanup();
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	private cleanup(): void {
		if (this.cache.size <= this.maxSize) {
			return;
		}

		// Remove expired entries first
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
			}
		}

		// If still over limit, remove oldest entries
		if (this.cache.size > this.maxSize) {
			const entries = Array.from(this.cache.entries()).sort(
				(a, b) => a[1].timestamp - b[1].timestamp
			);

			const entriesToRemove = entries.slice(0, this.cache.size - this.maxSize);
			entriesToRemove.forEach(([key]) => this.cache.delete(key));
		}
	}
}

// Create singleton instances for different cache types
// Export the MemoryCache class
export { MemoryCache };

export const recipeCache = new MemoryCache(100);
export const userCache = new MemoryCache(50);
export const mealPlanCache = new MemoryCache(200); // Larger cache for meal plans
export const shoppingListCache = new MemoryCache(100); // Cache for shopping lists
export const freezerCache = new MemoryCache(50); // Cache for freezer inventory

// Helper function to create cache keys
export function createCacheKey(
	prefix: string,
	params: Record<string, any>
): string {
	const sortedParams = Object.keys(params)
		.sort()
		.map((key) => `${key}:${params[key]}`)
		.join('_');
	return `${prefix}_${sortedParams}`;
}

// Helper function to invalidate meal plan cache for a user
export function invalidateUserMealPlanCache(userId: string): void {
	// Remove all cache entries for this user
	const keysToDelete: string[] = [];

	// Since we can't iterate over Map keys directly, we need to track keys
	// In a production app, you might want to maintain a separate index
	for (const [key] of (mealPlanCache as any).cache.entries()) {
		if (key.includes(`userId:${userId}`)) {
			keysToDelete.push(key);
		}
	}

	keysToDelete.forEach((key) => mealPlanCache.delete(key));
}

// Helper to invalidate cache for a specific date range
export function invalidateMealPlanCacheForDateRange(
	userId: string,
	startDate: string,
	endDate: string
): void {
	const key = createCacheKey('meal-plans', { userId, startDate, endDate });
	mealPlanCache.delete(key);
}

// Helper to invalidate shopping list cache for a user
export function invalidateUserShoppingListCache(userId: string): void {
	const keysToDelete: string[] = [];

	for (const [key] of (shoppingListCache as any).cache.entries()) {
		if (key.includes(`userId:${userId}`)) {
			keysToDelete.push(key);
		}
	}

	keysToDelete.forEach((key) => shoppingListCache.delete(key));
}

// Helper to invalidate freezer cache for a user
export function invalidateUserFreezerCache(userId: string): void {
	const keysToDelete: string[] = [];

	for (const [key] of (freezerCache as any).cache.entries()) {
		if (key.includes(`userId:${userId}`)) {
			keysToDelete.push(key);
		}
	}

	keysToDelete.forEach((key) => freezerCache.delete(key));
}
