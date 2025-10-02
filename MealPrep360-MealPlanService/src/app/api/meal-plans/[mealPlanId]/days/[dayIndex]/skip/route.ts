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

export async function POST(
	request: NextRequest,
	{ params }: { params: { mealPlanId: string; dayIndex: string } }
) {
	try {
		const { mealPlanId, dayIndex } = params;
		const body = await request.json();
		const { userId } = body;

		if (!userId) {
			return NextResponse.json(
				{ error: 'User ID is required' },
				{ status: 400 }
			);
		}

		const mealPlan = await mealPlanService.skipMealPlanDay(
			mealPlanId,
			parseInt(dayIndex),
			userId
		);

		return NextResponse.json(mealPlan);
	} catch (error) {
		console.error('Error skipping meal plan day:', error);

		if (error instanceof Error) {
			if (error.message.includes('Meal plan not found')) {
				return NextResponse.json(
					{ error: 'Meal plan not found' },
					{ status: 404 }
				);
			}
			if (error.message.includes('Invalid day index')) {
				return NextResponse.json(
					{ error: 'Invalid day index' },
					{ status: 400 }
				);
			}
		}

		return NextResponse.json(
			{ error: 'Failed to skip meal plan day' },
			{ status: 500 }
		);
	}
}
