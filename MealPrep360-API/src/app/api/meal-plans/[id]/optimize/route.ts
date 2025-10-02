import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IMealPlanService } from '@/lib/meal-plans/interfaces/IMealPlanService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const container = await Container.getInstance();
		const mealPlanService =
			container.getService<IMealPlanService>('mealPlanService');

		const options = await request.json();
		const optimizedPlan = await mealPlanService.optimizeMealPlan(
			params.id,
			userId,
			options
		);

		return NextResponse.json(optimizedPlan);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
