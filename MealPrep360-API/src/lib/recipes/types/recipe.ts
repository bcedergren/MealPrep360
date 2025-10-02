import { Document } from 'mongoose';

export interface IRecipeDocument extends Document {
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
	isPublic: boolean;
	userId: string;
	savedBy?: string[];
	createdAt: Date;
	updatedAt: Date;
}
