import Constants from 'expo-constants';

export const API_CONFIG = {
	BASE_URL:
		Constants.expoConfig?.extra?.apiUrl || 'https://api.mealprep360.com',
	TIMEOUT: 10000, // 10 seconds
	MAX_RETRIES: 3,
	INITIAL_RETRY_DELAY: 1000, // 1 second
	SYNC_INTERVAL: 5000, // 5 seconds
} as const;

export const CACHE_CONFIG = {
	KEY_PREFIX: 'recipe_cache_',
	EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
	OFFLINE_QUEUE_KEY: 'offline_recipe_changes',
} as const;

// Use environment variable for API base URL
// Always use production URL as APIs only run in production
export const API_BASE_URL =
	Constants.expoConfig?.extra?.apiUrl || 'https://api.mealprep360.com';

console.log('API Configuration:', {
	configuredUrl: Constants.expoConfig?.extra?.apiUrl,
	finalUrl: API_BASE_URL,
	environment: __DEV__ ? 'development' : 'production',
});
