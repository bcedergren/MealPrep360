import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IAnalyticsService } from '@/lib/analytics/interfaces/IAnalyticsService';
import { AnalyticsQuery, AnalyticsResult } from '@/lib/analytics/types';
import { AnalyticsQueryValidator } from '@/lib/analytics/validation/AnalyticsValidator';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

const queryValidator = new AnalyticsQueryValidator();
let analyticsService: IAnalyticsService;

async function getAnalyticsService(): Promise<IAnalyticsService> {
	if (!analyticsService) {
		const container = await Container.getInstance();
		analyticsService =
			container.getService<IAnalyticsService>('analyticsService');
	}
	return analyticsService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await queryValidator.validate(request);
		const service = await getAnalyticsService();
		const result = await service.aggregateEvents({
			...validationResult.data,
			groupBy: validationResult.data.dimensions || [],
			metrics: validationResult.data.metrics || [],
		});

		return NextResponse.json(result);
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
		const type = searchParams.get('type');
		const startDate = searchParams.get('startDate')
			? new Date(searchParams.get('startDate')!)
			: undefined;
		const endDate = searchParams.get('endDate')
			? new Date(searchParams.get('endDate')!)
			: undefined;
		const metrics = searchParams.getAll('metrics');
		const dimensions = searchParams.getAll('dimensions');

		const service = await getAnalyticsService();
		const result = await service.aggregateEvents({
			type: type || undefined,
			userId,
			startDate,
			endDate,
			groupBy: dimensions,
			metrics,
		});

		return NextResponse.json(result);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
