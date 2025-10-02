// API Configuration - Client-side should use relative paths only
export const API_BASE_URL = '';

// Helper function to construct API URLs - always uses local Next.js API routes
export function getApiUrl(path: string): string {
	// Ensure path starts with /api for Next.js routes
	const normalizedPath = path.startsWith('/api/')
		? path
		: `/api/${path.replace(/^\//, '')}`;
	return normalizedPath;
}

// Helper function to get the API base URL for client-side requests
// Client-side should always use relative URLs to go through Next.js API routes
// which handle authentication properly
export function getClientApiBase(): string {
	return '';
}

// External API path prefix (e.g., '/api' or '/v1')
// Configure via NEXT_PUBLIC_API_PREFIX to align with external API docs
// Defaults to '/api' for backward compatibility
const EXTERNAL_API_PREFIX = (process.env.NEXT_PUBLIC_API_PREFIX || '/api')
	.trim()
	.replace(/\/$/, '');

function externalPath(path: string): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `${EXTERNAL_API_PREFIX}${normalized}`;
}

// API endpoint constants
export const API_ENDPOINTS = {
	// Auth
	AUTH_UPDATE_PASSWORD: '/api/auth/update-password',
	AUTH_RESET_PASSWORD: '/api/auth/reset-password',

	// User
	USER: '/api/user',
	USER_SETTINGS: '/api/user/settings',
	USER_RECIPES: '/api/user/recipes',
	USER_RECIPES_SAVED: '/api/user/recipes/saved',
	USER_PASSWORD: '/api/user/password',
	USER_PREFERENCES: '/api/user/preferences',

	// Recipes
	RECIPES: '/api/recipes',
	RECIPE_BY_ID: (id: string) => `/api/recipes/${id}`,
	RECIPE_IMAGE: (id: string) => `/api/recipes/${id}/image`,
	RECIPE_SAVED: (id: string) => `/api/recipes/${id}/saved`,
	RECIPE_REPORT_IMAGE: (id: string) => `/api/recipes/${id}/report-image`,
	RECIPES_SEARCH: '/api/recipes/search',
	RECIPES_RECOMMENDED: '/api/recipes/recommended',
	RECIPES_TAGS: '/api/recipes/tags',

	// Meal Plans
	MEAL_PLANS: '/api/meal-plans',
	MEAL_PLAN_BY_DATE: (date: string) => `/api/meal-plans/${date}`,
	MEAL_PLANS_GENERATE: '/api/meal-plans/generate',
	MEAL_PLANS_SKIP_DATE: '/api/meal-plans/skip-date',

	// Shopping Lists
	SHOPPING_LISTS: '/api/shopping-lists',
	SHOPPING_LIST_BY_ID: (id: string) => `/api/shopping-lists/${id}`,
	SHOPPING_LISTS_GENERATE: '/api/shopping-lists/generate',

	// Subscription
	SUBSCRIPTION: '/api/subscription',
	SUBSCRIPTION_CHECKOUT: '/api/subscription/checkout',
	SUBSCRIPTION_CANCEL: '/api/subscription/cancel',

	// AI Features
	AI_SUGGESTIONS: '/api/ai/suggestions',
	AI_TEST: '/api/ai/test',

	// Other
	FEEDBACK: '/api/feedback',
	NEWSLETTER_SUBSCRIBE: '/api/newsletter/subscribe',
	FREEZER_INVENTORY: '/api/freezer/inventory',
	SETTINGS: '/api/settings',
	LANGUAGE: '/api/language',
	NOTIFICATIONS: '/api/notifications',
	NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,
	IMAGES_REPORT: '/api/images/report',

	// Blog
	BLOG_POSTS: '/api/blog/posts',
	BLOG_POST_BY_ID: (id: string) => `/api/blog/posts/${id}`,
	BLOG_POST_LIKE: (id: string) => `/api/blog/posts/${id}/like`,
	BLOG_COMMENTS: '/api/blog/comments',
	BLOG_CATEGORIES: '/api/blog/categories',
	BLOG_TAGS: '/api/blog/tags',

	// Social
	SOCIAL_POSTS: '/api/social/posts',
	SOCIAL_PROFILE: '/api/social/profile',
	SOCIAL_FOLLOW: '/api/social/follow',
	SOCIAL_GROUP_PREP: '/api/social/group-prep',
	SOCIAL_GROUP_PREP_TASKS: '/api/social/group-prep/tasks',
} as const;

export const API_CONFIG = {
	// External API base URL
	baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.mealprep360.com',

	// API endpoints
	endpoints: {
		// User endpoints
		user: externalPath('/user'),
		userPreferences: externalPath('/user/preferences'),
		userRecipes: externalPath('/user/recipes'),
		userRecipesSaved: externalPath('/user/recipes/saved'),

		// Recipe endpoints
		recipes: externalPath('/recipes'),
		recipesSearch: externalPath('/recipes/search'),
		recipesRecommended: externalPath('/recipes/recommended'),

		// Meal plan endpoints
		mealPlans: externalPath('/meal-plans'),
		mealPlansGenerate: externalPath('/meal-plans/generate'),

		// Shopping list endpoints
		shoppingLists: externalPath('/shopping-lists'),
		shoppingListsGenerate: externalPath('/shopping-lists/generate'),

		// AI endpoints
		aiSuggestions: externalPath('/ai/suggestions'),
		aiTest: externalPath('/ai/test'),
		ai: externalPath('/ai'),

		// Other endpoints
		freezerInventory: externalPath('/freezer/inventory'),
		notifications: externalPath('/notifications'),
		health: externalPath('/health'),
		settings: externalPath('/settings'),
		subscription: externalPath('/subscription'),
		skippedDays: externalPath('/skipped-days'),
		upload: externalPath('/upload'),
		generateImage: externalPath('/generate-image'),

		// Blog endpoints
		blogPosts: externalPath('/blog/posts'),

		// Admin endpoints
		adminUsers: externalPath('/admin/users'),
		adminRecipes: externalPath('/admin/recipes'),
		adminStats: externalPath('/admin/stats'),

		// Auth endpoints
		authToken: externalPath('/auth/token'),

		// Security endpoints
		security2FA: externalPath('/security/2fa'),

		// Notification endpoints
		notificationsPush: externalPath('/notifications/push'),
	},

	// Default headers
	defaultHeaders: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},

	// Request timeout
	timeout: 30000,
};
