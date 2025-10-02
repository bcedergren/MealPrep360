import { Document, Model } from 'mongoose';

export interface Ingredient {
	name: string;
	amount: number;
	unit: string;
}

export interface TranslatedIngredient extends Ingredient {
	translations: {
		[language: string]: {
			name: string;
		};
	};
}

export interface Instruction {
	step: number;
	text: string;
}

export interface TranslatedInstruction extends Instruction {
	translations: {
		[language: string]: {
			text: string;
		};
	};
}

export interface RecipeTranslation {
	title: string;
	summary: string;
	category: string;
	cuisine: string;
	tags: string[];
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type DietaryInfo =
	| 'VEGETARIAN'
	| 'VEGAN'
	| 'GLUTEN_FREE'
	| 'DAIRY_FREE'
	| 'NUT_FREE';
export type AllergenInfo =
	| 'GLUTEN'
	| 'DAIRY'
	| 'NUTS'
	| 'EGGS'
	| 'SOY'
	| 'FISH'
	| 'SHELLFISH';

export interface RecipeDocument extends Document {
	_id: string;
	title: string;
	description: string;
	ingredients: string;
	instructions: string;
	imageUrl: string;
	imageBase64?: string;
	prepTime: number;
	servings: number;
	tags: string[];
	clerkId: string;
	spoonacularId?: string;
	defrostInstructions?: string;
	freezerPrep?: string;
	containerSuggestions?: string;
	cookingInstructions?: string;
	servingInstructions?: string;
	storageTime?: string;
	cookTime: number;
	prepInstructions?: string;
	hasImage: boolean;
	season?: string;
	isPublic: boolean;
	isPlaceholder: boolean;
	analysis?: any;
	originalLanguage: string;
	category?: string;
	cuisine?: string;
	summary?: string;
	difficulty?: string;
	mealType?: string;
	allergenInfo: string[];
	dietaryInfo: string[];
	nutrition?: {
		calories?: number;
		protein?: number;
		carbs?: number;
		fat?: number;
		fiber?: number;
		sugar?: number;
		sodium?: number;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface RecipePlainObject {
	_id: string;
	id: string;
	title: string;
	description: string;
	ingredients: { name: string; quantity: number; unit: string }[];
	instructions: string[];
	imageUrl: string;
	imageBase64?: string;
	prepTime: number;
	servings: number;
	tags: string[];
	clerkId: string;
	spoonacularId?: string;
	defrostInstructions?: string;
	freezerPrep?: string;
	containerSuggestions?: string;
	cookingInstructions?: string;
	servingInstructions?: string;
	storageTime?: string;
	cookTime: number;
	prepInstructions?: string;
	hasImage: boolean;
	season?: string;
	isPublic: boolean;
	isPlaceholder: boolean;
	analysis?: any;
	originalLanguage: string;
	category?: string;
	cuisine?: string;
	summary?: string;
	difficulty?: string;
	mealType?: string;
	allergenInfo: string[];
	dietaryInfo: string[];
	nutrition?: {
		calories?: number;
		protein?: number;
		carbs?: number;
		fat?: number;
		fiber?: number;
		sugar?: number;
		sodium?: number;
	};
	createdAt: Date;
	updatedAt: Date;
	isSaved?: boolean;
}

export type Recipe = RecipePlainObject;

export interface MongoRecipe {
	_id: string;
	title: string;
	description: string;
	ingredients: Array<{
		name: string;
		amount: string;
		unit: string;
		_id: string;
	}>;
	prepInstructions: string[];
	cookTime: number;
	servings: number;
	tags: string[];
	storageTime: number;
	containerSuggestions: string[];
	defrostInstructions: string[];
	cookingInstructions: string[];
	servingInstructions: string[];
	season: string;
	createdAt: string;
	updatedAt: string;
	images: {
		main: string;
		thumbnail: string;
	};
	isPublic: boolean;
}

export function transformMongoRecipe(recipe: MongoRecipe): RecipePlainObject {
	return {
		_id: recipe._id,
		id: recipe._id,
		title: recipe.title,
		description: sanitizeText(recipe.description),
		ingredients: recipe.ingredients.map((ing) => ({
			name: ing.name,
			quantity: parseFloat(ing.amount),
			unit: ing.unit,
		})),
		instructions: recipe.cookingInstructions,
		imageUrl: recipe.images?.main || '',
		imageBase64: undefined,
		prepTime: 0,
		servings: recipe.servings,
		tags: recipe.tags,
		clerkId: '',
		spoonacularId: undefined,
		defrostInstructions: sanitizeText(recipe.defrostInstructions.join('\n')),
		freezerPrep: '',
		containerSuggestions: sanitizeText(recipe.containerSuggestions.join('\n')),
		cookingInstructions: sanitizeText(recipe.cookingInstructions.join('\n')),
		servingInstructions: sanitizeText(recipe.servingInstructions.join('\n')),
		storageTime: sanitizeText(recipe.storageTime.toString()),
		cookTime: recipe.cookTime,
		prepInstructions: sanitizeText(recipe.prepInstructions.join('\n')),
		hasImage: !!recipe.images?.main,
		season: recipe.season,
		isPublic: recipe.isPublic,
		isPlaceholder: false,
		analysis: null,
		originalLanguage: 'en',
		category: '',
		cuisine: '',
		summary: '',
		difficulty: 'easy',
		mealType: 'dinner',
		allergenInfo: [],
		dietaryInfo: [],
		nutrition: undefined,
		createdAt: new Date(recipe.createdAt),
		updatedAt: new Date(recipe.updatedAt),
	};
}

function sanitizeText(text: string): string {
	return text || '';
}
