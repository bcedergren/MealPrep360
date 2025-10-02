import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ISearchService } from '@/lib/search/interfaces/ISearchService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { SearchIndexValidator } from '@/lib/search/validation/SearchValidator';

const indexValidator = new SearchIndexValidator();
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

		const validationResult = await indexValidator.validate(request);
		const service = await getSearchService();
		const index = await service.createIndex(validationResult.data);

		return NextResponse.json(index);
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
		const entityType = searchParams.get('entityType') as any;
		const status = searchParams.get('status');

		const service = await getSearchService();
		const indices = await service.listIndices({
			entityType: entityType ?? undefined,
			status: status ?? undefined,
		});

		return NextResponse.json(indices);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
