// Mock dependencies **before** imports
jest.mock('../jobService');
jest.mock('../queueService');
jest.mock('../../config.js', () => ({
        config: {
                openai: {
                        apiKey: 'test-api-key',
                        model: 'gpt-3.5-turbo',
                },
                queue: {
                        name: 'TestQueue',
                },
        },
}));

import { RecipeGenerator } from '../recipeGenerator.js';
import { JobService } from '../jobService.js';
import { QueueService } from '../queueService.js';
import { IRecipe } from '../../models/recipe.js';
import {
        REQUIRED_FIELDS,
        ARRAY_FIELDS,
        NUMERIC_FIELDS,
        MIN_RECIPES_REQUIRED,
} from '../../constants/recipeFields.js';

describe('RecipeGenerator', () => {
	let recipeGenerator: RecipeGenerator;
	let mockJobService: jest.Mocked<JobService>;
	let mockQueueService: jest.Mocked<QueueService>;

        beforeEach(() => {
                // Clear all mocks
                jest.clearAllMocks();

		// Initialize mocks
		mockJobService = {
			getJob: jest.fn(),
			updateJobProgress: jest.fn(),
			createJob: jest.fn(),
			updateJobStatus: jest.fn(),
		} as any;

		mockQueueService = {
			enqueueJob: jest.fn(),
			processJob: jest.fn(),
		} as any;

		// Mock JobService and QueueService getInstance
		(JobService.getInstance as jest.Mock).mockReturnValue(mockJobService);
		(QueueService.getInstance as jest.Mock).mockReturnValue(mockQueueService);

		// Create instance
                recipeGenerator = RecipeGenerator.getInstance();
        });

        afterEach(() => {
                jest.restoreAllMocks();
        });

	describe('generateRecipes', () => {
		const mockSeason = 'summer';
		const mockJobId = 'test-job-id';

		it('should generate the required number of recipes', async () => {
			// Mock successful recipe generation
			const mockRecipe: Partial<IRecipe> = {
				title: 'Test Recipe',
				description: 'Test Description',
                                ingredients: [
                                        { name: 'Test Ingredient 1', amount: '1', unit: 'cup' },
                                        { name: 'Test Ingredient 2', amount: '2', unit: 'tbsp' },
                                ],
				prepInstructions: ['Test Prep'],
				prepTime: 30,
				cookTime: 30,
				servings: 4,
				tags: ['test'],
				storageTime: 30,
				containerSuggestions: ['Test Container'],
				defrostInstructions: ['Test Defrost'],
				cookingInstructions: ['Test Cooking'],
				servingInstructions: ['Test Serving'],
				season: mockSeason,
			};

			// Mock OpenAI response for recipe names
			(recipeGenerator as any).generateRecipeNames = jest
				.fn()
				.mockResolvedValue(Array(MIN_RECIPES_REQUIRED).fill('Test Recipe'));

			// Mock recipe generation
			(recipeGenerator as any).generateRecipeFromName = jest
				.fn()
				.mockResolvedValue(mockRecipe);

			// Mock job service
			mockJobService.getJob.mockResolvedValue({
				id: mockJobId,
				status: 'pending',
				type: 'recipe',
				progress: 0,
				total: 1,
				data: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);
			mockJobService.updateJobProgress.mockResolvedValue({
				id: mockJobId,
				status: 'pending',
				type: 'recipe',
				progress: 0,
				total: 1,
				data: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);

			const recipes = await recipeGenerator.generateRecipes(
				mockSeason,
				mockJobId
			);

			expect(recipes).toHaveLength(MIN_RECIPES_REQUIRED);
			expect(mockJobService.updateJobProgress).toHaveBeenCalledTimes(
				MIN_RECIPES_REQUIRED
			);
		});

		it('should throw error if insufficient recipe names are generated', async () => {
			// Mock insufficient recipe names
			(recipeGenerator as any).generateRecipeNames = jest
				.fn()
				.mockResolvedValue(Array(MIN_RECIPES_REQUIRED - 1).fill('Test Recipe'));

			await expect(
				recipeGenerator.generateRecipes(mockSeason, mockJobId)
			).rejects.toThrow(
				`Insufficient recipe names generated: ${MIN_RECIPES_REQUIRED - 1}. Expected at least ${MIN_RECIPES_REQUIRED}.`
			);
		});

		it('should handle recipe generation failures gracefully', async () => {
			// Mock recipe names
			(recipeGenerator as any).generateRecipeNames = jest
				.fn()
				.mockResolvedValue(Array(MIN_RECIPES_REQUIRED + 2).fill('Test Recipe'));

			// Mock some successful and some failed recipe generations
			let successCount = 0;
			(recipeGenerator as any).generateRecipeFromName = jest
				.fn()
				.mockImplementation(() => {
					if (successCount < MIN_RECIPES_REQUIRED) {
						successCount++;
						return Promise.resolve({
							title: 'Test Recipe',
							description: 'Test Description',
                                                        ingredients: [
                                                                { name: 'Test Ingredient 1', amount: '1', unit: 'cup' },
                                                                { name: 'Test Ingredient 2', amount: '2', unit: 'tbsp' },
                                                        ],
							prepInstructions: ['Test Prep'],
							prepTime: 30,
							cookTime: 30,
							servings: 4,
							tags: ['test'],
							storageTime: 30,
							containerSuggestions: ['Test Container'],
							defrostInstructions: ['Test Defrost'],
							cookingInstructions: ['Test Cooking'],
							servingInstructions: ['Test Serving'],
							season: mockSeason,
						});
					}
					return Promise.reject(new Error('Failed to generate recipe'));
				});

			mockJobService.getJob.mockResolvedValue({
				id: mockJobId,
				status: 'pending',
				type: 'recipe',
				progress: 0,
				total: 1,
				data: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);
			mockJobService.updateJobProgress.mockResolvedValue({
				id: mockJobId,
				status: 'pending',
				type: 'recipe',
				progress: 0,
				total: 1,
				data: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);

			const recipes = await recipeGenerator.generateRecipes(
				mockSeason,
				mockJobId
			);

			expect(recipes).toHaveLength(MIN_RECIPES_REQUIRED);
			expect(mockJobService.updateJobProgress).toHaveBeenCalled();
		});
	});

	describe('isRecipeComplete', () => {
		it('should return true for a complete recipe', () => {
			const completeRecipe: Partial<IRecipe> = {
				title: 'Test Recipe',
				description: 'Test Description',
                                ingredients: [
                                        { name: 'Test Ingredient 1', amount: '1', unit: 'cup' },
                                        { name: 'Test Ingredient 2', amount: '2', unit: 'tbsp' },
                                ],
				prepInstructions: ['Test Prep'],
				prepTime: 30,
				cookTime: 30,
				servings: 4,
				tags: ['test'],
				storageTime: 30,
				containerSuggestions: ['Test Container'],
				defrostInstructions: ['Test Defrost'],
				cookingInstructions: ['Test Cooking'],
				servingInstructions: ['Test Serving'],
				season: 'summer',
			};

			expect((recipeGenerator as any).isRecipeComplete(completeRecipe)).toBe(
				true
			);
		});

		it('should return false for an incomplete recipe', () => {
			const incompleteRecipe: Partial<IRecipe> = {
				title: 'Test Recipe',
				description: 'Test Description',
				// Missing required fields
			};

			expect((recipeGenerator as any).isRecipeComplete(incompleteRecipe)).toBe(
				false
			);
		});

		it('should validate numeric fields correctly', () => {
			const recipeWithInvalidNumbers: Partial<IRecipe> = {
				title: 'Test Recipe',
				description: 'Test Description',
                                ingredients: [
                                        { name: 'Test Ingredient 1', amount: '1', unit: 'cup' },
                                        { name: 'Test Ingredient 2', amount: '2', unit: 'tbsp' },
                                ],
				prepInstructions: ['Test Prep'],
				prepTime: -1, // Invalid prep time
				cookTime: 30,
				servings: 4,
				tags: ['test'],
				storageTime: 30,
				containerSuggestions: ['Test Container'],
				defrostInstructions: ['Test Defrost'],
				cookingInstructions: ['Test Cooking'],
				servingInstructions: ['Test Serving'],
				season: 'summer',
			};

			expect(
				(recipeGenerator as any).isRecipeComplete(recipeWithInvalidNumbers)
			).toBe(false);
		});

		it('should validate array fields correctly', () => {
			const recipeWithEmptyArrays: Partial<IRecipe> = {
				title: 'Test Recipe',
				description: 'Test Description',
				ingredients: [], // Empty ingredients array
				prepInstructions: ['Test Prep'],
				prepTime: 30,
				cookTime: 30,
				servings: 4,
				tags: ['test'],
				storageTime: 30,
				containerSuggestions: ['Test Container'],
				defrostInstructions: ['Test Defrost'],
				cookingInstructions: ['Test Cooking'],
				servingInstructions: ['Test Serving'],
				season: 'summer',
			};

			expect(
				(recipeGenerator as any).isRecipeComplete(recipeWithEmptyArrays)
			).toBe(false);
		});
	});

	describe('generateRecipe', () => {
		const mockSeason = 'summer';

		it('should generate a complete recipe', async () => {
			const mockRecipe = {
				title: 'Test Recipe',
				description: 'A freezer-friendly test recipe',
                                ingredients: [
                                        { name: 'Test Ingredient 1', amount: '1', unit: 'cup' },
                                        { name: 'Test Ingredient 2', amount: '2', unit: 'tbsp' },
                                ],
				prepInstructions: ['Test Prep'],
				prepTime: 30,
				cookTime: 30,
				servings: 4,
				tags: ['test'],
				storageTime: 30,
				containerSuggestions: ['Test Container'],
				defrostInstructions: ['Test Defrost'],
				cookingInstructions: ['Test Cooking'],
				servingInstructions: ['Test Serving'],
				season: mockSeason,
			};

			(recipeGenerator as any).callOpenAI = jest
				.fn()
				.mockResolvedValue(mockRecipe);
			(recipeGenerator as any).generateRecipeImages = jest
				.fn()
				.mockResolvedValue({
					main: 'test-image.jpg',
					thumbnail: 'test-thumbnail.jpg',
					additional: [],
				});

			const result = await recipeGenerator.generateRecipe(mockSeason);

			expect(result).toMatchObject(mockRecipe);
			expect(result.images).toBeDefined();
		});

		it('should throw error for incomplete recipe', async () => {
			const incompleteRecipe = {
				title: 'Test Recipe',
				// Missing required fields
			};

			(recipeGenerator as any).callOpenAI = jest
				.fn()
				.mockResolvedValue(incompleteRecipe);

			await expect(recipeGenerator.generateRecipe(mockSeason)).rejects.toThrow(
				'Missing required field'
			);
		});
	});

	describe('generateRecipeNames', () => {
		const mockSeason = 'summer';

		it('should generate recipe names', async () => {
			const mockNames = ['Chicken Stew', 'Beef Casserole'];
			(recipeGenerator as any).generateRecipeNames = jest
				.fn()
				.mockResolvedValue(mockNames);

			const result = await recipeGenerator.generateRecipeNames(mockSeason);

			expect(result).toEqual(mockNames);
		});
	});

	describe('generateFreezerFriendlyRecipes', () => {
		const mockSeason = 'summer';

		it('should generate freezer-friendly recipes', async () => {
                       const mockConcepts = ['chicken stew', 'beef casserole'];
                       const mockRecipes = [
                               {
                                       title: 'Chicken Stew',
                                       freezerFriendly: true,
                                       freezerFriendlyReason: 'test',
                               },
                               {
                                       title: 'Beef Casserole',
                                       freezerFriendly: true,
                                       freezerFriendlyReason: 'test',
                               },
                       ];

                        (recipeGenerator as any).generateFreezerFriendlyConcepts = jest
                                .fn()
                                .mockResolvedValue(mockConcepts);
                        (recipeGenerator as any).searchSpoonacularRecipes = jest
                                .fn()
                                .mockResolvedValue(mockRecipes);

                        jest.spyOn(recipeGenerator as any, 'classifyFreezerFriendly')
                                .mockResolvedValue({ freezerFriendly: true, reason: 'test' });

                        const result =
                                await recipeGenerator.generateFreezerFriendlyRecipes(mockSeason);

			expect(result).toEqual(mockRecipes);
		});
	});
});
