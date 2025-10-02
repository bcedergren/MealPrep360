import {
	Recipe,
	MealPlanItem,
	NormalizedIngredient,
	Category,
} from '../types/ingredients';
import { Unit } from '../types/units';
import { IIngredientParser } from './ingredientParser';
import { IUnitConverter } from './unitConverter';
import { INameNormalizer } from './nameNormalizer';
import { ICategoryManager } from './categoryManager';
import { IQuantityCalculator } from './quantityCalculator';

export interface IShoppingListGenerator {
	generateShoppingList(
		recipes: Recipe[],
		mealPlan: MealPlanItem[],
		pantryExclusions?: string[]
	): Promise<NormalizedIngredient[]>;
}

export class ShoppingListGenerator implements IShoppingListGenerator {
	constructor(
		private ingredientParser: IIngredientParser,
		private unitConverter: IUnitConverter,
		private nameNormalizer: INameNormalizer,
		private categoryManager: ICategoryManager,
		private quantityCalculator: IQuantityCalculator
	) {}

	async generateShoppingList(
		recipes: Recipe[],
		mealPlan: MealPlanItem[],
		pantryExclusions: string[] = []
	): Promise<NormalizedIngredient[]> {
		// Validate input recipes
		this.validateRecipes(recipes);

		// Extract and process all ingredients from recipes
		const allIngredients = await this.extractIngredients(recipes, mealPlan);

		// Filter out empty recipe results and flatten the array
		const flattenedIngredients = allIngredients.filter(
			(ingredient): ingredient is NormalizedIngredient => ingredient !== null
		);
		if (flattenedIngredients.length === 0) {
			throw new Error('No valid ingredients found in recipes');
		}

		// Filter out pantry exclusions
		const filteredIngredients = flattenedIngredients.filter(
			(ingredient) => !pantryExclusions.includes(ingredient.name.toLowerCase())
		);

		// Combine similar ingredients
		const combinedIngredients =
			await this.combineIngredients(filteredIngredients);

		// Sort the final shopping list by category and name
		return this.sortShoppingList(Array.from(combinedIngredients.values()));
	}

	private validateRecipes(recipes: Recipe[]): void {
		if (!recipes || !Array.isArray(recipes)) {
			throw new Error(
				'Invalid recipes array provided to shopping list service'
			);
		}

		recipes.forEach((recipe, index) => {
			if (!recipe || typeof recipe !== 'object') {
				throw new Error(`Invalid recipe at index ${index}`);
			}
			if (!recipe._id) {
				throw new Error(`Recipe at index ${index} is missing _id`);
			}
			if (!recipe.title) {
				throw new Error(`Recipe with ID ${recipe._id} is missing title`);
			}
			if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
				throw new Error(
					`Recipe "${recipe.title}" has invalid ingredients array`
				);
			}
		});
	}

	private async extractIngredients(
		recipes: Recipe[],
		mealPlan: MealPlanItem[]
	): Promise<(NormalizedIngredient | null)[]> {
		const processedIngredients: Promise<NormalizedIngredient | null>[] = [];

		for (const recipe of recipes) {
			const mealPlanItem = mealPlan.find(
				(item) => item.recipeId === recipe._id
			);
			if (!mealPlanItem) {
				console.log(
					`No meal plan item found for recipe ${recipe.title} (ID: ${recipe._id})`
				);
				continue;
			}

			for (const ingredient of recipe.ingredients) {
				processedIngredients.push(
					this.processIngredient(ingredient, mealPlanItem.servings)
				);
			}
		}

		return Promise.all(processedIngredients);
	}

	private async processIngredient(
		ingredient: any,
		servings: number
	): Promise<NormalizedIngredient | null> {
		// Parse the ingredient if it's a string
		const parsedIngredient =
			typeof ingredient === 'string'
				? this.ingredientParser.parseIngredientString(ingredient)
				: {
						name: ingredient.name,
						quantity: ingredient.amount ? Number(ingredient.amount) : null,
						unit: ingredient.unit || null,
					};

		// Clean the name
		const cleanedName = this.nameNormalizer.cleanIngredientName(
			parsedIngredient.name
		);
		if (!cleanedName) {
			return null;
		}

		// Get or normalize the category
		const category =
			ingredient.category ||
			(await this.categoryManager.normalizeCategory(cleanedName));

		// Handle "to taste" ingredients
		if (parsedIngredient.quantity === null) {
			return {
				name: cleanedName,
				amount: null,
				unit: null,
				category,
				normalizedAmount: 0,
				normalizedUnit: 'piece' as Unit,
			};
		}

		// Validate quantity
		if (isNaN(parsedIngredient.quantity) || parsedIngredient.quantity < 0) {
			throw new Error(
				`Invalid quantity "${parsedIngredient.quantity}" for ingredient "${parsedIngredient.name}"`
			);
		}

		// Calculate servings amount
		const servingsAmount = parsedIngredient.quantity * servings;

		// Normalize unit and convert quantity if needed
		const originalUnit = parsedIngredient.unit || 'piece';
		const normalizedUnit = this.unitConverter.normalizeUnit(originalUnit);
		const convertedAmount = this.unitConverter.convert(
			servingsAmount,
			originalUnit,
			normalizedUnit
		);

		// Round quantity to friendly fraction
		const roundedAmount =
			this.quantityCalculator.roundToFriendlyFraction(convertedAmount);

		return {
			name: cleanedName,
			amount: roundedAmount,
			unit: normalizedUnit,
			category,
			normalizedAmount: roundedAmount,
			normalizedUnit: normalizedUnit,
		};
	}

	private async combineIngredients(
		ingredients: NormalizedIngredient[]
	): Promise<Map<string, NormalizedIngredient>> {
		const combined = new Map<string, NormalizedIngredient>();

		for (const ingredient of ingredients) {
			const key = await this.generateIngredientKey(ingredient);
			const existing = combined.get(key);

			if (!existing) {
				combined.set(key, { ...ingredient });
				continue;
			}

			// Handle "to taste" ingredients
			if (ingredient.amount === null || existing.amount === null) {
				continue;
			}

			// Try to combine amounts if units are compatible
			if (existing.unit === ingredient.unit) {
				existing.amount = this.quantityCalculator.roundToFriendlyFraction(
					existing.amount + ingredient.amount
				);
				existing.normalizedAmount = existing.amount;
			} else {
				// If units are different, try to convert and combine
				const convertedAmount = this.unitConverter.convert(
					ingredient.amount,
					ingredient.unit || 'piece',
					existing.unit || 'piece'
				);
				existing.amount = this.quantityCalculator.roundToFriendlyFraction(
					existing.amount + convertedAmount
				);
				existing.normalizedAmount = existing.amount;
			}
		}

		return combined;
	}

	private async generateIngredientKey(
		ingredient: NormalizedIngredient
	): Promise<string> {
		const normalizedName = this.nameNormalizer.cleanIngredientName(
			ingredient.name
		);
		return `${normalizedName}-${ingredient.category}`;
	}

	private sortShoppingList(
		ingredients: NormalizedIngredient[]
	): NormalizedIngredient[] {
		const categoryOrder: Record<Category, number> = {
			Produce: 1,
			Meat: 2,
			Seafood: 3,
			Dairy: 4,
			Pantry: 5,
			Spices: 6,
			Frozen: 7,
			Bakery: 8,
			Other: 9,
		};

		return ingredients.sort((a, b) => {
			// First sort by category
			const categoryDiff =
				(categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
			if (categoryDiff !== 0) return categoryDiff;

			// Then sort alphabetically by name within category
			return a.name.localeCompare(b.name);
		});
	}
}
