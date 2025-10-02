import { EnhancedRecipe, RecommendationContext, RecommendationResponse } from '../../models/enhancedRecipe';
import { ILogger } from '../interfaces/ILogger';
import { IAIService } from '../interfaces/IAIService';

export class HybridRecommendationService {
  private logger: ILogger;
  private aiService: IAIService;

  constructor(logger: ILogger, aiService: IAIService) {
    this.logger = logger;
    this.aiService = aiService;
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    context: RecommendationContext,
    limit: number = 10
  ): Promise<RecommendationResponse> {
    try {
      this.logger.info(`Getting personalized recommendations for user ${userId}`);

      // Get user preferences and history
      const userPreferences = await this.getUserPreferences(userId);
      const userHistory = await this.getUserHistory(userId);

      // Generate recommendations using multiple strategies
      const collaborativeRecs = await this.getCollaborativeRecommendations(userId, limit);
      const contentBasedRecs = await this.getContentBasedRecommendations(userPreferences, context, limit);
      const contextualRecs = await this.getContextualRecommendations(context, limit);

      // Combine and rank recommendations
      const combinedRecs = await this.combineRecommendations([
        ...collaborativeRecs,
        ...contentBasedRecs,
        ...contextualRecs
      ], userPreferences, context);

      // Remove duplicates and limit results
      const uniqueRecs = this.removeDuplicates(combinedRecs).slice(0, limit);

      // Generate alternatives
      const alternatives = await this.generateAlternatives(uniqueRecs, context, 5);

      // Calculate confidence score
      const confidence = this.calculateConfidence(uniqueRecs, userHistory);

      // Generate reasoning
      const reasoning = this.generateReasoning(uniqueRecs, userPreferences, context);

      return {
        recommendations: uniqueRecs,
        context,
        confidence,
        reasoning,
        alternatives
      };

    } catch (error) {
      this.logger.error('Error getting personalized recommendations:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get contextual recommendations based on current context
   */
  async getContextualRecommendations(
    context: RecommendationContext,
    limit: number = 10
  ): Promise<EnhancedRecipe[]> {
    try {
      this.logger.info('Getting contextual recommendations');

      // Build context-aware prompt
      const prompt = this.buildContextPrompt(context);

      // Use AI to generate contextual recommendations
      const response = await this.aiService.generateCompletion({
        systemPrompt: 'You are a culinary expert providing personalized recipe recommendations based on context.',
        prompt,
        temperature: 0.7
      });

      // Parse AI response to get recipe suggestions
      const suggestedRecipes = await this.parseAIRecommendations(response.content);

      // Filter and rank based on context
      const filteredRecipes = await this.filterByContext(suggestedRecipes, context);

      return filteredRecipes.slice(0, limit);

    } catch (error) {
      this.logger.error('Error getting personalized recommendations:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    userId: string,
    limit: number
  ): Promise<EnhancedRecipe[]> {
    try {
      // Find similar users based on recipe preferences
      const similarUsers = await this.findSimilarUsers(userId);
      
      // Get recipes liked by similar users
      const recommendedRecipes = await this.getRecipesFromSimilarUsers(similarUsers, userId);
      
      return recommendedRecipes.slice(0, limit);
    } catch (error) {
      this.logger.warn('Warning in recommendation service:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Get content-based recommendations
   */
  private async getContentBasedRecommendations(
    userPreferences: any,
    context: RecommendationContext,
    limit: number
  ): Promise<EnhancedRecipe[]> {
    try {
      // Find recipes similar to user's liked recipes
      const likedRecipes = await this.getUserLikedRecipes(userPreferences.userId);
      const similarRecipes = await this.findSimilarRecipes(likedRecipes, context);
      
      return similarRecipes.slice(0, limit);
    } catch (error) {
      this.logger.warn('Warning in recommendation service:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Combine recommendations from different strategies
   */
  private async combineRecommendations(
    recommendations: EnhancedRecipe[],
    userPreferences: any,
    context: RecommendationContext
  ): Promise<EnhancedRecipe[]> {
    // Score each recommendation
    const scoredRecs = recommendations.map(recipe => ({
      recipe,
      score: this.calculateRecommendationScore(recipe, userPreferences, context)
    }));

    // Sort by score
    scoredRecs.sort((a, b) => b.score - a.score);

    // Update recommendation scores
    scoredRecs.forEach(({ recipe, score }) => {
      recipe.recommendationScore = score;
    });

    return scoredRecs.map(({ recipe }) => recipe);
  }

  /**
   * Calculate recommendation score for a recipe
   */
  private calculateRecommendationScore(
    recipe: EnhancedRecipe,
    userPreferences: any,
    context: RecommendationContext
  ): number {
    let score = 0;

    // Base score from recipe rating
    score += recipe.averageRating * 20;

    // Context matching
    if (recipe.category === this.mapTimeToCategory(context.timeOfDay)) {
      score += 30;
    }

    // Cuisine preference
    if (userPreferences.preferredCuisines?.includes(recipe.cuisine)) {
      score += 25;
    }

    // Dietary restrictions
    if (this.matchesDietaryRestrictions(recipe, userPreferences.dietaryRestrictions)) {
      score += 20;
    }

    // Time constraints
    if (recipe.totalTime <= context.cookingTime) {
      score += 15;
    }

    // Available ingredients
    const ingredientMatch = this.calculateIngredientMatch(recipe, context.availableIngredients);
    score += ingredientMatch * 10;

    // Seasonal relevance
    if (this.isSeasonallyRelevant(recipe, context.season)) {
      score += 10;
    }

    // Occasion matching
    if (this.matchesOccasion(recipe, context.occasion)) {
      score += 15;
    }

    // Mood matching
    if (this.matchesMood(recipe, context.mood)) {
      score += 10;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Remove duplicate recipes from recommendations
   */
  private removeDuplicates(recipes: EnhancedRecipe[]): EnhancedRecipe[] {
    const seen = new Set();
    return recipes.filter(recipe => {
      if (seen.has(recipe.id)) {
        return false;
      }
      seen.add(recipe.id);
      return true;
    });
  }

  /**
   * Generate alternative recommendations
   */
  private async generateAlternatives(
    recommendations: EnhancedRecipe[],
    context: RecommendationContext,
    limit: number
  ): Promise<EnhancedRecipe[]> {
    // Generate alternatives by varying one aspect of the recommendations
    const alternatives: EnhancedRecipe[] = [];

    for (const recipe of recommendations.slice(0, 3)) { // Only for top 3
      // Try different cuisine
      const cuisineAlternative = await this.findAlternativeCuisine(recipe, context);
      if (cuisineAlternative) alternatives.push(cuisineAlternative);

      // Try different difficulty
      const difficultyAlternative = await this.findAlternativeDifficulty(recipe, context);
      if (difficultyAlternative) alternatives.push(difficultyAlternative);
    }

    return alternatives.slice(0, limit);
  }

  /**
   * Calculate confidence score for recommendations
   */
  private calculateConfidence(
    recommendations: EnhancedRecipe[],
    userHistory: any
  ): number {
    if (recommendations.length === 0) return 0;

    const avgScore = recommendations.reduce((sum, r) => sum + r.recommendationScore, 0) / recommendations.length;
    const historyConfidence = userHistory.recipeCount > 10 ? 0.8 : 0.5;
    
    return Math.min(avgScore * historyConfidence / 100, 1.0);
  }

  /**
   * Generate reasoning for recommendations
   */
  private generateReasoning(
    recommendations: EnhancedRecipe[],
    userPreferences: any,
    context: RecommendationContext
  ): string[] {
    const reasoning: string[] = [];

    if (recommendations.length > 0) {
      reasoning.push(`Based on your preference for ${userPreferences.preferredCuisines?.join(', ') || 'various cuisines'}`);
      
      if (context.timeOfDay) {
        reasoning.push(`Perfect for ${context.timeOfDay} with ${context.cookingTime} minutes available`);
      }
      
      if (context.availableIngredients.length > 0) {
        reasoning.push(`Uses ingredients you have: ${context.availableIngredients.slice(0, 3).join(', ')}`);
      }
      
      if (context.mood) {
        reasoning.push(`Matches your ${context.mood} mood`);
      }
    }

    return reasoning;
  }

  /**
   * Build context-aware prompt for AI
   */
  private buildContextPrompt(context: RecommendationContext): string {
    return `Recommend recipes based on this context:
- Time of day: ${context.timeOfDay}
- Season: ${context.season}
- Available ingredients: ${context.availableIngredients.join(', ')}
- Cooking time available: ${context.cookingTime} minutes
- Serving size: ${context.servingSize}
- Budget: $${context.budget}
- Occasion: ${context.occasion}
- Mood: ${context.mood}

Provide 5 recipe suggestions that match this context.`;
  }

  /**
   * Parse AI recommendations from response
   */
  private async parseAIRecommendations(response: string): Promise<EnhancedRecipe[]> {
    // This would parse the AI response and convert to recipe objects
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Filter recipes by context
   */
  private async filterByContext(
    recipes: EnhancedRecipe[],
    context: RecommendationContext
  ): Promise<EnhancedRecipe[]> {
    return recipes.filter(recipe => {
      // Filter by cooking time
      if (recipe.totalTime > context.cookingTime) return false;
      
      // Filter by serving size
      if (Math.abs(recipe.servings - context.servingSize) > 2) return false;
      
      // Filter by budget
      if (recipe.estimatedCost.total > context.budget) return false;
      
      return true;
    });
  }

  /**
   * Map time of day to recipe category
   */
  private mapTimeToCategory(timeOfDay: string): string {
    const mapping: { [key: string]: string } = {
      'morning': 'breakfast',
      'afternoon': 'lunch',
      'evening': 'dinner'
    };
    return mapping[timeOfDay] || 'main_course';
  }

  /**
   * Check if recipe matches dietary restrictions
   */
  private matchesDietaryRestrictions(recipe: EnhancedRecipe, restrictions: string[]): boolean {
    if (!restrictions || restrictions.length === 0) return true;
    
    return restrictions.every(restriction => 
      recipe.dietaryFlags.includes(restriction as any)
    );
  }

  /**
   * Calculate ingredient match percentage
   */
  private calculateIngredientMatch(recipe: EnhancedRecipe, availableIngredients: string[]): number {
    if (availableIngredients.length === 0) return 0;
    
    const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
    const availableLower = availableIngredients.map(i => i.toLowerCase());
    
    const matches = recipeIngredients.filter(ingredient =>
      availableLower.some(available => available.includes(ingredient) || ingredient.includes(available))
    );
    
    return matches.length / recipeIngredients.length;
  }

  /**
   * Check if recipe is seasonally relevant
   */
  private isSeasonallyRelevant(recipe: EnhancedRecipe, season: string): boolean {
    return recipe.seasonalAvailability.availableSeasons.includes(season);
  }

  /**
   * Check if recipe matches occasion
   */
  private matchesOccasion(recipe: EnhancedRecipe, occasion: string): boolean {
    // This would check recipe tags and metadata for occasion relevance
    return true; // Simplified
  }

  /**
   * Check if recipe matches mood
   */
  private matchesMood(recipe: EnhancedRecipe, mood: string): boolean {
    // This would check recipe characteristics against mood preferences
    return true; // Simplified
  }

  // Placeholder methods for user data access
  private async getUserPreferences(userId: string): Promise<any> {
    // This would fetch user preferences from database
    return {
      userId,
      preferredCuisines: ['italian', 'mexican'],
      dietaryRestrictions: ['vegetarian']
    };
  }

  private async getUserHistory(userId: string): Promise<any> {
    // This would fetch user cooking history
    return {
      recipeCount: 15,
      averageRating: 4.2,
      preferredCategories: ['main_course', 'soup']
    };
  }

  private async findSimilarUsers(userId: string): Promise<string[]> {
    // This would find users with similar preferences
    return []; // Placeholder
  }

  private async getRecipesFromSimilarUsers(similarUsers: string[], userId: string): Promise<EnhancedRecipe[]> {
    // This would get recipes liked by similar users
    return []; // Placeholder
  }

  private async getUserLikedRecipes(userId: string): Promise<EnhancedRecipe[]> {
    // This would get user's liked recipes
    return []; // Placeholder
  }

  private async findSimilarRecipes(likedRecipes: EnhancedRecipe[], context: RecommendationContext): Promise<EnhancedRecipe[]> {
    // This would find recipes similar to liked ones
    return []; // Placeholder
  }

  private async findAlternativeCuisine(recipe: EnhancedRecipe, context: RecommendationContext): Promise<EnhancedRecipe | null> {
    // This would find similar recipe with different cuisine
    return null; // Placeholder
  }

  private async findAlternativeDifficulty(recipe: EnhancedRecipe, context: RecommendationContext): Promise<EnhancedRecipe | null> {
    // This would find similar recipe with different difficulty
    return null; // Placeholder
  }
}
