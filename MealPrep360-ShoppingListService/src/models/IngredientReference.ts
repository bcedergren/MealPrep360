import mongoose from 'mongoose';
import { Category } from '../types';

const ingredientReferenceSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	},
	displayName: {
		type: String,
		required: true,
		trim: true,
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
	alternateNames: [
		{
			type: String,
			lowercase: true,
			trim: true,
		},
	],
	defaultUnit: {
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
	defaultAmount: {
		type: Number,
		required: true,
	},
	isCommonPantryItem: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Add text index for better search
ingredientReferenceSchema.index({
	name: 'text',
	alternateNames: 'text',
	displayName: 'text',
});

// Update the updatedAt timestamp before saving
ingredientReferenceSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

export const IngredientReference = mongoose.model(
	'IngredientReference',
	ingredientReferenceSchema
);

// Helper function to get or create an ingredient reference
export async function getOrCreateIngredientReference(
	name: string,
	category: Category
) {
	const normalizedName = name.toLowerCase().trim();

	// Try to find existing reference
	let reference = await IngredientReference.findOne({
		$or: [{ name: normalizedName }, { alternateNames: normalizedName }],
	});

	if (!reference) {
		// Create new reference with basic info
		reference = new IngredientReference({
			name: normalizedName,
			displayName: name.trim(),
			category,
			defaultUnit: 'piece', // Default unit
			defaultAmount: 1, // Default amount
			alternateNames: [],
		});
		await reference.save();
	}

	return reference;
}
