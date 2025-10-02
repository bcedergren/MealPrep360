export interface UserProfile {
  id: string;
  userId: string; // Clerk user ID
  personalInfo: PersonalInfo;
  dietaryPreferences: DietaryPreferences;
  cookingPreferences: CookingPreferences;
  healthGoals: HealthGoals;
  kitchenEquipment: KitchenEquipment;
  notificationSettings: NotificationSettings;
  appSettings: AppSettings;
  createdAt: string;
  updatedAt: string;
  isOnboardingComplete: boolean;
  profilePictureUrl?: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: Gender;
  height?: Height;
  weight?: Weight;
  activityLevel: ActivityLevel;
  location?: Location;
  timezone: string;
}

export interface Height {
  value: number;
  unit: 'ft' | 'cm';
  feet?: number; // for ft unit
  inches?: number; // for ft unit
}

export interface Weight {
  value: number;
  unit: 'lbs' | 'kg';
  targetWeight?: number;
}

export interface Location {
  country: string;
  state?: string;
  city?: string;
  zipCode?: string;
}

export interface DietaryPreferences {
  restrictions: DietaryRestriction[];
  allergies: Allergy[];
  preferences: FoodPreference[];
  cuisinePreferences: CuisinePreference[];
  avoidedIngredients: string[];
  preferredIngredients: string[];
  macroTargets?: MacroTargets;
  calorieTarget?: number;
  mealPreferences: MealPreference[];
}

export interface Allergy {
  name: string;
  severity: AllergySeverity;
  description?: string;
}

export interface FoodPreference {
  category: string;
  preference: PreferenceLevel;
  notes?: string;
}

export interface CuisinePreference {
  cuisine: string;
  preference: PreferenceLevel;
}

export interface MacroTargets {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  percentages?: {
    protein: number; // percentage
    carbs: number; // percentage
    fat: number; // percentage
  };
}

export interface MealPreference {
  mealType: string;
  preferredTime?: string; // HH:MM format
  calorieTarget?: number;
  skipFrequently?: boolean;
}

export interface CookingPreferences {
  skillLevel: CookingSkillLevel;
  preferredCookingMethods: CookingMethod[];
  maxCookingTime: number; // minutes
  maxPrepTime: number; // minutes
  difficultyPreference: DifficultyPreference;
  budgetPreference: BudgetPreference;
  mealPrepFrequency: MealPrepFrequency;
  servingPreferences: ServingPreferences;
  cookingStyles: CookingStyle[];
}

export interface ServingPreferences {
  defaultServings: number;
  householdSize: number;
  leftoverPreference: LeftoverPreference;
  portionSizePreference: PortionSize;
}

export interface HealthGoals {
  primaryGoal: HealthGoal;
  secondaryGoals: HealthGoal[];
  targetWeight?: number;
  targetDate?: string;
  weeklyWeightLossGoal?: number; // lbs per week
  fitnessLevel: FitnessLevel;
  medicalConditions: MedicalCondition[];
  supplements: Supplement[];
  trackingPreferences: TrackingPreferences;
}

export interface MedicalCondition {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  dietaryImpact: string[];
  medications?: string[];
  doctorRecommendations?: string;
}

export interface Supplement {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
}

export interface TrackingPreferences {
  trackWeight: boolean;
  trackCalories: boolean;
  trackMacros: boolean;
  trackWater: boolean;
  trackExercise: boolean;
  trackMood: boolean;
  trackSleep: boolean;
  reminderFrequency: ReminderFrequency;
}

export interface KitchenEquipment {
  appliances: Appliance[];
  cookware: Cookware[];
  tools: KitchenTool[];
  storageCapacity: StorageCapacity;
  kitchenSize: KitchenSize;
  equipmentWishlist: string[];
}

export interface Appliance {
  name: string;
  type: ApplianceType;
  isAvailable: boolean;
  condition: EquipmentCondition;
  notes?: string;
}

export interface Cookware {
  name: string;
  type: CookwareType;
  material?: string;
  size?: string;
  quantity: number;
  isAvailable: boolean;
}

