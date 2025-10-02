import mongoose from 'mongoose';
import { Ingredient, Unit, Category } from '../types';

const shoppingListSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	recipeIds: [{ type: String, required: true }],
	items: [
		{
			name: { type: String, required: true },
			amount: { type: Number, required: true },
			unit: {
				type: String,
				enum: [
					'g',
					'kg',
					'oz',
					'lb',
					'ml',
					'l',
					'cup',
					'tbsp',
					'tsp',
					'piece',
					'whole',
					'pinch',
				],
				required: true,
			},
			category: {
				type: String,
				enum: [
					'Produce',
					'Dairy',
					'Meat',
					'Seafood',
					'Pantry',
					'Spices',
					'Bakery',
					'Frozen',
					'Other',
				],
				required: true,
			},
			normalizedAmount: { type: Number, required: true },
			normalizedUnit: {
				type: String,
				enum: [
					'g',
					'kg',
					'oz',
					'lb',
					'ml',
					'l',
					'cup',
					'tbsp',
					'tsp',
					'piece',
					'whole',
					'pinch',
				],
				required: true,
			},
		},
	],
	createdAt: { type: Date, default: Date.now },
});

export const ShoppingList = mongoose.model('ShoppingList', shoppingListSchema);
