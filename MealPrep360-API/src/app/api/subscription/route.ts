import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ISubscriptionService } from '@/lib/subscription/interfaces/ISubscriptionService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { SubscriptionValidator } from '@/lib/subscription/validation/SubscriptionValidator';

const subscriptionValidator = new SubscriptionValidator();
let subscriptionService: ISubscriptionService;

async function getSubscriptionService(): Promise<ISubscriptionService> {
	if (!subscriptionService) {
		const container = await Container.getInstance();
		subscriptionService = container.getService<ISubscriptionService>(
			'subscriptionService'
		);
	}
	return subscriptionService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await subscriptionValidator.validate(request);
		const service = await getSubscriptionService();
		const subscription = await service.createSubscription({
			...validationResult.data,
			userId,
		});

		return NextResponse.json(subscription);
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
		const planId = searchParams.get('planId');
		const status = searchParams.get('status') as any;

		const service = await getSubscriptionService();
		const subscriptions = await service.listSubscriptions({
			userId,
			planId: planId ?? undefined,
			status,
		});

		return NextResponse.json(subscriptions);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
