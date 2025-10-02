import { IRecipe } from '../../models/recipe';
import { 
  EnhancedRecipe, 
  CuisineType, 
  RecipeCategory, 
  DifficultyLevel, 
  DietaryFlag,
  AllergenInfo,
  DetailedNutrition,
  CostEstimate,
  SeasonalInfo,
  SkillRequirement
} from '../../models/enhancedRecipe';
import { ILogger } from '../interfaces/ILogger';
import { IAIService } from '../interfaces/IAIService';

export class RecipeCategorizationService {
  private logger: ILogger;
  private aiService: IAIService;

  constructor(logger: ILogger, aiService: IAIService) {
    this.logger = logger;
    this.aiService = aiService;
  }

  /**
   * Categorize a basic recipe into an enhanced recipe with all metadata
   */
  async categorizeRecipe(recipe: IRecipe): Promise<EnhancedRecipe> {
    try {
      this.logger.info(`Categorizing recipe: ${recipe.title}`);

      // Extract basic categorization
      const cuisine = await this.detectCuisine(recipe);
      const category = await this.detectCategory(recipe);
      const difficulty = await this.assessDifficulty(recipe);
      const dietaryFlags = await this.detectDietaryFlags(recipe);
      const tags = await this.generateTags(recipe);

      // Analyze nutrition
      const nutrition = await this.analyzeNutrition(recipe);

      // Detect allergens
      const allergenInfo = await this.detectAllergens(recipe);

      // Estimate cost
      const estimatedCost = await this.estimateCost(recipe);

      // Assess seasonal availability
      const seasonalAvailability = await this.assessSeasonalAvailability(recipe);

      // Generate cooking steps
      const cookingSteps = await this.generateCookingSteps(recipe);

      // Assess skill requirements
      const skillRequirements = await this.assessSkillRequirements(recipe, difficulty);

      // Create enhanced recipe
      const enhancedRecipe: EnhancedRecipe = {
        ...recipe,
        cuisine,
        category,
        subcategory: await this.generateSubcategory(recipe, category),
        tags,
        nutrition,
        dietaryFlags,
        allergenInfo,
        difficulty,
        prepTime: await this.estimatePrepTime(recipe),
        cookTime: await this.estimateCookTime(recipe),
        totalTime: await this.estimateTotalTime(recipe),
        estimatedCost,
        seasonalAvailability,
        aiTags: await this.generateAITags(recipe),
        similarityScores: [],
        recommendationScore: 0,
        cookingSteps,
        skillRequirements,
        equipment: await this.extractEquipment(recipe),
        tips: await this.generateTips(recipe),
        variations: await this.generateVariations(recipe),
        substitutions: await this.generateSubstitutions(recipe),
        viewCount: 0,
        ratingCount: 0,
        averageRating: 0,
        completionRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        isVerified: false,
        source: 'ai_generated',
        author: 'MealPrep360 AI'
      };

      this.logger.info(`Successfully categorized recipe: ${recipe.title}`);
      return enhancedRecipe;

    } catch (error) {
      this.logger.error('Error categorizing recipe:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get recipes by cuisine type
   */
  async getCuisineRecipes(cuisine: CuisineType): Promise<EnhancedRecipe[]> {
    // This would typically query the database
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get recipes by dietary restrictions
   */
  async getDietaryRecipes(restrictions: DietaryFlag[]): Promise<EnhancedRecipe[]> {
    // This would typically query the database
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get recipes by category
   */
  async getCategoryRecipes(category: RecipeCategory): Promise<EnhancedRecipe[]> {
    // This would typically query the database
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Detect cuisine type from recipe
   */
  private async detectCuisine(recipe: IRecipe): Promise<CuisineType> {
    const prompt = `Analyze this recipe and determine its cuisine type. Return only the cuisine type from this list: ${Object.values(CuisineType).join(', ')}.

Recipe Title: ${recipe.title}
Description: ${recipe.description}
Ingredients: ${recipe.ingredients.map(i => i.name).join(', ')}

Cuisine:`;

    try {
      const response = await this.aiService.generateCompletion({
        systemPrompt: 'You are a culinary expert specializing in cuisine classification.',
        prompt,
        temperature: 0.3
      });

      const cuisine = response.content.trim().toLowerCase();
      return Object.values(CuisineType).find(c => c === cuisine) || CuisineType.OTHER;
    } catch (error) {
      this.logger.warn('Failed to detect cuisine, defaulting to OTHER');
      return CuisineType.OTHER;
    }
  }

  /**
   * Detect recipe category
   */
  private async detectCategory(recipe: IRecipe): Promise<RecipeCategory> {
    const prompt = `Analyze this recipe and determine its category. Return only the category from this list: ${Object.values(RecipeCategory).join(', ')}.

Recipe Title: ${recipe.title}
Description: ${recipe.description}
Ingredients: ${recipe.ingredients.map(i => i.name).join(', ')}

Category:`;

    try {
      const response = await this.aiService.generateCompletion({
        systemPrompt: 'You are a culinary expert specializing in recipe categorization.',
        prompt,
        temperature: 0.3
      });

      const category = response.content.trim().toLowerCase();
      return Object.values(RecipeCategory).find(c => c === category) || RecipeCategory.MAIN_COURSE;
    } catch (error) {
      this.logger.warn('Failed to detect category, defaulting to MAIN_COURSE');
      return RecipeCategory.MAIN_COURSE;
    }
  }

  /**
   * Assess recipe difficulty
   */
  private async assessDifficulty(recipe: IRecipe): Promise<DifficultyLevel> {
    const prompt = `Analyze this recipe and assess its difficulty level. Consider:
- Number of ingredients
- Complexity of techniques
- Cooking time
- Required equipment
- Skill level needed

Return only the difficulty level from: ${Object.values(DifficultyLevel).join(', ')}

Recipe Title: ${recipe.title}
Instructions: ${recipe.prepInstructions.join(' ')}
Ingredients: ${recipe.ingredients.map(i => i.name).join(', ')}

Difficulty:`;

    try {
      const response = await this.aiService.generateCompletion({
        systemPrompt: 'You are a culinary expert specializing in recipe difficulty assessment.',
        prompt,
        temperature: 0.3
      });

      const difficulty = response.content.trim().toLowerCase();
      return Object.values(DifficultyLevel).find(d => d === difficulty) || DifficultyLevel.INTERMEDIATE;
    } catch (error) {
      this.logger.warn('Failed to assess difficulty, defaulting to INTERMEDIATE');
      return DifficultyLevel.INTERMEDIATE;
    }
  }

  /**
   * Detect dietary flags
   */
  private async detectDietaryFlags(recipe: IRecipe): Promise<DietaryFlag[]> {
    const prompt = `Analyze this recipe and identify all applicable dietary flags. Return only the flags from this list: ${Object.values(DietaryFlag).join(', ')}.

Recipe Title: ${recipe.title}
Ingredients: ${recipe.ingredients.map(i => i.name).join(', ')}

Dietary Flags (comma-separated):`;

    try {
      const response = await this.aiService.generateCompletion({
        systemPrompt: 'You are a nutrition expert specializing in dietary restriction identification.',
        prompt,
        temperature: 0.3
      });

      const flags = response.content.trim().split(',').map(f => f.trim().toLowerCase());
      return flags.filter(flag => Object.values(DietaryFlag).includes(flag as DietaryFlag)) as DietaryFlag[];
    } catch (error) {
      this.logger.warn('Failed to detect dietary flags, returning empty array');
      return [];
    }
  }

  /**
   * Generate tags for the recipe
   */
  private async generateTags(recipe: IRecipe): Promise<string[]> {
    const prompt = `Generate 5-10 relevant tags for this recipe. Focus on:
- Cooking methods
- Key ingredients
- Flavor profiles
- Occasions
- Health aspects

Recipe Title: ${recipe.title}
Description: ${recipe.description}
Ingredients: ${recipe.ingredients.map(i => i.name).join(', ')}

Tags (comma-separated):`;

    try {
      const response = await this.aiService.generateCompletion({
        systemPrompt: 'You are a culinary expert specializing in recipe tagging.',
        prompt,
        temperature: 0.5
      });

      return response.content.trim().split(',').map(tag => tag.trim().toLowerCase());
    } catch (error) {
      this.logger.warn('Failed to generate tags, returning empty array');
      return [];
    }
  }

  /**
   * Analyze nutrition information
   */
  private async analyzeNutrition(recipe: IRecipe): Promise<DetailedNutrition> {
    // This is a simplified nutrition analysis
    // In a real implementation, you would use a comprehensive nutrition database
    const baseNutrition = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
      saturatedFat: 0,
      transFat: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 0,
      iron: 0,
      potassium: 0,
      magnesium: 0,
      zinc: 0,
      omega3: 0,
      omega6: 0
    };

    // Estimate basic nutrition based on ingredients
    for (const ingredient of recipe.ingredients) {
      // This would typically look up nutrition data for each ingredient
      // For now, we'll use placeholder values
      baseNutrition.calories += 50; // Placeholder
      baseNutrition.protein += 2; // Placeholder
      baseNutrition.carbohydrates += 8; // Placeholder
      baseNutrition.fat += 1; // Placeholder
    }

    return baseNutrition;
  }

  /**
   * Detect allergens in the recipe
   */
  private async detectAllergens(recipe: IRecipe): Promise<AllergenInfo> {
    const commonAllergens = [
      'milk', 'dairy', 'cheese', 'butter', 'cream',
      'eggs', 'egg',
      'nuts', 'almonds', 'walnuts', 'peanuts', 'cashews',
      'soy', 'soybean', 'tofu', 'miso',
      'wheat', 'gluten', 'flour', 'bread',
      'fish', 'shellfish', 'shrimp', 'crab', 'lobster',
      'sesame', 'mustard'
    ];

    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());
    const contains = commonAllergens.filter(allergen => 
      ingredients.some(ingredient => ingredient.includes(allergen))
    );

    return {
      contains,
      mayContain: [],
      freeFrom: commonAllergens.filter(allergen => !contains.includes(allergen))
    };
  }

  /**
   * Estimate recipe cost
   */
  private async estimateCost(recipe: IRecipe): Promise<CostEstimate> {
    // This is a simplified cost estimation
    // In a real implementation, you would use current market prices
    const baseCostPerServing = 3.50; // Base cost per serving
    const ingredientCount = recipe.ingredients.length;
    const complexityMultiplier = Math.min(1 + (ingredientCount * 0.1), 2.0);
    
    const perServing = baseCostPerServing * complexityMultiplier;
    const total = perServing * recipe.servings;

    return {
      perServing,
      total,
      currency: 'USD',
      breakdown: {
        ingredients: {},
        labor: total * 0.3,
        overhead: total * 0.1
      }
    };
  }

  /**
   * Assess seasonal availability
   */
  private async assessSeasonalAvailability(recipe: IRecipe): Promise<SeasonalInfo> {
    // This is a simplified seasonal assessment
    // In a real implementation, you would analyze ingredient seasonality
    return {
      isSeasonal: false,
      peakSeason: ['spring', 'summer'],
      availableSeasons: ['spring', 'summer', 'fall', 'winter'],
      bestTimeToCook: 'anytime'
    };
  }

  /**
   * Generate cooking steps
   */
  private async generateCookingSteps(recipe: IRecipe): Promise<any[]> {
    // Convert existing instructions to structured cooking steps
    return recipe.prepInstructions.map((instruction: string, index: number) => ({
      stepNumber: index + 1,
      instruction,
      duration: 5, // Placeholder duration in minutes
      equipment: [],
      ingredients: [],
      tips: []
    }));
  }

  /**
   * Assess skill requirements
   */
  private async assessSkillRequirements(recipe: IRecipe, difficulty: DifficultyLevel): Promise<SkillRequirement[]> {
    const requirements: SkillRequirement[] = [];

    if (difficulty === DifficultyLevel.BEGINNER) {
      requirements.push({
        skill: 'Basic knife skills',
        level: DifficultyLevel.BEGINNER,
        description: 'Ability to chop vegetables safely'
      });
    } else if (difficulty === DifficultyLevel.INTERMEDIATE) {
      requirements.push({
        skill: 'Knife skills',
        level: DifficultyLevel.INTERMEDIATE,
        description: 'Proficient chopping and dicing techniques'
      });
    }

    return requirements;
  }

  /**
   * Generate subcategory
   */
  private async generateSubcategory(recipe: IRecipe, category: RecipeCategory): Promise<string> {
    // Generate subcategory based on recipe content
    const subcategories: { [key: string]: string[] } = {
      [RecipeCategory.MAIN_COURSE]: ['pasta', 'rice', 'meat', 'seafood', 'vegetarian'],
      [RecipeCategory.SOUP]: ['broth', 'cream', 'chunky', 'pureed'],
      [RecipeCategory.SALAD]: ['green', 'grain', 'protein', 'fruit'],
      [RecipeCategory.DESSERT]: ['cake', 'pie', 'cookie', 'ice cream', 'pudding']
    };

    const options = subcategories[category] || ['general'];
    return options[0]; // Simplified - would use AI in real implementation
  }

  /**
   * Estimate prep time
   */
  private async estimatePrepTime(recipe: IRecipe): Promise<number> {
    // Simple estimation based on ingredient count and complexity
    const baseTime = 15; // Base prep time in minutes
    const ingredientTime = recipe.ingredients.length * 2;
    return Math.min(baseTime + ingredientTime, 60);
  }

  /**
   * Estimate cook time
   */
  private async estimateCookTime(recipe: IRecipe): Promise<number> {
    // Simple estimation based on cooking methods
    const baseTime = 20; // Base cook time in minutes
    const instructionTime = recipe.prepInstructions.length * 3;
    return Math.min(baseTime + instructionTime, 120);
  }

  /**
   * Estimate total time
   */
  private async estimateTotalTime(recipe: IRecipe): Promise<number> {
    const prepTime = await this.estimatePrepTime(recipe);
    const cookTime = await this.estimateCookTime(recipe);
    return prepTime + cookTime;
  }

  /**
   * Generate AI tags
   */
  private async generateAITags(recipe: IRecipe): Promise<string[]> {
    // This would use AI to generate more sophisticated tags
    return ['ai_generated', 'healthy', 'homemade'];
  }

  /**
   * Extract equipment needed
   */
  private async extractEquipment(recipe: IRecipe): Promise<string[]> {
    // This would analyze instructions to extract required equipment
    return ['knife', 'cutting board', 'pan', 'stove'];
  }

  /**
   * Generate cooking tips
   */
  private async generateTips(recipe: IRecipe): Promise<string[]> {
    // This would generate helpful cooking tips
    return ['Taste and adjust seasoning as needed', 'Don\'t overcook the vegetables'];
  }

  /**
   * Generate recipe variations
   */
  private async generateVariations(recipe: IRecipe): Promise<string[]> {
    // This would suggest recipe variations
    return ['Add more vegetables', 'Use different protein', 'Adjust spice level'];
  }

  /**
   * Generate ingredient substitutions
   */
  private async generateSubstitutions(recipe: IRecipe): Promise<{ [key: string]: string[] }> {
    // This would suggest ingredient substitutions
    return {
      'butter': ['olive oil', 'coconut oil', 'ghee'],
      'milk': ['almond milk', 'soy milk', 'oat milk']
    };
  }
}