export interface KitchenTool {
  name: string;
  type: ToolType;
  isAvailable: boolean;
  isEssential: boolean;
}

export interface StorageCapacity {
  refrigeratorSize: RefrigeratorSize;
  freezerSize: FreezerSize;
  pantrySize: PantrySize;
  hasPantry: boolean;
  hasBasement: boolean;
  hasGarage: boolean;
}

export interface NotificationSettings {
  mealReminders: boolean;
  mealReminderTimes: MealReminderTime[];
  shoppingReminders: boolean;
  shoppingReminderDay: string; // day of week
  prepReminders: boolean;
  prepReminderTime: string; // HH:MM
  nutritionReminders: boolean;
  weightTrackingReminders: boolean;
  weeklyReports: boolean;
  recipeRecommendations: boolean;
  specialOffers: boolean;
  appUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface MealReminderTime {
  mealType: string;
  time: string; // HH:MM
  enabled: boolean;
}

export interface AppSettings {
  theme: Theme;
  language: string;
  units: UnitSystem;
  privacy: PrivacySettings;
  dataSync: DataSyncSettings;
  accessibility: AccessibilitySettings;
  experimentalFeatures: ExperimentalFeatures;
}

export interface PrivacySettings {
  profileVisibility: 'private' | 'friends' | 'public';
  shareRecipes: boolean;
  shareMealPlans: boolean;
  shareProgress: boolean;
  dataCollection: boolean;
  analyticsOptOut: boolean;
}

export interface DataSyncSettings {
  autoSync: boolean;
  syncFrequency: SyncFrequency;
  backupEnabled: boolean;
  cloudStorageProvider?: CloudProvider;
  lastSync?: string;
}

export interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  voiceNavigation: boolean;
}

export interface ExperimentalFeatures {
  betaFeatures: boolean;
  aiRecommendations: boolean;
  advancedAnalytics: boolean;
  socialFeatures: boolean;
}

// Enums and Types
export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

export type ActivityLevel = 
  | 'sedentary'
  | 'lightly-active'
  | 'moderately-active'
  | 'very-active'
  | 'extremely-active';

export type DietaryRestriction = 
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'paleo'
  | 'low-carb'
  | 'low-fat'
  | 'low-sodium'
  | 'low-sugar'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'egg-free'
  | 'soy-free'
  | 'shellfish-free'
  | 'kosher'
  | 'halal'
  | 'intermittent-fasting'
  | 'raw-food'
  | 'whole30'
  | 'mediterranean'
  | 'dash'
  | 'anti-inflammatory';

export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life-threatening';

export type PreferenceLevel = 'love' | 'like' | 'neutral' | 'dislike' | 'hate';

export type CookingSkillLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'expert';

export type CookingMethod = 
  | 'baking'
  | 'grilling'
  | 'sautéing'
  | 'roasting'
  | 'steaming'
  | 'boiling'
  | 'frying'
  | 'slow-cooking'
  | 'pressure-cooking'
  | 'air-frying'
  | 'smoking'
  | 'braising'
  | 'poaching'
  | 'stir-frying'
  | 'broiling';

export type DifficultyPreference = 'easy-only' | 'mostly-easy' | 'mixed' | 'challenging' | 'expert-level';

export type BudgetPreference = 'budget' | 'moderate' | 'premium' | 'luxury';

export type MealPrepFrequency = 'daily' | 'every-other-day' | 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly';

export type LeftoverPreference = 'love' | 'tolerate' | 'avoid' | 'hate';

export type PortionSize = 'small' | 'medium' | 'large' | 'extra-large';

export type CookingStyle = 
  | 'quick-and-simple'
  | 'batch-cooking'
  | 'gourmet'
  | 'comfort-food'
  | 'healthy-focused'
  | 'international'
  | 'experimental'
  | 'traditional'
  | 'minimal-ingredients'
  | 'one-pot-meals';

export type HealthGoal = 
  | 'weight-loss'
  | 'weight-gain'
  | 'muscle-gain'
  | 'maintenance'
  | 'improved-energy'
  | 'better-digestion'
  | 'reduced-inflammation'
  | 'heart-health'
  | 'diabetes-management'
  | 'blood-pressure'
  | 'cholesterol'
  | 'athletic-performance'
  | 'recovery'
  | 'longevity'
  | 'mental-clarity';

