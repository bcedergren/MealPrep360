import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IUserService } from '@/lib/users/interfaces/IUserService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const container = await Container.getInstance();
		const userService = container.getService<IUserService>('userService');

		const data = await request.json();
		const { type, preferences } = data;

		let updatedUser;
		switch (type) {
			case 'dietary':
				updatedUser = await userService.updateDietaryPreferences(
					userId,
					preferences
				);
				break;
			case 'cooking':
				updatedUser = await userService.updateCookingPreferences(
					userId,
					preferences
				);
				break;
			case 'notifications':
				updatedUser = await userService.updateNotificationPreferences(
					userId,
					preferences
				);
				break;
			default:
				throw new Error('Invalid preference type');
		}

		return NextResponse.json(updatedUser);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
