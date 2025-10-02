import { BaseRouteHandler } from '@/lib/core/api/BaseRouteHandler';
import { ShoppingListValidator } from '@/lib/shopping/validation/ShoppingListValidator';
import { Container } from '@/lib/container/Container';
import { IShoppingListService } from '@/lib/shopping/interfaces/IShoppingListService';
import { ShoppingListCreateDTO } from '@/lib/shopping/types';
import { IShoppingListDocument } from '@/lib/shopping/types/shopping-list';

class ShoppingListRouteHandler extends BaseRouteHandler<
	ShoppingListCreateDTO,
	IShoppingListDocument | IShoppingListDocument[] | null
> {
	protected validator = new ShoppingListValidator();
	private shoppingListService: IShoppingListService | null = null;

	private async getShoppingListService(): Promise<IShoppingListService> {
		if (!this.shoppingListService) {
			const container = await Container.getInstance();
			this.shoppingListService = container.getService<IShoppingListService>(
				'shoppingListService'
			);
		}
		return this.shoppingListService;
	}

	async POST(request: Request) {
		return this.handleRequest(request, async (data, userId) => {
			// Check if we should generate from meal plan
			if (data.mealPlanId) {
				const service = await this.getShoppingListService();
				return await service.generateFromMealPlan(data.mealPlanId, userId, {
					excludeItems: data.excludeItems,
					preferences: data.preferences,
				});
			}

			// Create regular shopping list
			const service = await this.getShoppingListService();
			return await service.createShoppingList({
				...data,
				userId,
			});
		});
	}

	async GET(request: Request) {
		return this.handleAuthenticatedRequest(async (userId) => {
			const { searchParams } = new URL(request.url);
			// Accept and ignore cache-buster param if present
			searchParams.get('t');
			const startDate = searchParams.get('startDate');
			const endDate = searchParams.get('endDate');

			if (startDate && endDate) {
				const service = await this.getShoppingListService();
				return await service.getShoppingListsByDateRange(
					userId,
					new Date(startDate),
					new Date(endDate)
				);
			}

			const service = await this.getShoppingListService();
			return await service.getActiveShoppingList(userId);
		});
	}
}

const handler = new ShoppingListRouteHandler();
export const POST = handler.POST.bind(handler);
export const GET = handler.GET.bind(handler);
