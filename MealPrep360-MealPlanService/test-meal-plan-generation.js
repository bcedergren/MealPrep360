import { RecipeService } from './src/app/services/recipeService.js';
import { MealPlanService } from './src/app/services/mealPlanService.js';
import { MealPlanRepository } from './src/app/repositories/mealPlanRepository.js';

async function testMealPlanGeneration() {
	console.log('Testing meal plan generation...');

	try {
		// Initialize services
		const recipeService = new RecipeService();
		const mealPlanRepository = new MealPlanRepository();
		const mealPlanService = new MealPlanService(
			mealPlanRepository,
			recipeService
		);

		// Test with the specific user ID
		const userId = '68376d8d1d7239d019114200';
		console.log('Testing with userId:', userId);

		// Test getting user saved recipes
		console.log('Getting user saved recipes...');
		const recipes = await recipeService.getUserSavedRecipes(userId);
		console.log('Found', recipes.length, 'recipes for user');

		if (recipes.length > 0) {
			console.log('Sample recipe:', {
				id: recipes[0]._id.toString(),
				title: recipes[0].title,
				ingredients: recipes[0].ingredients.slice(0, 3), // Show first 3 ingredients
			});
		}

		// Test meal plan generation
		console.log('Generating meal plan...');
		const mealPlan = await mealPlanService.generateMealPlan(userId, {
			startDate: new Date(),
			duration: 7,
		});

		console.log('Meal plan generated successfully!');
		console.log('Meal plan ID:', mealPlan.id);
		console.log('Number of days:', mealPlan.days.length);
		console.log(
			'Days with recipes:',
			mealPlan.days.filter((day) => day.recipeId).length
		);

		// Show some details about the generated meal plan
		mealPlan.days.forEach((day, index) => {
			if (day.recipeId) {
				console.log(
					`Day ${index + 1}: Recipe ID ${day.recipeId}, Status: ${day.status}`
				);
			} else {
				console.log(`Day ${index + 1}: No recipe, Status: ${day.status}`);
			}
		});
	} catch (error) {
		console.error('Error testing meal plan generation:', error);
		console.error('Error details:', {
			message: error.message,
			stack: error.stack,
		});
	}
}

testMealPlanGeneration().catch(console.error);
