import mongoose from 'mongoose';
import { Unit, Category } from '../types';

const ingredientSchema = new mongoose.Schema({
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
});

const recipeSchema = new mongoose.Schema({
	title: { type: String, required: true },
	ingredients: [ingredientSchema],
});

export const Recipe = mongoose.model('Recipe', recipeSchema);
