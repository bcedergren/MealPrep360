const { generateShoppingList } = require('./dist/services/shoppingListService');

async function testDirectService() {
	try {
		console.log('🧪 Testing shopping list service directly...');

		// Test data that matches the image scenario
		const recipes = [
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
			{
				_id: '3',
				title: 'Chicken Recipe 3',
				ingredients: [
					{
						name: 'boneless, skinless chicken breasts',
						amount: 1,
						unit: 'piece',
						category: 'Meat',
					},
					{ name: 'shrimp', amount: 1, unit: 'g', category: 'Seafood' },
				],
			},
			{
				_id: '4',
				title: 'Beef Recipe',
				ingredients: [
					{ name: 'Beef chuck', amount: 1, unit: 'lb', category: 'Meat' },
					{ name: 'Beef broth', amount: 0.5, unit: 'cup', category: 'Pantry' },
				],
			},
		];

		const mealPlan = [
			{ recipeId: '1', servings: 1 },
			{ recipeId: '2', servings: 1 },
			{ recipeId: '3', servings: 1 },
			{ recipeId: '4', servings: 1 },
		];

		console.log('📋 Testing with recipes:');
		recipes.forEach((recipe, index) => {
			console.log(`${index + 1}. ${recipe.title}`);
			recipe.ingredients.forEach(ing => {
				console.log(`   - ${ing.name}: ${ing.amount} ${ing.unit} (${ing.category})`);
			});
		});

		const shoppingList = await generateShoppingList(recipes, mealPlan);

		console.log('\n✅ Generated shopping list:');
		shoppingList.forEach((ingredient, index) => {
			console.log(
				`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (${ing.category})`
			);
		});

		// Check if chicken ingredients were combined
		const chickenIngredients = shoppingList.filter((ingredient) =>
			ingredient.name.toLowerCase().includes('chicken')
		);

		console.log(`\n🐔 Chicken ingredients found: ${chickenIngredients.length}`);
		chickenIngredients.forEach((ingredient) => {
			console.log(
				`- ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`
			);
		});

		// Check if broth ingredients were combined
		const brothIngredients = shoppingList.filter((ingredient) =>
			ingredient.name.toLowerCase().includes('broth')
		);

		console.log(`\n🥣 Broth ingredients found: ${brothIngredients.length}`);
		brothIngredients.forEach((ingredient) => {
			console.log(
				`- ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`
			);
		});

		// Check shrimp
		const shrimpIngredients = shoppingList.filter((ingredient) =>
			ingredient.name.toLowerCase().includes('shrimp')
		);

		console.log(`\n🦐 Shrimp ingredients found: ${shrimpIngredients.length}`);
		shrimpIngredients.forEach((ingredient) => {
			console.log(
				`- ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`
			);
		});

		// Summary of fixes
		console.log('\n📊 Summary of fixes:');
		console.log('✅ Chicken breasts should be combined into one item');
		console.log('✅ Broth should be categorized as "Pantry"');
		console.log('✅ Shrimp should show "1 g" (not "1 grams")');
		
		// Check if fixes are working
		const chickenBreastCount = chickenIngredients.filter(ingredient => ingredient.name.toLowerCase().includes('chicken breast')).length;
		const brothPantryCount = brothIngredients.filter(ingredient => ingredient.category === 'Pantry').length;
		const shrimpCorrectUnit = shrimpIngredients.filter(ingredient => ingredient.unit === 'g').length;
		
		console.log(`\n🔍 Fix verification:`);
		console.log(`- Chicken breast combination: ${chickenBreastCount === 1 ? '✅ Working' : '❌ Not working'}`);
		console.log(`- Broth in Pantry category: ${brothPantryCount === brothIngredients.length ? '✅ Working' : '❌ Not working'}`);
		console.log(`- Shrimp with correct unit: ${shrimpCorrectUnit === shrimpIngredients.length ? '✅ Working' : '❌ Not working'}`);

	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

testDirectService(); 