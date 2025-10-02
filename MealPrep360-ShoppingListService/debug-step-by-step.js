const { generateShoppingList } = require('./dist/services/shoppingListService');
const { normalizeIngredients } = require('./dist/services/unitConverter');

// Test with both chicken broth and beef broth
const mockRecipes = [
	{
		_id: '1',
		title: 'Chicken Recipe 1',
		ingredients: [
			{ name: 'chicken breasts', amount: 2, unit: 'piece', category: 'Meat' },
			{ name: 'chicken broth', amount: 1, unit: 'cup', category: 'Pantry' },
		],
	},
	{
		_id: '2',
		title: 'Chicken Recipe 2',
		ingredients: [
			{
				name: 'boneless chicken breasts',
				amount: 1,
				unit: 'piece',
				category: 'Meat',
			},
			{ name: 'beef broth', amount: 0.5, unit: 'cup', category: 'Pantry' },
		],
	},
];

const mockMealPlan = [
	{ recipeId: '1', servings: 1 },
	{ recipeId: '2', servings: 1 },
];

async function debugStepByStep() {
	try {
		console.log('=== Step-by-step debugging ===\n');

		// Step 1: Extract ingredients manually
		console.log('Step 1: Extract ingredients from recipes');
		const allIngredients = mockRecipes.flatMap((recipe) => {
			const mealPlanItem = mockMealPlan.find(
				(item) => item.recipeId === recipe._id
			);
			if (!mealPlanItem) return [];

			return recipe.ingredients.map((ingredient) => {
				const amount = Number(ingredient.amount);
				const servingsAmount = amount * mealPlanItem.servings;

				return {
					name: ingredient.name,
					amount: servingsAmount,
					unit: ingredient.unit,
					category: ingredient.category,
				};
			});
		});

		console.log('Extracted ingredients:');
		allIngredients.forEach((ingredient, index) => {
			console.log(
				`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (${ingredient.category})`
			);
		});

		// Step 2: Normalize ingredients
		console.log('\nStep 2: Normalize ingredients');
		const normalizedIngredients = normalizeIngredients(allIngredients);
		console.log('Normalized ingredients:');
		normalizedIngredients.forEach((ingredient, index) => {
			console.log(
				`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (normalized: ${ingredient.normalizedAmount} ${ingredient.normalizedUnit})`
			);
		});

		// Step 3: Test the findSimilarIngredient function
		console.log('\nStep 3: Test ingredient combination logic');
		const {
			findSimilarIngredient,
		} = require('./dist/services/shoppingListService');

		// Create a map to simulate the combination process
		const combinedIngredients = new Map();

		for (const ingredient of normalizedIngredients) {
			console.log(`\nProcessing: ${ingredient.name}`);

			// Find similar ingredient
			const existingKey = findSimilarIngredient(
				combinedIngredients,
				ingredient
			);
			console.log(
				`  - Similar ingredient found: ${existingKey ? 'YES' : 'NO'}`
			);

			if (existingKey) {
				const existing = combinedIngredients.get(existingKey);
				console.log(`  - Existing ingredient: ${existing.name}`);
				console.log(
					`  - Combining: ${existing.amount} + ${ingredient.amount} = ${existing.amount + ingredient.amount}`
				);

				existing.amount += ingredient.amount;
				existing.normalizedAmount += ingredient.normalizedAmount;
			} else {
				const key = `${ingredient.name.toLowerCase()}-${ingredient.category}`;
				console.log(`  - Adding new ingredient with key: ${key}`);
				combinedIngredients.set(key, { ...ingredient });
			}
		}

		console.log('\nFinal combined ingredients:');
		combinedIngredients.forEach((ingredient, key) => {
			console.log(
				`- ${key}: ${ingredient.name} - ${ingredient.amount} ${ingredient.unit}`
			);
		});

		// Step 4: Run the full generateShoppingList function
		console.log('\nStep 4: Full generateShoppingList result');
		const shoppingList = await generateShoppingList(mockRecipes, mockMealPlan);
		console.log('Final shopping list:');
		shoppingList.forEach((ingredient, index) => {
			console.log(
				`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (${ingredient.category})`
			);
		});
	} catch (error) {
		console.error('Error in step-by-step debugging:', error);
	}
}

debugStepByStep();
