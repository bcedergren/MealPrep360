import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
    ONBOARDING_STEPS,
    OnboardingState,
    OnboardingStep,
    OnboardingStepData,
    OnboardingStepId,
    calculateProgress,
    canSkipStep,
    createInitialOnboardingState,
    getStepById,
    validateStepData,
} from '../types/onboarding';
import { UserProfile, generateDefaultProfile } from '../types/userProfile';
import { useUserProfile } from './useUserProfile';

const STORAGE_KEY = 'meal_prep_onboarding';

interface UseOnboardingReturn {
  // State
  state: OnboardingState;
  currentStep: OnboardingStep | null;
  stepData: OnboardingStepData;
  isLoading: boolean;
  error: string | null;
  
  // Navigation
  goToNextStep: () => Promise<void>;
  goToPreviousStep: () => void;
  goToStep: (stepId: OnboardingStepId) => void;
  skipStep: (stepId?: OnboardingStepId) => Promise<void>;
  
  // Data Management
  updateStepData: (stepId: OnboardingStepId, data: any) => void;
  completeStep: (stepId: OnboardingStepId, data: any) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
  
  // Utilities
  getProgress: () => number;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  canSkipCurrent: () => boolean;
  getValidationErrors: (stepId: OnboardingStepId) => string[];
  getTotalEstimatedTime: () => number;
  getRemainingTime: () => number;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const { user } = useUser();
  const { createProfile, updateProfile } = useUserProfile();
  
  const [state, setState] = useState<OnboardingState | null>(null);
  const [stepData, setStepData] = useState<OnboardingStepData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize onboarding state
  useEffect(() => {
    if (user?.id) {
      loadOnboardingState();
    }
  }, [user?.id]);

  // Load onboarding state from storage
  const loadOnboardingState = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const storageKey = `${STORAGE_KEY}_${user.id}`;
      const savedState = await AsyncStorage.getItem(storageKey);
      const savedStepData = await AsyncStorage.getItem(`${storageKey}_data`);

      if (savedState) {
        const parsedState: OnboardingState = JSON.parse(savedState);
        setState(parsedState);
      } else {
        // Create new onboarding state
        const newState = createInitialOnboardingState(user.id);
        setState(newState);
        await saveOnboardingState(newState);
      }

