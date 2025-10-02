export interface RecipeCreateDTO {
	title: string;
	description?: string;
	ingredients: string[];
	instructions: string[];
	prepTime?: number;
	cookTime?: number;
	servings?: number;
	difficulty?: 'easy' | 'medium' | 'hard';
	cuisine?: string;
	tags?: string[];
	imageUrl?: string;
	isPublic?: boolean;
	userId: string;
}

export interface RecipeFilterDTO {
	title?: string;
	description?: string;
	cuisine?: string;
	difficulty?: 'easy' | 'medium' | 'hard';
	tags?: string[];
	isPublic?: boolean;
	userId?: string;
	prepTime?: {
		min?: number;
		max?: number;
	};
	cookTime?: {
		min?: number;
		max?: number;
	};
}
