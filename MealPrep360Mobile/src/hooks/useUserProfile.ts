import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
    AppSettings,
    calculateBMR,
    calculateCalorieTarget,
    calculateTDEE,
    convertHeightToCm,
    convertWeightToKg,
    CookingPreferences,
    DietaryPreferences,
    generateDefaultProfile,
    getAgeFromBirthdate,
    HealthGoals,
    KitchenEquipment,
    NotificationSettings,
    PersonalInfo,
    UserProfile,
    validateMacroTargets
} from '../types/userProfile';

const STORAGE_KEY = 'meal_prep_user_profile';

interface UseUserProfileReturn {
  // Profile state
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Profile management
  createProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteProfile: () => Promise<void>;
  
  // Section-specific updates
  updatePersonalInfo: (info: Partial<PersonalInfo>) => Promise<void>;
  updateDietaryPreferences: (preferences: Partial<DietaryPreferences>) => Promise<void>;
  updateCookingPreferences: (preferences: Partial<CookingPreferences>) => Promise<void>;
  updateHealthGoals: (goals: Partial<HealthGoals>) => Promise<void>;
  updateKitchenEquipment: (equipment: Partial<KitchenEquipment>) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // Onboarding
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  
  // Calculations
  calculateUserBMR: () => number | null;
  calculateUserTDEE: () => number | null;
  calculateUserCalorieTarget: () => number | null;
  
  // Utility functions
  exportProfile: () => string;
  importProfile: (profileData: string) => Promise<void>;
  validateProfile: () => { isValid: boolean; errors: string[] };
  
  // Profile picture
  updateProfilePicture: (imageUrl: string) => Promise<void>;
  
