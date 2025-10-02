import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { mockRecipes } from '../data/mockRecipes';
import { useApiClient } from '../services/api';
import {
	DEFAULT_FILTERS,
	FilterPreset,
	Recipe,
	RecipeFilters,
	SearchHistory,
	SearchSuggestion,
} from '../types/recipe';
import { useNetworkStatus } from './useNetworkStatus';

// Utility functions for error handling
const isNetworkError = (error: any): boolean => {
	return (
		error?.message?.includes('Network') ||
		error?.code === 'NETWORK_ERROR' ||
		error?.name === 'NetworkError'
	);
};

const getErrorMessage = (error: any): string => {
	if (typeof error === 'string') return error;
	return error?.message || 'An unexpected error occurred';
};

interface UseRecipeSearchProps {
	initialFilters?: Partial<RecipeFilters>;
	pageSize?: number;
	enableCache?: boolean;
}

interface UseRecipeSearchReturn {
	// Search state
	recipes: Recipe[];
	filteredRecipes: Recipe[];
	loading: boolean;
	refreshing: boolean;
	error: string | null;
	hasMore: boolean;

	// Filters
	filters: RecipeFilters;
	activeFilterCount: number;

	// Search suggestions
	suggestions: SearchSuggestion[];
	searchHistory: SearchHistory[];
	suggestionsLoading: boolean;

	// Actions
	search: (query: string) => Promise<void>;
	applyFilters: (newFilters: RecipeFilters) => void;
	applyPreset: (preset: FilterPreset) => void;
	clearFilters: () => void;
	loadMore: () => Promise<void>;
	refresh: () => Promise<void>;

	// Search suggestions
	updateSearchQuery: (query: string) => void;
	selectSuggestion: (suggestion: SearchSuggestion) => void;
	selectSearchHistory: (history: SearchHistory) => void;
	clearSearchHistory: () => void;
}

const CACHE_KEYS = {
	RECIPES: 'recipe_search_cache',
	SEARCH_HISTORY: 'search_history',
	SUGGESTIONS: 'search_suggestions',
};

