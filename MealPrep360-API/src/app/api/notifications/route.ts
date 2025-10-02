import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { INotificationsService } from '@/lib/notifications/interfaces/INotificationsService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { NotificationValidator } from '@/lib/notifications/validation/NotificationsValidator';

const notificationValidator = new NotificationValidator();
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

		const validationResult = await notificationValidator.validate(request);
		const service = await getNotificationsService();
		const notification = await service.sendNotification({
			...validationResult.data,
			userId,
		});

		return NextResponse.json(notification);
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
		const type = searchParams.get('type') as any;
		const status = searchParams.get('status') as any;
		const channel = searchParams.get('channel') as any;
		const startDate = searchParams.get('startDate')
			? new Date(searchParams.get('startDate')!)
			: undefined;
		const endDate = searchParams.get('endDate')
			? new Date(searchParams.get('endDate')!)
			: undefined;

		const service = await getNotificationsService();
		const notifications = await service.listNotifications({
			userId,
			type,
			status,
			channel,
			startDate,
			endDate,
		});

		return NextResponse.json(notifications);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
