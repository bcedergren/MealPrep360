import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import {
	Recipe,
	RecipeFilters,
	RecipeSearchResponse,
	RecipeSuggestionsResponse,
} from '../types/recipe';

// Always use production URL as APIs only run in production
const API_BASE_URL =
	Constants.expoConfig?.extra?.apiUrl || 'https://api.mealprep360.com';

export interface RecipesResponse {
	recipes: Recipe[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface MealPlan {
	_id: string;
	date: string;
	meals: {
		breakfast?: Recipe;
		lunch?: Recipe;
		dinner?: Recipe;
		snack?: Recipe;
	};
	clerkId: string;
}

export interface ShoppingItem {
	_id: string;
	name: string;
	quantity: string;
	category: string;
	completed: boolean;
	createdAt: string;
}

export interface ShoppingList {
	_id: string;
	name: string;
	items: ShoppingItem[];
	clerkId: string;
	createdAt: string;
	updatedAt: string;
}

// API Configuration - Direct to API gateway without versioning
const API_URL = API_BASE_URL;

// API Error Types
export interface ApiError {
	message: string;
	statusCode: number;
	code?: string;
	details?: any;
}

export class ApiClientError extends Error {
	statusCode: number;
	code?: string;
	details?: any;

	constructor(error: ApiError) {
		super(error.message);
		this.name = 'ApiClientError';
		this.statusCode = error.statusCode;
		this.code = error.code;
		this.details = error.details;
	}
}

// Extended request interface for internal use
interface ApiRequestOptions extends RequestInit {
	token?: string;
}

// API Client Class
class ApiClient {
	private async makeRequest<T>(
		endpoint: string,
		options: ApiRequestOptions = {},
		requireAuth = true
	): Promise<T> {
		try {
			// Extract token from options
			const { token, ...fetchOptions } = options;

			// Get auth token if required
			let headers: Record<string, string> = {
				'Content-Type': 'application/json',
				...((fetchOptions.headers as Record<string, string>) || {}),
			};

			if (requireAuth && token) {
				headers.Authorization = `Bearer ${token}`;
			}

			const url = endpoint.startsWith('http')
				? endpoint
				: `${API_URL}${endpoint}`;

			const response = await fetch(url, {
				...fetchOptions,
				headers,
			});

			// Handle different response types
			if (!response.ok) {
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				let errorDetails = null;

				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorMessage;
					errorDetails = errorData;
				} catch {
					// If response is not JSON, use default error message
				}

				throw new ApiClientError({
					message: errorMessage,
					statusCode: response.status,
					code: errorDetails?.code,
					details: errorDetails,
				});
			}

			// Handle empty responses
			if (response.status === 204) {
				return {} as T;
			}

			// Parse JSON response
			const data = await response.json();
			return data;
		} catch (error) {
			if (error instanceof ApiClientError) {
				throw error;
			}

			// Handle network errors, timeout, etc.
			throw new ApiClientError({
				message:
					error instanceof Error ? error.message : 'Network error occurred',
				statusCode: 0,
				code: 'NETWORK_ERROR',
			});
		}
	}

	// Recipe API Methods
	async searchRecipes(
		filters: RecipeFilters,
		page: number = 1,
		limit: number = 20,
		token?: string
	): Promise<RecipeSearchResponse> {
		const params = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString(),
			...(filters.searchQuery && { query: filters.searchQuery }),
			...(filters.categories.length > 0 && {
				categories: filters.categories.join(','),
			}),
			...(filters.dietaryRestrictions.length > 0 && {
				dietary: filters.dietaryRestrictions.join(','),
			}),
			...(filters.cuisineTypes.length > 0 && {
				cuisines: filters.cuisineTypes.join(','),
			}),
			...(filters.mealTypes.length > 0 && {
				mealTypes: filters.mealTypes.join(','),
			}),
			...(filters.difficulty.length > 0 && {
				difficulty: filters.difficulty.join(','),
			}),
			...(filters.prepTimeRange.max < 180 && {
				maxPrepTime: filters.prepTimeRange.max.toString(),
			}),
			...(filters.cookTimeRange.max < 240 && {
				maxCookTime: filters.cookTimeRange.max.toString(),
			}),
			...(filters.totalTimeRange.max < 300 && {
				maxTotalTime: filters.totalTimeRange.max.toString(),
			}),
			...(filters.calorieRange.max < 2000 && {
				maxCalories: filters.calorieRange.max.toString(),
			}),
			...(filters.rating > 0 && { minRating: filters.rating.toString() }),
			...(filters.ingredients.length > 0 && {
				includeIngredients: filters.ingredients.join(','),
			}),
			...(filters.excludeIngredients.length > 0 && {
				excludeIngredients: filters.excludeIngredients.join(','),
			}),
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
		});

