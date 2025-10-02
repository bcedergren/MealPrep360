import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { INotificationsService } from '@/lib/notifications/interfaces/INotificationsService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { NotificationPreferencesValidator } from '@/lib/notifications/validation/NotificationsValidator';

const preferencesValidator = new NotificationPreferencesValidator();
let notificationsService: INotificationsService;

async function getNotificationsService(): Promise<INotificationsService> {
	if (!notificationsService) {
		const container = await Container.getInstance();
		notificationsService = container.getService<INotificationsService>(
			'notificationsService'
		);
	}
	return notificationsService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await preferencesValidator.validate(request);
		const service = await getNotificationsService();
		const preferences = await service.setPreferences({
			...validationResult.data,
			userId,
		});

		return NextResponse.json(preferences);
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

		const service = await getNotificationsService();
		const preferences = await service.getPreferences(userId);

		return NextResponse.json(preferences);
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

		const updates = await request.json();
		const service = await getNotificationsService();
		const preferences = await service.updatePreferences(userId, updates);

		return NextResponse.json(preferences);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
