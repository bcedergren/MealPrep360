import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
    CookingContext,
    RecipeRating,
    REVIEW_TAGS,
    ReviewTag,
} from '../types/collections';
import { Recipe } from '../types/recipe';
import { useRecommendations } from './useRecommendations';

interface UseRecipeRatingsProps {
  autoSync?: boolean;
}

interface UseRecipeRatingsReturn {
  // Ratings state
  ratings: RecipeRating[];
  userRatings: RecipeRating[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Rating management
  rateRecipe: (data: RateRecipeData) => Promise<RecipeRating>;
  updateRating: (ratingId: string, updates: Partial<RecipeRating>) => Promise<void>;
  deleteRating: (ratingId: string) => Promise<void>;
  
  // Rating queries
  getRatingsForRecipe: (recipeId: string) => RecipeRating[];
  getUserRatingForRecipe: (recipeId: string) => RecipeRating | null;
  hasUserRatedRecipe: (recipeId: string) => boolean;
  getAverageRating: (recipeId: string) => { average: number; count: number };
  
  // Review features
  addReviewImages: (ratingId: string, images: string[]) => Promise<void>;
  removeReviewImage: (ratingId: string, imageUrl: string) => Promise<void>;
  updateReviewTags: (ratingId: string, tags: ReviewTag[]) => Promise<void>;
  
  // Social features
  markReviewAsHelpful: (ratingId: string) => Promise<void>;
  reportReview: (ratingId: string, reason: string) => Promise<void>;
  verifyRecipeCook: (ratingId: string, proofImage?: string) => Promise<void>;
  
  // Statistics and insights
  getTopRatedRecipes: (limit?: number) => { recipe: Recipe; rating: number; count: number }[];
  getMostHelpfulReviews: (recipeId?: string, limit?: number) => RecipeRating[];
  getRecentReviews: (limit?: number) => RecipeRating[];
  getUserRatingStats: () => UserRatingStats;
  
  // Cooking context
  addCookingContext: (ratingId: string, context: CookingContext) => Promise<void>;
  getCookingInsights: (recipeId: string) => CookingInsights;
  
  // Review templates and helpers
  getReviewTags: () => ReviewTag[];
  generateReviewSuggestions: (recipe: Recipe, rating: number) => string[];
  getRecipeRatingBreakdown: (recipeId: string) => RatingBreakdown;
}

interface RateRecipeData {
  recipeId: string;
  rating: number;
  review?: string;
  tags?: ReviewTag[];
  detailedRatings?: {
    taste?: number;
    difficulty?: number;
    instructionClarity?: number;
    valueForTime?: number;
  };
  cookingContext?: Partial<CookingContext>;
  modifications?: string[];
  cookingTips?: string;
  images?: string[];
}

interface UserRatingStats {
  totalRatings: number;
  averageRating: number;
  recipesCookedCount: number;
  helpfulVotesReceived: number;
  verifiedCooksCount: number;
  favoriteReviewTags: ReviewTag[];
  ratingDistribution: { rating: number; count: number }[];
}

interface CookingInsights {
  averageActualCookTime: number;
  difficultyConsensus: string;
  commonModifications: string[];
  successRate: number;
  wouldCookAgainPercentage: number;
  topCookingTips: string[];
}

interface RatingBreakdown {
  overall: { average: number; count: number };
  breakdown: { rating: number; count: number; percentage: number }[];
  detailed: {
    taste: number;
    difficulty: number;
    instructionClarity: number;
    valueForTime: number;
  };
  tags: { tag: ReviewTag; count: number }[];
}

const STORAGE_KEYS = {
  RATINGS: 'recipe_ratings',
  USER_RATING_STATS: 'user_rating_stats',
  HELPFUL_VOTES: 'helpful_votes',
};

export const useRecipeRatings = ({
  autoSync = true,
}: UseRecipeRatingsProps = {}): UseRecipeRatingsReturn => {
  const { user } = useUser();
  const { recordInteraction } = useRecommendations();
  
  // State
  const [ratings, setRatings] = useState<RecipeRating[]>([]);
  const [userRatings, setUserRatings] = useState<RecipeRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadRatingsData();
    }
  }, [user?.id]);

  // Auto-sync ratings with server
  useEffect(() => {
    if (autoSync && user) {
      const syncInterval = setInterval(() => {
        // Sync with API in production
        console.log('Auto-syncing ratings...');
      }, 10 * 60 * 1000); // Every 10 minutes

      return () => clearInterval(syncInterval);
    }
  }, [autoSync, user]);

  // Load ratings data from storage
  const loadRatingsData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [allRatingsData, userRatingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.RATINGS),
        AsyncStorage.getItem(`${STORAGE_KEYS.RATINGS}_user_${user.id}`),
      ]);

      // Load all ratings (in production, this would come from API)
      if (allRatingsData) {
        const parsedRatings: RecipeRating[] = JSON.parse(allRatingsData);
        setRatings(parsedRatings);
      }

      // Load user's ratings
      if (userRatingsData) {
        const parsedUserRatings: RecipeRating[] = JSON.parse(userRatingsData);
        setUserRatings(parsedUserRatings);
      }
    } catch (err) {
      console.error('Error loading ratings data:', err);
      setError('Failed to load ratings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save ratings to storage
  const saveRatings = useCallback(async (ratingsToSave: RecipeRating[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratingsToSave));
    } catch (err) {
      console.error('Error saving ratings:', err);
      throw new Error('Failed to save ratings');
    }
  }, []);

  // Save user ratings to storage
  const saveUserRatings = useCallback(async (userRatingsToSave: RecipeRating[]) => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.RATINGS}_user_${user.id}`,
        JSON.stringify(userRatingsToSave)
      );
    } catch (err) {
      console.error('Error saving user ratings:', err);
      throw new Error('Failed to save user ratings');
    }
  }, [user]);

  // Rate a recipe
  const rateRecipe = useCallback(async (data: RateRecipeData): Promise<RecipeRating> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsSaving(true);
      setError(null);

      const newRating: RecipeRating = {
        id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        username: user.username || user.firstName || 'Anonymous',
        profileImageUrl: user.imageUrl,
        recipeId: data.recipeId,
        rating: data.rating,
        review: data.review,
        images: data.images || [],
        tags: data.tags || [],
        isVerifiedCook: false,
        helpfulCount: 0,
        reportCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasteRating: data.detailedRatings?.taste,
        difficultyRating: data.detailedRatings?.difficulty,
        instructionClarityRating: data.detailedRatings?.instructionClarity,
        valueForTimeRating: data.detailedRatings?.valueForTime,
        modifications: data.modifications,
        cookingTips: data.cookingTips,
      };

      if (data.cookingContext) {
        newRating.cookingContext = {
          cookingDate: data.cookingContext.cookingDate || new Date().toISOString(),
          cookingTime: data.cookingContext.cookingTime || 0,
          servingsActual: data.cookingContext.servingsActual || 1,
          difficultyExperienced: data.cookingContext.difficultyExperienced || 'Medium',
          wouldCookAgain: data.cookingContext.wouldCookAgain ?? true,
          skillLevelWhenCooked: data.cookingContext.skillLevelWhenCooked || 'Intermediate',
        };
      }

      // Update local state
      const updatedRatings = [...ratings, newRating];
      const updatedUserRatings = [...userRatings, newRating];
      
      setRatings(updatedRatings);
      setUserRatings(updatedUserRatings);
      
      // Save to storage
      await Promise.all([
        saveRatings(updatedRatings),
        saveUserRatings(updatedUserRatings),
      ]);

      // Record interaction for recommendations
      await recordInteraction({
        recipeId: data.recipeId,
        action: 'rated',
        rating: data.rating,
        notes: data.review,
      });

      return newRating;
    } catch (err) {
      console.error('Error rating recipe:', err);
      setError('Failed to rate recipe');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user, ratings, userRatings, saveRatings, saveUserRatings, recordInteraction]);

  // Update existing rating
  const updateRating = useCallback(async (ratingId: string, updates: Partial<RecipeRating>) => {
    try {
      setIsSaving(true);
      setError(null);

      const updatedRatings = ratings.map(rating =>
        rating.id === ratingId
          ? { ...rating, ...updates, updatedAt: new Date().toISOString() }
          : rating
      );

      const updatedUserRatings = userRatings.map(rating =>
        rating.id === ratingId
          ? { ...rating, ...updates, updatedAt: new Date().toISOString() }
          : rating
      );

      setRatings(updatedRatings);
      setUserRatings(updatedUserRatings);

      await Promise.all([
        saveRatings(updatedRatings),
        saveUserRatings(updatedUserRatings),
      ]);
    } catch (err) {
      console.error('Error updating rating:', err);
      setError('Failed to update rating');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [ratings, userRatings, saveRatings, saveUserRatings]);

  // Delete rating
  const deleteRating = useCallback(async (ratingId: string) => {
    try {
      setIsSaving(true);
      setError(null);

      const updatedRatings = ratings.filter(r => r.id !== ratingId);
      const updatedUserRatings = userRatings.filter(r => r.id !== ratingId);

      setRatings(updatedRatings);
      setUserRatings(updatedUserRatings);

      await Promise.all([
        saveRatings(updatedRatings),
        saveUserRatings(updatedUserRatings),
      ]);
    } catch (err) {
      console.error('Error deleting rating:', err);
      setError('Failed to delete rating');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [ratings, userRatings, saveRatings, saveUserRatings]);

  // Get ratings for a specific recipe
  const getRatingsForRecipe = useCallback((recipeId: string): RecipeRating[] => {
    return ratings.filter(r => r.recipeId === recipeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ratings]);

  // Get user's rating for a specific recipe
  const getUserRatingForRecipe = useCallback((recipeId: string): RecipeRating | null => {
    return userRatings.find(r => r.recipeId === recipeId) || null;
  }, [userRatings]);

  // Check if user has rated a recipe
  const hasUserRatedRecipe = useCallback((recipeId: string): boolean => {
    return userRatings.some(r => r.recipeId === recipeId);
  }, [userRatings]);

  // Get average rating for a recipe
  const getAverageRating = useCallback((recipeId: string): { average: number; count: number } => {
    const recipeRatings = getRatingsForRecipe(recipeId);
    
    if (recipeRatings.length === 0) {
      return { average: 0, count: 0 };
    }

    const total = recipeRatings.reduce((sum, rating) => sum + rating.rating, 0);
    const average = total / recipeRatings.length;

    return { average: Math.round(average * 10) / 10, count: recipeRatings.length };
  }, [getRatingsForRecipe]);

  // Add images to review
  const addReviewImages = useCallback(async (ratingId: string, images: string[]) => {
    const rating = ratings.find(r => r.id === ratingId);
    if (!rating) throw new Error('Rating not found');

    const updatedImages = [...(rating.images || []), ...images];
    await updateRating(ratingId, { images: updatedImages });
  }, [ratings, updateRating]);

  // Remove image from review
  const removeReviewImage = useCallback(async (ratingId: string, imageUrl: string) => {
    const rating = ratings.find(r => r.id === ratingId);
    if (!rating) throw new Error('Rating not found');

    const updatedImages = rating.images?.filter(img => img !== imageUrl) || [];
    await updateRating(ratingId, { images: updatedImages });
  }, [ratings, updateRating]);

  // Update review tags
  const updateReviewTags = useCallback(async (ratingId: string, tags: ReviewTag[]) => {
    await updateRating(ratingId, { tags });
  }, [updateRating]);

  // Mark review as helpful
  const markReviewAsHelpful = useCallback(async (ratingId: string) => {
    const rating = ratings.find(r => r.id === ratingId);
    if (!rating) throw new Error('Rating not found');

    await updateRating(ratingId, { helpfulCount: rating.helpfulCount + 1 });
  }, [ratings, updateRating]);

  // Report review
  const reportReview = useCallback(async (ratingId: string, reason: string) => {
    const rating = ratings.find(r => r.id === ratingId);
    if (!rating) throw new Error('Rating not found');

    await updateRating(ratingId, { reportCount: rating.reportCount + 1 });
    
    // In production, send report to moderation system
    console.log(`Review ${ratingId} reported for: ${reason}`);
  }, [ratings, updateRating]);

  // Verify that user actually cooked the recipe
  const verifyRecipeCook = useCallback(async (ratingId: string, proofImage?: string) => {
    const updates: Partial<RecipeRating> = { isVerifiedCook: true };
    
    if (proofImage) {
      const rating = ratings.find(r => r.id === ratingId);
      const existingImages = rating?.images || [];
      updates.images = [...existingImages, proofImage];
    }

    await updateRating(ratingId, updates);
  }, [ratings, updateRating]);

  // Get top rated recipes
  const getTopRatedRecipes = useCallback((limit: number = 10) => {
    const recipeRatings = new Map<string, { total: number; count: number; recipe?: Recipe }>();
    
    ratings.forEach(rating => {
      const existing = recipeRatings.get(rating.recipeId) || { total: 0, count: 0 };
      recipeRatings.set(rating.recipeId, {
        total: existing.total + rating.rating,
        count: existing.count + 1,
      });
    });

    return Array.from(recipeRatings.entries())
      .map(([recipeId, data]) => ({
        recipeId,
        rating: data.total / data.count,
        count: data.count,
      }))
      .filter(item => item.count >= 3) // Require at least 3 ratings
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map(item => ({
        recipe: {} as Recipe, // Would fetch from recipes store
        rating: Math.round(item.rating * 10) / 10,
        count: item.count,
      }));
  }, [ratings]);

  // Get most helpful reviews
  const getMostHelpfulReviews = useCallback((recipeId?: string, limit: number = 10): RecipeRating[] => {
    let filteredRatings = ratings;
    
    if (recipeId) {
      filteredRatings = getRatingsForRecipe(recipeId);
    }

    return filteredRatings
      .filter(rating => rating.review && rating.review.length > 20) // Must have substantial review
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, limit);
  }, [ratings, getRatingsForRecipe]);

  // Get recent reviews
  const getRecentReviews = useCallback((limit: number = 10): RecipeRating[] => {
    return ratings
      .filter(rating => rating.review)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [ratings]);

  // Get user's rating statistics
  const getUserRatingStats = useCallback((): UserRatingStats => {
    const totalRatings = userRatings.length;
    const averageRating = totalRatings > 0 
      ? userRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
      : 0;
    
    const recipesCookedCount = userRatings.filter(r => r.cookingContext).length;
    const helpfulVotesReceived = userRatings.reduce((sum, r) => sum + r.helpfulCount, 0);
    const verifiedCooksCount = userRatings.filter(r => r.isVerifiedCook).length;

    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: userRatings.filter(r => r.rating === rating).length,
    }));

    // Favorite review tags
    const tagCounts = new Map<string, number>();
    userRatings.forEach(rating => {
      rating.tags.forEach(tag => {
        tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1);
      });
    });

    const favoriteReviewTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tagId]) => REVIEW_TAGS.find(tag => tag.id === tagId)!)
      .filter(Boolean);

    return {
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      recipesCookedCount,
      helpfulVotesReceived,
      verifiedCooksCount,
      favoriteReviewTags,
      ratingDistribution,
    };
  }, [userRatings]);

  // Add cooking context to rating
  const addCookingContext = useCallback(async (ratingId: string, context: CookingContext) => {
    await updateRating(ratingId, { cookingContext: context });
  }, [updateRating]);

  // Get cooking insights for a recipe
  const getCookingInsights = useCallback((recipeId: string): CookingInsights => {
    const recipeRatings = getRatingsForRecipe(recipeId);
    const ratingsWithContext = recipeRatings.filter(r => r.cookingContext);

    if (ratingsWithContext.length === 0) {
      return {
        averageActualCookTime: 0,
        difficultyConsensus: 'Unknown',
        commonModifications: [],
        successRate: 0,
        wouldCookAgainPercentage: 0,
        topCookingTips: [],
      };
    }

    const averageActualCookTime = Math.round(
      ratingsWithContext.reduce((sum, r) => sum + (r.cookingContext!.cookingTime || 0), 0) / 
      ratingsWithContext.length
    );

    // Difficulty consensus
    const difficultyVotes = new Map<string, number>();
    ratingsWithContext.forEach(r => {
      const difficulty = r.cookingContext!.difficultyExperienced;
      difficultyVotes.set(difficulty, (difficultyVotes.get(difficulty) || 0) + 1);
    });
    const difficultyConsensus = Array.from(difficultyVotes.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Medium';

    // Common modifications
    const modifications = recipeRatings
      .flatMap(r => r.modifications || [])
      .filter(mod => mod.length > 3);
    const modificationCounts = new Map<string, number>();
    modifications.forEach(mod => {
      modificationCounts.set(mod, (modificationCounts.get(mod) || 0) + 1);
    });
    const commonModifications = Array.from(modificationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mod]) => mod);

    // Success rate (based on ratings >= 4)
    const successfulCooks = recipeRatings.filter(r => r.rating >= 4).length;
    const successRate = recipeRatings.length > 0 ? (successfulCooks / recipeRatings.length) * 100 : 0;

    // Would cook again percentage
    const wouldCookAgain = ratingsWithContext.filter(r => r.cookingContext!.wouldCookAgain).length;
    const wouldCookAgainPercentage = ratingsWithContext.length > 0 
      ? (wouldCookAgain / ratingsWithContext.length) * 100 
      : 0;

    // Top cooking tips
    const tips = recipeRatings
      .map(r => r.cookingTips)
      .filter(tip => tip && tip.length > 10);
    const topCookingTips = tips.slice(0, 5) as string[];

    return {
      averageActualCookTime,
      difficultyConsensus,
      commonModifications,
      successRate: Math.round(successRate),
      wouldCookAgainPercentage: Math.round(wouldCookAgainPercentage),
      topCookingTips,
    };
  }, [getRatingsForRecipe]);

  // Get review tags
  const getReviewTags = useCallback((): ReviewTag[] => {
    return REVIEW_TAGS;
  }, []);

  // Generate review suggestions based on rating
  const generateReviewSuggestions = useCallback((recipe: Recipe, rating: number): string[] => {
    const suggestions: string[] = [];

         if (rating >= 5) {
       suggestions.push(
         `Absolutely delicious! This ${recipe.title} exceeded my expectations.`,
         `Perfect recipe! Easy to follow and amazing results.`,
         `This is going into my regular rotation. Fantastic!`
       );
     } else if (rating >= 4) {
       suggestions.push(
         `Really enjoyed this ${recipe.title}. Would definitely make again.`,
         `Great recipe with clear instructions. Turned out well!`,
         `Tasty and satisfying. A few minor tweaks and it would be perfect.`
       );
    } else if (rating >= 3) {
      suggestions.push(
        `Decent recipe, but needed some adjustments to my taste.`,
        `Not bad, but I would modify a few things next time.`,
        `Good for a quick meal, though nothing extraordinary.`
      );
    } else {
      suggestions.push(
        `Had some issues with this recipe. Instructions could be clearer.`,
        `Didn't turn out as expected. Maybe I missed something.`,
        `Not really my style, but others might enjoy it.`
      );
    }

    return suggestions;
  }, []);

  // Get detailed rating breakdown for recipe
  const getRecipeRatingBreakdown = useCallback((recipeId: string): RatingBreakdown => {
    const recipeRatings = getRatingsForRecipe(recipeId);
    const totalRatings = recipeRatings.length;

    if (totalRatings === 0) {
      return {
        overall: { average: 0, count: 0 },
        breakdown: [],
        detailed: { taste: 0, difficulty: 0, instructionClarity: 0, valueForTime: 0 },
        tags: [],
      };
    }

    // Overall average
    const overallAverage = recipeRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    // Rating breakdown
    const breakdown = [5, 4, 3, 2, 1].map(rating => {
      const count = recipeRatings.filter(r => r.rating === rating).length;
      return {
        rating,
        count,
        percentage: Math.round((count / totalRatings) * 100),
      };
    });

    // Detailed ratings
    const detailedRatings = recipeRatings.filter(r => 
      r.tasteRating || r.difficultyRating || r.instructionClarityRating || r.valueForTimeRating
    );

    const detailed = {
      taste: detailedRatings.length > 0 
        ? detailedRatings.reduce((sum, r) => sum + (r.tasteRating || 0), 0) / detailedRatings.length 
        : 0,
      difficulty: detailedRatings.length > 0 
        ? detailedRatings.reduce((sum, r) => sum + (r.difficultyRating || 0), 0) / detailedRatings.length 
        : 0,
      instructionClarity: detailedRatings.length > 0 
        ? detailedRatings.reduce((sum, r) => sum + (r.instructionClarityRating || 0), 0) / detailedRatings.length 
        : 0,
      valueForTime: detailedRatings.length > 0 
        ? detailedRatings.reduce((sum, r) => sum + (r.valueForTimeRating || 0), 0) / detailedRatings.length 
        : 0,
    };

    // Tag frequency
    const tagCounts = new Map<string, number>();
    recipeRatings.forEach(rating => {
      rating.tags.forEach(tag => {
        tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1);
      });
    });

    const tags = Array.from(tagCounts.entries())
      .map(([tagId, count]) => ({
        tag: REVIEW_TAGS.find(tag => tag.id === tagId)!,
        count,
      }))
      .filter(item => item.tag)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      overall: { average: Math.round(overallAverage * 10) / 10, count: totalRatings },
      breakdown,
      detailed,
      tags,
    };
  }, [getRatingsForRecipe]);

  return {
    // Ratings state
    ratings,
    userRatings,
    isLoading,
    isSaving,
    error,
    
    // Rating management
    rateRecipe,
    updateRating,
    deleteRating,
    
    // Rating queries
    getRatingsForRecipe,
    getUserRatingForRecipe,
    hasUserRatedRecipe,
    getAverageRating,
    
    // Review features
    addReviewImages,
    removeReviewImage,
    updateReviewTags,
    
    // Social features
    markReviewAsHelpful,
    reportReview,
    verifyRecipeCook,
    
    // Statistics and insights
    getTopRatedRecipes,
    getMostHelpfulReviews,
    getRecentReviews,
    getUserRatingStats,
    
    // Cooking context
    addCookingContext,
    getCookingInsights,
    
    // Review templates and helpers
    getReviewTags,
    generateReviewSuggestions,
    getRecipeRatingBreakdown,
  };
};

export default useRecipeRatings;