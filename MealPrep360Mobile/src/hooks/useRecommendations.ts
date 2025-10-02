import { useCallback, useEffect, useState } from 'react';
import {
    RecipeRecommendation,
    RecommendationContext,
    recommendationEngine,
    UserInteraction,
} from '../services/recommendationEngine';
import { Recipe } from '../types/recipe';
import { UserProfile } from '../types/userProfile';
import { useRecipeSearch } from './useRecipeSearch';
import { useUserProfile } from './useUserProfile';

interface UseRecommendationsProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // minutes
}

interface UseRecommendationsReturn {
  // Recommendations
  personalizedRecommendations: RecipeRecommendation[];
  trendingRecipes: Recipe[];
  quickMeals: RecipeRecommendation[];
  healthyOptions: RecipeRecommendation[];
  
  // State
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  refreshRecommendations: () => Promise<void>;
  recordInteraction: (interaction: Omit<UserInteraction, 'timestamp'>) => Promise<void>;
  getRecommendationsForContext: (context: Partial<RecommendationContext>) => Promise<RecipeRecommendation[]>;
  
  // Smart features
  getRecommendedForMealType: (mealType: string) => RecipeRecommendation[];
  getRecommendedForTime: (availableMinutes: number) => RecipeRecommendation[];
  getSimilarRecipes: (recipeId: string) => RecipeRecommendation[];
  
  // Learning features
  markRecipeAsCooked: (recipeId: string, rating?: number, notes?: string) => Promise<void>;
  skipRecipe: (recipeId: string) => Promise<void>;
  clearRecommendationHistory: () => Promise<void>;
}

