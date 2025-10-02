import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IIntegrationService } from '@/lib/integration/interfaces/IIntegrationService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { IntegrationValidator } from '@/lib/integration/validation/IntegrationValidator';

const integrationValidator = new IntegrationValidator();
let integrationService: IIntegrationService;

async function getIntegrationService(): Promise<IIntegrationService> {
	if (!integrationService) {
		const container = await Container.getInstance();
		integrationService =
			container.getService<IIntegrationService>('integrationService');
	}
	return integrationService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await integrationValidator.validate(request);
		const service = await getIntegrationService();
		const integration = await service.createIntegration({
			...validationResult.data,
			userId,
			status: 'inactive',
			settings: {
				syncInterval: 3600,
				retryAttempts: 3,
				timeout: 30000,
			},
			scopes: [],
		});

		return NextResponse.json(integration);
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
		const type = searchParams.get('type') || undefined;
		const provider = searchParams.get('provider') || undefined;
		const status = searchParams.get('status') || undefined;

		const service = await getIntegrationService();
		const integrations = await service.listIntegrations({
			userId,
			type,
			provider,
			status,
		});

		return NextResponse.json(integrations);
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

		const { integrationId, updates } = await request.json();
		if (!integrationId) {
			throw new Error('Integration ID is required');
		}

		const service = await getIntegrationService();
		const integration = await service.updateIntegration(integrationId, updates);

		return NextResponse.json(integration);
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
		const integrationId = searchParams.get('integrationId');
		if (!integrationId) {
			throw new Error('Integration ID is required');
		}

		const service = await getIntegrationService();
		await service.deleteIntegration(integrationId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
