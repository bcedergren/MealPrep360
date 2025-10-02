import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { INutritionService } from '@/lib/nutrition/interfaces/INutritionService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { NutritionalGoalsValidator } from '@/lib/nutrition/validation/NutritionValidator';

const goalsValidator = new NutritionalGoalsValidator();
let nutritionService: INutritionService;

async function getNutritionService(): Promise<INutritionService> {
	if (!nutritionService) {
		const container = await Container.getInstance();
		nutritionService = container.getService<INutritionService>('nutritionService');
	}
	return nutritionService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await goalsValidator.validate(request);
		const service = await getNutritionService();
		const goals = await service.setNutritionalGoals(
			userId,
			validationResult.data
		);

		return NextResponse.json(goals);
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

		const service = await getNutritionService();
		const goals = await service.getNutritionalGoals(userId);
		if (!goals) {
			return NextResponse.json(null);
		}

		return NextResponse.json(goals);
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

		const validationResult = await goalsValidator.validate(request);
		const service = await getNutritionService();
		const goals = await service.updateNutritionalGoals(
			userId,
			validationResult.data
		);

		return NextResponse.json(goals);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
