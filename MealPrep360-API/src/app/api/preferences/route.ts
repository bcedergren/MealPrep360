import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IPreferencesService } from '@/lib/preferences/interfaces/IPreferencesService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { UserPreferenceValidator } from '@/lib/preferences/validation/PreferencesValidator';

const preferenceValidator = new UserPreferenceValidator();
let preferencesService: IPreferencesService;

async function getPreferencesService(): Promise<IPreferencesService> {
	if (!preferencesService) {
		const container = await Container.getInstance();
		preferencesService = container.getService<IPreferencesService>('preferencesService');
	}
	return preferencesService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await preferenceValidator.validate(request);
		const service = await getPreferencesService();
		const preference = await service.setPreference({
			...validationResult.data,
			userId,
		});

		return NextResponse.json(preference);
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
		const scope = searchParams.get('scope') as any;
		const definitionIds = searchParams.get('definitionIds')?.split(',');

		const service = await getPreferencesService();
		const preferences = await service.getUserPreferences(userId, {
			scope,
			definitionIds,
		});

		return NextResponse.json(preferences);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
