import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IAnalyticsService } from '@/lib/analytics/interfaces/IAnalyticsService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

let analyticsService: IAnalyticsService;

async function getAnalyticsService(): Promise<IAnalyticsService> {
	if (!analyticsService) {
		const container = await Container.getInstance();
		analyticsService =
			container.getService<IAnalyticsService>('analyticsService');
	}
	return analyticsService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const eventData = await request.json();
		const service = await getAnalyticsService();
		const event = await service.trackEvent(eventData);

		return NextResponse.json(event);
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
		const type = searchParams.get('type');
		const sessionId = searchParams.get('sessionId');
		const startDate = searchParams.get('startDate')
			? new Date(searchParams.get('startDate')!)
			: undefined;
		const endDate = searchParams.get('endDate')
			? new Date(searchParams.get('endDate')!)
			: undefined;

		const service = await getAnalyticsService();
		const events = await service.getEvents({
			type: type || undefined,
			userId,
			sessionId: sessionId || undefined,
			startDate,
			endDate,
		});

		return NextResponse.json(events);
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
		const eventId = searchParams.get('eventId');
		if (!eventId) {
			throw new Error('Event ID is required');
		}

		const service = await getAnalyticsService();
		await service.deleteEvent(eventId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