export const useRecommendations = ({
  autoRefresh = true,
  refreshInterval = 60, // 1 hour default
}: UseRecommendationsProps = {}): UseRecommendationsReturn => {
  const { profile: userProfile } = useUserProfile();
  const { recipes } = useRecipeSearch();
  
  // State
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<RecipeRecommendation[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [quickMeals, setQuickMeals] = useState<RecipeRecommendation[]>([]);
  const [healthyOptions, setHealthyOptions] = useState<RecipeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Generate personalized recommendations
  const generateRecommendations = useCallback(async (
    profile: UserProfile,
    availableRecipes: Recipe[]
  ): Promise<void> => {
    if (!profile || !availableRecipes.length) {
      return;
    }

    try {
      setError(null);

      // Get general personalized recommendations
      const recommendations = await recommendationEngine.getRecommendations(
        availableRecipes,
        profile,
        undefined,
        20
      );
      setPersonalizedRecommendations(recommendations);

      // Get trending recipes
      const trending = await recommendationEngine.getTrendingRecipes(availableRecipes, 8);
      setTrendingRecipes(trending);

      // Get quick meal recommendations (30 minutes or less)
      const quickContext: RecommendationContext = {
        ...getDefaultContext(),
        availableTime: 30,
      };
      const quickRecommendations = await recommendationEngine.getRecommendations(
        availableRecipes.filter(recipe => (recipe.prepTime + recipe.cookTime) <= 30),
        profile,
        quickContext,
        10
      );
      setQuickMeals(quickRecommendations);

      // Get healthy options (based on nutrition goals)
      const healthyRecipes = availableRecipes.filter(recipe => {
        if (!recipe.nutritionInfo) return false;
        return recipe.nutritionInfo.calories < 500 && 
               recipe.nutritionInfo.fiber >= 5 &&
               recipe.nutritionInfo.sodium < 800;
      });
      const healthyRecommendations = await recommendationEngine.getRecommendations(
        healthyRecipes,
        profile,
        undefined,
        10
      );
      setHealthyOptions(healthyRecommendations);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
    }
  }, []);

  // Refresh all recommendations
  const refreshRecommendations = useCallback(async (): Promise<void> => {
    if (!userProfile) {
      setError('User profile not available');
      return;
    }

    setLoading(true);
    try {
      await generateRecommendations(userProfile, recipes);
    } finally {
      setLoading(false);
    }
  }, [userProfile, recipes, generateRecommendations]);

  // Record user interaction with recipe
  const recordInteraction = useCallback(async (
    interaction: Omit<UserInteraction, 'timestamp'>
  ): Promise<void> => {
    try {
      await recommendationEngine.recordInteraction(interaction);
      
      // Refresh recommendations after significant interactions
      if (['saved', 'cooked', 'rated'].includes(interaction.action)) {
        setTimeout(() => {
          refreshRecommendations();
        }, 1000); // Delay to allow for multiple rapid interactions
      }
    } catch (err) {
      console.error('Error recording interaction:', err);
    }
  }, [refreshRecommendations]);

  // Get recommendations for specific context
  const getRecommendationsForContext = useCallback(async (
    context: Partial<RecommendationContext>
  ): Promise<RecipeRecommendation[]> => {
    if (!userProfile) return [];

    try {
      const fullContext: RecommendationContext = {
        ...getDefaultContext(),
        ...context,
      };

      return await recommendationEngine.getRecommendations(
        recipes,
        userProfile,
        fullContext,
        10
      );
    } catch (err) {
      console.error('Error getting contextual recommendations:', err);
      return [];
    }
  }, [userProfile, recipes]);

  // Get recommendations filtered by meal type
  const getRecommendedForMealType = useCallback((mealType: string): RecipeRecommendation[] => {
    return personalizedRecommendations.filter(rec => 
      rec.mealType.some(type => type.toLowerCase() === mealType.toLowerCase())
    ).slice(0, 8);
  }, [personalizedRecommendations]);

  // Get recommendations filtered by available time
  const getRecommendedForTime = useCallback((availableMinutes: number): RecipeRecommendation[] => {
    return personalizedRecommendations.filter(rec => 
      (rec.prepTime + rec.cookTime) <= availableMinutes
    ).slice(0, 8);
  }, [personalizedRecommendations]);

  // Get similar recipes to a given recipe
  const getSimilarRecipes = useCallback((recipeId: string): RecipeRecommendation[] => {
    const targetRecipe = recipes.find(r => r.id === recipeId);
    if (!targetRecipe) return [];

    // Find recipes with similar characteristics
    return personalizedRecommendations.filter(rec => {
      if (rec.id === recipeId) return false;
      
      // Same cuisine type
      if (rec.cuisineType === targetRecipe.cuisineType) return true;
      
      // Similar difficulty
      if (rec.difficulty === targetRecipe.difficulty) return true;
      
      // Similar meal types
      const hasCommonMealType = rec.mealType.some(type => 
        targetRecipe.mealType.includes(type)
      );
      if (hasCommonMealType) return true;
      
      // Similar dietary restrictions
      const hasCommonRestriction = rec.dietaryRestrictions.some(restriction => 
        targetRecipe.dietaryRestrictions.includes(restriction)
      );
      if (hasCommonRestriction) return true;
      
      return false;
    }).slice(0, 6);
  }, [personalizedRecommendations, recipes]);

  // Helper function to mark recipe as cooked
  const markRecipeAsCooked = useCallback(async (
    recipeId: string,
    rating?: number,
    notes?: string
  ): Promise<void> => {
    await recordInteraction({
      recipeId,
      action: 'cooked',
      rating,
      notes,
    });
  }, [recordInteraction]);

  // Helper function to skip recipe
  const skipRecipe = useCallback(async (recipeId: string): Promise<void> => {
    await recordInteraction({
      recipeId,
      action: 'skipped',
    });
  }, [recordInteraction]);

  // Clear recommendation history
  const clearRecommendationHistory = useCallback(async (): Promise<void> => {
    try {
      await recommendationEngine.clearRecommendationData();
      await refreshRecommendations();
    } catch (err) {
      console.error('Error clearing recommendation history:', err);
      setError('Failed to clear recommendation history');
    }
  }, [refreshRecommendations]);

  // Generate initial recommendations when profile or recipes change
  useEffect(() => {
    if (userProfile && recipes.length > 0) {
      refreshRecommendations();
    }
  }, [userProfile?.id, recipes.length]); // Use profile ID to detect profile changes

  // Auto-refresh recommendations
  useEffect(() => {
    if (!autoRefresh || !userProfile) return;

    const interval = setInterval(() => {
      refreshRecommendations();
    }, refreshInterval * 60 * 1000); // Convert to milliseconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, userProfile, refreshRecommendations]);

  // Try to load cached recommendations on mount
  useEffect(() => {
    const loadCachedRecommendations = async () => {
      try {
        const cached = await recommendationEngine.getCachedRecommendations();
        if (cached && cached.length > 0) {
          setPersonalizedRecommendations(cached);
          setLastUpdated(new Date(Date.now() - 30 * 60 * 1000)); // Mark as 30 minutes old
        }
      } catch (err) {
        console.error('Error loading cached recommendations:', err);
      }
    };

    loadCachedRecommendations();
  }, []);

  return {
    // Recommendations
    personalizedRecommendations,
    trendingRecipes,
    quickMeals,
    healthyOptions,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshRecommendations,
    recordInteraction,
    getRecommendationsForContext,
    
    // Smart features
    getRecommendedForMealType,
    getRecommendedForTime,
    getSimilarRecipes,
    
    // Learning features
    markRecipeAsCooked,
    skipRecipe,
    clearRecommendationHistory,
  };
};

// Helper function to get default context
const getDefaultContext = (): RecommendationContext => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const month = now.getMonth();

  let timeOfDay: 'morning' | 'afternoon' | 'evening';
  if (hour < 12) timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';
  else timeOfDay = 'evening';

  let season: 'spring' | 'summer' | 'fall' | 'winter';
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'fall';
  else season = 'winter';

  return {
    timeOfDay,
    dayOfWeek,
    season,
  };
};

export default useRecommendations;