export const useRecipeSearch = ({
	initialFilters = {},
	pageSize = 20,
	enableCache = true,
}: UseRecipeSearchProps = {}): UseRecipeSearchReturn => {
	const { getToken } = useAuth();
	const { isConnected } = useNetworkStatus();
	const api = useApiClient();

	// Search state
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);

	// Filters
	const [filters, setFilters] = useState<RecipeFilters>({
		...DEFAULT_FILTERS,
		...initialFilters,
	});

	// Search suggestions
	const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
	const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
	const [suggestionsLoading, setSuggestionsLoading] = useState(false);

	// Computed values
	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (filters.searchQuery.trim()) count++;
		if (filters.categories.length > 0) count++;
		if (filters.dietaryRestrictions.length > 0) count++;
		if (filters.cuisineTypes.length > 0) count++;
		if (filters.mealTypes.length > 0) count++;
		if (filters.difficulty.length > 0) count++;
		if (filters.totalTimeRange.max < DEFAULT_FILTERS.totalTimeRange.max)
			count++;
		if (filters.calorieRange.max < DEFAULT_FILTERS.calorieRange.max) count++;
		if (filters.rating > 0) count++;
		return count;
	}, [filters]);

	const filteredRecipes = useMemo(() => {
		return recipes.filter((recipe) => {
			// Apply client-side filtering for better UX
			if (filters.searchQuery.trim()) {
				const query = filters.searchQuery.toLowerCase();
				const matches =
					recipe.title.toLowerCase().includes(query) ||
					recipe.description.toLowerCase().includes(query) ||
					recipe.tags.some((tag) => tag.toLowerCase().includes(query));
				if (!matches) return false;
			}

			// Filter by rating
			if (filters.rating > 0 && (recipe.rating || 0) < filters.rating) {
				return false;
			}

			return true;
		});
	}, [recipes, filters.searchQuery, filters.rating]);

	// Load cached data on mount
	useEffect(() => {
		if (enableCache) {
			loadCachedData();
		}
		loadSearchHistory();
	}, [enableCache]);

	// Debounced search suggestions
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (filters.searchQuery.trim().length > 1) {
				fetchSuggestions(filters.searchQuery);
			} else {
				setSuggestions([]);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [filters.searchQuery]);

	const loadCachedData = async () => {
		try {
			const cachedData = await AsyncStorage.getItem(CACHE_KEYS.RECIPES);
			if (cachedData) {
				const parsed = JSON.parse(cachedData);
				if (parsed.timestamp > Date.now() - 5 * 60 * 1000) {
					// 5 minutes cache
					setRecipes(parsed.recipes);
				}
			}
		} catch (error) {
			console.error('Error loading cached recipes:', error);
		}
	};

	const cacheData = async (recipes: Recipe[]) => {
		if (!enableCache) return;
		try {
			const cacheData = {
				recipes,
				timestamp: Date.now(),
			};
			await AsyncStorage.setItem(CACHE_KEYS.RECIPES, JSON.stringify(cacheData));
		} catch (error) {
			console.error('Error caching recipes:', error);
		}
	};

	const loadSearchHistory = async () => {
		try {
			const historyData = await AsyncStorage.getItem(CACHE_KEYS.SEARCH_HISTORY);
			if (historyData) {
				setSearchHistory(JSON.parse(historyData));
			}
		} catch (error) {
			console.error('Error loading search history:', error);
		}
	};

	const saveSearchHistory = async (
		query: string,
		filters?: Partial<RecipeFilters>
	) => {
		try {
			const newHistory: SearchHistory = {
				id: Date.now().toString(),
				query,
				timestamp: new Date().toISOString(),
				filters,
			};

			const updatedHistory = [
				newHistory,
				...searchHistory.filter((h) => h.query !== query),
			].slice(0, 10); // Keep only 10 recent searches

			setSearchHistory(updatedHistory);
			await AsyncStorage.setItem(
				CACHE_KEYS.SEARCH_HISTORY,
				JSON.stringify(updatedHistory)
			);
		} catch (error) {
			console.error('Error saving search history:', error);
		}
	};

	const fetchRecipes = async (
		searchFilters: RecipeFilters,
		page: number = 1,
		append: boolean = false
	): Promise<void> => {
		try {
			if (!isConnected) {
				setError('No internet connection. Showing cached results.');
				return;
			}

			const data = await api.searchRecipes(searchFilters, page, pageSize);

			if (append) {
				setRecipes((prev) => [...prev, ...data.recipes]);
			} else {
				setRecipes(data.recipes);
				cacheData(data.recipes);
			}

			setHasMore(data.hasMore);
			setError(null);
		} catch (err) {
			console.error('Error fetching recipes:', err);

			if (isNetworkError(err)) {
				setError(
					'No internet connection. Please check your network and try again.'
				);
			} else {
				setError(getErrorMessage(err));
			}

			// Fallback to mock data if API fails
			if (!append && recipes.length === 0) {
				setRecipes(mockRecipes);
				setHasMore(false);
			}
		}
	};

	const fetchSuggestions = async (query: string) => {
		try {
			setSuggestionsLoading(true);

			const data = await api.getRecipeSuggestions(query);
			setSuggestions(data.suggestions || []);
		} catch (error) {
			console.error('Error fetching suggestions:', error);
			// Provide fallback suggestions
			setSuggestions([
				{
					id: '1',
					text: query,
					type: 'recipe',
				},
			]);
		} finally {
			setSuggestionsLoading(false);
		}
	};

	const search = useCallback(
		async (query: string) => {
			const newFilters = { ...filters, searchQuery: query };
			setFilters(newFilters);
			setCurrentPage(1);
			setLoading(true);

			try {
				await fetchRecipes(newFilters, 1, false);
				if (query.trim()) {
					await saveSearchHistory(query, newFilters);
				}
			} finally {
				setLoading(false);
			}
		},
		[filters]
	);

	const applyFilters = useCallback(async (newFilters: RecipeFilters) => {
		setFilters(newFilters);
		setCurrentPage(1);
		setLoading(true);

		try {
			await fetchRecipes(newFilters, 1, false);
		} finally {
			setLoading(false);
		}
	}, []);

	const applyPreset = useCallback(
		async (preset: FilterPreset) => {
			const newFilters = { ...filters, ...preset.filters };
			await applyFilters(newFilters);
		},
		[filters, applyFilters]
	);

	const clearFilters = useCallback(async () => {
		await applyFilters(DEFAULT_FILTERS);
	}, [applyFilters]);

	const loadMore = useCallback(async () => {
		if (!hasMore || loading) return;

		const nextPage = currentPage + 1;
		setCurrentPage(nextPage);

		try {
			await fetchRecipes(filters, nextPage, true);
		} catch (error) {
			setCurrentPage(currentPage); // Revert on error
		}
	}, [hasMore, loading, currentPage, filters]);

	const refresh = useCallback(async () => {
		setRefreshing(true);
		setCurrentPage(1);

		try {
			await fetchRecipes(filters, 1, false);
		} finally {
			setRefreshing(false);
		}
	}, [filters]);

	const updateSearchQuery = useCallback((query: string) => {
		setFilters((prev) => ({ ...prev, searchQuery: query }));
	}, []);

	const selectSuggestion = useCallback(
		async (suggestion: SearchSuggestion) => {
			await search(suggestion.text);
		},
		[search]
	);

	const selectSearchHistory = useCallback(
		async (history: SearchHistory) => {
			if (history.filters) {
				await applyFilters({ ...DEFAULT_FILTERS, ...history.filters });
			} else {
				await search(history.query);
			}
		},
		[search, applyFilters]
	);

	const clearSearchHistory = useCallback(async () => {
		setSearchHistory([]);
		try {
			await AsyncStorage.removeItem(CACHE_KEYS.SEARCH_HISTORY);
		} catch (error) {
			console.error('Error clearing search history:', error);
		}
	}, []);

	// Initial load
	useEffect(() => {
		const initialLoad = async () => {
			setLoading(true);
			try {
				// Try to load from API first, fallback to mock data if needed
				await fetchRecipes(filters, 1, false);
			} finally {
				setLoading(false);
			}
		};

		initialLoad();
	}, []); // Only run on mount

	return {
		// Search state
		recipes,
		filteredRecipes,
		loading,
		refreshing,
		error,
		hasMore,

		// Filters
		filters,
		activeFilterCount,

		// Search suggestions
		suggestions,
		searchHistory,
		suggestionsLoading,

		// Actions
		search,
		applyFilters,
		applyPreset,
		clearFilters,
		loadMore,
		refresh,

		// Search suggestions
		updateSearchQuery,
		selectSuggestion,
		selectSearchHistory,
		clearSearchHistory,
	};
};
