import { NextRequest, NextResponse } from 'next/server';
import { MealPlanService } from '@/app/services/mealPlanService';
import { MealPlanRepository } from '@/app/repositories/mealPlanRepository';
import { DateService } from '@/app/infrastructure/services/DateService';
import { DefaultMealPlanGenerator } from '@/app/domain/services/MealPlanGenerator';
import { VarietyBasedRecipeSelector } from '@/app/domain/services/VarietyBasedRecipeSelector';
import { MongoRecipeRepository } from '@/app/infrastructure/repositories/MongoRecipeRepository';
import { DatabaseFactory } from '@/app/infrastructure/database/DatabaseFactory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const dateService = new DateService();
const database = DatabaseFactory.getInstance().getDatabase('mongodb', {
	uri: process.env.MONGODB_URI!,
	dbName: process.env.MONGODB_DB!,
});
const recipeRepository = new MongoRecipeRepository(database, dateService);
const recipeSelector = new VarietyBasedRecipeSelector();
const mealPlanGenerator = new DefaultMealPlanGenerator(
	recipeSelector,
	recipeRepository,
	dateService
);
const mealPlanRepository = new MealPlanRepository();
const mealPlanService = new MealPlanService(
	mealPlanRepository,
	mealPlanGenerator,
	dateService
);

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userId, date } = body;

		if (!userId || !date) {
			return NextResponse.json(
				{ error: 'User ID and date are required' },
				{ status: 400 }
			);
		}

		const mealPlan = await mealPlanService.skipDate(userId, new Date(date));
		return NextResponse.json(mealPlan);
	} catch (error) {
		console.error('Error skipping date:', error);

		if (error instanceof Error) {
			if (error.message.includes('No meal plan found')) {
				return NextResponse.json(
					{
						error: 'No meal plan found',
						message:
							'Please generate a meal plan for this date before skipping it.',
					},
					{ status: 404 }
				);
			}
		}

		return NextResponse.json({ error: 'Failed to skip date' }, { status: 500 });
	}
}