  // Preferences helpers
  hasAllergies: () => boolean;
  hasDietaryRestrictions: () => boolean;
  getRecommendedRecipeFilters: () => any;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  // Load profile from storage
  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const profileData = await AsyncStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      
      if (profileData) {
        const parsedProfile: UserProfile = JSON.parse(profileData);
        setProfile(parsedProfile);
      } else {
        // Create default profile for new users
        const defaultProfile = generateDefaultProfile(user.id);
        const newProfile: UserProfile = {
          id: `profile_${user.id}`,
          ...defaultProfile,
          personalInfo: {
            ...defaultProfile.personalInfo!,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
          },
        } as UserProfile;
        
        setProfile(newProfile);
        await saveProfile(newProfile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save profile to storage
  const saveProfile = useCallback(async (profileToSave: UserProfile) => {
    if (!user?.id) return;

    try {
      const updatedProfile = {
        ...profileToSave,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${user.id}`, 
        JSON.stringify(updatedProfile)
      );
      
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Error saving profile:', err);
      throw new Error('Failed to save profile');
    }
  }, [user?.id]);

  // Create new profile
  const createProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setIsSaving(true);
      setError(null);

      const newProfile: UserProfile = {
        id: `profile_${user.id}`,
        userId: user.id,
        ...generateDefaultProfile(user.id),
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as UserProfile;

      await saveProfile(newProfile);
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, saveProfile]);

  // Update entire profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) {
      throw new Error('No profile to update');
    }

    try {
      setIsSaving(true);
      setError(null);

      const updatedProfile = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await saveProfile(updatedProfile);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [profile, saveProfile]);

  // Delete profile
  const deleteProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      await AsyncStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
      setProfile(null);
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError('Failed to delete profile');
      throw err;
    }
  }, [user?.id]);

  // Update personal info
  const updatePersonalInfo = useCallback(async (info: Partial<PersonalInfo>) => {
    if (!profile) return;

    await updateProfile({
      personalInfo: {
        ...profile.personalInfo,
        ...info,
      },
    });
  }, [profile, updateProfile]);

  // Update dietary preferences
  const updateDietaryPreferences = useCallback(async (preferences: Partial<DietaryPreferences>) => {
    if (!profile) return;

    await updateProfile({
      dietaryPreferences: {
        ...profile.dietaryPreferences,
        ...preferences,
      },
    });
  }, [profile, updateProfile]);

  // Update cooking preferences
  const updateCookingPreferences = useCallback(async (preferences: Partial<CookingPreferences>) => {
    if (!profile) return;

    await updateProfile({
      cookingPreferences: {
        ...profile.cookingPreferences,
        ...preferences,
      },
    });
  }, [profile, updateProfile]);

  // Update health goals
  const updateHealthGoals = useCallback(async (goals: Partial<HealthGoals>) => {
    if (!profile) return;

    await updateProfile({
      healthGoals: {
        ...profile.healthGoals,
        ...goals,
      },
    });
  }, [profile, updateProfile]);

  // Update kitchen equipment
  const updateKitchenEquipment = useCallback(async (equipment: Partial<KitchenEquipment>) => {
    if (!profile) return;

    await updateProfile({
      kitchenEquipment: {
        ...profile.kitchenEquipment,
        ...equipment,
      },
    });
  }, [profile, updateProfile]);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    if (!profile) return;

    await updateProfile({
      notificationSettings: {
        ...profile.notificationSettings,
        ...settings,
      },
    });
  }, [profile, updateProfile]);

  // Update app settings
  const updateAppSettings = useCallback(async (settings: Partial<AppSettings>) => {
    if (!profile) return;

    await updateProfile({
      appSettings: {
        ...profile.appSettings,
        ...settings,
      },
    });
  }, [profile, updateProfile]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    await updateProfile({ isOnboardingComplete: true });
  }, [updateProfile]);

  // Reset onboarding
  const resetOnboarding = useCallback(async () => {
    await updateProfile({ isOnboardingComplete: false });
  }, [updateProfile]);

  // Calculate BMR
  const calculateUserBMR = useCallback((): number | null => {
    if (!profile?.personalInfo) return null;

    const { weight, height, dateOfBirth, gender } = profile.personalInfo;
    
    if (!weight || !height || !dateOfBirth) return null;

    const weightKg = convertWeightToKg(weight.value, weight.unit);
    const heightCm = convertHeightToCm(height);
    const age = getAgeFromBirthdate(dateOfBirth);

    return calculateBMR(weightKg, heightCm, age, gender || 'female');
  }, [profile]);

  // Calculate TDEE
  const calculateUserTDEE = useCallback((): number | null => {
    const bmr = calculateUserBMR();
    if (!bmr || !profile?.personalInfo?.activityLevel) return null;

    return calculateTDEE(bmr, profile.personalInfo.activityLevel);
  }, [calculateUserBMR, profile]);

  // Calculate calorie target
  const calculateUserCalorieTarget = useCallback((): number | null => {
    const tdee = calculateUserTDEE();
    if (!tdee || !profile?.healthGoals) return null;

    return calculateCalorieTarget(
      tdee, 
      profile.healthGoals.primaryGoal,
      profile.healthGoals.weeklyWeightLossGoal
    );
  }, [calculateUserTDEE, profile]);

  // Export profile
  const exportProfile = useCallback((): string => {
    if (!profile) return '';
    
    return JSON.stringify(profile, null, 2);
  }, [profile]);

  // Import profile
  const importProfile = useCallback(async (profileData: string) => {
    try {
      const importedProfile: UserProfile = JSON.parse(profileData);
      
      // Validate basic structure
      if (!importedProfile.userId || !importedProfile.personalInfo) {
        throw new Error('Invalid profile data structure');
      }

      await updateProfile(importedProfile);
    } catch (err) {
      console.error('Error importing profile:', err);
      throw new Error('Failed to import profile data');
    }
  }, [updateProfile]);

  // Validate profile
  const validateProfile = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!profile) {
      return { isValid: false, errors: ['No profile found'] };
    }

    // Validate personal info
    if (!profile.personalInfo.firstName.trim()) {
      errors.push('First name is required');
    }
    if (!profile.personalInfo.email.trim()) {
      errors.push('Email is required');
    }

    // Validate macro targets if set
    if (profile.dietaryPreferences.macroTargets) {
      if (!validateMacroTargets(profile.dietaryPreferences.macroTargets)) {
        errors.push('Macro targets must add up to 100%');
      }
    }

    // Validate weight goals
    if (profile.healthGoals.primaryGoal === 'weight-loss' && !profile.healthGoals.targetWeight) {
      errors.push('Target weight is required for weight loss goals');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [profile]);

  // Update profile picture
  const updateProfilePicture = useCallback(async (imageUrl: string) => {
    await updateProfile({ profilePictureUrl: imageUrl });
  }, [updateProfile]);

  // Check if user has allergies
  const hasAllergies = useCallback((): boolean => {
    return (profile?.dietaryPreferences.allergies?.length || 0) > 0;
  }, [profile]);

  // Check if user has dietary restrictions
  const hasDietaryRestrictions = useCallback((): boolean => {
    return (profile?.dietaryPreferences.restrictions?.length || 0) > 0;
  }, [profile]);

  // Get recommended recipe filters based on profile
  const getRecommendedRecipeFilters = useCallback(() => {
    if (!profile) return {};

    const filters: any = {};

    // Add dietary restrictions
    if (profile.dietaryPreferences.restrictions.length > 0) {
      filters.dietaryRestrictions = profile.dietaryPreferences.restrictions;
    }

    // Add avoided ingredients
    if (profile.dietaryPreferences.avoidedIngredients.length > 0) {
      filters.excludeIngredients = profile.dietaryPreferences.avoidedIngredients;
    }

    // Add allergens to exclude
    if (profile.dietaryPreferences.allergies.length > 0) {
      const allergens = profile.dietaryPreferences.allergies.map(allergy => allergy.name);
      filters.excludeIngredients = [
        ...(filters.excludeIngredients || []),
        ...allergens,
      ];
    }

    // Add cooking time preferences
    if (profile.cookingPreferences.maxCookingTime) {
      filters.cookTimeRange = {
        min: 0,
        max: profile.cookingPreferences.maxCookingTime,
      };
    }

    // Add prep time preferences
    if (profile.cookingPreferences.maxPrepTime) {
      filters.prepTimeRange = {
        min: 0,
        max: profile.cookingPreferences.maxPrepTime,
      };
    }

    // Add difficulty preference
    if (profile.cookingPreferences.difficultyPreference !== 'mixed') {
      const difficultyMap = {
        'easy-only': ['Easy'],
        'mostly-easy': ['Easy', 'Medium'],
        'challenging': ['Medium', 'Hard'],
        'expert-level': ['Hard'],
      };
      filters.difficulty = difficultyMap[profile.cookingPreferences.difficultyPreference] || [];
    }

    // Add calorie targets
    const calorieTarget = calculateUserCalorieTarget();
    if (calorieTarget) {
      // Suggest recipes that are reasonable portion of daily calories
      filters.calorieRange = {
        min: 0,
        max: Math.round(calorieTarget * 0.4), // Max 40% of daily calories per meal
      };
    }

    return filters;
  }, [profile, calculateUserCalorieTarget]);

  return {
    // Profile state
    profile,
    isLoading,
    isSaving,
    error,
    
    // Profile management
    createProfile,
    updateProfile,
    deleteProfile,
    
    // Section-specific updates
    updatePersonalInfo,
    updateDietaryPreferences,
    updateCookingPreferences,
    updateHealthGoals,
    updateKitchenEquipment,
    updateNotificationSettings,
    updateAppSettings,
    
    // Onboarding
    completeOnboarding,
    resetOnboarding,
    
    // Calculations
    calculateUserBMR,
    calculateUserTDEE,
    calculateUserCalorieTarget,
    
    // Utility functions
    exportProfile,
    importProfile,
    validateProfile,
    
    // Profile picture
    updateProfilePicture,
    
    // Preferences helpers
    hasAllergies,
    hasDietaryRestrictions,
    getRecommendedRecipeFilters,
  };
};