// Mock dependencies **before** imports
jest.mock('../../models/recipe.js');
jest.mock('../../config.js', () => ({
        config: {
                openai: {
                        apiKey: 'test-api-key',
                        model: 'dall-e-3',
                },
                placeholderImageUrl: 'placeholder.jpg',
                redis: {
                        url: 'redis://localhost:6379',
                },
                queue: {
                        name: 'TestQueue',
                },
        },
}));

import { RecipeGenerator } from '../../services/recipeGenerator.js';
import { Recipe } from '../../models/recipe.js';
import { config } from '../../config.js';

// Mock fetch
global.fetch = jest.fn();

describe('Image Generation', () => {
	let recipeGenerator: RecipeGenerator;
	const mockRecipe = {
		_id: 'test-recipe-id',
		title: 'Test Recipe',
		description: 'Test Description',
		ingredients: [{ name: 'Test Ingredient', amount: '1', unit: 'cup' }],
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
		createdAt: new Date(),
		updatedAt: new Date(),
	};

        beforeEach(() => {
                jest.clearAllMocks();
                recipeGenerator = RecipeGenerator.getInstance();
                RecipeGenerator.imageCache.clear();
        });

	describe('RecipeGenerator Image Generation', () => {
		it('should generate images using Spoonacular when API key is available', async () => {
			process.env.SPOONACULAR_API_KEY = 'test-spoonacular-key';
			const mockSpoonacularResponse = {
				results: [
					{
						image: 'https://spoonacular.com/test-image.jpg',
					},
				],
			};
			const mockImageResponse = new ArrayBuffer(8);

			(global.fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockSpoonacularResponse),
				})
				.mockResolvedValueOnce({
					ok: true,
					arrayBuffer: () => Promise.resolve(mockImageResponse),
				});

			const images = await recipeGenerator.generateRecipeImages(mockRecipe);

			expect(images).toBeDefined();
			expect(images.main).toBeDefined();
			expect(images.thumbnail).toBeDefined();
			expect(images.additional).toBeInstanceOf(Array);
		});

		it('should fall back to DALL-E when Spoonacular fails', async () => {
			process.env.SPOONACULAR_API_KEY = 'test-spoonacular-key';
			const mockDalleResponse = {
				data: [
					{
						b64_json: 'test-base64-image',
					},
				],
			};

			(global.fetch as jest.Mock)
				.mockRejectedValueOnce(new Error('Spoonacular failed'))
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockDalleResponse),
				});

			const images = await recipeGenerator.generateRecipeImages(mockRecipe);

			expect(images).toBeDefined();
			expect(images.main).toContain('data:image/png;base64,test-base64-image');
			expect(images.thumbnail).toContain(
				'data:image/png;base64,test-base64-image'
			);
		});

		it('should use cached images when available', async () => {
			const cachedImages = {
				main: 'cached-main.jpg',
				thumbnail: 'cached-thumbnail.jpg',
				additional: [],
			};
			RecipeGenerator.imageCache.set(mockRecipe.title.toLowerCase().trim(), {
				images: cachedImages,
				timestamp: Date.now(),
			});

			const images = await recipeGenerator.generateRecipeImages(mockRecipe);

			expect(images).toEqual(cachedImages);
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('should return placeholder images when all generation attempts fail', async () => {
			process.env.SPOONACULAR_API_KEY = 'test-spoonacular-key';
			(global.fetch as jest.Mock)
				.mockRejectedValueOnce(new Error('Spoonacular failed'))
				.mockRejectedValueOnce(new Error('DALL-E failed'));

			const images = await recipeGenerator.generateRecipeImages(mockRecipe);

			expect(images).toEqual({
				main: config.placeholderImageUrl,
				thumbnail: config.placeholderImageUrl,
				additional: [],
			});
		});
	});
});
