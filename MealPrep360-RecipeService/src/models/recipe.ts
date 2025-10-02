import mongoose from 'mongoose';
import { IRecipeBase, IIngredient } from './interfaces/IRecipeBase';
import { IRecipeInstructions } from './interfaces/IRecipeInstructions';
import { IRecipeMetadata } from './interfaces/IRecipeMetadata';
import { IRecipeMedia } from './interfaces/IRecipeMedia';

export interface IRecipe extends IRecipeBase, IRecipeInstructions, IRecipeMetadata, IRecipeMedia {
  id?: string;
  _id?: string;
}

const ingredientSchema = new mongoose.Schema<IIngredient>({
  name: { type: String, required: true },
  amount: { type: String, required: true },
  unit: { type: String, required: true },
});

const recipeSchema = new mongoose.Schema<IRecipe>({
  // Base
  title: { type: String, required: true },
  description: { type: String, required: true },
  ingredients: [ingredientSchema],
  prepTime: { type: Number, required: true },
  cookTime: { type: Number, required: true },
  servings: { type: Number, required: true },

  // Instructions
  prepInstructions: [{ type: String, required: true }],
  cookingInstructions: [{ type: String, required: true }],
  servingInstructions: [{ type: String, required: true }],
  defrostInstructions: [{ type: String, required: true }],
  containerSuggestions: [{ type: String, required: true }],
  storageTime: { type: Number, required: true },

  // Metadata
  tags: [{ type: String }],
  season: { type: String, required: true },
  allergenInfo: [{ type: String }],
  dietaryInfo: [{ type: String }],
  regions: [{ type: String }],
  cuisineTypes: [{ type: String }],
  climateZones: [{ type: String }],
  culturalTags: [{ type: String }],
  originalLanguage: { type: String, default: 'en' },
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },

  // Media
  images: {
    main: { type: String },
    thumbnail: { type: String },
    additional: [{ type: String }],
  },
  imageGenerationJobId: { type: String },
  hasImage: { type: Boolean, default: false },
  embedding: { type: [Number], required: false },
});

// Update the updatedAt timestamp before saving
recipeSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema);