import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ILocalizationService } from '@/lib/localization/interfaces/ILocalizationService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { LocaleValidator } from '@/lib/localization/validation/LocalizationValidator';

const localeValidator = new LocaleValidator();
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

		const validationResult = await localeValidator.validate(request);
		const service = await getLocalizationService();
		const locale = await service.createLocale({
			...validationResult.data,
			createdBy: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return NextResponse.json(locale);
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
		const enabled = searchParams.get('enabled') === 'true';
		const region = searchParams.get('region') || undefined;

		const service = await getLocalizationService();
		const locales = await service.listLocales({
			enabled,
			region,
		});

		return NextResponse.json(locales);
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

		const { localeId, updates } = await request.json();
		if (!localeId) {
			throw new Error('Locale ID is required');
		}

		const service = await getLocalizationService();
		const locale = await service.updateLocale(localeId, {
			...updates,
			updatedAt: new Date(),
		});

		return NextResponse.json(locale);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { searchParams } = new URL(request.url);
		const localeId = searchParams.get('localeId');
		if (!localeId) {
			throw new Error('Locale ID is required');
		}

		const service = await getLocalizationService();
		await service.deleteLocale(localeId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
