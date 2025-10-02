import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IGamificationService } from '@/lib/gamification/interfaces/IGamificationService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { GamificationEventValidator } from '@/lib/gamification/validation/GamificationValidator';

const eventValidator = new GamificationEventValidator();
let gamificationService: IGamificationService;

async function getGamificationService(): Promise<IGamificationService> {
	if (!gamificationService) {
		const container = await Container.getInstance();
		gamificationService = container.getService<IGamificationService>(
			'gamificationService'
		);
	}
	return gamificationService;
}

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const service = await getGamificationService();
		const progress = await service.getUserProgress(userId);

		return NextResponse.json(progress);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type') || 'event';

		if (type === 'event') {
			const validationResult = await eventValidator.validate(request);
			const service = await getGamificationService();
			const event = await service.updateProgress({
				...validationResult.data,
				userId,
			});

			return NextResponse.json(event);
		} else if (type === 'points') {
			const { points, reason, metadata } = await request.json();
			const service = await getGamificationService();
			const result = await service.awardPoints({
				userId,
				points,
				reason,
				metadata,
			});

			return NextResponse.json(result);
		} else {
			throw new Error(`Invalid progress type: ${type}`);
		}
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