export type FitnessLevel = 'sedentary' | 'beginner' | 'intermediate' | 'advanced' | 'athlete';

export type ReminderFrequency = 'never' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly';

export type ApplianceType = 
  | 'oven'
  | 'microwave'
  | 'stovetop'
  | 'dishwasher'
  | 'refrigerator'
  | 'freezer'
  | 'slow-cooker'
  | 'pressure-cooker'
  | 'air-fryer'
  | 'blender'
  | 'food-processor'
  | 'stand-mixer'
  | 'toaster'
  | 'coffee-maker'
  | 'grill'
  | 'griddle'
  | 'rice-cooker'
  | 'dehydrator'
  | 'ice-maker'
  | 'garbage-disposal';

export type CookwareType = 
  | 'skillet'
  | 'saucepan'
  | 'stockpot'
  | 'dutch-oven'
  | 'baking-sheet'
  | 'baking-dish'
  | 'muffin-tin'
  | 'cake-pan'
  | 'roasting-pan'
  | 'steamer'
  | 'wok'
  | 'grill-pan'
  | 'casserole-dish';

export type ToolType = 
  | 'knife'
  | 'cutting-board'
  | 'measuring-cups'
  | 'measuring-spoons'
  | 'mixing-bowls'
  | 'whisk'
  | 'spatula'
  | 'tongs'
  | 'ladle'
  | 'can-opener'
  | 'peeler'
  | 'grater'
  | 'thermometer'
  | 'timer'
  | 'scale';

export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'needs-replacement';

export type RefrigeratorSize = 'mini' | 'small' | 'standard' | 'large' | 'extra-large';
export type FreezerSize = 'none' | 'small' | 'standard' | 'large' | 'chest-freezer';
export type PantrySize = 'none' | 'small' | 'medium' | 'large' | 'walk-in';
export type KitchenSize = 'tiny' | 'small' | 'medium' | 'large' | 'commercial';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type SyncFrequency = 'real-time' | 'hourly' | 'daily' | 'weekly' | 'manual';
export type CloudProvider = 'icloud' | 'google-drive' | 'dropbox' | 'none';

export interface UnitSystem {
  temperature: 'fahrenheit' | 'celsius';
  weight: 'imperial' | 'metric';
  volume: 'imperial' | 'metric';
  distance: 'imperial' | 'metric';
}

// Default values and utility functions
export const DEFAULT_MACRO_TARGETS: MacroTargets = {
  protein: 150,
  carbs: 200,
  fat: 70,
  fiber: 30,
  percentages: {
    protein: 30,
    carbs: 40,
    fat: 30,
  },
};

export const ACTIVITY_LEVEL_MULTIPLIERS: Record<ActivityLevel, number> = {
  'sedentary': 1.2,
  'lightly-active': 1.375,
  'moderately-active': 1.55,
  'very-active': 1.725,
  'extremely-active': 1.9,
};

export const calculateBMR = (
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: Gender
): number => {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
};

export const calculateTDEE = (
  bmr: number,
  activityLevel: ActivityLevel
): number => {
  return bmr * ACTIVITY_LEVEL_MULTIPLIERS[activityLevel];
};

export const calculateCalorieTarget = (
  tdee: number,
  goal: HealthGoal,
  weeklyWeightLossGoal?: number
): number => {
  switch (goal) {
    case 'weight-loss':
      const deficitPerWeek = (weeklyWeightLossGoal || 1) * 3500; // 3500 calories per pound
      const dailyDeficit = deficitPerWeek / 7;
      return Math.max(1200, tdee - dailyDeficit); // Don't go below 1200 calories
    case 'weight-gain':
      return tdee + 500; // 1 lb per week gain
    case 'muscle-gain':
      return tdee + 300; // Lean bulk
    case 'maintenance':
    default:
      return tdee;
  }
};

