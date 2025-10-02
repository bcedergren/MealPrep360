import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IFeedbackService } from '@/lib/feedback/interfaces/IFeedbackService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { FeedbackValidator } from '@/lib/feedback/validation/FeedbackValidator';

const feedbackValidator = new FeedbackValidator();
let feedbackService: IFeedbackService;

async function getFeedbackService(): Promise<IFeedbackService> {
	if (!feedbackService) {
		const container = await Container.getInstance();
		feedbackService = container.getService<IFeedbackService>('feedbackService');
	}
	return feedbackService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await feedbackValidator.validate(request);
		const service = await getFeedbackService();
		const feedback = await service.createFeedback({
			...validationResult.data,
			userId,
			status: 'open',
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return NextResponse.json(feedback);
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
		const priority = searchParams.get('priority') || undefined;
		const category = searchParams.get('category') || undefined;
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		const service = await getFeedbackService();
		const feedback = await service.listFeedback({
			priority,
			userId,
			category,
			startDate: startDate ? new Date(startDate) : undefined,
			endDate: endDate ? new Date(endDate) : undefined,
		});

		return NextResponse.json(feedback);
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

		const { feedbackId, updates } = await request.json();
		if (!feedbackId) {
			throw new Error('Feedback ID is required');
		}

		const service = await getFeedbackService();
		const feedback = await service.updateFeedback(feedbackId, {
			...updates,
			updatedAt: new Date(),
		});

		return NextResponse.json(feedback);
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
		const feedbackId = searchParams.get('feedbackId');
		if (!feedbackId) {
			throw new Error('Feedback ID is required');
		}

		const service = await getFeedbackService();
		await service.deleteFeedback(feedbackId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
