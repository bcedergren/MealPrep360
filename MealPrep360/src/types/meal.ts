import { Recipe } from '@/types/recipe';

export interface Meal {
	id: string;
	date: Date;
	recipeId: string | null;
	userId: string;
	servings: number;
	createdAt: Date;
	status: 'PLANNED' | 'COOKED' | 'FROZEN' | 'CONSUMED' | 'SKIPPED';
	recipe?: Recipe;
}