export const convertWeightToKg = (weight: number, unit: 'lbs' | 'kg'): number => {
  return unit === 'lbs' ? weight * 0.453592 : weight;
};

export const convertHeightToCm = (height: Height): number => {
  if (height.unit === 'cm') {
    return height.value;
  } else {
    const feet = height.feet || 0;
    const inches = height.inches || 0;
    return (feet * 12 + inches) * 2.54;
  }
};

export const getAgeFromBirthdate = (birthdate: string): number => {
  const today = new Date();
  const birth = new Date(birthdate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }
  
  return age;
};

export const validateMacroTargets = (macros: MacroTargets): boolean => {
  const totalPercentage = (macros.percentages?.protein || 0) + 
                         (macros.percentages?.carbs || 0) + 
                         (macros.percentages?.fat || 0);
  
  return Math.abs(totalPercentage - 100) < 0.1; // Allow for small rounding errors
};

export const generateDefaultProfile = (userId: string): Partial<UserProfile> => {
  return {
    userId,
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      activityLevel: 'moderately-active',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    dietaryPreferences: {
      restrictions: [],
      allergies: [],
      preferences: [],
      cuisinePreferences: [],
      avoidedIngredients: [],
      preferredIngredients: [],
      mealPreferences: [
        { mealType: 'breakfast', preferredTime: '08:00' },
        { mealType: 'lunch', preferredTime: '12:30' },
        { mealType: 'dinner', preferredTime: '18:30' },
      ],
    },
    cookingPreferences: {
      skillLevel: 'intermediate',
      preferredCookingMethods: ['baking', 'sautéing', 'roasting'],
      maxCookingTime: 60,
      maxPrepTime: 30,
      difficultyPreference: 'mixed',
      budgetPreference: 'moderate',
      mealPrepFrequency: 'weekly',
      servingPreferences: {
        defaultServings: 4,
        householdSize: 2,
        leftoverPreference: 'tolerate',
        portionSizePreference: 'medium',
      },
      cookingStyles: [],
    },
    healthGoals: {
      primaryGoal: 'maintenance',
      secondaryGoals: [],
      fitnessLevel: 'intermediate',
      medicalConditions: [],
      supplements: [],
      trackingPreferences: {
        trackWeight: false,
        trackCalories: true,
        trackMacros: false,
        trackWater: false,
        trackExercise: false,
        trackMood: false,
        trackSleep: false,
        reminderFrequency: 'weekly',
      },
    },
    kitchenEquipment: {
      appliances: [],
      cookware: [],
      tools: [],
      storageCapacity: {
        refrigeratorSize: 'standard',
        freezerSize: 'standard',
        pantrySize: 'medium',
        hasPantry: true,
        hasBasement: false,
        hasGarage: false,
      },
      kitchenSize: 'medium',
      equipmentWishlist: [],
    },
    notificationSettings: {
      mealReminders: true,
      mealReminderTimes: [
        { mealType: 'breakfast', time: '08:00', enabled: true },
        { mealType: 'lunch', time: '12:30', enabled: true },
        { mealType: 'dinner', time: '18:30', enabled: true },
      ],
      shoppingReminders: true,
      shoppingReminderDay: 'sunday',
      prepReminders: true,
      prepReminderTime: '10:00',
      nutritionReminders: false,
      weightTrackingReminders: false,
      weeklyReports: true,
      recipeRecommendations: true,
      specialOffers: false,
      appUpdates: true,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
    appSettings: {
      theme: 'system',
      language: 'en',
      units: {
        temperature: 'fahrenheit',
        weight: 'imperial',
        volume: 'imperial',
        distance: 'imperial',
      },
      privacy: {
        profileVisibility: 'private',
        shareRecipes: false,
        shareMealPlans: false,
        shareProgress: false,
        dataCollection: true,
        analyticsOptOut: false,
      },
      dataSync: {
        autoSync: true,
        syncFrequency: 'daily',
        backupEnabled: true,
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
        voiceNavigation: false,
      },
      experimentalFeatures: {
        betaFeatures: false,
        aiRecommendations: true,
        advancedAnalytics: false,
        socialFeatures: false,
      },
    },
    isOnboardingComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};