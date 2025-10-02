import 'dotenv/config';
import { getMongoClient } from '../lib/mongodb.js';

async function migrateMealPlans() {
	try {
		const client = await getMongoClient();
		const collection = client.db().collection('mealPlans');

		// Get all meal plans
		const mealPlans = await collection.find({}).toArray();

		for (const mealPlan of mealPlans) {
			// Create the updated meal plan structure
			const updatedMealPlan = {
				id: mealPlan.id,
				userId: mealPlan.userId,
				startDate: mealPlan.startDate,
				endDate: mealPlan.endDate,
				days: mealPlan.days.map((day: any) => ({
					recipeId: day.recipeId || null,
					status: day.status || 'planned',
				})),
				createdAt: mealPlan.createdAt,
				updatedAt: mealPlan.updatedAt,
				__v: mealPlan.__v,
			};

			// Update the meal plan in the database
			await collection.updateOne(
				{ _id: mealPlan._id },
				{ $set: updatedMealPlan }
			);
		}
	} catch (error) {
		console.error('Error during migration:', error);
	} finally {
		process.exit(0);
	}
}

migrateMealPlans();
