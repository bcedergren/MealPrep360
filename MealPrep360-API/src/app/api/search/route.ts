import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ISearchService } from '@/lib/search/interfaces/ISearchService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { SearchQueryValidator } from '@/lib/search/validation/SearchValidator';

const queryValidator = new SearchQueryValidator();
let searchService: ISearchService;

async function getSearchService(): Promise<ISearchService> {
	if (!searchService) {
		const container = await Container.getInstance();
		searchService = container.getService<ISearchService>('searchService');
	}
	return searchService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await queryValidator.validate(request);
		const service = await getSearchService();
		const results = await service.search(validationResult.data);

		// Track search query asynchronously
		service
			.trackSearchQuery(validationResult.data, {
				total: results.total,
				returned: results.results.length,
				latency: results.metadata.latency,
				ids: results.results.map((r) => r.id),
			})
			.catch((error) => console.error('Failed to track search query:', error));

		return NextResponse.json(results);
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
		const query = searchParams.get('query');
		const entityTypes = searchParams.get('entityTypes')?.split(',') as any[];
		const limit = searchParams.get('limit')
			? parseInt(searchParams.get('limit')!)
			: undefined;
		const minScore = searchParams.get('minScore')
			? parseFloat(searchParams.get('minScore')!)
			: undefined;

		if (!query) {
			throw new Error('Query parameter is required');
		}

		const service = await getSearchService();
		const suggestions = await service.suggest(query, {
			entityTypes,
			limit,
			minScore,
		});

		return NextResponse.json(suggestions);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
