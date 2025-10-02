import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IPreferencesService } from '@/lib/preferences/interfaces/IPreferencesService';
import { PreferenceScope, PreferenceType } from '@/lib/preferences/types';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { PreferenceDefinitionValidator } from '@/lib/preferences/validation/PreferencesValidator';

const definitionValidator = new PreferenceDefinitionValidator();
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

		const validationResult = await definitionValidator.validate(request);
		const service = await getPreferencesService();
		const definition = await service.createDefinition(
			validationResult.data
		);

		return NextResponse.json(definition);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const scope =
			(searchParams.get('scope') as PreferenceScope | null) ?? undefined;
		const type =
			(searchParams.get('type') as PreferenceType | null) ?? undefined;
		const search = searchParams.get('search') ?? undefined;

		const service = await getPreferencesService();
		const definitions = await service.listDefinitions({
			scope,
			type,
			search,
		});

		return NextResponse.json(definitions);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
