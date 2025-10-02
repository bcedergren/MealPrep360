import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IGamificationService } from '@/lib/gamification/interfaces/IGamificationService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { AchievementValidator } from '@/lib/gamification/validation/GamificationValidator';

const achievementValidator = new AchievementValidator();
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

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await achievementValidator.validate(request);
		const service = await getGamificationService();
		const achievement = await service.createAchievement({
			...validationResult.data,
			userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return NextResponse.json(achievement);
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
		const type = searchParams.get('type') || undefined;
		const status = searchParams.get('status') || undefined;

		const service = await getGamificationService();
		const achievements = await service.listAchievements({
			userId,
			type,
			status,
		});

		return NextResponse.json(achievements);
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

		const { achievementId, updates } = await request.json();
		if (!achievementId) {
			throw new Error('Achievement ID is required');
		}

		const service = await getGamificationService();
		const achievement = await service.updateAchievement(achievementId, {
			...updates,
			updatedAt: new Date(),
		});

		return NextResponse.json(achievement);
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
		const achievementId = searchParams.get('achievementId');
		if (!achievementId) {
			throw new Error('Achievement ID is required');
		}

		const service = await getGamificationService();
		await service.deleteAchievement(achievementId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
