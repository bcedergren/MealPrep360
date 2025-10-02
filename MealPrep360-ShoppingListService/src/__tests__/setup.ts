import { connectToDatabase } from '../utils/database';
import { Recipe } from '../models/Recipe';

async function setupTestData() {
	try {
		await connectToDatabase();

		// Create test recipe
		const testRecipe = new Recipe({
			name: 'Test Pasta',
			ingredients: [
				{
					name: 'Pasta',
					amount: 500,
					unit: 'g',
					category: 'Pantry',
				},
				{
					name: 'Tomato Sauce',
					amount: 400,
					unit: 'ml',
					category: 'Pantry',
				},
				{
					name: 'Salt',
					amount: 1,
					unit: 'tsp',
					category: 'Spices',
				},
			],
		});

		await testRecipe.save();
		console.log('Test recipe created with ID:', testRecipe._id);
		return testRecipe._id;
	} catch (error) {
		console.error('Error setting up test data:', error);
		throw error;
	}
}

setupTestData().catch(console.error);
