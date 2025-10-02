import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipeVersion extends Document {
	recipeId: mongoose.Types.ObjectId;
	version: number;
	authorId: string;
	changes: Array<{
		field: string;
		oldValue: string;
		newValue: string;
	}>;
	comment?: string;
	createdAt: Date;
	updatedAt: Date;
}

const RecipeVersionSchema = new Schema<IRecipeVersion>(
	{
		recipeId: {
			type: Schema.Types.ObjectId,
			ref: 'Recipe',
			required: true,
		},
		version: {
			type: Number,
			required: true,
		},
		authorId: {
			type: String,
			required: true,
		},
		changes: [
			{
				field: {
					type: String,
					required: true,
				},
				oldValue: {
					type: String,
					required: true,
				},
				newValue: {
					type: String,
					required: true,
				},
			},
		],
		comment: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

// Create compound index for efficient querying
RecipeVersionSchema.index({ recipeId: 1, version: 1 });

export const RecipeVersion =
	mongoose.models.RecipeVersion ||
	mongoose.model<IRecipeVersion>('RecipeVersion', RecipeVersionSchema);
