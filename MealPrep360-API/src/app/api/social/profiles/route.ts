import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { ISocialService } from '@/lib/social/interfaces/ISocialService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { UserProfileValidator } from '@/lib/social/validation/SocialValidator';

const profileValidator = new UserProfileValidator();
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

		const validationResult = await profileValidator.validate(request);
		const service = await getSocialService();
		const profile = await service.createSettings({
			userId,
			privacy: {
				profileVisibility:
					(validationResult.data.preferences?.visibility === 'friends'
						? 'followers'
						: validationResult.data.preferences?.visibility) || 'public',
				activityVisibility:
					(validationResult.data.preferences?.visibility === 'friends'
						? 'followers'
						: validationResult.data.preferences?.visibility) || 'public',
				allowMentions: true,
				allowTags: true,
				allowDirectMessages: true,
			},
			notifications: {
				likes: true,
				comments: true,
				follows: true,
				mentions: true,
				tags: true,
				collections: true,
			},
			contentFilters: {
				enabled: false,
			},
			interactions: {
				autoAcceptFollows: true,
				allowReplies: 'everyone',
				defaultCollectionVisibility: 'public',
				moderationLevel: 'low',
			},
		});

		return NextResponse.json(profile);
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

		const validationResult = await profileValidator.validate(request);
		const service = await getSocialService();
		const profile = await service.updateSettings(userId, validationResult.data);

		return NextResponse.json(profile);
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
		const targetUserId = searchParams.get('userId') || userId;

		const service = await getSocialService();
		const profile = await service.getSettings(targetUserId);
		return NextResponse.json(profile);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
