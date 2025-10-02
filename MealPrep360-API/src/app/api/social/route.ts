import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ISocialService } from '@/lib/social/interfaces/ISocialService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import {
	SocialInteractionValidator,
	SocialCommentValidator,
} from '@/lib/social/validation/SocialValidator';

const interactionValidator = new SocialInteractionValidator();
const commentValidator = new SocialCommentValidator();
let socialService: ISocialService;

async function getSocialService(): Promise<ISocialService> {
	if (!socialService) {
		const container = await Container.getInstance();
		socialService = container.getService<ISocialService>('socialService');
	}
	return socialService;
}

// Interactions
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await interactionValidator.validate(request);
		const service = await getSocialService();
		const interaction = await service.createInteraction({
			userId,
			type:
				validationResult.data.type === 'block'
					? 'report'
					: validationResult.data.type,
			entityType:
				validationResult.data.targetType === 'post'
					? 'recipe'
					: validationResult.data.targetType,
			entityId: validationResult.data.targetId,
			metadata: validationResult.data.metadata,
		});

		return NextResponse.json(interaction);
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
		const entityType = searchParams.get('entityType') as any;
		const entityId = searchParams.get('entityId');
		const startDate = searchParams.get('startDate')
			? new Date(searchParams.get('startDate')!)
			: undefined;
		const endDate = searchParams.get('endDate')
			? new Date(searchParams.get('endDate')!)
			: undefined;

		const service = await getSocialService();
		const interactions = await service.listInteractions({
			userId,
			type,
			entityType,
			entityId: entityId ?? undefined,
			startDate,
			endDate,
		});

		return NextResponse.json(interactions);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

// Comments
export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await commentValidator.validate(request);
		const service = await getSocialService();
		const comment = await service.createComment({
			userId,
			content: validationResult.data.content,
			entityType:
				validationResult.data.targetType === 'post'
					? 'recipe'
					: validationResult.data.targetType,
			entityId: validationResult.data.targetId,
			contentType: 'text',
			status: 'active',
			parentId: validationResult.data.parentId,
			metadata: {
				attachments: validationResult.data.attachments,
			},
		});

		return NextResponse.json(comment);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
