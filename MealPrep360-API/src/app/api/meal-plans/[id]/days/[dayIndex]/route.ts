import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IMealPlanService } from '@/lib/meal-plans/interfaces/IMealPlanService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string; dayIndex: string } }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const container = await Container.getInstance();
		const mealPlanService =
			container.getService<IMealPlanService>('mealPlanService');

		const data = await request.json();
		const date = new Date(params.dayIndex);

		const updatedPlan = await mealPlanService.updateDayMeals(
			params.id,
			userId,
			date,
			data.meals
		);

		return NextResponse.json(updatedPlan);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string; dayIndex: string } }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const container = await Container.getInstance();
		const mealPlanService =
			container.getService<IMealPlanService>('mealPlanService');

		const { action, notes } = await request.json();
		const date = new Date(params.dayIndex);

		let updatedPlan;
		if (action === 'skip') {
			updatedPlan = await mealPlanService.skipDay(
				params.id,
				userId,
				date,
				notes
			);
		} else if (action === 'unskip') {
			updatedPlan = await mealPlanService.unskipDay(params.id, userId, date);
		} else {
			throw new Error('Invalid action');
		}

		return NextResponse.json(updatedPlan);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
