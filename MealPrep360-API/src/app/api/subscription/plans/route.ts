import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ISubscriptionService } from '@/lib/subscription/interfaces/ISubscriptionService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { SubscriptionPlanValidator } from '@/lib/subscription/validation/SubscriptionValidator';

const planValidator = new SubscriptionPlanValidator();
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

		const validationResult = await planValidator.validate(request);
		const service = await getSubscriptionService();
		const plan = await service.createPlan(validationResult.data);

		return NextResponse.json(plan);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const active = searchParams.get('active') === 'true';
		const currency = searchParams.get('currency') as any;
		const interval = searchParams.get('interval') as any;

		const service = await getSubscriptionService();
		const plans = await service.listPlans({
			active,
			currency,
			interval,
		});

		return NextResponse.json(plans);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
