import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ILocalizationService } from '@/lib/localization/interfaces/ILocalizationService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

let localizationService: ILocalizationService;

async function getLocalizationService(): Promise<ILocalizationService> {
	if (!localizationService) {
		const container = await Container.getInstance();
		localizationService = container.getService<ILocalizationService>(
			'localizationService'
		);
	}
	return localizationService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const {
			text,
			sourceLocale,
			targetLocale,
			context,
			format = 'text',
		} = await request.json();

		if (!text) {
			throw new Error('Text is required');
		}

		if (!sourceLocale) {
			throw new Error('Source locale is required');
		}

		if (!targetLocale) {
			throw new Error('Target locale is required');
		}

		const service = await getLocalizationService();
		const result = await service.translateText({
			text,
			sourceLocale,
			targetLocale,
			context,
			format,
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
		const text = searchParams.get('text');
		const confidence = searchParams.get('confidence')
			? parseFloat(searchParams.get('confidence')!)
			: undefined;

		if (!text) {
			throw new Error('Text is required');
		}

		const service = await getLocalizationService();
		const result = await service.detectLocale({
			text,
			confidence,
		});

		return NextResponse.json(result);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