      if (savedStepData) {
        const parsedStepData: OnboardingStepData = JSON.parse(savedStepData);
        setStepData(parsedStepData);
      }
    } catch (err) {
      console.error('Error loading onboarding state:', err);
      setError('Failed to load onboarding progress');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Save onboarding state to storage
  const saveOnboardingState = useCallback(async (newState: OnboardingState) => {
    if (!user?.id) return;

    try {
      const storageKey = `${STORAGE_KEY}_${user.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newState));
      setState(newState);
    } catch (err) {
      console.error('Error saving onboarding state:', err);
      throw new Error('Failed to save onboarding progress');
    }
  }, [user?.id]);

  // Save step data to storage
  const saveStepData = useCallback(async (newStepData: OnboardingStepData) => {
    if (!user?.id) return;

    try {
      const storageKey = `${STORAGE_KEY}_${user.id}_data`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newStepData));
      setStepData(newStepData);
    } catch (err) {
      console.error('Error saving step data:', err);
      throw new Error('Failed to save step data');
    }
  }, [user?.id]);

  // Get current step
  const getCurrentStep = useCallback((): OnboardingStep | null => {
    if (!state) return null;
    return ONBOARDING_STEPS[state.currentStep] || null;
  }, [state]);

  // Navigate to next step
  const goToNextStep = useCallback(async () => {
    if (!state) return;

    const currentStep = getCurrentStep();
    if (!currentStep) return;

    // Validate current step data
    const currentStepData = stepData[currentStep.id as keyof OnboardingStepData];
    const validationErrors = validateStepData(currentStep.id, currentStepData);

    if (validationErrors.length > 0 && currentStep.isRequired) {
      setError(`Please fix the following errors: ${validationErrors.join(', ')}`);
      return;
    }

    // Move to next step
    const nextStepIndex = Math.min(state.currentStep + 1, state.totalSteps - 1);
    const newState = {
      ...state,
      currentStep: nextStepIndex,
    };

    await saveOnboardingState(newState);
    setError(null);
  }, [state, stepData, getCurrentStep, saveOnboardingState]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    if (!state) return;

    const previousStepIndex = Math.max(state.currentStep - 1, 0);
    const newState = {
      ...state,
      currentStep: previousStepIndex,
    };

    saveOnboardingState(newState);
    setError(null);
  }, [state, saveOnboardingState]);

  // Navigate to specific step
  const goToStep = useCallback((stepId: OnboardingStepId) => {
    if (!state) return;

    const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const newState = {
      ...state,
      currentStep: stepIndex,
    };

    saveOnboardingState(newState);
    setError(null);
  }, [state, saveOnboardingState]);

  // Skip current step
  const skipStep = useCallback(async (stepId?: OnboardingStepId) => {
    if (!state) return;

    const targetStepId = stepId || getCurrentStep()?.id;
    if (!targetStepId || !canSkipStep(targetStepId)) return;

    const skippedStep = getStepById(targetStepId);
    if (!skippedStep) return;

    const newState = {
      ...state,
      skippedSteps: [...state.skippedSteps, { ...skippedStep, isSkipped: true }],
    };

    await saveOnboardingState(newState);

    // Move to next step if skipping current step
    if (!stepId) {
      await goToNextStep();
    }
  }, [state, getCurrentStep, saveOnboardingState, goToNextStep]);

  // Update step data
  const updateStepData = useCallback((stepId: OnboardingStepId, data: any) => {
    const newStepData = {
      ...stepData,
      [stepId]: {
        ...stepData[stepId as keyof OnboardingStepData],
        ...data,
      },
    };

    setStepData(newStepData);
    saveStepData(newStepData);
  }, [stepData, saveStepData]);

  // Complete a step
  const completeStep = useCallback(async (stepId: OnboardingStepId, data: any) => {
    if (!state) return;

    // Validate step data
    const validationErrors = validateStepData(stepId, data);
    if (validationErrors.length > 0) {
      setError(`Please fix the following errors: ${validationErrors.join(', ')}`);
      return;
    }

    // Update step data
    await updateStepData(stepId, data);

    // Mark step as completed
    const completedStep = getStepById(stepId);
    if (!completedStep) return;

    const updatedCompletedStep = {
      ...completedStep,
      isCompleted: true,
      data,
    };

    const newState = {
      ...state,
      completedSteps: [
        ...state.completedSteps.filter(step => step.id !== stepId),
        updatedCompletedStep,
      ],
    };

    await saveOnboardingState(newState);
    setError(null);

    // Auto-advance to next step if not the last step
    if (stepId !== 'complete') {
      await goToNextStep();
    }
  }, [state, updateStepData, saveOnboardingState, goToNextStep]);

  // Complete entire onboarding
  const completeOnboarding = useCallback(async () => {
    if (!state || !user?.id) return;

    try {
      setIsLoading(true);

      // Convert onboarding data to user profile
      const profileData = convertOnboardingDataToProfile(stepData, user.id);
      
      // Create or update user profile
      await createProfile(profileData);

      // Mark onboarding as complete
      const newState = {
        ...state,
        isComplete: true,
        completedAt: new Date().toISOString(),
      };

      await saveOnboardingState(newState);

      // Clear onboarding data from storage
      const storageKey = `${STORAGE_KEY}_${user.id}`;
      await AsyncStorage.removeItem(storageKey);
      await AsyncStorage.removeItem(`${storageKey}_data`);
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [state, stepData, user?.id, createProfile, saveOnboardingState]);

  // Restart onboarding
  const restartOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      const newState = createInitialOnboardingState(user.id);
      await saveOnboardingState(newState);
      setStepData({});
      await saveStepData({});
      setError(null);
    } catch (err) {
      console.error('Error restarting onboarding:', err);
      setError('Failed to restart onboarding');
    }
  }, [user?.id, saveOnboardingState, saveStepData]);

  // Get progress percentage
  const getProgress = useCallback((): number => {
    if (!state) return 0;
    return calculateProgress(state.completedSteps);
  }, [state]);

  // Check if can go to next step
  const canGoNext = useCallback((): boolean => {
    if (!state) return false;
    return state.currentStep < state.totalSteps - 1;
  }, [state]);

  // Check if can go to previous step
  const canGoPrevious = useCallback((): boolean => {
    if (!state) return false;
    return state.currentStep > 0;
  }, [state]);

  // Check if can skip current step
  const canSkipCurrent = useCallback((): boolean => {
    const currentStep = getCurrentStep();
    return currentStep ? canSkipStep(currentStep.id) : false;
  }, [getCurrentStep]);

  // Get validation errors for a step
  const getValidationErrors = useCallback((stepId: OnboardingStepId): string[] => {
    const currentStepData = stepData[stepId as keyof OnboardingStepData];
    return validateStepData(stepId, currentStepData);
  }, [stepData]);

  // Get total estimated time
  const getTotalEstimatedTime = useCallback((): number => {
    return ONBOARDING_STEPS.reduce((total, step) => total + step.estimatedTime, 0);
  }, []);

  // Get remaining time estimate
  const getRemainingTime = useCallback((): number => {
    if (!state) return 0;
    
    const remainingSteps = ONBOARDING_STEPS.slice(state.currentStep);
    return remainingSteps.reduce((total, step) => total + step.estimatedTime, 0);
  }, [state]);

  // Convert onboarding data to user profile
  const convertOnboardingDataToProfile = (
    onboardingData: OnboardingStepData,
    userId: string
  ): Partial<UserProfile> => {
    const defaultProfile = generateDefaultProfile(userId);
    
    return {
      ...defaultProfile,
      personalInfo: {
        ...defaultProfile.personalInfo!,
        firstName: onboardingData.personalInfo?.firstName || '',
        lastName: onboardingData.personalInfo?.lastName || '',
        email: onboardingData.personalInfo?.email || '',
        dateOfBirth: onboardingData.personalInfo?.dateOfBirth,
        gender: onboardingData.personalInfo?.gender,
        height: onboardingData.personalInfo?.height ? {
          value: onboardingData.personalInfo.height.unit === 'ft' 
            ? (onboardingData.personalInfo.height.feet || 0) + ((onboardingData.personalInfo.height.inches || 0) / 12)
            : (onboardingData.personalInfo.height.cm || 0) / 30.48,
          unit: 'ft',
          feet: onboardingData.personalInfo.height.feet,
          inches: onboardingData.personalInfo.height.inches,
        } : undefined,
        weight: onboardingData.personalInfo?.weight,
        activityLevel: onboardingData.personalInfo?.activityLevel || 'moderately-active',
        location: onboardingData.personalInfo?.location,
      },
      healthGoals: {
        ...defaultProfile.healthGoals!,
        primaryGoal: onboardingData.healthGoals?.primaryGoal || 'maintenance',
        secondaryGoals: (onboardingData.healthGoals?.secondaryGoals || []) as any,
        targetWeight: onboardingData.healthGoals?.targetWeight,
        targetDate: onboardingData.healthGoals?.targetDate,
        weeklyWeightLossGoal: onboardingData.healthGoals?.weeklyWeightLossGoal,
        fitnessLevel: onboardingData.healthGoals?.fitnessLevel || 'intermediate',
        medicalConditions: onboardingData.healthGoals?.medicalConditions || [],
        supplements: (onboardingData.healthGoals?.supplements || []).map(s => ({
          ...s,
          purpose: 'Health supplement',
        })),
        trackingPreferences: {
          ...defaultProfile.healthGoals!.trackingPreferences,
          ...onboardingData.healthGoals?.trackingPreferences,
        },
      },
      dietaryPreferences: {
        ...defaultProfile.dietaryPreferences!,
        restrictions: (onboardingData.dietaryPreferences?.restrictions || []) as any,
        allergies: onboardingData.dietaryPreferences?.allergies || [],
        cuisinePreferences: onboardingData.dietaryPreferences?.cuisinePreferences || [],
        avoidedIngredients: onboardingData.dietaryPreferences?.avoidedIngredients || [],
        preferredIngredients: onboardingData.dietaryPreferences?.preferredIngredients || [],
        macroTargets: onboardingData.dietaryPreferences?.macroTargets,
        calorieTarget: onboardingData.dietaryPreferences?.calorieTarget,
        mealPreferences: onboardingData.dietaryPreferences?.mealPreferences || defaultProfile.dietaryPreferences!.mealPreferences,
      },
      cookingPreferences: {
        ...defaultProfile.cookingPreferences!,
        skillLevel: onboardingData.cookingPreferences?.skillLevel || 'intermediate',
        preferredCookingMethods: (onboardingData.cookingPreferences?.preferredCookingMethods || []) as any,
        maxCookingTime: onboardingData.cookingPreferences?.maxCookingTime || 60,
        maxPrepTime: onboardingData.cookingPreferences?.maxPrepTime || 30,
        difficultyPreference: onboardingData.cookingPreferences?.difficultyPreference || 'mixed',
        budgetPreference: onboardingData.cookingPreferences?.budgetPreference || 'moderate',
        mealPrepFrequency: onboardingData.cookingPreferences?.mealPrepFrequency || 'weekly',
        servingPreferences: {
          ...defaultProfile.cookingPreferences!.servingPreferences,
          ...onboardingData.cookingPreferences?.servingPreferences,
        },
        cookingStyles: (onboardingData.cookingPreferences?.cookingStyles || []) as any,
      },
      kitchenEquipment: {
        ...defaultProfile.kitchenEquipment!,
        appliances: onboardingData.kitchenEquipment?.appliances?.map(appliance => ({
          name: appliance.name,
          type: appliance.type as any,
          isAvailable: appliance.isAvailable,
          condition: (appliance.condition || 'good') as 'excellent' | 'good' | 'fair' | 'poor' | 'needs-replacement',
        })) || [],
        tools: onboardingData.kitchenEquipment?.essentialTools?.map(tool => ({
          name: tool.name,
          type: 'other' as any,
          isAvailable: tool.isAvailable,
          isEssential: true,
        })) || [],
        storageCapacity: {
          ...defaultProfile.kitchenEquipment!.storageCapacity,
          ...onboardingData.kitchenEquipment?.storageCapacity,
        },
        kitchenSize: onboardingData.kitchenEquipment?.kitchenSize || 'medium',
        equipmentWishlist: onboardingData.kitchenEquipment?.equipmentWishlist || [],
        cookware: [],
      },
      notificationSettings: {
        ...defaultProfile.notificationSettings!,
        mealReminders: onboardingData.notifications?.mealReminders ?? true,
        mealReminderTimes: onboardingData.notifications?.mealReminderTimes || defaultProfile.notificationSettings!.mealReminderTimes,
        shoppingReminders: onboardingData.notifications?.shoppingReminders ?? true,
        shoppingReminderDay: onboardingData.notifications?.shoppingReminderDay || 'sunday',
        prepReminders: onboardingData.notifications?.prepReminders ?? true,
        prepReminderTime: onboardingData.notifications?.prepReminderTime || '10:00',
        nutritionReminders: onboardingData.notifications?.nutritionReminders ?? false,
        weeklyReports: onboardingData.notifications?.weeklyReports ?? true,
        recipeRecommendations: onboardingData.notifications?.recipeRecommendations ?? true,
        pushNotifications: onboardingData.notifications?.pushNotifications ?? true,
        emailNotifications: onboardingData.notifications?.emailNotifications ?? true,
      },
      isOnboardingComplete: true,
    };
  };

  return {
    // State
    state: state || createInitialOnboardingState(''),
    currentStep: getCurrentStep(),
    stepData,
    isLoading,
    error,
    
    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,
    skipStep,
    
    // Data Management
    updateStepData,
    completeStep,
    completeOnboarding,
    restartOnboarding,
    
    // Utilities
    getProgress,
    canGoNext,
    canGoPrevious,
    canSkipCurrent,
    getValidationErrors,
    getTotalEstimatedTime,
    getRemainingTime,
  };
};