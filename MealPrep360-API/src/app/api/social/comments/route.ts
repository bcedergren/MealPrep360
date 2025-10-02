import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ISocialService } from '@/lib/social/interfaces/ISocialService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { SocialCommentValidator } from '@/lib/social/validation/SocialValidator';

const commentValidator = new SocialCommentValidator();
let socialService: ISocialService;

async function getSocialService(): Promise<ISocialService> {
	if (!socialService) {
		const container = await Container.getInstance();
		socialService = container.getService<ISocialService>('socialService');
	}
	return socialService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await commentValidator.validate(request);
		const service = await getSocialService();
		const comment = await service.createComment({
			...validationResult.data,
			userId,
			entityType:
				validationResult.data.targetType === 'post'
					? 'recipe'
					: validationResult.data.targetType,
			entityId: validationResult.data.targetId,
			contentType: 'text',
			status: 'active',
		});

		return NextResponse.json(comment);
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
		const entityType = searchParams.get('entityType') as any;
		const entityId = searchParams.get('entityId');
		const status = searchParams.get('status');
		const parentId = searchParams.get('parentId');

		const service = await getSocialService();
		const comments = await service.listComments({
			userId,
			entityType,
			entityId: entityId ?? undefined,
			status: status ?? undefined,
			parentId: parentId ?? undefined,
		});

		return NextResponse.json(comments);
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

		const { commentId } = await request.json();
		if (!commentId) {
			throw new Error('Comment ID is required');
		}

		const validationResult = await commentValidator.validate(request);
		const service = await getSocialService();
		const comment = await service.updateComment(
			commentId,
			validationResult.data
		);

		return NextResponse.json(comment);
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
		const commentId = searchParams.get('commentId');
		if (!commentId) {
			throw new Error('Comment ID is required');
		}

		const service = await getSocialService();
		await service.deleteComment(commentId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
