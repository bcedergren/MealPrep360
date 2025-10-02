import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IAnalyticsService } from '@/lib/analytics/interfaces/IAnalyticsService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

let analyticsService: IAnalyticsService;

async function getAnalyticsService(): Promise<IAnalyticsService> {
	if (!analyticsService) {
		const container = await Container.getInstance();
		analyticsService =
			container.getService<IAnalyticsService>('analyticsService');
	}
	return analyticsService;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type') || 'user';

		switch (type) {
			case 'user':
				const service = await getAnalyticsService();
				const insights = await service.getUserInsights(userId);
				return NextResponse.json(insights);

			case 'recommendations':
				const service2 = await getAnalyticsService();
				const recommendations = await service2.getRecommendations(
					userId,
					'recipe'
				);
				return NextResponse.json({ recommendations });

			case 'anomalies':
				const service3 = await getAnalyticsService();
				const anomalies = await service3.getPerformanceMetrics({
					startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
					endDate: new Date(),
					resolution: '1h',
				});
				return NextResponse.json({ anomalies });

			case 'usage':
				const service4 = await getAnalyticsService();
				const usage = await service4.getUsageStatistics({
					startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
					endDate: new Date(),
					groupBy: ['feature', 'subscription'],
				});
				return NextResponse.json({ usage });

			default:
				throw new Error(`Invalid insight type: ${type}`);
		}
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
