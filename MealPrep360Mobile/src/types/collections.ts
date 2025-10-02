import { Recipe } from './recipe';

// Recipe Collections Types
export interface RecipeCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  recipeIds: string[];
  recipes?: Recipe[]; // Populated recipes for convenience
  isPrivate: boolean;
  isDefault: boolean; // For system collections like "Favorites", "To Try"
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // Social features
  isShared: boolean;
  shareCode?: string; // For sharing collections
  collaborators: CollectionCollaborator[];
  
  // Metadata
  recipeCount: number;
  coverImageUrl?: string;
  totalCookTime?: number; // Sum of all recipes
  avgRating?: number;
  nutrition?: CollectionNutrition;
}

export interface CollectionCollaborator {
  userId: string;
  username: string;
  profileImageUrl?: string;
  permission: 'view' | 'edit' | 'admin';
  invitedAt: string;
  acceptedAt?: string;
}

export interface CollectionNutrition {
  avgCaloriesPerRecipe: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  totalRecipes: number;
}

// Recipe Bookmarks & Favorites
export interface RecipeBookmark {
  id: string;
  userId: string;
  recipeId: string;
  recipe?: Recipe;
  collectionIds: string[]; // Which collections this recipe is in
  notes?: string;
  tags: string[];
  isCooked: boolean;
  cookedDates: string[]; // Track when user cooked this recipe
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
  
  // Personal customizations
  personalNotes: string;
  customIngredients: RecipeCustomization[];
  difficultyOverride?: 'Easy' | 'Medium' | 'Hard';
  cookingTimeActual?: number; // How long it actually took user
}

export interface RecipeCustomization {
  ingredientId: string;
  originalAmount: number;
  customAmount: number;
  originalUnit: string;
  customUnit: string;
  notes?: string;
}

// Recipe Ratings & Reviews
export interface RecipeRating {
  id: string;
  userId: string;
  username?: string;
  profileImageUrl?: string;
  recipeId: string;
  rating: number; // 1-5 stars
  review?: string;
  images?: string[]; // User-uploaded photos of their cooking
  tags: ReviewTag[];
  isVerifiedCook: boolean; // User actually cooked and can prove it
  helpfulCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  
  // Detailed breakdown
  tasteRating?: number;
  difficultyRating?: number;
  instructionClarityRating?: number;
  valueForTimeRating?: number;
  
  // Cooking context
  cookingContext?: CookingContext;
  modifications?: string[]; // What they changed
  cookingTips?: string;
}

export interface ReviewTag {
  id: string;
  name: string;
  type: 'positive' | 'negative' | 'neutral';
  emoji?: string;
}

export interface CookingContext {
  cookingDate: string;
  cookingTime: number; // How long it actually took
  servingsActual: number;
  difficultyExperienced: 'Easy' | 'Medium' | 'Hard';
  wouldCookAgain: boolean;
  skillLevelWhenCooked: string;
}

// Collection Management
export interface CollectionFilter {
  userId?: string;
  isPrivate?: boolean;
  isShared?: boolean;
  tags?: string[];
  sortBy: CollectionSortOption;
  sortOrder: 'asc' | 'desc';
  searchQuery?: string;
}

export type CollectionSortOption = 
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'recipeCount'
  | 'avgRating'
  | 'totalCookTime';

export interface CollectionTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  suggestedTags: string[];
  isSystemTemplate: boolean;
}

// User Recipe Activity
export interface UserRecipeActivity {
  userId: string;
  recipeId: string;
  activityType: RecipeActivityType;
  timestamp: string;
  metadata?: any;
}

export type RecipeActivityType =
  | 'viewed'
  | 'bookmarked'
  | 'unbookmarked'
  | 'rated'
  | 'reviewed'
  | 'cooked'
  | 'shared'
  | 'added_to_collection'
  | 'removed_from_collection'
  | 'modified_recipe';

// Social Sharing
export interface RecipeShare {
  id: string;
  userId: string;
  recipeId: string;
  shareType: 'public' | 'friends' | 'specific_users';
  sharedWith?: string[]; // User IDs for specific sharing
  message?: string;
  includePersonalNotes: boolean;
  includeRating: boolean;
  includeModifications: boolean;
  expiresAt?: string;
  createdAt: string;
}

