export interface MealPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string; // ISO date string for the week start (Monday)
  endDate: string; // ISO date string for the week end (Sunday)
  days: MealPlanDay[];
  settings: MealPlanSettings;
  nutritionSummary?: WeeklyNutritionSummary;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isTemplate?: boolean;
}

export interface MealPlanDay {
  date: string; // ISO date string
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  meals: MealSlot[];
  nutritionSummary?: DailyNutritionSummary;
  notes?: string;
}

export interface MealSlot {
  id: string;
  mealType: MealType;
  order: number; // For custom meal ordering
  recipes: MealRecipe[];
  customMeal?: CustomMeal;
  plannedTime?: string; // HH:MM format
  isCompleted?: boolean;
  notes?: string;
}

export interface MealRecipe {
  id: string;
  recipeId: string;
  recipe: Recipe; // Full recipe object for offline access
  servings: number;
  modifications?: RecipeModification[];
  estimatedPrepTime?: number;
  status: MealStatus;
  addedAt: string;
}

export interface CustomMeal {
  id: string;
  name: string;
  description?: string;
  estimatedCalories?: number;
  estimatedTime?: number;
  ingredients?: string[];
  instructions?: string[];
}

export interface RecipeModification {
  type: 'ingredient_substitution' | 'ingredient_omission' | 'serving_adjustment' | 'note';
  originalIngredientId?: string;
  newIngredientName?: string;
  note?: string;
}

export interface MealPlanSettings {
  defaultMealTypes: MealType[];
  targetCaloriesPerDay?: number;
  dietaryRestrictions: DietaryRestriction[];
  cuisinePreferences: CuisineType[];
  cookingTimePreference: 'quick' | 'normal' | 'extended';
  budgetPreference: 'low' | 'moderate' | 'high';
  autoSuggestions: boolean;
  shoppingListIntegration: boolean;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  mealReminders: boolean;
  prepReminders: boolean;
  shoppingReminders: boolean;
  reminderTimeMinutes: number;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  mealBreakdown: MealNutritionBreakdown[];
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

export interface MealNutritionBreakdown {
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface WeeklyNutritionSummary {
  weekStart: string;
  weekEnd: string;
  totalCalories: number;
  averageCaloriesPerDay: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  dailySummaries: DailyNutritionSummary[];
  complianceScore: number; // 0-100 based on targets
}

// Enums and Types
export type MealType = 
  | 'breakfast'
  | 'lunch' 
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout'
  | 'dessert';

export type MealStatus = 
  | 'planned'
  | 'prepped'
  | 'cooking'
  | 'ready'
  | 'completed'
  | 'skipped';

export type DayOfWeek = 
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

// Meal Plan Templates
export interface MealPlanTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number; // weeks
  targetGoal: string;
  mealPlanStructure: Omit<MealPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>;
  tags: string[];
  rating?: number;
  usageCount?: number;
  isPublic: boolean;
  authorId: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory = 
  | 'weight_loss'
  | 'muscle_gain'
  | 'maintenance'
  | 'athletic_performance'
  | 'family_friendly'
  | 'meal_prep'
  | 'quick_meals'
  | 'budget_friendly'
  | 'special_diet';

// Meal Suggestions
export interface MealSuggestion {
  id: string;
  mealType: MealType;
  recipes: Recipe[];
  reason: SuggestionReason;
  confidence: number; // 0-1
  nutritionFit: number; // 0-1
  preferenceFit: number; // 0-1;
  varietyScore: number; // 0-1
  estimatedPrepTime: number;
  estimatedCost: number;
  difficultyLevel: 'Easy' | 'Medium' | 'Hard';
}

export type SuggestionReason = 
  | 'nutrition_goals'
  | 'dietary_restrictions'
  | 'cuisine_preference'
  | 'time_constraint'
  | 'budget_constraint'
  | 'ingredient_availability'
  | 'variety_enhancement'
  | 'user_favorites'
  | 'seasonal_ingredients'
  | 'leftover_utilization';

// Meal Plan Actions
export interface MealPlanAction {
  type: MealPlanActionType;
  payload: any;
  timestamp: string;
  userId: string;
  mealPlanId: string;
}

export type MealPlanActionType = 
  | 'create_meal_plan'
  | 'update_meal_plan'
  | 'delete_meal_plan'
  | 'add_recipe_to_meal'
  | 'remove_recipe_from_meal'
  | 'update_meal_recipe'
  | 'add_custom_meal'
  | 'update_custom_meal'
  | 'mark_meal_completed'
  | 'add_meal_note'
  | 'update_meal_time'
  | 'duplicate_meal_plan'
  | 'apply_template';

// Utility Functions
export const getMealTypeColor = (mealType: MealType): string => {
  switch (mealType) {
    case 'breakfast':
      return '#F59E0B'; // Amber
    case 'lunch':
      return '#10B981'; // Emerald
    case 'dinner':
      return '#6366F1'; // Indigo
    case 'snack':
      return '#EF4444'; // Red
    case 'pre_workout':
      return '#8B5CF6'; // Violet
    case 'post_workout':
      return '#06B6D4'; // Cyan
    case 'dessert':
      return '#EC4899'; // Pink
    default:
      return '#6B7280'; // Gray
  }
};

export const getMealTypeIcon = (mealType: MealType): string => {
  switch (mealType) {
    case 'breakfast':
      return 'sunny-outline';
    case 'lunch':
      return 'restaurant-outline';
    case 'dinner':
      return 'moon-outline';
    case 'snack':
      return 'cafe-outline';
    case 'pre_workout':
      return 'fitness-outline';
    case 'post_workout':
      return 'barbell-outline';
    case 'dessert':
      return 'ice-cream-outline';
    default:
      return 'restaurant-outline';
  }
};

export const getDayOfWeekName = (dayOfWeek: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
};

export const getWeekDates = (startDate: Date): Date[] => {
  const dates: Date[] = [];
  const start = new Date(startDate);
  
  // Ensure we start on Monday
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

export const calculateMealNutrition = (mealRecipes: MealRecipe[]): MealNutritionBreakdown => {
  const nutrition = {
    mealType: 'breakfast' as MealType,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  mealRecipes.forEach(mealRecipe => {
    if (mealRecipe.recipe.nutritionInfo) {
      const scale = mealRecipe.servings / mealRecipe.recipe.servings;
      const recipeNutrition = mealRecipe.recipe.nutritionInfo;
      
      nutrition.calories += recipeNutrition.calories * scale;
      nutrition.protein += recipeNutrition.protein * scale;
      nutrition.carbs += recipeNutrition.carbs * scale;
      nutrition.fat += recipeNutrition.fat * scale;
      nutrition.fiber += recipeNutrition.fiber * scale;
      nutrition.sugar += recipeNutrition.sugar * scale;
      nutrition.sodium += recipeNutrition.sodium * scale;
    }
  });

  return nutrition;
};

// Default meal plan settings
export const DEFAULT_MEAL_PLAN_SETTINGS: MealPlanSettings = {
  defaultMealTypes: ['breakfast', 'lunch', 'dinner', 'snack'],
  targetCaloriesPerDay: 2000,
  dietaryRestrictions: [],
  cuisinePreferences: [],
  cookingTimePreference: 'normal',
  budgetPreference: 'moderate',
  autoSuggestions: true,
  shoppingListIntegration: true,
  notificationSettings: {
    mealReminders: true,
    prepReminders: true,
    shoppingReminders: true,
    reminderTimeMinutes: 30,
  },
};

// Import Recipe type from existing types
import { CuisineType, DietaryRestriction, Recipe } from './recipe';
