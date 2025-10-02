import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IMealPlanService } from '@/lib/meal-plans/interfaces/IMealPlanService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { MealPlanValidator } from '@/lib/meal-plans/validation/MealPlanValidator';
import connectDB from '@/lib/mongodb/connection';
import { User, UserRecipe } from '@/lib/mongodb/schemas';

const mealPlanValidator = new MealPlanValidator();
let mealPlanService: IMealPlanService;

async function getMealPlanService(): Promise<IMealPlanService> {
	if (!mealPlanService) {
		const container = await Container.getInstance();
		mealPlanService = container.getService<IMealPlanService>('mealPlanService');
	}
	return mealPlanService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await mealPlanValidator.validate(request);
		const service = await getMealPlanService();
		try {
			const mealPlan = await service.createMealPlan({
				...validationResult.data,
				userId,
			});
			return NextResponse.json(mealPlan);
		} catch (err: any) {
			const message = (err && err.message) || '';
			if (/No recipes available for meal plan generation/i.test(message)) {
				// Fallback: generate using user's saved recipes (duplicates allowed)
				await connectDB();
				const user = await User.findOne({ clerkId: userId });
				if (!user) {
					throw new Error('User not found');
				}

				const userRecipe = await UserRecipe.findOne({
					userId: user._id,
				}).populate('savedRecipes.recipeId');
				const recipes =
					userRecipe?.savedRecipes
						?.map((saved: any) => saved.recipeId)
						.filter(Boolean) || [];

				if (recipes.length === 0) {
					return NextResponse.json(
						{
							error: 'No saved recipes found. Please save some recipes first.',
						},
						{ status: 400 }
					);
				}

				const start = new Date(validationResult.data.startDate as any);
				const end = new Date(validationResult.data.endDate as any);
				if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
					return NextResponse.json(
						{ error: 'Invalid startDate or endDate' },
						{ status: 400 }
					);
				}

				const days: Array<{
					recipeId: string | null;
					status: 'planned' | 'skipped';
				}> = [];
				const msPerDay = 24 * 60 * 60 * 1000;
				const duration =
					Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
				for (let i = 0; i < duration; i++) {
					const randomRecipe =
						recipes[Math.floor(Math.random() * recipes.length)];
					days.push({
						recipeId: randomRecipe._id.toString(),
						status: 'planned',
					});
				}

				const fallbackPlan = {
					id: new Date().getTime().toString(),
					userId: user._id.toString(),
					startDate: start.toISOString(),
					endDate: new Date(
						start.getTime() + (duration - 1) * msPerDay
					).toISOString(),
					days,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				return NextResponse.json(fallbackPlan);
			}
			throw err;
		}
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		if (startDate && endDate) {
			// Validate dates
			const start = new Date(startDate);
			const end = new Date(endDate);
			if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
				return NextResponse.json(
					{ error: 'Invalid startDate or endDate' },
					{ status: 400 }
				);
			}
			if (end.getTime() < start.getTime()) {
				return NextResponse.json(
					{ error: 'endDate must be on or after startDate' },
					{ status: 400 }
				);
			}

			const service = await getMealPlanService();
			const mealPlans = await service.getMealPlansByDateRange(
				userId,
				start,
				end
			);
			// Ensure array response for range queries
			return NextResponse.json(Array.isArray(mealPlans) ? mealPlans : []);
		} else {
			const service = await getMealPlanService();
			const mealPlan = await service.getActiveMealPlan(userId);
			return NextResponse.json(mealPlan);
		}
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { mealPlanId, updates } = await request.json();
		if (!mealPlanId) {
			throw new Error('Meal Plan ID is required');
		}

		const service = await getMealPlanService();
		const mealPlan = await service.updateMealPlan(mealPlanId, userId, updates);

		return NextResponse.json(mealPlan);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { searchParams } = new URL(request.url);
		const mealPlanId = searchParams.get('mealPlanId');
		if (!mealPlanId) {
			throw new Error('Meal Plan ID is required');
		}

		const service = await getMealPlanService();
		await service.deleteMealPlan(mealPlanId, userId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
