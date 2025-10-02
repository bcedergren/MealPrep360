import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IFeedbackService } from '@/lib/feedback/interfaces/IFeedbackService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { FeedbackResponseValidator } from '@/lib/feedback/validation/FeedbackValidator';

const responseValidator = new FeedbackResponseValidator();
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

		const validationResult = await responseValidator.validate(request);
		const service = await getFeedbackService();
		const response = await service.createResponse({
			...validationResult.data,
			userId,
			createdAt: new Date(),
			updatedAt: new Date(),
			isInternal: validationResult.data.isInternal || false,
		});

		return NextResponse.json(response);
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
		const feedbackId = searchParams.get('feedbackId');
		if (!feedbackId) {
			throw new Error('Feedback ID is required');
		}

		const service = await getFeedbackService();
		const responses = await service.listResponses(feedbackId);

		return NextResponse.json(responses);
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

		const { responseId, updates } = await request.json();
		if (!responseId) {
			throw new Error('Response ID is required');
		}

		const service = await getFeedbackService();
		const response = await service.updateResponse(responseId, {
			...updates,
			updatedAt: new Date(),
		});

		return NextResponse.json(response);
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
		const responseId = searchParams.get('responseId');
		if (!responseId) {
			throw new Error('Response ID is required');
		}

		const service = await getFeedbackService();
		await service.deleteResponse(responseId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
