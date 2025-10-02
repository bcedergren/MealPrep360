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
		const { userId, startDate, duration } = body;

		if (!userId || !startDate || !duration) {
			return NextResponse.json(
				{ error: 'User ID, start date, and duration are required' },
				{ status: 400 }
			);
		}

		const mealPlan = await mealPlanService.generateMealPlan(userId, {
			startDate,
			duration,
		});

		return NextResponse.json(mealPlan);
	} catch (error) {
		console.error('Error generating meal plan:', error);
		if (
			error instanceof Error &&
			error.message.includes('No saved recipes found')
		) {
			return NextResponse.json(
				{
					error: 'No saved recipes found',
					message:
						'Please add some recipes to your collection before generating a meal plan.',
					code: 'NO_RECIPES',
				},
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: 'Failed to generate meal plan' },
			{ status: 500 }
		);
	}
}

export async function GET() {
	return NextResponse.json(
		{ error: 'Method not allowed. Use POST to generate meal plans.' },
		{ status: 405 }
	);
}

export async function PUT() {
	return NextResponse.json(
		{ error: 'Method not allowed. Use POST to generate meal plans.' },
		{ status: 405 }
	);
}

export async function DELETE() {
	return NextResponse.json(
		{ error: 'Method not allowed. Use POST to generate meal plans.' },
		{ status: 405 }
	);
}

export async function PATCH() {
	return NextResponse.json(
		{ error: 'Method not allowed. Use POST to generate meal plans.' },
		{ status: 405 }
	);
}
