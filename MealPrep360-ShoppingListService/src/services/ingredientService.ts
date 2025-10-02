import { IngredientReference } from '../models/IngredientReference';
import type { Category, IIngredientReference } from '../types';

export async function normalizeIngredient(name: string, category?: Category) {
	const normalizedName = name.toLowerCase().trim();

	// Try to find existing reference
	const reference = await IngredientReference.findOne({
		$or: [{ name: normalizedName }, { alternateNames: normalizedName }],
	});

	if (reference) {
		return {
			name: reference.displayName,
			category: reference.category,
			defaultUnit: reference.defaultUnit,
			defaultAmount: reference.defaultAmount,
			isCommonPantryItem: reference.isCommonPantryItem,
		};
	}

	// If no reference found and category provided, create a new one
	if (category) {
		const newReference = new IngredientReference({
			name: normalizedName,
			displayName: name.trim(),
			category,
			defaultUnit: 'piece',
			defaultAmount: 1,
			alternateNames: [],
			isCommonPantryItem: false,
		});
		await newReference.save();

		return {
			name: newReference.displayName,
			category: newReference.category,
			defaultUnit: newReference.defaultUnit,
			defaultAmount: newReference.defaultAmount,
			isCommonPantryItem: newReference.isCommonPantryItem,
		};
	}

	// If no reference and no category, return null
	return null;
}

export async function findSimilarIngredients(
	name: string
): Promise<IIngredientReference[]> {
	const normalizedName = name.toLowerCase().trim();

	return IngredientReference.find({
		$or: [
			{ name: { $regex: normalizedName, $options: 'i' } },
			{ alternateNames: { $regex: normalizedName, $options: 'i' } },
			{ displayName: { $regex: normalizedName, $options: 'i' } },
		],
	}).limit(5);
}

export async function getIngredientsByCategory(
	category: Category
): Promise<IIngredientReference[]> {
	return IngredientReference.find({ category }).sort({ name: 1 });
}

export async function getCommonPantryItems(): Promise<IIngredientReference[]> {
	return IngredientReference.find({ isCommonPantryItem: true }).sort({
		name: 1,
	});
}