// Recipe Lists (for meal planning integration)
export interface RecipeList {
  id: string;
  userId: string;
  name: string;
  type: 'meal_plan' | 'shopping' | 'custom';
  recipeIds: string[];
  recipes?: Recipe[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

// Default Collection Templates
export const DEFAULT_COLLECTION_TEMPLATES: CollectionTemplate[] = [
  {
    id: 'favorites',
    name: 'Favorites',
    description: 'Your most loved recipes',
    emoji: '❤️',
    color: '#EF4444',
    suggestedTags: ['favorite', 'loved'],
    isSystemTemplate: true,
  },
  {
    id: 'to-try',
    name: 'To Try',
    description: 'Recipes you want to cook',
    emoji: '🔖',
    color: '#F59E0B',
    suggestedTags: ['bookmark', 'to-try'],
    isSystemTemplate: true,
  },
  {
    id: 'weeknight-dinners',
    name: 'Weeknight Dinners',
    description: 'Quick and easy dinner recipes',
    emoji: '🍽️',
    color: '#3B82F6',
    suggestedTags: ['quick', 'dinner', 'weeknight'],
    isSystemTemplate: false,
  },
  {
    id: 'healthy-options',
    name: 'Healthy Options',
    description: 'Nutritious and wholesome recipes',
    emoji: '🥗',
    color: '#10B981',
    suggestedTags: ['healthy', 'nutritious', 'clean'],
    isSystemTemplate: false,
  },
  {
    id: 'meal-prep',
    name: 'Meal Prep',
    description: 'Perfect for batch cooking',
    emoji: '📦',
    color: '#8B5CF6',
    suggestedTags: ['meal-prep', 'batch', 'make-ahead'],
    isSystemTemplate: false,
  },
  {
    id: 'comfort-food',
    name: 'Comfort Food',
    description: 'Soul-warming comfort classics',
    emoji: '🤗',
    color: '#F97316',
    suggestedTags: ['comfort', 'cozy', 'classic'],
    isSystemTemplate: false,
  },
  {
    id: 'special-occasions',
    name: 'Special Occasions',
    description: 'Recipes for celebrations',
    emoji: '🎉',
    color: '#EC4899',
    suggestedTags: ['special', 'celebration', 'entertaining'],
    isSystemTemplate: false,
  },
  {
    id: 'quick-bites',
    name: 'Quick Bites',
    description: 'Fast snacks and light meals',
    emoji: '⚡',
    color: '#06B6D4',
    suggestedTags: ['quick', 'snack', 'light'],
    isSystemTemplate: false,
  },
];

// Review Helper Tags
export const REVIEW_TAGS: ReviewTag[] = [
  // Positive tags
  { id: 'delicious', name: 'Delicious', type: 'positive', emoji: '😋' },
  { id: 'easy', name: 'Easy to follow', type: 'positive', emoji: '👍' },
  { id: 'quick', name: 'Quick to make', type: 'positive', emoji: '⚡' },
  { id: 'healthy', name: 'Healthy', type: 'positive', emoji: '🥗' },
  { id: 'kid-friendly', name: 'Kid-friendly', type: 'positive', emoji: '👶' },
  { id: 'impressive', name: 'Impressive results', type: 'positive', emoji: '✨' },
  { id: 'budget-friendly', name: 'Budget-friendly', type: 'positive', emoji: '💰' },
  { id: 'great-leftovers', name: 'Great leftovers', type: 'positive', emoji: '🔄' },
  
  // Negative tags
  { id: 'too-salty', name: 'Too salty', type: 'negative', emoji: '🧂' },
  { id: 'took-too-long', name: 'Took too long', type: 'negative', emoji: '⏰' },
  { id: 'confusing', name: 'Confusing instructions', type: 'negative', emoji: '❓' },
  { id: 'bland', name: 'Bland flavor', type: 'negative', emoji: '😐' },
  { id: 'too-difficult', name: 'Too difficult', type: 'negative', emoji: '😰' },
  { id: 'expensive', name: 'Expensive ingredients', type: 'negative', emoji: '💸' },
  
  // Neutral tags
  { id: 'needs-modifications', name: 'Needs modifications', type: 'neutral', emoji: '🔧' },
  { id: 'seasonal', name: 'Seasonal ingredients', type: 'neutral', emoji: '🍂' },
  { id: 'special-equipment', name: 'Special equipment needed', type: 'neutral', emoji: '🔨' },
];

// Collection Colors
export const COLLECTION_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange  
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#C026D3', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
];

// Helper Functions
export const createDefaultCollections = (userId: string): RecipeCollection[] => {
  const now = new Date().toISOString();
  
  return [
    {
      id: `${userId}_favorites`,
      userId,
      name: 'Favorites',
      description: 'Your most loved recipes',
      emoji: '❤️',
      color: '#EF4444',
      recipeIds: [],
      isPrivate: true,
      isDefault: true,
      tags: ['favorite'],
      createdAt: now,
      updatedAt: now,
      isShared: false,
      collaborators: [],
      recipeCount: 0,
    },
    {
      id: `${userId}_to_try`,
      userId,
      name: 'To Try',
      description: 'Recipes you want to cook',
      emoji: '🔖', 
      color: '#F59E0B',
      recipeIds: [],
      isPrivate: true,
      isDefault: true,
      tags: ['bookmark', 'to-try'],
      createdAt: now,
      updatedAt: now,
      isShared: false,
      collaborators: [],
      recipeCount: 0,
    },
  ];
};

export const getCollectionStats = (collection: RecipeCollection): CollectionNutrition | null => {
  if (!collection.recipes || collection.recipes.length === 0) {
    return null;
  }

  const recipes = collection.recipes.filter(recipe => recipe.nutritionInfo);
  if (recipes.length === 0) return null;

  const totalCalories = recipes.reduce((sum, recipe) => sum + (recipe.nutritionInfo?.calories || 0), 0);
  const totalProtein = recipes.reduce((sum, recipe) => sum + (recipe.nutritionInfo?.protein || 0), 0);
  const totalCarbs = recipes.reduce((sum, recipe) => sum + (recipe.nutritionInfo?.carbs || 0), 0);
  const totalFat = recipes.reduce((sum, recipe) => sum + (recipe.nutritionInfo?.fat || 0), 0);

  return {
    avgCaloriesPerRecipe: Math.round(totalCalories / recipes.length),
    avgProtein: Math.round(totalProtein / recipes.length),
    avgCarbs: Math.round(totalCarbs / recipes.length),
    avgFat: Math.round(totalFat / recipes.length),
    totalRecipes: recipes.length,
  };
};

export const generateShareCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default {
  DEFAULT_COLLECTION_TEMPLATES,
  REVIEW_TAGS,
  COLLECTION_COLORS,
  createDefaultCollections,
  getCollectionStats,
  generateShareCode,
};