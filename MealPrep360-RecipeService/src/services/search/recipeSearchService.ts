import { 
  EnhancedRecipe, 
  SearchQuery, 
  SearchResult,
  CuisineType,
  RecipeCategory,
  DifficultyLevel,
  DietaryFlag
} from '../../models/enhancedRecipe';
import { ILogger } from '../interfaces/ILogger';

export class RecipeSearchService {
  private logger: ILogger;
  private recipes: EnhancedRecipe[] = []; // In-memory cache for now

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Search recipes with advanced filtering
   */
  async searchRecipes(query: SearchQuery): Promise<SearchResult[]> {
    try {
      this.logger.info('Searching recipes with query:', query);

      let results = [...this.recipes];

      // Apply text search
      if (query.text) {
        results = this.applyTextSearch(results, query.text);
      }

      // Apply ingredient filtering
      if (query.ingredients && query.ingredients.length > 0) {
        results = this.filterByIngredients(results, query.ingredients);
      }

      // Apply cuisine filtering
      if (query.cuisine && query.cuisine.length > 0) {
        results = this.filterByCuisine(results, query.cuisine);
      }

      // Apply category filtering
      if (query.category && query.category.length > 0) {
        results = this.filterByCategory(results, query.category);
      }

      // Apply dietary restrictions filtering
      if (query.dietaryFlags && query.dietaryFlags.length > 0) {
        results = this.filterByDietaryFlags(results, query.dietaryFlags);
      }

      // Apply difficulty filtering
      if (query.difficulty && query.difficulty.length > 0) {
        results = this.filterByDifficulty(results, query.difficulty);
      }

      // Apply time filtering
      if (query.maxPrepTime || query.maxCookTime || query.maxTotalTime) {
        results = this.filterByTime(results, query);
      }

      // Apply rating filtering
      if (query.minRating) {
        results = this.filterByRating(results, query.minRating);
      }

      // Apply nutrition goals filtering
      if (query.nutritionGoals) {
        results = this.filterByNutritionGoals(results, query.nutritionGoals);
      }

      // Apply cost filtering
      if (query.costRange) {
        results = this.filterByCost(results, query.costRange);
      }

      // Apply tag filtering
      if (query.tags && query.tags.length > 0) {
        results = this.filterByTags(results, query.tags);
      }

      // Exclude ingredients
      if (query.excludeIngredients && query.excludeIngredients.length > 0) {
        results = this.excludeIngredients(results, query.excludeIngredients);
      }

      // Convert to search results with scoring
      const searchResults = results.map(recipe => ({
        recipe,
        score: this.calculateSearchScore(recipe, query),
        highlights: this.generateHighlights(recipe, query),
        matchedFields: this.getMatchedFields(recipe, query)
      }));

      // Sort results
      const sortedResults = this.sortResults(searchResults, query);

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 20;
      const paginatedResults = sortedResults.slice(offset, offset + limit);

      this.logger.info(`Found ${paginatedResults.length} recipes matching search criteria`);
      return paginatedResults;

    } catch (error) {
      this.logger.error('Error searching recipes:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get search suggestions based on partial input
   */
  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    try {
      const suggestions: string[] = [];
      const lowerQuery = partialQuery.toLowerCase();

      // Recipe title suggestions
      const titleSuggestions = this.recipes
        .filter(recipe => recipe.title.toLowerCase().includes(lowerQuery))
        .map(recipe => recipe.title)
        .slice(0, 5);

      // Ingredient suggestions
      const ingredientSuggestions = this.extractUniqueIngredients()
        .filter(ingredient => ingredient.toLowerCase().includes(lowerQuery))
        .slice(0, 5);

      // Cuisine suggestions
      const cuisineSuggestions = Object.values(CuisineType)
        .filter(cuisine => cuisine.toLowerCase().includes(lowerQuery))
        .slice(0, 3);

      // Tag suggestions
      const tagSuggestions = this.extractUniqueTags()
        .filter(tag => tag.toLowerCase().includes(lowerQuery))
        .slice(0, 5);

      suggestions.push(...titleSuggestions, ...ingredientSuggestions, ...cuisineSuggestions, ...tagSuggestions);

      // Remove duplicates and limit
      return [...new Set(suggestions)].slice(0, 10);

    } catch (error) {
      this.logger.error('Error searching recipes:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Get ingredient suggestions
   */
  async getIngredientSuggestions(partialIngredient: string): Promise<string[]> {
    try {
      const lowerPartial = partialIngredient.toLowerCase();
      return this.extractUniqueIngredients()
        .filter(ingredient => ingredient.toLowerCase().includes(lowerPartial))
        .slice(0, 10);
    } catch (error) {
      this.logger.error('Error searching recipes:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Get cuisine suggestions
   */
  async getCuisineSuggestions(): Promise<string[]> {
    return Object.values(CuisineType).map(cuisine => 
      cuisine.charAt(0).toUpperCase() + cuisine.slice(1).replace('_', ' ')
    );
  }

  /**
   * Apply text search to recipes
   */
  private applyTextSearch(recipes: EnhancedRecipe[], searchText: string): EnhancedRecipe[] {
    const lowerSearchText = searchText.toLowerCase();
    
    return recipes.filter(recipe => {
      const searchableText = [
        recipe.title,
        recipe.description,
        ...recipe.tags,
        ...recipe.aiTags,
        recipe.cuisine,
        recipe.category
      ].join(' ').toLowerCase();

      return searchableText.includes(lowerSearchText);
    });
  }

  /**
   * Filter recipes by ingredients
   */
  private filterByIngredients(recipes: EnhancedRecipe[], ingredients: string[]): EnhancedRecipe[] {
    return recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
      return ingredients.every(ingredient =>
        recipeIngredients.some(recipeIngredient =>
          recipeIngredient.includes(ingredient.toLowerCase()) ||
          ingredient.toLowerCase().includes(recipeIngredient)
        )
      );
    });
  }

  /**
   * Filter recipes by cuisine
   */
  private filterByCuisine(recipes: EnhancedRecipe[], cuisines: CuisineType[]): EnhancedRecipe[] {
    return recipes.filter(recipe => cuisines.includes(recipe.cuisine));
  }

  /**
   * Filter recipes by category
   */
  private filterByCategory(recipes: EnhancedRecipe[], categories: RecipeCategory[]): EnhancedRecipe[] {
    return recipes.filter(recipe => categories.includes(recipe.category));
  }

  /**
   * Filter recipes by dietary flags
   */
  private filterByDietaryFlags(recipes: EnhancedRecipe[], dietaryFlags: DietaryFlag[]): EnhancedRecipe[] {
    return recipes.filter(recipe =>
      dietaryFlags.every(flag => recipe.dietaryFlags.includes(flag))
    );
  }

  /**
   * Filter recipes by difficulty
   */
  private filterByDifficulty(recipes: EnhancedRecipe[], difficulties: DifficultyLevel[]): EnhancedRecipe[] {
    return recipes.filter(recipe => difficulties.includes(recipe.difficulty));
  }

  /**
   * Filter recipes by time constraints
   */
  private filterByTime(recipes: EnhancedRecipe[], query: SearchQuery): EnhancedRecipe[] {
    return recipes.filter(recipe => {
      if (query.maxPrepTime && recipe.prepTime > query.maxPrepTime) return false;
      if (query.maxCookTime && recipe.cookTime > query.maxCookTime) return false;
      if (query.maxTotalTime && recipe.totalTime > query.maxTotalTime) return false;
      return true;
    });
  }

  /**
   * Filter recipes by minimum rating
   */
  private filterByRating(recipes: EnhancedRecipe[], minRating: number): EnhancedRecipe[] {
    return recipes.filter(recipe => recipe.averageRating >= minRating);
  }

  /**
   * Filter recipes by nutrition goals
   */
  private filterByNutritionGoals(recipes: EnhancedRecipe[], goals: any): EnhancedRecipe[] {
    return recipes.filter(recipe => {
      const nutrition = recipe.nutrition;
      
      if (goals.targetCalories && nutrition.calories > goals.targetCalories) return false;
      if (goals.targetProtein && nutrition.protein < goals.targetProtein) return false;
      if (goals.targetCarbs && nutrition.carbohydrates > goals.targetCarbs) return false;
      if (goals.targetFat && nutrition.fat > goals.targetFat) return false;
      if (goals.maxSodium && nutrition.sodium > goals.maxSodium) return false;
      if (goals.maxSugar && nutrition.sugar > goals.maxSugar) return false;
      if (goals.minFiber && nutrition.fiber < goals.minFiber) return false;
      
      return true;
    });
  }

  /**
   * Filter recipes by cost range
   */
  private filterByCost(recipes: EnhancedRecipe[], costRange: { min: number; max: number }): EnhancedRecipe[] {
    return recipes.filter(recipe =>
      recipe.estimatedCost.total >= costRange.min && recipe.estimatedCost.total <= costRange.max
    );
  }

  /**
   * Filter recipes by tags
   */
  private filterByTags(recipes: EnhancedRecipe[], tags: string[]): EnhancedRecipe[] {
    return recipes.filter(recipe =>
      tags.every(tag =>
        recipe.tags.some(recipeTag => recipeTag.toLowerCase().includes(tag.toLowerCase())) ||
        recipe.aiTags.some(aiTag => aiTag.toLowerCase().includes(tag.toLowerCase()))
      )
    );
  }

  /**
   * Exclude recipes with specific ingredients
   */
  private excludeIngredients(recipes: EnhancedRecipe[], excludeIngredients: string[]): EnhancedRecipe[] {
    return recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
      return !excludeIngredients.some(excludeIngredient =>
        recipeIngredients.some(recipeIngredient =>
          recipeIngredient.includes(excludeIngredient.toLowerCase()) ||
          excludeIngredient.toLowerCase().includes(recipeIngredient)
        )
      );
    });
  }

  /**
   * Calculate search score for a recipe
   */
  private calculateSearchScore(recipe: EnhancedRecipe, query: SearchQuery): number {
    let score = 0;

    // Text match score
    if (query.text) {
      const textMatch = this.calculateTextMatch(recipe, query.text);
      score += textMatch * 40;
    }

    // Ingredient match score
    if (query.ingredients && query.ingredients.length > 0) {
      const ingredientMatch = this.calculateIngredientMatch(recipe, query.ingredients);
      score += ingredientMatch * 30;
    }

    // Rating score
    score += recipe.averageRating * 10;

    // View count score (popularity)
    score += Math.min(recipe.viewCount / 100, 10);

    // Completion rate score
    score += recipe.completionRate * 10;

    return Math.min(score, 100);
  }

  /**
   * Calculate text match score
   */
  private calculateTextMatch(recipe: EnhancedRecipe, searchText: string): number {
    const searchableText = [
      recipe.title,
      recipe.description,
      ...recipe.tags,
      ...recipe.aiTags
    ].join(' ').toLowerCase();

    const lowerSearchText = searchText.toLowerCase();
    
    if (recipe.title.toLowerCase().includes(lowerSearchText)) return 1.0;
    if (recipe.description.toLowerCase().includes(lowerSearchText)) return 0.8;
    if (searchableText.includes(lowerSearchText)) return 0.6;
    
    return 0.3;
  }

  /**
   * Calculate ingredient match score
   */
  private calculateIngredientMatch(recipe: EnhancedRecipe, ingredients: string[]): number {
    const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
    const matches = ingredients.filter(ingredient =>
      recipeIngredients.some(recipeIngredient =>
        recipeIngredient.includes(ingredient.toLowerCase()) ||
        ingredient.toLowerCase().includes(recipeIngredient)
      )
    );
    
    return matches.length / ingredients.length;
  }

  /**
   * Generate highlights for search results
   */
  private generateHighlights(recipe: EnhancedRecipe, query: SearchQuery): string[] {
    const highlights: string[] = [];

    if (query.text) {
      const searchText = query.text.toLowerCase();
      if (recipe.title.toLowerCase().includes(searchText)) {
        highlights.push(`Title: ${recipe.title}`);
      }
      if (recipe.description.toLowerCase().includes(searchText)) {
        highlights.push(`Description: ${recipe.description.substring(0, 100)}...`);
      }
    }

    if (query.ingredients && query.ingredients.length > 0) {
      const matchingIngredients = recipe.ingredients
        .filter(ingredient => query.ingredients!.some(qi => 
          ingredient.name.toLowerCase().includes(qi.toLowerCase())
        ))
        .map(ingredient => ingredient.name);
      
      if (matchingIngredients.length > 0) {
        highlights.push(`Ingredients: ${matchingIngredients.join(', ')}`);
      }
    }

    return highlights;
  }

  /**
   * Get matched fields for search results
   */
  private getMatchedFields(recipe: EnhancedRecipe, query: SearchQuery): string[] {
    const matchedFields: string[] = [];

    if (query.text && recipe.title.toLowerCase().includes(query.text.toLowerCase())) {
      matchedFields.push('title');
    }
    if (query.text && recipe.description.toLowerCase().includes(query.text.toLowerCase())) {
      matchedFields.push('description');
    }
    if (query.cuisine && query.cuisine.includes(recipe.cuisine)) {
      matchedFields.push('cuisine');
    }
    if (query.category && query.category.includes(recipe.category)) {
      matchedFields.push('category');
    }
    if (query.difficulty && query.difficulty.includes(recipe.difficulty)) {
      matchedFields.push('difficulty');
    }

    return matchedFields;
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], query: SearchQuery): SearchResult[] {
    const sortBy = query.sortBy || 'relevance';
    const sortOrder = query.sortOrder || 'desc';

    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = a.score - b.score;
          break;
        case 'rating':
          comparison = a.recipe.averageRating - b.recipe.averageRating;
          break;
        case 'time':
          comparison = a.recipe.totalTime - b.recipe.totalTime;
          break;
        case 'difficulty':
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
          comparison = difficultyOrder[a.recipe.difficulty] - difficultyOrder[b.recipe.difficulty];
          break;
        case 'cost':
          comparison = a.recipe.estimatedCost.total - b.recipe.estimatedCost.total;
          break;
        case 'nutrition':
          comparison = a.recipe.nutrition.calories - b.recipe.nutrition.calories;
          break;
        default:
          comparison = a.score - b.score;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Extract unique ingredients from all recipes
   */
  private extractUniqueIngredients(): string[] {
    const ingredients = new Set<string>();
    this.recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        ingredients.add(ingredient.name);
      });
    });
    return Array.from(ingredients).sort();
  }

  /**
   * Extract unique tags from all recipes
   */
  private extractUniqueTags(): string[] {
    const tags = new Set<string>();
    this.recipes.forEach(recipe => {
      recipe.tags.forEach(tag => tags.add(tag));
      recipe.aiTags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Add recipes to the search index
   */
  async addRecipes(recipes: EnhancedRecipe[]): Promise<void> {
    this.recipes.push(...recipes);
    this.logger.info(`Added ${recipes.length} recipes to search index`);
  }

  /**
   * Update a recipe in the search index
   */
  async updateRecipe(recipe: EnhancedRecipe): Promise<void> {
    const index = this.recipes.findIndex(r => r.id === recipe.id);
    if (index !== -1) {
      this.recipes[index] = recipe;
      this.logger.info(`Updated recipe ${recipe.id} in search index`);
    }
  }

  /**
   * Remove a recipe from the search index
   */
  async removeRecipe(recipeId: string): Promise<void> {
    const index = this.recipes.findIndex(r => r.id === recipeId);
    if (index !== -1) {
      this.recipes.splice(index, 1);
      this.logger.info(`Removed recipe ${recipeId} from search index`);
    }
  }
}
