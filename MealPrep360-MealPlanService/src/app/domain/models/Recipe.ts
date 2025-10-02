export interface Recipe {
	id: string;
	userId: string;
	title: string;
	description: string;
	ingredients: string[];
	prepInstructions: string[];
	prepTime: number;
	cookTime: number;
	servings: number;
	tags: string[];
	storageTime: number;
	containerSuggestions: string[];
	defrostInstructions: string[];
	cookingInstructions: string[];
	servingInstructions: string[];
	season: string;
	embedding: number[];
	images: Record<string, any>;
	isPublic: boolean;
	allergenInfo: string[];
	dietaryInfo: string[];
	hasImage: boolean;
	isPlaceholder: boolean;
	createdAt: string;
	updatedAt: string;
}
