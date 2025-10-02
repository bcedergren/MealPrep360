import { BaseRouteHandler } from '@/lib/core/api/BaseRouteHandler';
import { UserCreateValidator } from '@/lib/users/validation/UserValidator';
import { Container } from '@/lib/container/Container';
import { IUserService } from '@/lib/users/interfaces/IUserService';
import { UserCreateDTO } from '@/lib/users/types';
import { IUserDocument } from '@/lib/users/types/user';
import { auth } from '@clerk/nextjs/server';

class UserRouteHandler extends BaseRouteHandler<UserCreateDTO, IUserDocument> {
	protected validator = new UserCreateValidator();
	private userService: IUserService | null = null;

	private async getUserService(): Promise<IUserService> {
		if (!this.userService) {
			const container = await Container.getInstance();
			this.userService = container.getService<IUserService>('userService');
		}
		return this.userService;
	}

	async POST(request: Request) {
		return this.handleRequest(request, async (data) => {
			const { userId } = await auth();
			const service = await this.getUserService();
			return await service.createUser({
				...data,
				clerkId: userId!,
			});
		});
	}

	async GET(request: Request) {
		return this.handleAuthenticatedRequest(async (userId) => {
			const service = await this.getUserService();
			return await service.getUser(userId);
		});
	}
}

const handler = new UserRouteHandler();
export const POST = handler.POST.bind(handler);
export const GET = handler.GET.bind(handler);
