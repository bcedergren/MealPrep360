import { IRecipe } from './recipe';

// Enhanced categorization types
export enum CuisineType {
  ITALIAN = 'italian',
  MEXICAN = 'mexican',
  CHINESE = 'chinese',
  INDIAN = 'indian',
  FRENCH = 'french',
  JAPANESE = 'japanese',
  THAI = 'thai',
  MEDITERRANEAN = 'mediterranean',
  AMERICAN = 'american',
  KOREAN = 'korean',
  VIETNAMESE = 'vietnamese',
  MIDDLE_EASTERN = 'middle_eastern',
  SPANISH = 'spanish',
  GREEK = 'greek',
  GERMAN = 'german',
  BRITISH = 'british',
  FUSION = 'fusion',
  OTHER = 'other'
}

export enum RecipeCategory {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  DESSERT = 'dessert',
  APPETIZER = 'appetizer',
  SOUP = 'soup',
  SALAD = 'salad',
  MAIN_COURSE = 'main_course',
  SIDE_DISH = 'side_dish',
  BEVERAGE = 'beverage',
  SAUCE = 'sauce',
  MARINADE = 'marinade',
  DIP = 'dip',
  SPREAD = 'spread'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum DietaryFlag {
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
  NUT_FREE = 'nut_free',
  SOY_FREE = 'soy_free',
  EGG_FREE = 'egg_free',
  SUGAR_FREE = 'sugar_free',
  LOW_CARB = 'low_carb',
  KETO = 'keto',
  PALEO = 'paleo',
  WHOLE30 = 'whole30',
  MEDITERRANEAN = 'mediterranean',
  DASH = 'dash',
  LOW_SODIUM = 'low_sodium',
  HIGH_PROTEIN = 'high_protein',
  LOW_FAT = 'low_fat',
  HIGH_FIBER = 'high_fiber'
}

export interface AllergenInfo {
  contains: string[];
  mayContain: string[];
  freeFrom: string[];
}

export interface DetailedNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  saturatedFat: number;
  transFat: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
  potassium: number;
  magnesium: number;
  zinc: number;
  omega3: number;
  omega6: number;
}

export interface CostEstimate {
  perServing: number;
  total: number;
  currency: string;
  breakdown: {
    ingredients: { [key: string]: number };
    labor?: number;
    overhead?: number;
  };
}

export interface SeasonalInfo {
  isSeasonal: boolean;
  peakSeason: string[];
  availableSeasons: string[];
  bestTimeToCook: string;
}

export interface SimilarityScore {
  recipeId: string;
  score: number;
  reasons: string[];
}

export interface SkillRequirement {
  skill: string;
  level: DifficultyLevel;
  description: string;
}

export interface NutritionGoals {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  maxSodium: number;
  maxSugar: number;
  minFiber: number;
}

export interface RecommendationContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  availableIngredients: string[];
  cookingTime: number;
  servingSize: number;
  budget: number;
  occasion: 'casual' | 'formal' | 'celebration' | 'quick_meal';
  mood: 'comfort' | 'healthy' | 'adventurous' | 'familiar';
}

export interface SearchQuery {
  text?: string;
  ingredients?: string[];
  cuisine?: CuisineType[];
  category?: RecipeCategory[];
  dietaryFlags?: DietaryFlag[];
  difficulty?: DifficultyLevel[];
  maxPrepTime?: number;
  maxCookTime?: number;
  maxTotalTime?: number;
  minRating?: number;
  nutritionGoals?: Partial<NutritionGoals>;
  costRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  excludeIngredients?: string[];
  sortBy?: 'relevance' | 'rating' | 'time' | 'difficulty' | 'cost' | 'nutrition';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  recipe: EnhancedRecipe;
  score: number;
  highlights: string[];
  matchedFields: string[];
}

export interface CookingStep {
  stepNumber: number;
  instruction: string;
  duration?: number;
  temperature?: number;
  equipment?: string[];
  ingredients?: string[];
  tips?: string[];
  imageUrl?: string;
  videoUrl?: string;
}

export interface PreparationStatus {
  isStarted: boolean;
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  estimatedTimeRemaining: number;
  lastUpdated: Date;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  healthScore: number; // 0-100
  colorCode: 'green' | 'yellow' | 'red';
}

export interface EnhancedRecipeCard {
  recipe: EnhancedRecipe;
  userRating?: number;
  isBookmarked: boolean;
  preparationStatus?: PreparationStatus;
  estimatedCost: CostEstimate;
  nutritionSummary: NutritionSummary;
  difficultyBadge: string;
  timeBadge: string;
  dietaryBadges: string[];
  cuisineBadge: string;
}

// Main enhanced recipe interface
export interface EnhancedRecipe extends Omit<IRecipe, 'allergenInfo'> {
  // Enhanced categorization
  cuisine: CuisineType;
  category: RecipeCategory;
  subcategory: string;
  tags: string[];
  
  // Nutritional analysis
  nutrition: DetailedNutrition;
  dietaryFlags: DietaryFlag[];
  allergenInfo: AllergenInfo;
  
  // Difficulty and timing
  difficulty: DifficultyLevel;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  
  // Cost and availability
  estimatedCost: CostEstimate;
  seasonalAvailability: SeasonalInfo;
  
  // AI-generated metadata
  aiTags: string[];
  similarityScores: SimilarityScore[];
  recommendationScore: number;
  
  // Enhanced content
  cookingSteps: CookingStep[];
  skillRequirements: SkillRequirement[];
  equipment: string[];
  tips: string[];
  variations: string[];
  substitutions: { [key: string]: string[] };
  
  // Analytics
  viewCount: number;
  ratingCount: number;
  averageRating: number;
  completionRate: number;
  lastViewed?: Date;
  lastCooked?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isVerified: boolean;
  source: string;
  author: string;
}

// Utility types for API responses
export interface RecipeListResponse {
  recipes: EnhancedRecipe[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: SearchQuery;
}

export interface RecommendationResponse {
  recommendations: EnhancedRecipe[];
  context: RecommendationContext;
  confidence: number;
  reasoning: string[];
  alternatives: EnhancedRecipe[];
}

export interface AnalyticsResponse {
  totalRecipes: number;
  categories: { [key: string]: number };
  cuisines: { [key: string]: number };
  dietaryFlags: { [key: string]: number };
  difficultyDistribution: { [key: string]: number };
  averageNutrition: DetailedNutrition;
  topRated: EnhancedRecipe[];
  mostPopular: EnhancedRecipe[];
  trending: EnhancedRecipe[];
}
