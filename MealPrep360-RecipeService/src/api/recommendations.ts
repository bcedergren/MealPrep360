import { Request, Response } from 'express';
import { ServiceContainer } from '../container/ServiceContainer';
import { RecommendationContext, RecommendationResponse } from '../models/enhancedRecipe';
import { ILogger } from '../services/interfaces/ILogger';

export class RecommendationsAPI {
  private container: ServiceContainer;
  private logger: ILogger;

  constructor() {
    this.container = ServiceContainer.getInstance();
    this.logger = this.container.get<ILogger>('ILogger');
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const context: RecommendationContext = req.body.context || {};
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // Get recommendation service
      const recommendationService = this.container.getRecommendationService();
      
      // Get personalized recommendations
      const recommendations = await recommendationService.getPersonalizedRecommendations(
        userId,
        context,
        limit
      );
      
      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      this.logger.error('Error getting personalized recommendations:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get contextual recommendations
   */
  async getContextualRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const context: RecommendationContext = req.body;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!context) {
        res.status(400).json({ error: 'Context is required' });
        return;
      }

      // Get recommendation service
      const recommendationService = this.container.getRecommendationService();
      
      // Get contextual recommendations
      const recommendations = await recommendationService.getContextualRecommendations(
        context,
        limit
      );
      
      res.json({
        success: true,
        data: {
          recommendations,
          context
        }
      });

    } catch (error) {
      this.logger.error('Error getting personalized recommendations:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get similar recipes
   */
  async getSimilarRecipes(req: Request, res: Response): Promise<void> {
    try {
      const { recipeId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      if (!recipeId) {
        res.status(400).json({ error: 'Recipe ID is required' });
        return;
      }

      // Get recommendation service
      const recommendationService = this.container.getRecommendationService();
      
      // Get similar recipes (this would need to be implemented)
      const similarRecipes = await this.getSimilarRecipesForRecipe(recipeId, limit);
      
      res.json({
        success: true,
        data: {
          recipeId,
          similarRecipes,
          count: similarRecipes.length
        }
      });

    } catch (error) {
      this.logger.error('Error getting personalized recommendations:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get trending recipes
   */
  async getTrendingRecipes(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const timeframe = req.query.timeframe as string || 'week';

      // Get trending recipes (this would need to be implemented)
      const trendingRecipes = await this.getTrendingRecipesForTimeframe(timeframe, limit);
      
      res.json({
        success: true,
        data: {
          trendingRecipes,
          timeframe,
          count: trendingRecipes.length
        }
      });

    } catch (error) {
      this.logger.error('Error getting personalized recommendations:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get recipe recommendations based on ingredients
   */
  async getRecipesByIngredients(req: Request, res: Response): Promise<void> {
    try {
      const { ingredients } = req.body;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!ingredients || !Array.isArray(ingredients)) {
        res.status(400).json({ error: 'Ingredients array is required' });
        return;
      }

      // Get search service
      const searchService = this.container.getSearchService();
      
      // Search recipes by ingredients
      const results = await searchService.searchRecipes({
        ingredients,
        limit
      });
      
      res.json({
        success: true,
        data: {
          recipes: results.map(r => r.recipe),
          ingredients,
          count: results.length
        }
      });

    } catch (error) {
      this.logger.error('Error getting personalized recommendations:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods (these would need to be implemented)
  private async getSimilarRecipesForRecipe(recipeId: string, limit: number): Promise<any[]> {
    // This would implement similar recipe logic
    return [];
  }

  private async getTrendingRecipesForTimeframe(timeframe: string, limit: number): Promise<any[]> {
    // This would implement trending recipe logic
    return [];
  }
}
