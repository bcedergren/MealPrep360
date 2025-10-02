import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IIntegrationService } from '@/lib/integration/interfaces/IIntegrationService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { IntegrationSyncValidator } from '@/lib/integration/validation/IntegrationValidator';

const syncValidator = new IntegrationSyncValidator();
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

		const validationResult = await syncValidator.validate(request);
		const service = await getIntegrationService();
		const sync = await service.createSyncJob({
			...validationResult.data,
			status: 'pending',
			progress: {
				current: 0,
				total: 0,
				errors: 0,
			},
			metadata: {
				startTime: new Date(),
			},
		});

		return NextResponse.json(sync);
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
		const integrationId = searchParams.get('integrationId');
		const status = searchParams.get('status') as any;

		const service = await getIntegrationService();
		const syncJobs = await service.listSyncJobs({
			integrationId: integrationId || undefined,
			status: status || undefined,
		});

		return NextResponse.json(syncJobs);
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

		const { jobId, action } = await request.json();
		if (!jobId) {
			throw new Error('Job ID is required');
		}

		switch (action) {
			case 'cancel':
				const service1 = await getIntegrationService();
				await service1.cancelSyncJob(jobId);
				break;
			case 'retry':
				const service2 = await getIntegrationService();
				const job = await service2.retrySyncJob(jobId);
				return NextResponse.json(job);
			default:
				throw new Error(`Invalid action: ${action}`);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
