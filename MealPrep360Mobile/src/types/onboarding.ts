export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completedSteps: OnboardingStep[];
  isComplete: boolean;
  skippedSteps: OnboardingStep[];
  userId: string;
  startedAt: string;
  completedAt?: string;
}

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  icon: string;
  isRequired: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  data?: any;
  validationErrors?: string[];
  estimatedTime: number; // in minutes
}

export type OnboardingStepId = 
  | 'welcome'
  | 'personal-info'
  | 'health-goals'
  | 'dietary-preferences'
  | 'cooking-preferences'
  | 'notifications'
  | 'complete';

export interface OnboardingProgress {
  stepId: OnboardingStepId;
  isCompleted: boolean;
  completedAt?: string;
  data?: any;
}

export interface OnboardingContext {
  state: OnboardingState;
  currentStepData: OnboardingStepData;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (stepId: OnboardingStepId) => void;
  skipStep: (stepId: OnboardingStepId) => void;
  completeStep: (stepId: OnboardingStepId, data: any) => void;
  updateStepData: (stepId: OnboardingStepId, data: any) => void;
  restartOnboarding: () => void;
  completeOnboarding: () => void;
}

export interface OnboardingStepData {
  welcome?: WelcomeStepData;
  personalInfo?: PersonalInfoStepData;
  healthGoals?: HealthGoalsStepData;
  dietaryPreferences?: DietaryPreferencesStepData;
  cookingPreferences?: CookingPreferencesStepData;
  kitchenEquipment?: KitchenEquipmentStepData;
  notifications?: NotificationsStepData;
}

export interface WelcomeStepData {
  userName?: string;
  primaryGoal?: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'improved-health';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  timeCommitment?: 'minimal' | 'moderate' | 'high';
}

export interface PersonalInfoStepData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  height?: {
    feet?: number;
    inches?: number;
    cm?: number;
    unit: 'ft' | 'cm';
  };
  weight?: {
    value: number;
    unit: 'lbs' | 'kg';
  };
  activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extremely-active';
  location?: {
    country: string;
    state?: string;
    city?: string;
  };
}

export interface HealthGoalsStepData {
  primaryGoal: 'weight-loss' | 'weight-gain' | 'muscle-gain' | 'maintenance' | 'improved-energy';
  secondaryGoals: string[];
  targetWeight?: number;
  targetDate?: string;
  weeklyWeightLossGoal?: number;
  fitnessLevel: 'sedentary' | 'beginner' | 'intermediate' | 'advanced' | 'athlete';
  medicalConditions: {
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
    dietaryImpact: string[];
  }[];
  supplements: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  trackingPreferences: {
    trackWeight: boolean;
    trackCalories: boolean;
    trackMacros: boolean;
    trackWater: boolean;
    trackExercise: boolean;
  };
}

