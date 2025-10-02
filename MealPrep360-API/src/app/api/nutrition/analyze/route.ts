import { BaseRouteHandler } from '@/lib/core/api/BaseRouteHandler';
import { NutritionAnalysisValidator } from '@/lib/nutrition/validation/NutritionValidator';
import { Container } from '@/lib/container/Container';
import { INutritionService } from '@/lib/nutrition/interfaces/INutritionService';
import { NutritionAnalysisRequest, NutritionInfo } from '@/lib/nutrition/types';
import { NextRequest, NextResponse } from 'next/server';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

class NutritionAnalysisRouteHandler extends BaseRouteHandler<
	NutritionAnalysisRequest,
	NutritionInfo
> {
	protected validator = new NutritionAnalysisValidator();
	private nutritionService: INutritionService | null = null;

	private async getNutritionService(): Promise<INutritionService> {
		if (!this.nutritionService) {
			const container = await Container.getInstance();
			this.nutritionService =
				container.getService<INutritionService>('nutritionService');
		}
		return this.nutritionService;
	}

	async POST(request: Request) {
		return this.handleRequest(request, async (data) => {
			const service = await this.getNutritionService();
			return await service.analyzeIngredients(data);
		});
	}

	async GET(request: NextRequest) {
		try {
			const { userId } = await auth();
			if (!userId) {
				throw new UnauthorizedError();
			}

			const { searchParams } = new URL(request.url);
			const recipeId = searchParams.get('recipeId');
			const mealPlanId = searchParams.get('mealPlanId');
			const date = searchParams.get('date');

			if (recipeId) {
				const service = await this.getNutritionService();
				const nutrition = await service.analyzeRecipe(recipeId);
				return NextResponse.json(nutrition);
			}

			if (mealPlanId && date) {
				const service = await this.getNutritionService();
				const analysis = await service.analyzeMealPlan(
					mealPlanId,
					new Date(date)
				);
				return NextResponse.json(analysis);
			}

			throw new Error(
				'Either recipeId or mealPlanId with date must be provided'
			);
		} catch (error) {
			return ErrorService.handle(error as Error);
		}
	}
}

const handler = new NutritionAnalysisRouteHandler();
export const POST = handler.POST.bind(handler);
export const GET = handler.GET.bind(handler);
