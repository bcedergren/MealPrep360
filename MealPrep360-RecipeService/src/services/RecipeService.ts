import { IRecipeService, RecipeGenerationParams } from './interfaces/IRecipeService';
import { ILogger } from './interfaces/ILogger';
import { IAIService } from './interfaces/IAIService';
import { IImageService } from './interfaces/IImageService';
import { IRecipe, Recipe } from '../models/recipe';
import { ServiceContainer } from '../container/ServiceContainer';
import { RECIPE_SYSTEM_PROMPT } from '../constants/prompts';

export class RecipeService implements IRecipeService {
  private logger: ILogger;
  private aiService: IAIService;
  private imageService: IImageService;

  constructor(
    logger: ILogger,
    aiService: IAIService,
    imageService: IImageService
  ) {
    this.logger = logger;
    this.aiService = aiService;
    this.imageService = imageService;
  }

  public static getInstance(): RecipeService {
    const container = ServiceContainer.getInstance();
    const logger = container.get<ILogger>('ILogger');
    const aiService = container.get<IAIService>('IAIService');
    const imageService = container.get<IImageService>('IImageService');
    return new RecipeService(logger, aiService, imageService);
  }

  public async generateRecipe(params: RecipeGenerationParams): Promise<IRecipe> {
    try {
      this.logger.info('Generating recipe with params:', params);

      // Generate recipe data using AI
      const response = await this.aiService.generateCompletion({
        systemPrompt: RECIPE_SYSTEM_PROMPT,
        prompt: this.buildRecipePrompt(params),
        temperature: 0.7,
      });

      // Extract and validate recipe data
      const recipeData = this.aiService.extractJSONFromResponse(response.content);
      const validationResult = await this.validateRecipe(recipeData);
      if (!validationResult) {
        throw new Error('Generated recipe failed validation');
      }

      // Generate recipe images
      const images = await this.imageService.generateImages({
        prompt: this.buildImagePrompt(recipeData),
        n: 2, // Main image + 1 additional
      });

      // Create recipe with images
      const recipe: IRecipe = {
        ...recipeData,
        images,
        createdAt: new Date(),
        updatedAt: new Date(),
        hasImage: true,
      };

      // Generate embedding for similarity search
      const embedding = await this.aiService.generateEmbedding(
        `${recipe.title} ${recipe.description} ${recipe.ingredients.map(i => i.name).join(' ')}`
      );
      recipe.embedding = embedding;

      // Save recipe
      const savedRecipe = await this.saveRecipe(recipe);
      this.logger.info('Generated and saved recipe:', { id: savedRecipe.id, title: savedRecipe.title });

      return savedRecipe;
    } catch (error) {
      this.logger.error('Error generating recipe:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async validateRecipe(recipe: IRecipe): Promise<boolean> {
    try {
      // Check required fields
      const requiredFields = [
        'title',
        'description',
        'ingredients',
        'prepInstructions',
        'cookingInstructions',
        'servingInstructions',
        'prepTime',
        'cookTime',
        'servings',
        'tags',
        'season',
      ];

      for (const field of requiredFields) {
        if (!recipe[field as keyof IRecipe]) {
          this.logger.error(`Missing required field: ${field}`);
          return false;
        }
      }

      // Validate arrays
      const arrayFields = [
        'ingredients',
        'prepInstructions',
        'cookingInstructions',
        'servingInstructions',
        'tags',
      ];

      for (const field of arrayFields) {
        const value = recipe[field as keyof IRecipe];
        if (!Array.isArray(value) || value.length === 0) {
          this.logger.error(`Invalid array field: ${field}`);
          return false;
        }
      }

      // Validate numeric fields
      const numericFields = ['prepTime', 'cookTime', 'servings', 'storageTime'];
      for (const field of numericFields) {
        const value = recipe[field as keyof IRecipe];
        if (typeof value !== 'number' || value <= 0) {
          this.logger.error(`Invalid numeric field: ${field}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating recipe:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  public async saveRecipe(recipe: IRecipe): Promise<IRecipe> {
    try {
      const newRecipe = new Recipe(recipe);
      await newRecipe.save();
      return newRecipe;
    } catch (error) {
      this.logger.error('Error saving recipe:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async getRecipe(id: string): Promise<IRecipe | null> {
    try {
      return await Recipe.findById(id);
    } catch (error) {
      this.logger.error('Error getting recipe:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async listRecipes(filter: Partial<IRecipe>): Promise<IRecipe[]> {
    try {
      return await Recipe.find(filter).sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error('Error listing recipes:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async updateRecipe(id: string, updates: Partial<IRecipe>): Promise<IRecipe> {
    try {
      const recipe = await Recipe.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
      if (!recipe) {
        throw new Error(`Recipe ${id} not found`);
      }
      return recipe;
    } catch (error) {
      this.logger.error('Error updating recipe:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async deleteRecipe(id: string): Promise<boolean> {
    try {
      const result = await Recipe.deleteOne({ _id: id });
      return result.deletedCount === 1;
    } catch (error) {
      this.logger.error('Error deleting recipe:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async generateRecipeEmbedding(recipe: IRecipe): Promise<number[]> {
    try {
      const text = `${recipe.title} ${recipe.description} ${recipe.ingredients.map(i => i.name).join(' ')}`;
      return await this.aiService.generateEmbedding(text);
    } catch (error) {
      this.logger.error('Error generating recipe embedding:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async findSimilarRecipes(recipeId: string, limit: number = 5): Promise<IRecipe[]> {
    try {
      const recipe = await this.getRecipe(recipeId);
      if (!recipe || !recipe.embedding) {
        throw new Error('Recipe not found or has no embedding');
      }

      // Find recipes with embeddings and calculate similarity
      const recipes = await Recipe.find({ embedding: { $exists: true } });
      const similarities = recipes.map(r => ({
        recipe: r,
        similarity: this.calculateCosineSimilarity(recipe.embedding!, r.embedding!),
      }));

      // Sort by similarity and return top matches
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(s => s.recipe);
    } catch (error) {
      this.logger.error('Error finding similar recipes:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private buildRecipePrompt(params: RecipeGenerationParams): string {
    const parts = ['Generate a freezer-friendly recipe with the following requirements:'];
    
    if (params.season) {
      parts.push(`- Season: ${params.season}`);
    }
    if (params.dietary && params.dietary.length > 0) {
      parts.push(`- Dietary requirements: ${params.dietary.join(', ')}`);
    }
    if (params.excludeIngredients && params.excludeIngredients.length > 0) {
      parts.push(`- Exclude ingredients: ${params.excludeIngredients.join(', ')}`);
    }
    if (params.preferredCuisine && params.preferredCuisine.length > 0) {
      parts.push(`- Preferred cuisine types: ${params.preferredCuisine.join(', ')}`);
    }
    if (params.servingSize) {
      parts.push(`- Serving size: ${params.servingSize} portions`);
    }

    return parts.join('\n');
  }

  private buildImagePrompt(recipe: IRecipe): string {
    return `Professional food photography of ${recipe.title}. The image should show ${
      recipe.description
    }. Style: Clean, well-lit, appetizing presentation on a neutral background. The photo should highlight the main ingredients: ${
      recipe.ingredients.map(i => i.name).join(', ')
    }. The image should be suitable for a cookbook or food blog.`;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}