		return this.makeRequest<RecipeSearchResponse>(
			`/api/recipes/search?${params}`,
			{ token },
			true
		);
	}

	async getRecipeById(id: string, token?: string): Promise<Recipe> {
		return this.makeRequest<Recipe>(`/api/recipes/${id}`, { token }, true);
	}

	async getRecipeSuggestions(
		query: string,
		token?: string
	): Promise<RecipeSuggestionsResponse> {
		const params = new URLSearchParams({
			q: query,
			limit: '10',
		});

		return this.makeRequest<RecipeSuggestionsResponse>(
			`/api/ai/suggestions?${params}`,
			{ token },
			true
		);
	}

	async getFeaturedRecipes(token?: string): Promise<Recipe[]> {
		// Use recommended recipes as featured since /featured endpoint doesn't exist
		return this.makeRequest<Recipe[]>('/api/recipes/recommended', { token }, true);
	}

	async getPopularRecipes(
		limit: number = 10,
		token?: string
	): Promise<Recipe[]> {
		const params = new URLSearchParams({
			limit: limit.toString(),
			sortBy: 'rating',
			sortOrder: 'desc'
		});

		// Use regular recipes endpoint with popular sorting since /popular doesn't exist
		return this.makeRequest<Recipe[]>(
			`/api/recipes?${params}`,
			{ token },
			true
		);
	}

	async getRecommendedRecipes(token?: string): Promise<Recipe[]> {
		return this.makeRequest<Recipe[]>('/api/recipes/recommended', { token }, true);
	}

	// Recipe interaction methods
	async saveRecipe(
		recipeId: string,
		token?: string
	): Promise<{ saved: boolean }> {
		return this.makeRequest<{ saved: boolean }>(
			`/api/recipes/${recipeId}/saved`,
			{
				method: 'POST',
				token,
			},
			true
		);
	}

	async unsaveRecipe(
		recipeId: string,
		token?: string
	): Promise<{ saved: boolean }> {
		return this.makeRequest<{ saved: boolean }>(
			`/api/recipes/${recipeId}/saved`,
			{
				method: 'DELETE',
				token,
			},
			true
		);
	}

	async rateRecipe(
		recipeId: string,
		rating: number,
		token?: string
	): Promise<{ rating: number; averageRating: number }> {
		return this.makeRequest<{ rating: number; averageRating: number }>(
			`/api/recipes/${recipeId}/rating`,
			{
				method: 'POST',
				body: JSON.stringify({ rating }),
				token,
			},
			true
		);
	}

	// User's saved recipes
	async getSavedRecipes(token?: string): Promise<Recipe[]> {
		return this.makeRequest<Recipe[]>('/api/user/recipes/saved', { token }, true);
	}

	// Recipe categories and filters
	async getRecipeCategories(token?: string): Promise<string[]> {
		// Use tags endpoint since categories endpoint doesn't exist
		try {
			const response = await this.makeRequest<{tags: string[]}>('/api/recipes/tags', { token }, false);
			return response.tags || [];
		} catch (error) {
			// Return default categories if endpoint fails
			return ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
		}
	}

	async getCuisineTypes(token?: string): Promise<string[]> {
		// Return common cuisine types since endpoint doesn't exist
		return [
			'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 
			'Indian', 'French', 'Mediterranean', 'Thai', 'Korean'
		];
	}

	async getDietaryRestrictions(token?: string): Promise<string[]> {
		// Return common dietary restrictions since endpoint doesn't exist
		return [
			'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
			'Keto', 'Paleo', 'Low-Carb', 'Low-Fat'
		];
	}

	// Health check
	async healthCheck(): Promise<{ status: string; timestamp: string }> {
		return this.makeRequest<{ status: string; timestamp: string }>(
			'/api/health',
			{},
			false
		);
	}
}

