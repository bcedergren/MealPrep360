import { RecipeService } from '../services/recipeService';
import { Recipe as RecipeModel } from '../models/Recipe';

jest.mock('../models/Recipe');

describe('RecipeService', () => {
	const service = new RecipeService();
	const mockRecipe = {
		_id: { toString: () => '1' },
		id: '1',
		name: 'Test Recipe',
		ingredients: [
			{ name: 'Flour', amount: 100, unit: 'g', category: 'Pantry' },
		],
		toObject: function () {
			return this;
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('getRecipe returns a recipe', async () => {
		(RecipeModel.findOne as any).mockResolvedValueOnce(mockRecipe);
		const recipe = await service.getRecipe('1');
		expect(recipe.name).toBe('Test Recipe');
		expect(recipe.ingredients[0].name).toBe('Flour');
	});

	it('getRecipe throws if not found', async () => {
		(RecipeModel.findOne as any).mockResolvedValueOnce(null);
		await expect(service.getRecipe('2')).rejects.toThrow('Recipe not found: 2');
	});

	it('getRecipes returns multiple recipes', async () => {
		(RecipeModel.find as any).mockResolvedValueOnce([mockRecipe]);
		const recipes = await service.getRecipes(['1']);
		expect(recipes).toHaveLength(1);
		expect(recipes[0].name).toBe('Test Recipe');
	});

	it('getRecipes throws if any not found', async () => {
		(RecipeModel.find as any).mockResolvedValueOnce([]);
		await expect(service.getRecipes(['1'])).rejects.toThrow(
			'Recipes not found: 1'
		);
	});

	it('getRecipesByIds returns recipes by _id', async () => {
		(RecipeModel.find as any).mockResolvedValueOnce([mockRecipe]);
		const recipes = await service.getRecipesByIds(['1']);
		expect(recipes[0].name).toBe('Test Recipe');
	});
});
