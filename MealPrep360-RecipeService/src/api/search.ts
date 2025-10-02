import { Request, Response } from 'express';
import { ServiceContainer } from '../container/ServiceContainer';
import { SearchQuery, SearchResult } from '../models/enhancedRecipe';
import { ILogger } from '../services/interfaces/ILogger';

export class SearchAPI {
  private container: ServiceContainer;
  private logger: ILogger;

  constructor() {
    this.container = ServiceContainer.getInstance();
    this.logger = this.container.get<ILogger>('ILogger');
  }

  /**
   * Search recipes with advanced filtering
   */
  async searchRecipes(req: Request, res: Response): Promise<void> {
    try {
      const searchQuery: SearchQuery = req.body;
      
      // Validate search query
      if (!searchQuery) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      // Get search service
      const searchService = this.container.getSearchService();
      
      // Perform search
      const results = await searchService.searchRecipes(searchQuery);
      
      // Return results
      res.json({
        success: true,
        data: {
          results,
          total: results.length,
          query: searchQuery
        }
      });

    } catch (error) {
      this.logger.error('Error searching recipes:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Query parameter "q" is required' });
        return;
      }

      // Get search service
      const searchService = this.container.getSearchService();
      
      // Get suggestions
      const suggestions = await searchService.getSearchSuggestions(q);
      
      res.json({
        success: true,
        data: {
          suggestions,
          query: q
        }
      });

    } catch (error) {
      this.logger.error('Error searching recipes:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get ingredient suggestions
   */
  async getIngredientSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Query parameter "q" is required' });
        return;
      }

      // Get search service
      const searchService = this.container.getSearchService();
      
      // Get ingredient suggestions
      const suggestions = await searchService.getIngredientSuggestions(q);
      
      res.json({
        success: true,
        data: {
          suggestions,
          query: q
        }
      });

    } catch (error) {
      this.logger.error('Error searching recipes:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get cuisine suggestions
   */
  async getCuisineSuggestions(req: Request, res: Response): Promise<void> {
    try {
      // Get search service
      const searchService = this.container.getSearchService();
      
      // Get cuisine suggestions
      const suggestions = await searchService.getCuisineSuggestions();
      
      res.json({
        success: true,
        data: {
          suggestions
        }
      });

    } catch (error) {
      this.logger.error('Error searching recipes:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