// Export singleton instance
export const apiClient = new ApiClient();

// Hook for easy API usage with authentication
export const useApiClient = () => {
	const { getToken } = useAuth();

	const makeAuthenticatedRequest = async <T>(
		apiMethod: (token?: string) => Promise<T>
	): Promise<T> => {
		try {
			const token = await getToken();
			return await apiMethod(token || undefined);
		} catch (error) {
			if (error instanceof ApiClientError) {
				throw error;
			}
			throw new ApiClientError({
				message: 'Authentication failed',
				statusCode: 401,
				code: 'AUTH_ERROR',
			});
		}
	};

	return {
		// Recipe methods with authentication
		searchRecipes: (filters: RecipeFilters, page?: number, limit?: number) =>
			makeAuthenticatedRequest((token) =>
				apiClient.searchRecipes(filters, page, limit, token)
			),

		getRecipeById: (id: string) =>
			makeAuthenticatedRequest((token) => apiClient.getRecipeById(id, token)),

		getRecipeSuggestions: (query: string) =>
			makeAuthenticatedRequest((token) =>
				apiClient.getRecipeSuggestions(query, token)
			),

		getFeaturedRecipes: () =>
			makeAuthenticatedRequest((token) => apiClient.getFeaturedRecipes(token)),

		getPopularRecipes: (limit?: number) =>
			makeAuthenticatedRequest((token) =>
				apiClient.getPopularRecipes(limit, token)
			),

		getRecommendedRecipes: () =>
			makeAuthenticatedRequest((token) =>
				apiClient.getRecommendedRecipes(token)
			),

		saveRecipe: (recipeId: string) =>
			makeAuthenticatedRequest((token) =>
				apiClient.saveRecipe(recipeId, token)
			),

		unsaveRecipe: (recipeId: string) =>
			makeAuthenticatedRequest((token) =>
				apiClient.unsaveRecipe(recipeId, token)
			),

		rateRecipe: (recipeId: string, rating: number) =>
			makeAuthenticatedRequest((token) =>
				apiClient.rateRecipe(recipeId, rating, token)
			),

		getSavedRecipes: () =>
			makeAuthenticatedRequest((token) => apiClient.getSavedRecipes(token)),

		// Public methods (no auth required)
		getRecipeCategories: () => apiClient.getRecipeCategories(),
		getCuisineTypes: () => apiClient.getCuisineTypes(),
		getDietaryRestrictions: () => apiClient.getDietaryRestrictions(),
		healthCheck: () => apiClient.healthCheck(),
	};
};

// Utility functions for error handling
export const isApiError = (error: any): error is ApiClientError => {
	return error instanceof ApiClientError;
};

export const getErrorMessage = (error: any): string => {
	if (isApiError(error)) {
		return error.message;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return 'An unexpected error occurred';
};

export const isNetworkError = (error: any): boolean => {
	return isApiError(error) && error.code === 'NETWORK_ERROR';
};

export const isAuthError = (error: any): boolean => {
	return (
		isApiError(error) &&
		(error.statusCode === 401 || error.code === 'AUTH_ERROR')
	);
};

export default apiClient;
