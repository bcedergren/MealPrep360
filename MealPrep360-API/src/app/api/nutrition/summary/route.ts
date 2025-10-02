import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { INutritionService } from '@/lib/nutrition/interfaces/INutritionService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const container = await Container.getInstance();
		const nutritionService =
			container.getService<INutritionService>('nutritionService');

		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type') || 'daily';
		const date = searchParams.get('date');
		const year = searchParams.get('year');
		const month = searchParams.get('month');

		switch (type) {
			case 'daily':
				if (!date) {
					throw new Error('Date is required for daily summary');
				}
				return NextResponse.json(
					await nutritionService.getDailySummary(userId, new Date(date))
				);

			case 'weekly':
				if (!date) {
					throw new Error('Start date is required for weekly summary');
				}
				return NextResponse.json(
					await nutritionService.getWeeklySummary(userId, new Date(date))
				);

			case 'monthly':
				if (!year || !month) {
					throw new Error('Year and month are required for monthly summary');
				}
				return NextResponse.json(
					await nutritionService.getMonthlySummary(
						userId,
						parseInt(year),
						parseInt(month)
					)
				);

			default:
				throw new Error(
					'Invalid summary type. Must be daily, weekly, or monthly'
				);
		}
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
