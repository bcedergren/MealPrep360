import { BaseRouteHandler } from '@/lib/core/api/BaseRouteHandler';
import { RecipeValidator } from '@/lib/recipes/validation/RecipeValidator';
import { RecipeService } from '@/lib/recipes/services/RecipeService';
import { Container } from '@/lib/container/Container';
import { RecipeCreateDTO, RecipeFilterDTO } from '@/lib/recipes/types';
import { IRecipeDocument } from '@/lib/recipes/types/recipe';

class RecipeRouteHandler extends BaseRouteHandler<
	RecipeCreateDTO,
	IRecipeDocument | IRecipeDocument[]
> {
	protected validator = new RecipeValidator();
	private recipeService: RecipeService | null = null;

	private async getRecipeService(): Promise<RecipeService> {
		if (!this.recipeService) {
			const container = await Container.getInstance();
			this.recipeService = container.getService<RecipeService>('recipeService');
		}
		return this.recipeService;
	}

	async POST(request: Request) {
		return this.handleRequest(request, async (data, userId) => {
			const service = await this.getRecipeService();
			return await service.createRecipe({
				...data,
				userId,
			});
		});
	}

	async GET(request: Request) {
		return this.handleAuthenticatedRequest(async (userId) => {
			const { searchParams } = new URL(request.url);
			const filter: Partial<RecipeFilterDTO> = {
				userId,
				title: searchParams.get('search') || undefined,
				tags: searchParams.get('tags')?.split(','),
				prepTime:
					searchParams.get('prepTime') === 'quick'
						? { max: 30 }
						: searchParams.get('prepTime') === 'medium'
							? { min: 31, max: 60 }
							: searchParams.get('prepTime') === 'long'
								? { min: 61 }
								: undefined,
			};

			const service = await this.getRecipeService();
			return await service.searchRecipes(filter);
		});
	}
}

const handler = new RecipeRouteHandler();
export const POST = handler.POST.bind(handler);
export const GET = handler.GET.bind(handler);