export interface DietaryPreferencesStepData {
  restrictions: string[];
  allergies: {
    name: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
    description?: string;
  }[];
  cuisinePreferences: {
    cuisine: string;
    preference: 'love' | 'like' | 'neutral' | 'dislike' | 'hate';
  }[];
  avoidedIngredients: string[];
  preferredIngredients: string[];
  macroTargets?: {
    protein: number;
    carbs: number;
    fat: number;
    percentages?: {
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  calorieTarget?: number;
  mealPreferences: {
    mealType: string;
    preferredTime?: string;
    calorieTarget?: number;
    skipFrequently?: boolean;
  }[];
}

export interface CookingPreferencesStepData {
  skillLevel: 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'expert';
  preferredCookingMethods: string[];
  maxCookingTime: number;
  maxPrepTime: number;
  difficultyPreference: 'easy-only' | 'mostly-easy' | 'mixed' | 'challenging' | 'expert-level';
  budgetPreference: 'budget' | 'moderate' | 'premium' | 'luxury';
  mealPrepFrequency: 'daily' | 'every-other-day' | 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly';
  servingPreferences: {
    defaultServings: number;
    householdSize: number;
    leftoverPreference: 'love' | 'tolerate' | 'avoid' | 'hate';
    portionSizePreference: 'small' | 'medium' | 'large' | 'extra-large';
  };
  cookingStyles: string[];
}

export interface KitchenEquipmentStepData {
  appliances: {
    name: string;
    type: string;
    isAvailable: boolean;
    condition?: string;
  }[];
  essentialTools: {
    name: string;
    isAvailable: boolean;
  }[];
  storageCapacity: {
    refrigerator: 'small' | 'medium' | 'large';
    freezer: 'small' | 'medium' | 'large';
    pantry: 'small' | 'medium' | 'large';
  };
  kitchenSize: 'small' | 'medium' | 'large';
  equipmentWishlist: string[];
}

export interface NotificationsStepData {
  mealReminders: boolean;
  mealReminderTimes: {
    mealType: string;
    time: string;
    enabled: boolean;
  }[];
  shoppingReminders: boolean;
  shoppingReminderDay: string;
  prepReminders: boolean;
  prepReminderTime: string;
  nutritionReminders: boolean;
  weeklyReports: boolean;
  recipeRecommendations: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MealPrep360',
    description: 'Let\'s get you started with personalized meal planning',
    icon: 'hand-left',
    isRequired: true,
    isCompleted: false,
    isSkipped: false,
    estimatedTime: 1,
  },
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Tell us about yourself for personalized recommendations',
    icon: 'person',
    isRequired: true,
    isCompleted: false,
    isSkipped: false,
    estimatedTime: 3,
  },
  {
    id: 'health-goals',
    title: 'Health & Fitness Goals',
    description: 'Set your health goals and tracking preferences',
    icon: 'fitness',
    isRequired: true,
    isCompleted: false,
    isSkipped: false,
    estimatedTime: 4,
  },
  {
    id: 'dietary-preferences',
    title: 'Dietary Preferences',
    description: 'Configure your dietary restrictions and food preferences',
    icon: 'nutrition',
    isRequired: false,
    isCompleted: false,
    isSkipped: false,
    estimatedTime: 5,
  },
  {
    id: 'cooking-preferences',
    title: 'Cooking Preferences',
    description: 'Tell us about your cooking skills and preferences',
    icon: 'restaurant',
    isRequired: false,
    isCompleted: false,
    isSkipped: false,
    estimatedTime: 3,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Choose which notifications you\'d like to receive',
    icon: 'notifications',
    isRequired: false,
    isCompleted: false,
    isSkipped: false,
    estimatedTime: 2,
  },
  {
    id: 'complete',
    title: 'Setup Complete',
    description: 'You\'re all set! Start exploring your personalized meal plans',
    icon: 'checkmark-circle',
    isRequired: true,
    isCompleted: false,
    isSkipped: false,
    estimatedTime: 1,
  },
];

export const createInitialOnboardingState = (userId: string): OnboardingState => ({
  currentStep: 0,
  totalSteps: ONBOARDING_STEPS.length,
  completedSteps: [],
  isComplete: false,
  skippedSteps: [],
  userId,
  startedAt: new Date().toISOString(),
});

export const getStepById = (stepId: OnboardingStepId): OnboardingStep | undefined => {
  return ONBOARDING_STEPS.find(step => step.id === stepId);
};

export const getTotalEstimatedTime = (): number => {
  return ONBOARDING_STEPS.reduce((total, step) => total + step.estimatedTime, 0);
};

export const getRequiredSteps = (): OnboardingStep[] => {
  return ONBOARDING_STEPS.filter(step => step.isRequired);
};

export const getOptionalSteps = (): OnboardingStep[] => {
  return ONBOARDING_STEPS.filter(step => !step.isRequired);
};

export const calculateProgress = (completedSteps: OnboardingStep[]): number => {
  return (completedSteps.length / ONBOARDING_STEPS.length) * 100;
};

export const canSkipStep = (stepId: OnboardingStepId): boolean => {
  const step = getStepById(stepId);
  return step ? !step.isRequired : false;
};

export const validateStepData = (stepId: OnboardingStepId, data: any): string[] => {
  const errors: string[] = [];

  switch (stepId) {
    case 'personal-info':
      if (!data.firstName?.trim()) errors.push('First name is required');
      if (!data.lastName?.trim()) errors.push('Last name is required');
      if (!data.email?.trim()) errors.push('Email is required');
      if (!data.activityLevel) errors.push('Activity level is required');
      break;

    case 'health-goals':
      if (!data.primaryGoal) errors.push('Primary health goal is required');
      if (!data.fitnessLevel) errors.push('Fitness level is required');
      break;

    case 'dietary-preferences':
      if (data.macroTargets) {
        const total = (data.macroTargets.percentages?.protein || 0) + 
                     (data.macroTargets.percentages?.carbs || 0) + 
                     (data.macroTargets.percentages?.fat || 0);
        if (Math.abs(total - 100) > 0.1) {
          errors.push('Macro percentages must add up to 100%');
        }
      }
      break;

    case 'cooking-preferences':
      if (!data.skillLevel) errors.push('Cooking skill level is required');
      if (!data.maxCookingTime || data.maxCookingTime < 5) errors.push('Maximum cooking time must be at least 5 minutes');
      if (!data.maxPrepTime || data.maxPrepTime < 5) errors.push('Maximum prep time must be at least 5 minutes');
      break;

    default:
      break;
  }

  return errors;
};