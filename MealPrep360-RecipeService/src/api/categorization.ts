import { Request, Response } from 'express';
import { ServiceContainer } from '../container/ServiceContainer';
import { EnhancedRecipe, CuisineType, RecipeCategory, DietaryFlag } from '../models/enhancedRecipe';
import { ILogger } from '../services/interfaces/ILogger';
import { IRecipe } from '../models/recipe';

export class CategorizationAPI {
  private container: ServiceContainer;
  private logger: ILogger;

  constructor() {
    this.container = ServiceContainer.getInstance();
    this.logger = this.container.get<ILogger>('ILogger');
  }

  /**
   * Categorize a recipe
   */
  async categorizeRecipe(req: Request, res: Response): Promise<void> {
    try {
      const recipe: IRecipe = req.body;

      if (!recipe) {
        res.status(400).json({ error: 'Recipe data is required' });
        return;
      }

      // Get categorization service
      const categorizationService = this.container.getCategorizationService();
      
      // Categorize the recipe
      const enhancedRecipe = await categorizationService.categorizeRecipe(recipe);
      
      res.json({
        success: true,
        data: {
          originalRecipe: recipe,
          enhancedRecipe
        }
      });

    } catch (error) {
      this.logger.error('Error in categorizeRecipe API:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get recipes by cuisine
   */
  async getRecipesByCuisine(req: Request, res: Response): Promise<void> {
    try {
      const { cuisine } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!cuisine || !Object.values(CuisineType).includes(cuisine as CuisineType)) {
        res.status(400).json({ 
          error: 'Valid cuisine is required',
          availableCuisines: Object.values(CuisineType)
        });
        return;
      }

      // Get categorization service
      const categorizationService = this.container.getCategorizationService();
      
      // Get recipes by cuisine
      const recipes = await categorizationService.getCuisineRecipes(cuisine as CuisineType);
      
      // Apply pagination
      const paginatedRecipes = recipes.slice(offset, offset + limit);
      
      res.json({
        success: true,
        data: {
          recipes: paginatedRecipes,
          cuisine,
          total: recipes.length,
          limit,
          offset,
          hasMore: offset + limit < recipes.length
        }
      });

    } catch (error) {
      this.logger.error('Error in getRecipesByCuisine API:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get recipes by category
   */
  async getRecipesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!category || !Object.values(RecipeCategory).includes(category as RecipeCategory)) {
        res.status(400).json({ 
          error: 'Valid category is required',
          availableCategories: Object.values(RecipeCategory)
        });
        return;
      }

      // Get categorization service
      const categorizationService = this.container.getCategorizationService();
      
      // Get recipes by category
      const recipes = await categorizationService.getCategoryRecipes(category as RecipeCategory);
      
      // Apply pagination
      const paginatedRecipes = recipes.slice(offset, offset + limit);
      
      res.json({
        success: true,
        data: {
          recipes: paginatedRecipes,
          category,
          total: recipes.length,
          limit,
          offset,
          hasMore: offset + limit < recipes.length
        }
      });

    } catch (error) {
      this.logger.error('Error in getRecipesByCategory API:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get recipes by dietary restrictions
   */
  async getRecipesByDietaryFlags(req: Request, res: Response): Promise<void> {
    try {
      const { flags } = req.query;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!flags) {
        res.status(400).json({ 
          error: 'Dietary flags are required',
          availableFlags: Object.values(DietaryFlag)
        });
        return;
      }

      const dietaryFlags = Array.isArray(flags) ? flags : [flags];
      
      // Validate dietary flags
      const validFlags = dietaryFlags.filter(flag => 
        Object.values(DietaryFlag).includes(flag as DietaryFlag)
      );

      if (validFlags.length === 0) {
        res.status(400).json({ 
          error: 'Valid dietary flags are required',
          availableFlags: Object.values(DietaryFlag)
        });
        return;
      }

      // Get categorization service
      const categorizationService = this.container.getCategorizationService();
      
      // Get recipes by dietary flags
      const recipes = await categorizationService.getDietaryRecipes(validFlags as DietaryFlag[]);
      
      // Apply pagination
      const paginatedRecipes = recipes.slice(offset, offset + limit);
      
      res.json({
        success: true,
        data: {
          recipes: paginatedRecipes,
          dietaryFlags: validFlags,
          total: recipes.length,
          limit,
          offset,
          hasMore: offset + limit < recipes.length
        }
      });

    } catch (error) {
      this.logger.error('Error in getRecipesByDietaryFlags API:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available cuisines
   */
  async getAvailableCuisines(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          cuisines: Object.values(CuisineType).map(cuisine => ({
            value: cuisine,
            label: cuisine.charAt(0).toUpperCase() + cuisine.slice(1).replace('_', ' ')
          }))
        }
      });

    } catch (error) {
      this.logger.error('Error in getAvailableCuisines API:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available categories
   */
  async getAvailableCategories(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          categories: Object.values(RecipeCategory).map(category => ({
            value: category,
            label: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')
          }))
        }
      });

    } catch (error) {
      this.logger.error('Error in getAvailableCategories API:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available dietary flags
   */
  async getAvailableDietaryFlags(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          dietaryFlags: Object.values(DietaryFlag).map(flag => ({
            value: flag,
            label: flag.charAt(0).toUpperCase() + flag.slice(1).replace('_', ' ')
          }))
        }
      });

    } catch (error) {
      this.logger.error('Error in getAvailableDietaryFlags API:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
