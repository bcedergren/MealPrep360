import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ISearchService } from '@/lib/search/interfaces/ISearchService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const container = await Container.getInstance();
		const searchService = container.getService<ISearchService>('searchService');

		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type');

		switch (type) {
			case 'popular':
				const limit = searchParams.get('limit');
				const popularSearches = await searchService.getPopularQueries({
					limit: limit ? parseInt(limit) : undefined,
				});
				return NextResponse.json(popularSearches);

			case 'related':
				const query = searchParams.get('query');
				if (!query) {
					throw new Error('Query parameter is required');
				}
				const suggestions = await searchService.suggest(query);
				return NextResponse.json(suggestions);

			case 'insights':
				const insights = await searchService.getSearchAnalytics(
					new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
					new Date(),
					{ userId }
				);
				return NextResponse.json(insights);

			case 'stats':
				const stats = await searchService.getSearchPerformance();
				return NextResponse.json(stats);

			default:
				throw new Error(
					'Invalid analytics type. Must be popular, related, insights, or stats'
				);
		}
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		const container = await Container.getInstance();
		const searchService = container.getService<ISearchService>('searchService');

		const analytics = await request.json();
		await searchService.trackSearchQuery(analytics, {
			...analytics,
			userId: userId || undefined,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
