import { Recipe, MealPlanItem } from '../types';
import { ShoppingListService } from '../services/shoppingListService';

describe('ShoppingListService', () => {
	const mockRecipes: Recipe[] = [
		{
			id: '1',
			name: 'Pasta Salad',
			ingredients: [
				{ name: 'Pasta', quantity: 200, unit: 'g', category: 'Pantry' },
				{ name: 'Tomatoes', quantity: 2, unit: 'whole', category: 'Produce' },
				{ name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
			],
		},
		{
			id: '2',
			name: 'Greek Salad',
			ingredients: [
				{ name: 'Cucumber', quantity: 1, unit: 'whole', category: 'Produce' },
				{ name: 'Tomatoes', quantity: 3, unit: 'whole', category: 'Produce' },
				{ name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'Pantry' },
			],
		},
	];

	const mockMealPlan: MealPlanItem[] = [
		{ recipeId: '1', servings: 2 },
		{ recipeId: '2', servings: 1 },
	];

	it('should combine ingredients from multiple recipes', () => {
		const shoppingList = ShoppingListService.generateShoppingList(
			mockRecipes,
			mockMealPlan
		);

		// Check if ingredients are combined correctly
		const tomatoes = shoppingList.find((item) => item.name === 'Tomatoes');
		expect(tomatoes?.quantity).toBe(7); // 2 * 2 + 3 * 1

		const oliveOil = shoppingList.find((item) => item.name === 'Olive Oil');
		expect(oliveOil?.quantity).toBe(5); // 2 * 2 + 1 * 1
	});

	it('should filter out pantry exclusions', () => {
		const pantryExclusions = ['olive oil'];
		const shoppingList = ShoppingListService.generateShoppingList(
			mockRecipes,
			mockMealPlan,
			pantryExclusions
		);

		// Check if olive oil is excluded
		const oliveOil = shoppingList.find((item) => item.name === 'Olive Oil');
		expect(oliveOil).toBeUndefined();
	});

	it('should sort ingredients by category', () => {
		const shoppingList = ShoppingListService.generateShoppingList(
			mockRecipes,
			mockMealPlan
		);

		// Check if categories are in correct order
		const categories = shoppingList.map((item) => item.category);
		expect(categories).toEqual(['Produce', 'Produce', 'Pantry']);
	});

	it('should normalize units where possible', () => {
		const recipes: Recipe[] = [
			{
				id: '3',
				name: 'Test Recipe',
				ingredients: [
					{ name: 'Flour', quantity: 500, unit: 'g', category: 'Pantry' },
					{ name: 'Flour', quantity: 0.5, unit: 'kg', category: 'Pantry' },
				],
			},
		];

		const mealPlan: MealPlanItem[] = [{ recipeId: '3', servings: 1 }];
		const shoppingList = ShoppingListService.generateShoppingList(
			recipes,
			mealPlan
		);

		// Check if flour quantities are combined and normalized
		const flour = shoppingList.find((item) => item.name === 'Flour');
		expect(flour?.quantity).toBe(1); // 500g + 0.5kg = 1kg
		expect(flour?.unit).toBe('kg');
	});

	it('should normalize plural units to singular', () => {
		const recipes: Recipe[] = [
			{
				id: '4',
				name: 'Test Recipe',
				ingredients: [
					{ name: 'Apple', quantity: 2, unit: 'pieces', category: 'Produce' },
					{ name: 'Orange', quantity: 3, unit: 'pcs', category: 'Produce' },
					{ name: 'Garlic', quantity: 2, unit: 'cloves', category: 'Produce' },
				],
			},
		];

		const mealPlan: MealPlanItem[] = [{ recipeId: '4', servings: 1 }];
		const shoppingList = ShoppingListService.generateShoppingList(
			recipes,
			mealPlan
		);

		// Check if units are normalized to singular form
		const apple = shoppingList.find((item) => item.name === 'Apple');
		expect(apple?.unit).toBe('piece');

		const orange = shoppingList.find((item) => item.name === 'Orange');
		expect(orange?.unit).toBe('piece');

		const garlic = shoppingList.find((item) => item.name === 'Garlic');
		expect(garlic?.unit).toBe('piece');
	});

	it('should normalize volume units correctly', () => {
		const recipes: Recipe[] = [
			{
				id: '5',
				name: 'Test Recipe',
				ingredients: [
					{ name: 'Water', quantity: 1, unit: 'liter', category: 'Pantry' },
					{ name: 'Oil', quantity: 2, unit: 'tablespoons', category: 'Pantry' },
					{
						name: 'Vanilla',
						quantity: 1,
						unit: 'teaspoons',
						category: 'Pantry',
					},
				],
			},
		];

		const mealPlan: MealPlanItem[] = [{ recipeId: '5', servings: 1 }];
		const shoppingList = ShoppingListService.generateShoppingList(
			recipes,
			mealPlan
		);

		// Check if volume units are normalized correctly
		const water = shoppingList.find((item) => item.name === 'Water');
		expect(water?.unit).toBe('l');

		const oil = shoppingList.find((item) => item.name === 'Oil');
		expect(oil?.unit).toBe('tbsp');

		const vanilla = shoppingList.find((item) => item.name === 'Vanilla');
		expect(vanilla?.unit).toBe('tsp');
	});

	it('should normalize weight units correctly', () => {
		const recipes: Recipe[] = [
			{
				id: '6',
				name: 'Test Recipe',
				ingredients: [
					{ name: 'Sugar', quantity: 500, unit: 'grams', category: 'Pantry' },
					{ name: 'Butter', quantity: 1, unit: 'pounds', category: 'Dairy' },
					{ name: 'Cheese', quantity: 8, unit: 'ounces', category: 'Dairy' },
				],
			},
		];

		const mealPlan: MealPlanItem[] = [{ recipeId: '6', servings: 1 }];
		const shoppingList = ShoppingListService.generateShoppingList(
			recipes,
			mealPlan
		);

		// Check if weight units are normalized correctly
		const sugar = shoppingList.find((item) => item.name === 'Sugar');
		expect(sugar?.unit).toBe('g');

		const butter = shoppingList.find((item) => item.name === 'Butter');
		expect(butter?.unit).toBe('lb');

		const cheese = shoppingList.find((item) => item.name === 'Cheese');
		expect(cheese?.unit).toBe('oz');
	});

	it('should normalize container units to pieces', () => {
		const recipes: Recipe[] = [
			{
				id: '7',
				name: 'Test Recipe',
				ingredients: [
					{ name: 'Beans', quantity: 2, unit: 'cans', category: 'Pantry' },
					{ name: 'Sauce', quantity: 1, unit: 'jar', category: 'Pantry' },
					{ name: 'Pasta', quantity: 3, unit: 'boxes', category: 'Pantry' },
				],
			},
		];

		const mealPlan: MealPlanItem[] = [{ recipeId: '7', servings: 1 }];
		const shoppingList = ShoppingListService.generateShoppingList(
			recipes,
			mealPlan
		);

		// Check if container units are normalized to pieces
		const beans = shoppingList.find((item) => item.name === 'Beans');
		expect(beans?.unit).toBe('piece');

		const sauce = shoppingList.find((item) => item.name === 'Sauce');
		expect(sauce?.unit).toBe('piece');

		const pasta = shoppingList.find((item) => item.name === 'Pasta');
		expect(pasta?.unit).toBe('piece');
	});

	it('should handle special small amounts correctly', () => {
		const recipes: Recipe[] = [
			{
				id: '8',
				name: 'Test Recipe',
				ingredients: [
					{ name: 'Salt', quantity: 2, unit: 'pinches', category: 'Pantry' },
					{ name: 'Pepper', quantity: 1, unit: 'dash', category: 'Pantry' },
					{ name: 'Spice', quantity: 1, unit: 'sprinkle', category: 'Pantry' },
				],
			},
		];

		const mealPlan: MealPlanItem[] = [{ recipeId: '8', servings: 1 }];
		const shoppingList = ShoppingListService.generateShoppingList(
			recipes,
			mealPlan
		);

		// Check if special small amounts are normalized correctly
		const salt = shoppingList.find((item) => item.name === 'Salt');
		expect(salt?.unit).toBe('pinch');

		const pepper = shoppingList.find((item) => item.name === 'Pepper');
		expect(pepper?.unit).toBe('pinch');

		const spice = shoppingList.find((item) => item.name === 'Spice');
		expect(spice?.unit).toBe('pinch');
	});
});
