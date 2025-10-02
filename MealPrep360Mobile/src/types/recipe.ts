export interface NutritionalInfo {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

export interface Recipe {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	prepTime: number;
	cookTime: number;
	servings: number;
	difficulty: 'Easy' | 'Medium' | 'Hard';
	calories?: number;
	rating?: number;
	reviewCount?: number;
	
	// Enhanced fields
	tags: string[];
	dietaryRestrictions: DietaryRestriction[];
	cuisineType: CuisineType;
	mealType: MealType[];
	ingredients: Ingredient[];
	instructions: RecipeStep[];
	nutritionInfo?: NutritionInfo;
	
	// Metadata
	createdAt: string;
	updatedAt: string;
	authorId: string;
	authorName?: string;
	isPublic: boolean;
	savedCount?: number;
}

export interface Ingredient {
	id: string;
	name: string;
	amount: number;
	unit: string;
	category: IngredientCategory;
	isOptional?: boolean;
}

export interface RecipeStep {
	id: string;
	stepNumber: number;
	instruction: string;
	duration?: number; // in minutes
	temperature?: number; // in Fahrenheit
	imageUrl?: string;
}

export interface NutritionInfo {
	calories: number;
	protein: number; // grams
	carbs: number; // grams
	fat: number; // grams
	fiber: number; // grams
	sugar: number; // grams
	sodium: number; // milligrams
}

export interface CacheInfo {
	size: number;
	lastUpdated: number;
	expiresAt: number;
}

export interface OfflineChange {
	type: 'save' | 'unsave';
	recipeId: string;
	timestamp: number;
	version?: number;
}

export interface SyncStatus {
	isSyncing: boolean;
	progress: number;
	currentOperation: string;
	totalOperations: number;
}

// Filter Types
export interface RecipeFilters {
	searchQuery: string;
	categories: RecipeCategory[];
	dietaryRestrictions: DietaryRestriction[];
	cuisineTypes: CuisineType[];
	mealTypes: MealType[];
	difficulty: DifficultyLevel[];
	prepTimeRange: TimeRange;
	cookTimeRange: TimeRange;
	totalTimeRange: TimeRange;
	calorieRange: CalorieRange;
	servingRange: ServingRange;
	ingredients: string[]; // ingredient names to include
	excludeIngredients: string[]; // ingredients to exclude
	rating: number; // minimum rating
	sortBy: SortOption;
	sortOrder: 'asc' | 'desc';
}

export interface TimeRange {
	min: number; // minutes
	max: number; // minutes
}

export interface CalorieRange {
	min: number;
	max: number;
}

export interface ServingRange {
	min: number;
	max: number;
}

// Enum Types
export type RecipeCategory = 
	| 'Popular'
	| 'Quick & Easy'
	| 'Healthy'
	| 'Comfort Food'
	| 'Meal Prep'
	| 'One Pot'
	| 'Low Carb'
	| 'High Protein'
	| 'Kid Friendly'
	| 'Date Night'
	| 'Weekend Special'
	| 'Budget Friendly';

export type DietaryRestriction = 
	| 'Vegetarian'
	| 'Vegan'
	| 'Gluten-Free'
	| 'Dairy-Free'
	| 'Nut-Free'
	| 'Soy-Free'
	| 'Egg-Free'
	| 'Paleo'
	| 'Keto'
	| 'Low-Sodium'
	| 'Sugar-Free'
	| 'Halal'
	| 'Kosher';

export type CuisineType = 
	| 'American'
	| 'Italian'
	| 'Mexican'
	| 'Asian'
	| 'Chinese'
	| 'Japanese'
	| 'Thai'
	| 'Indian'
	| 'Mediterranean'
	| 'French'
	| 'Greek'
	| 'Middle Eastern'
	| 'Latin American'
	| 'African'
	| 'British'
	| 'German'
	| 'Korean'
	| 'Vietnamese'
	| 'Spanish'
	| 'Other';

export type MealType = 
	| 'Breakfast'
	| 'Lunch'
	| 'Dinner'
	| 'Snack'
	| 'Appetizer'
	| 'Dessert'
	| 'Beverage'
	| 'Side Dish';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type IngredientCategory = 
	| 'Protein'
	| 'Vegetables'
	| 'Fruits'
	| 'Grains'
	| 'Dairy'
	| 'Pantry'
	| 'Herbs & Spices'
	| 'Oils & Fats'
	| 'Condiments'
	| 'Beverages'
	| 'Other';

export type SortOption = 
	| 'relevance'
	| 'popularity'
	| 'rating'
	| 'prepTime'
	| 'totalTime'
	| 'calories'
	| 'recent'
	| 'alphabetical';

// Search Types
export interface SearchSuggestion {
	id: string;
	text: string;
	type: 'recipe' | 'ingredient' | 'cuisine' | 'category';
	count?: number;
}

export interface SearchHistory {
	id: string;
	query: string;
	timestamp: string;
	filters?: Partial<RecipeFilters>;
}

// API Response Types
export interface RecipeSearchResponse {
	recipes: Recipe[];
	total: number;
	page: number;
	limit: number;
	hasMore: boolean;
	filters: {
		availableCategories: RecipeCategory[];
		availableCuisines: CuisineType[];
		availableDietary: DietaryRestriction[];
		timeRanges: {
			prep: TimeRange;
			cook: TimeRange;
			total: TimeRange;
		};
		calorieRange: CalorieRange;
	};
}

export interface RecipeSuggestionsResponse {
	suggestions: SearchSuggestion[];
}

// Filter Preset Types
export interface FilterPreset {
	id: string;
	name: string;
	description: string;
	filters: Partial<RecipeFilters>;
	icon: string;
	isDefault?: boolean;
}

// Default Filter Values
export const DEFAULT_FILTERS: RecipeFilters = {
	searchQuery: '',
	categories: [],
	dietaryRestrictions: [],
	cuisineTypes: [],
	mealTypes: [],
	difficulty: [],
	prepTimeRange: { min: 0, max: 180 },
	cookTimeRange: { min: 0, max: 240 },
	totalTimeRange: { min: 0, max: 300 },
	calorieRange: { min: 0, max: 2000 },
	servingRange: { min: 1, max: 12 },
	ingredients: [],
	excludeIngredients: [],
	rating: 0,
	sortBy: 'relevance',
	sortOrder: 'desc',
};

// Filter Presets
export const FILTER_PRESETS: FilterPreset[] = [
	{
		id: 'quick-meals',
		name: 'Quick Meals',
		description: 'Ready in 30 minutes or less',
		icon: 'timer-outline',
		filters: {
			totalTimeRange: { min: 0, max: 30 },
			categories: ['Quick & Easy'],
		},
		isDefault: true,
	},
	{
		id: 'healthy',
		name: 'Healthy',
		description: 'Nutritious and balanced meals',
		icon: 'leaf-outline',
		filters: {
			categories: ['Healthy'],
			calorieRange: { min: 0, max: 600 },
		},
		isDefault: true,
	},
	{
		id: 'meal-prep',
		name: 'Meal Prep',
		description: 'Perfect for batch cooking',
		icon: 'calendar-outline',
		filters: {
			categories: ['Meal Prep'],
			servingRange: { min: 4, max: 12 },
		},
		isDefault: true,
	},
	{
		id: 'vegetarian',
		name: 'Vegetarian',
		description: 'Plant-based recipes',
		icon: 'leaf',
		filters: {
			dietaryRestrictions: ['Vegetarian'],
		},
		isDefault: true,
	},
	{
		id: 'high-protein',
		name: 'High Protein',
		description: 'Protein-rich meals',
		icon: 'fitness-outline',
		filters: {
			categories: ['High Protein'],
		},
		isDefault: true,
	},
	{
		id: 'budget-friendly',
		name: 'Budget Friendly',
		description: 'Affordable ingredients',
		icon: 'wallet-outline',
		filters: {
			categories: ['Budget Friendly'],
		},
		isDefault: true,
	},
];
