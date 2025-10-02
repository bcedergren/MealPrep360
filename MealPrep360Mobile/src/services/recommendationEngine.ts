import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealType, Recipe } from '../types/recipe';
import { UserProfile } from '../types/userProfile';

// Recommendation Engine Types
export interface RecipeRecommendation extends Recipe {
  score: number;
  reasoning: RecommendationReason[];
}

export interface RecommendationReason {
  type: 'dietary' | 'cuisine' | 'nutrition' | 'skill' | 'time' | 'ingredients' | 'history' | 'goals';
  description: string;
  weight: number;
}

export interface UserInteraction {
  recipeId: string;
  action: 'viewed' | 'saved' | 'cooked' | 'rated' | 'shared' | 'skipped';
  timestamp: string;
  rating?: number;
  cookingTime?: number;
  notes?: string;
}

export interface PreferenceWeights {
  dietary: number;
  cuisine: number;
  nutrition: number;
  difficulty: number;
  cookingTime: number;
  ingredients: number;
  history: number;
  healthGoals: number;
}

export interface RecommendationContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  mealType?: MealType;
  availableTime?: number; // minutes
  planningAhead?: boolean;
}

// Storage Keys
const STORAGE_KEYS = {
  USER_INTERACTIONS: 'user_interactions',
  PREFERENCE_WEIGHTS: 'preference_weights',
  RECOMMENDATION_CACHE: 'recommendation_cache',
};

class RecommendationEngine {
  private userInteractions: UserInteraction[] = [];
  private preferenceWeights: PreferenceWeights = {
    dietary: 1.0,
    cuisine: 0.8,
    nutrition: 0.9,
    difficulty: 0.7,
    cookingTime: 0.8,
    ingredients: 0.6,
    history: 0.9,
    healthGoals: 1.0,
  };

  constructor() {
    this.loadUserData();
  }

