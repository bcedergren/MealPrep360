import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IUserService } from '@/lib/users/interfaces/IUserService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const container = await Container.getInstance();
		const userService = container.getService<IUserService>('userService');

		const stats = await userService.getUserStats(userId);
		return NextResponse.json(stats);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
