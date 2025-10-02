import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipe extends Document {
	authorId: string;
	title: string;
	description: string;
	ingredients: {
		name: string;
		amount: number;
		unit: string;
	}[];
	instructions: {
		step: number;
		description: string;
		imageUrl?: string;
	}[];
	prepTime: number;
	cookTime: number;
	servings: number;
	difficulty: 'easy' | 'medium' | 'hard';
	tags: string[];
	images: string[];
	isPublic: boolean;
	collaborators: {
		userId: string;
		role: 'viewer' | 'editor' | 'admin';
	}[];
	version: number;
	parentRecipeId?: string;
	forks: number;
	likes: number;
	createdAt: Date;
	updatedAt: Date;
}

const RecipeSchema = new Schema(
	{
		authorId: { type: String, required: true, index: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
		ingredients: [
			{
				name: { type: String, required: true },
				amount: { type: Number, required: true },
				unit: { type: String, required: true },
			},
		],
		instructions: [
			{
				step: { type: Number, required: true },
				description: { type: String, required: true },
				imageUrl: String,
			},
		],
		prepTime: { type: Number, required: true },
		cookTime: { type: Number, required: true },
		servings: { type: Number, required: true },
		difficulty: {
			type: String,
			required: true,
			enum: ['easy', 'medium', 'hard'],
		},
		tags: [{ type: String }],
		images: [{ type: String }],
		isPublic: { type: Boolean, default: false },
		collaborators: [
			{
				userId: { type: String, required: true },
				role: {
					type: String,
					required: true,
					enum: ['viewer', 'editor', 'admin'],
				},
			},
		],
		version: { type: Number, default: 1 },
		parentRecipeId: { type: Schema.Types.ObjectId, ref: 'Recipe' },
		forks: { type: Number, default: 0 },
		likes: { type: Number, default: 0 },
	},
	{
		timestamps: true,
	}
);

// Indexes for efficient querying
RecipeSchema.index({ authorId: 1, createdAt: -1 });
RecipeSchema.index({ tags: 1 });
RecipeSchema.index({ isPublic: 1, likes: -1 });
RecipeSchema.index({ parentRecipeId: 1 });

export const Recipe =
	mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);