  // Load user interaction data and preference weights
  private async loadUserData(): Promise<void> {
    try {
      const [interactions, weights] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_INTERACTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.PREFERENCE_WEIGHTS),
      ]);

      if (interactions) {
        this.userInteractions = JSON.parse(interactions);
      }

      if (weights) {
        this.preferenceWeights = { ...this.preferenceWeights, ...JSON.parse(weights) };
      }
    } catch (error) {
      console.error('Error loading recommendation data:', error);
    }
  }

  // Save user interaction data
  private async saveUserData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_INTERACTIONS, JSON.stringify(this.userInteractions)),
        AsyncStorage.setItem(STORAGE_KEYS.PREFERENCE_WEIGHTS, JSON.stringify(this.preferenceWeights)),
      ]);
    } catch (error) {
      console.error('Error saving recommendation data:', error);
    }
  }

  // Record user interaction with recipe
  async recordInteraction(interaction: Omit<UserInteraction, 'timestamp'>): Promise<void> {
    const newInteraction: UserInteraction = {
      ...interaction,
      timestamp: new Date().toISOString(),
    };

    this.userInteractions.push(newInteraction);
    
    // Keep only last 1000 interactions
    if (this.userInteractions.length > 1000) {
      this.userInteractions = this.userInteractions.slice(-1000);
    }

    // Update preference weights based on user behavior
    this.updatePreferenceWeights(newInteraction);
    
    await this.saveUserData();
  }

  // Update preference weights based on user behavior
  private updatePreferenceWeights(interaction: UserInteraction): void {
    const learningRate = 0.1;
    
    // Positive interactions increase weights for similar content
    if (['saved', 'cooked', 'rated'].includes(interaction.action)) {
      const boost = interaction.rating ? interaction.rating / 5 : 1;
      
      // Increase weights slightly based on positive interaction
      this.preferenceWeights.history += learningRate * boost;
      this.preferenceWeights.cuisine += (learningRate * boost) * 0.5;
      this.preferenceWeights.difficulty += (learningRate * boost) * 0.3;
    }
    
    // Negative interactions (skipped) slightly decrease weights
    if (interaction.action === 'skipped') {
      this.preferenceWeights.history -= learningRate * 0.3;
    }

    // Normalize weights to prevent runaway values
    this.normalizeWeights();
  }

  // Normalize preference weights to keep them in reasonable bounds
  private normalizeWeights(): void {
    const maxWeight = 2.0;
    const minWeight = 0.1;
    
    Object.keys(this.preferenceWeights).forEach(key => {
      const weightKey = key as keyof PreferenceWeights;
      this.preferenceWeights[weightKey] = Math.max(
        minWeight,
        Math.min(maxWeight, this.preferenceWeights[weightKey])
      );
    });
  }

  // Get personalized recommendations
  async getRecommendations(
    recipes: Recipe[],
    userProfile: UserProfile,
    context: RecommendationContext = this.getDefaultContext(),
    limit: number = 10
  ): Promise<RecipeRecommendation[]> {
    try {
      // Score all recipes based on user preferences
      const scoredRecipes = recipes.map(recipe => 
        this.scoreRecipe(recipe, userProfile, context)
      );

      // Sort by score and return top recommendations
      const recommendations = scoredRecipes
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache recommendations
      await this.cacheRecommendations(recommendations);

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  // Score individual recipe based on user preferences
  private scoreRecipe(
    recipe: Recipe,
    userProfile: UserProfile,
    context: RecommendationContext
  ): RecipeRecommendation {
    const reasoning: RecommendationReason[] = [];
    let totalScore = 0;

    // 1. Dietary Restrictions Score
    const dietaryScore = this.calculateDietaryScore(recipe, userProfile, reasoning);
    totalScore += dietaryScore * this.preferenceWeights.dietary;

    // 2. Cuisine Preference Score
    const cuisineScore = this.calculateCuisineScore(recipe, userProfile, reasoning);
    totalScore += cuisineScore * this.preferenceWeights.cuisine;

    // 3. Nutrition Goals Score
    const nutritionScore = this.calculateNutritionScore(recipe, userProfile, reasoning);
    totalScore += nutritionScore * this.preferenceWeights.nutrition;

    // 4. Cooking Skill Score
    const skillScore = this.calculateSkillScore(recipe, userProfile, reasoning);
    totalScore += skillScore * this.preferenceWeights.difficulty;

    // 5. Time Preference Score
    const timeScore = this.calculateTimeScore(recipe, userProfile, context, reasoning);
    totalScore += timeScore * this.preferenceWeights.cookingTime;

    // 6. Ingredient Preference Score
    const ingredientScore = this.calculateIngredientScore(recipe, userProfile, reasoning);
    totalScore += ingredientScore * this.preferenceWeights.ingredients;

    // 7. Historical Preference Score
    const historyScore = this.calculateHistoryScore(recipe, reasoning);
    totalScore += historyScore * this.preferenceWeights.history;

    // 8. Health Goals Alignment Score
    const healthScore = this.calculateHealthGoalsScore(recipe, userProfile, reasoning);
    totalScore += healthScore * this.preferenceWeights.healthGoals;

    // 9. Contextual Score (time of day, season, etc.)
    const contextScore = this.calculateContextScore(recipe, context, reasoning);
    totalScore += contextScore * 0.3;

    // Normalize final score (0-1)
    const normalizedScore = Math.max(0, Math.min(1, totalScore / 9));

    return {
      ...recipe,
      score: normalizedScore,
      reasoning: reasoning.sort((a, b) => b.weight - a.weight),
    };
  }

  // Calculate dietary restrictions compatibility score
  private calculateDietaryScore(
    recipe: Recipe,
    userProfile: UserProfile,
    reasoning: RecommendationReason[]
  ): number {
    if (!userProfile.dietaryPreferences?.restrictions?.length) {
      return 0.5; // Neutral score if no restrictions
    }

    const userRestrictions = userProfile.dietaryPreferences.restrictions;
    const recipeRestrictions = recipe.dietaryRestrictions || [];

    // Convert user restrictions to match recipe format (capitalize first letter)
    const normalizedUserRestrictions = userRestrictions.map(restriction => 
      restriction.charAt(0).toUpperCase() + restriction.slice(1) as any
    );

    // Check if recipe violates any user restrictions
    const violations = normalizedUserRestrictions.filter(restriction => 
      !recipeRestrictions.includes(restriction)
    );

    if (violations.length === 0) {
      reasoning.push({
        type: 'dietary',
        description: 'Matches all your dietary restrictions',
        weight: 1.0,
      });
      return 1.0;
    }

    // Partial compatibility
    const compatibilityRatio = (normalizedUserRestrictions.length - violations.length) / normalizedUserRestrictions.length;
    
    if (compatibilityRatio > 0.5) {
      reasoning.push({
        type: 'dietary',
        description: 'Compatible with most of your dietary preferences',
        weight: compatibilityRatio,
      });
    }

    return compatibilityRatio;
  }

  // Calculate cuisine preference score
  private calculateCuisineScore(
    recipe: Recipe,
    userProfile: UserProfile,
    reasoning: RecommendationReason[]
  ): number {
    const cuisinePrefs = userProfile.dietaryPreferences?.cuisinePreferences;
    if (!cuisinePrefs) {
      return 0.5; // Neutral if no preferences recorded
    }

    // Find matching cuisine preference
    const matchingPref = cuisinePrefs.find(pref => pref.cuisine === recipe.cuisineType);
    if (!matchingPref) {
      return 0.5; // Neutral if no preference recorded for this cuisine
    }

    const preference = matchingPref.preference;
    let score = 0;

    switch (preference) {
      case 'love':
        score = 1.0;
        reasoning.push({
          type: 'cuisine',
          description: `You love ${recipe.cuisineType} cuisine`,
          weight: 1.0,
        });
        break;
      case 'like':
        score = 0.8;
        reasoning.push({
          type: 'cuisine',
          description: `You enjoy ${recipe.cuisineType} cuisine`,
          weight: 0.8,
        });
        break;
      case 'neutral':
        score = 0.5;
        break;
      case 'dislike':
        score = 0.2;
        break;
      default:
        score = 0.5;
    }

    return score;
  }

  // Calculate nutrition goals alignment score
  private calculateNutritionScore(
    recipe: Recipe,
    userProfile: UserProfile,
    reasoning: RecommendationReason[]
  ): number {
    if (!recipe.nutritionInfo) {
      return 0.5;
    }

    const nutrition = recipe.nutritionInfo;
    const dietaryPrefs = userProfile.dietaryPreferences;
    const goals = userProfile.healthGoals;
    let score = 0.5;
    let reasoningAdded = false;

    // Check calorie alignment
    if (dietaryPrefs?.calorieTarget) {
      const mealCalories = nutrition.calories;
      const targetMealCalories = dietaryPrefs.calorieTarget / 3; // Rough estimate for meal
      const calorieRatio = mealCalories / targetMealCalories;
      
      if (calorieRatio >= 0.7 && calorieRatio <= 1.3) {
        score += 0.3;
        if (!reasoningAdded) {
          reasoning.push({
            type: 'nutrition',
            description: 'Fits well with your calorie goals',
            weight: 0.3,
          });
          reasoningAdded = true;
        }
      }
    }

    // Check macro alignment if specified
    if (dietaryPrefs?.macroTargets) {
      const proteinRatio = nutrition.protein / (nutrition.calories / 4);
      const carbRatio = nutrition.carbs / (nutrition.calories / 4);
      const fatRatio = nutrition.fat / (nutrition.calories / 9);
      
      // Simple macro scoring (could be enhanced)
      if (goals?.primaryGoal === 'muscle-gain' && proteinRatio > 0.25) {
        score += 0.2;
        if (!reasoningAdded) {
          reasoning.push({
            type: 'nutrition',
            description: 'High protein content supports your muscle gain goals',
            weight: 0.2,
          });
          reasoningAdded = true;
        }
      }
    }

    return Math.min(1.0, score);
  }

  // Calculate cooking skill compatibility score
  private calculateSkillScore(
    recipe: Recipe,
    userProfile: UserProfile,
    reasoning: RecommendationReason[]
  ): number {
    const userSkill = userProfile.cookingPreferences?.skillLevel;
    if (!userSkill) return 0.5;

    const skillLevels: Record<string, number> = { 
      'beginner': 1, 
      'novice': 2, 
      'intermediate': 3, 
      'advanced': 4, 
      'expert': 5 
    };
    const difficultyLevels = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

    const userSkillNum = skillLevels[userSkill] || 3;
    const recipeDifficultyNum = difficultyLevels[recipe.difficulty] || 2;

    // Score based on how well difficulty matches skill
    let score = 0.5;
    
    if (recipeDifficultyNum <= userSkillNum) {
      score = 0.8 + (0.2 * (userSkillNum - recipeDifficultyNum) / 3);
      reasoning.push({
        type: 'skill',
        description: `${recipe.difficulty} difficulty matches your ${userSkill} skill level`,
        weight: score,
      });
    } else {
      score = 0.3;
    }

    return Math.min(1.0, score);
  }

  // Calculate time preference score
  private calculateTimeScore(
    recipe: Recipe,
    userProfile: UserProfile,
    context: RecommendationContext,
    reasoning: RecommendationReason[]
  ): number {
    const maxCookTime = userProfile.cookingPreferences?.maxCookingTime;
    const maxPrepTime = userProfile.cookingPreferences?.maxPrepTime;
    const availableTime = context.availableTime;

    const totalTime = recipe.prepTime + recipe.cookTime;
    let score = 0.5;

    // Check against user's maximum time preferences
    if (maxCookTime && recipe.cookTime <= maxCookTime) {
      score += 0.3;
    }
    
    if (maxPrepTime && recipe.prepTime <= maxPrepTime) {
      score += 0.2;
    }

    // Check against available time in context
    if (availableTime && totalTime <= availableTime) {
      score += 0.3;
      reasoning.push({
        type: 'time',
        description: `Can be prepared in your available ${availableTime} minutes`,
        weight: 0.3,
      });
    }

    // Bonus for quick recipes during busy times
    if (totalTime <= 30 && context.timeOfDay === 'evening') {
      score += 0.2;
      reasoning.push({
        type: 'time',
        description: 'Quick recipe perfect for busy evenings',
        weight: 0.2,
      });
    }

    return Math.min(1.0, score);
  }

  // Calculate ingredient preference score
  private calculateIngredientScore(
    recipe: Recipe,
    userProfile: UserProfile,
    reasoning: RecommendationReason[]
  ): number {
    const preferredIngredients = userProfile.dietaryPreferences?.preferredIngredients || [];
    const avoidedIngredients = userProfile.dietaryPreferences?.avoidedIngredients || [];
    
    if (!recipe.ingredients?.length) return 0.5;

    let score = 0.5;
    const recipeIngredientNames = recipe.ingredients.map(ing => ing.name.toLowerCase());

    // Check for avoided ingredients
    const hasAvoidedIngredients = avoidedIngredients.some(avoided =>
      recipeIngredientNames.some(ingredient => 
        ingredient.includes(avoided.toLowerCase())
      )
    );

    if (hasAvoidedIngredients) {
      score -= 0.4;
    }

    // Check for preferred ingredients
    const hasPreferredIngredients = preferredIngredients.filter(preferred =>
      recipeIngredientNames.some(ingredient => 
        ingredient.includes(preferred.toLowerCase())
      )
    ).length;

    if (hasPreferredIngredients > 0) {
      const preferredRatio = hasPreferredIngredients / preferredIngredients.length;
      score += preferredRatio * 0.4;
      
      reasoning.push({
        type: 'ingredients',
        description: `Contains ${hasPreferredIngredients} of your preferred ingredients`,
        weight: preferredRatio * 0.4,
      });
    }

    return Math.max(0, Math.min(1.0, score));
  }

  // Calculate historical preference score based on user interactions
  private calculateHistoryScore(recipe: Recipe, reasoning: RecommendationReason[]): number {
    if (!this.userInteractions.length) return 0.5;

    // Check if user has interacted with this specific recipe
    const recipeInteractions = this.userInteractions.filter(int => int.recipeId === recipe.id);
    
    if (recipeInteractions.length > 0) {
      const lastInteraction = recipeInteractions[recipeInteractions.length - 1];
      
      // Don't recommend recently skipped recipes
      if (lastInteraction.action === 'skipped') {
        const timeSinceSkip = Date.now() - new Date(lastInteraction.timestamp).getTime();
        if (timeSinceSkip < 7 * 24 * 60 * 60 * 1000) { // 7 days
          return 0.1;
        }
      }
      
      // Boost recipes that were previously rated highly
      if (lastInteraction.action === 'rated' && lastInteraction.rating && lastInteraction.rating >= 4) {
        reasoning.push({
          type: 'history',
          description: `You rated this recipe ${lastInteraction.rating} stars`,
          weight: 0.8,
        });
        return 0.8;
      }
    }

    // Analyze similar recipes based on characteristics
    const similarityScore = this.calculateSimilarityToHistory(recipe);
    
    if (similarityScore > 0.6) {
      reasoning.push({
        type: 'history',
        description: 'Similar to recipes you\'ve enjoyed before',
        weight: similarityScore,
      });
    }

    return similarityScore;
  }

  // Calculate health goals alignment score
  private calculateHealthGoalsScore(
    recipe: Recipe,
    userProfile: UserProfile,
    reasoning: RecommendationReason[]
  ): number {
    if (!userProfile.healthGoals?.primaryGoal) return 0.5;

    const goal = userProfile.healthGoals.primaryGoal;
    const nutrition = recipe.nutritionInfo;
    let score = 0.5;

    if (!nutrition) return score;

    switch (goal) {
      case 'weight-loss':
        if (nutrition.calories < 400) {
          score = 0.8;
          reasoning.push({
            type: 'goals',
            description: 'Low calorie recipe supports your weight loss goals',
            weight: 0.8,
          });
        }
        break;
        
      case 'muscle-gain':
        if (nutrition.protein > 25) {
          score = 0.8;
          reasoning.push({
            type: 'goals',
            description: 'High protein content supports muscle building',
            weight: 0.8,
          });
        }
        break;
        
      case 'improved-energy':
        if (nutrition.carbs > 30 && nutrition.fiber > 5) {
          score = 0.7;
          reasoning.push({
            type: 'goals',
            description: 'Good carb and fiber content for sustained energy',
            weight: 0.7,
          });
        }
        break;
    }

    return score;
  }

  // Calculate contextual score based on time, season, etc.
  private calculateContextScore(
    recipe: Recipe,
    context: RecommendationContext,
    reasoning: RecommendationReason[]
  ): number {
    let score = 0.5;

    // Time of day preferences
    if (context.mealType) {
      if (recipe.mealType.includes(context.mealType)) {
        score += 0.3;
        reasoning.push({
          type: 'time',
          description: `Perfect for ${context.mealType.toLowerCase()}`,
          weight: 0.3,
        });
      }
    }

    // Weekend vs weekday preferences
    const isWeekend = context.dayOfWeek === 0 || context.dayOfWeek === 6;
    if (isWeekend && recipe.difficulty === 'Hard') {
      score += 0.2; // Complex recipes for weekends
    } else if (!isWeekend && (recipe.prepTime + recipe.cookTime) <= 30) {
      score += 0.2; // Quick recipes for weekdays
    }

    return Math.min(1.0, score);
  }

  // Calculate similarity to user's historical preferences
  private calculateSimilarityToHistory(recipe: Recipe): number {
    const positiveInteractions = this.userInteractions.filter(
      int => ['saved', 'cooked', 'rated'].includes(int.action) && 
             (!int.rating || int.rating >= 3)
    );

    if (positiveInteractions.length === 0) return 0.5;

    // This would ideally compare recipe characteristics to previously liked recipes
    // For now, return a base similarity score
    return 0.6;
  }

  // Get default recommendation context
  private getDefaultContext(): RecommendationContext {
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
  }

  // Cache recommendations for quick access
  private async cacheRecommendations(recommendations: RecipeRecommendation[]): Promise<void> {
    try {
      const cacheData = {
        recommendations,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.RECOMMENDATION_CACHE, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching recommendations:', error);
    }
  }

  // Get cached recommendations if still valid
  async getCachedRecommendations(): Promise<RecipeRecommendation[] | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.RECOMMENDATION_CACHE);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;
      
      // Cache valid for 1 hour
      if (age < 60 * 60 * 1000) {
        return cacheData.recommendations;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading cached recommendations:', error);
      return null;
    }
  }

  // Get trending recipes based on community interactions
  async getTrendingRecipes(recipes: Recipe[], limit: number = 5): Promise<Recipe[]> {
    // This would typically use community data from API
    // For now, return recipes with high ratings and recent activity
    return recipes
      .filter(recipe => recipe.rating && recipe.rating >= 4.5)
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, limit);
  }

  // Clear all recommendation data (for testing/reset)
  async clearRecommendationData(): Promise<void> {
    this.userInteractions = [];
    this.preferenceWeights = {
      dietary: 1.0,
      cuisine: 0.8,
      nutrition: 0.9,
      difficulty: 0.7,
      cookingTime: 0.8,
      ingredients: 0.6,
      history: 0.9,
      healthGoals: 1.0,
    };

    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER_INTERACTIONS),
      AsyncStorage.removeItem(STORAGE_KEYS.PREFERENCE_WEIGHTS),
      AsyncStorage.removeItem(STORAGE_KEYS.RECOMMENDATION_CACHE),
    ]);
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
export default recommendationEngine;