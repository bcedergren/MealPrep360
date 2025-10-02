import 'dotenv/config';
console.log('🚀 Starting MealPrep360 Service Test Script...');

process.on('unhandledRejection', (reason, promise) => {
	console.error('❌ Unhandled Rejection:', reason);
});

try {
	const { MealPrep360Service } = await import(
		'./dist/services/mealPrep360Service.js'
	);

	async function testMealPrep360Service() {
		console.log('🧪 Testing MealPrep360 Service (OpenAI API)...\n');

		try {
			const service = MealPrep360Service.getInstance();

			// Test 1: Basic Recipe Generation
			console.log('🔍 Test 1: Basic Recipe Generation');
			await testRecipeGeneration(service);

			// Test 2: Recipe Name Generation
			console.log('\n🔍 Test 2: Recipe Name Generation');
			await testRecipeNames(service);

			// Test 3: Image Generation Prompt
			console.log('\n🔍 Test 3: Image Generation Prompt');
			await testImagePrompt(service);

			// Test 4: Seasonal Recipe with Specific Requirements
			console.log('\n🔍 Test 4: Seasonal Recipe with Specific Requirements');
			await testSeasonalRecipe(service);
		} catch (error) {
			console.log('❌ Test failed:', error.message);
		}
	}

	async function testRecipeGeneration(service) {
		try {
			const recipe = await service.generateRecipe({
				season: 'winter',
			});

			console.log('✅ Recipe generation successful');
			console.log('📝 Recipe title:', recipe.title);
			console.log('📝 Season:', recipe.season);
			console.log(
				'📝 Description length:',
				recipe.description.length,
				'characters'
			);
			console.log('📝 Number of ingredients:', recipe.ingredients.length);
			console.log('📝 Prep time:', recipe.prepTime, 'minutes');
			console.log('📝 Cook time:', recipe.cookTime, 'minutes');
			console.log('📝 Servings:', recipe.servings);
			console.log('📝 Storage time:', recipe.storageTime, 'days');

			// Validate required fields
			const requiredFields = [
				'title',
				'description',
				'ingredients',
				'prepInstructions',
				'prepTime',
				'cookTime',
				'servings',
				'tags',
				'storageTime',
				'containerSuggestions',
				'defrostInstructions',
				'cookingInstructions',
				'servingInstructions',
				'allergenInfo',
				'dietaryInfo',
				'season',
			];

			const missingFields = requiredFields.filter((field) => !recipe[field]);
			if (missingFields.length > 0) {
				console.log('❌ Missing required fields:', missingFields.join(', '));
			} else {
				console.log('✅ All required fields present');
			}

			// Check specific validations
			if (recipe.description.length > 150) {
				console.log('❌ Description exceeds 150 characters');
			} else {
				console.log('✅ Description length is appropriate');
			}

			if (recipe.cookTime < 1) {
				console.log('❌ Cook time is less than 1 minute');
			} else {
				console.log('✅ Cook time is valid');
			}
		} catch (error) {
			console.log('❌ Recipe generation failed:', error.message);
		}
	}

	async function testRecipeNames(service) {
		try {
			const recipeNames = await service.generateRecipeNames('spring', 10);

			console.log('✅ Recipe names generation successful');
			console.log('📊 Number of names generated:', recipeNames.length);
			console.log('📝 Sample names:', recipeNames.slice(0, 3));

			if (recipeNames.length === 10) {
				console.log('✅ Correct number of recipe names generated');
			} else {
				console.log('❌ Incorrect number of recipe names generated');
			}
		} catch (error) {
			console.log('❌ Recipe names generation failed:', error.message);
		}
	}

	async function testImagePrompt(service) {
		try {
			const imagePrompt = await service.createImagePrompt(
				'Beef and Vegetable Stew'
			);

			console.log('✅ Image prompt generation successful');
			console.log('📝 Generated prompt:', imagePrompt);
			console.log('📊 Prompt length:', imagePrompt.length, 'characters');

			if (imagePrompt.includes('Beef and Vegetable Stew')) {
				console.log('✅ Image prompt includes recipe title');
			} else {
				console.log('❌ Image prompt missing recipe title');
			}
		} catch (error) {
			console.log('❌ Image prompt generation failed:', error.message);
		}
	}

	async function testSeasonalRecipe(service) {
		try {
			const recipe = await service.generateRecipe({
				season: 'summer',
				ingredients: ['zucchini', 'tomatoes'],
				dietaryRestrictions: ['vegetarian'],
				servings: 4,
			});

			console.log('✅ Seasonal recipe generation successful');
			console.log('📝 Recipe title:', recipe.title);
			console.log('📝 Season:', recipe.season);

			// Check if requirements were met
			const ingredients = recipe.ingredients.map((ing) =>
				ing.name.toLowerCase()
			);
			const hasZucchini = ingredients.some((ing) => ing.includes('zucchini'));
			const hasTomatoes = ingredients.some((ing) => ing.includes('tomato'));
			const isVegetarian = recipe.dietaryInfo.some((info) =>
				info.toLowerCase().includes('vegetarian')
			);
			const correctServings = recipe.servings === 4;

			console.log('📊 Requirements check:');
			console.log('  - Includes zucchini:', hasZucchini ? '✅' : '❌');
			console.log('  - Includes tomatoes:', hasTomatoes ? '✅' : '❌');
			console.log('  - Vegetarian:', isVegetarian ? '✅' : '❌');
			console.log('  - 4 servings:', correctServings ? '✅' : '❌');
		} catch (error) {
			console.log('❌ Seasonal recipe generation failed:', error.message);
		}
	}

	// Run the tests
	testMealPrep360Service().catch(console.error);
} catch (importError) {
	console.error('❌ Import error:', importError);
}
