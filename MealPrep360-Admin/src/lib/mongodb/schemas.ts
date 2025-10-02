import mongoose from 'mongoose';
import { User } from '@/models/User';

const feedbackSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		userName: {
			type: String,
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		status: {
			type: String,
			enum: ['pending', 'reviewed', 'resolved'],
			default: 'pending',
		},
	},
	{
		timestamps: true,
	}
);

const jobSchema = new mongoose.Schema(
	{
		id: { type: String, required: true, unique: true },
		type: { type: String, required: true },
		status: { type: String, required: true },
		data: { type: mongoose.Schema.Types.Mixed, required: true },
		result: { type: mongoose.Schema.Types.Mixed },
		error: { type: String },
		attempts: { type: Number, required: true, default: 0 },
		maxAttempts: { type: Number, required: true, default: 3 },
		startedAt: { type: Date },
		completedAt: { type: Date },
		progress: { type: Number, default: 0 },
		total: { type: Number, default: 0 },
	},
	{
		timestamps: true,
	}
);

export { User };

export const Feedback =
	mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
export const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

export const BlogPost =
	mongoose.models.BlogPost ||
	mongoose.model(
		'BlogPost',
		new mongoose.Schema({
			title: { type: String, required: true },
			content: { type: String, required: true },
			excerpt: { type: String, required: true },
			category: { type: String, required: true },
			tags: [{ type: String }],
			imageUrl: { type: String },
			author: { type: String, required: true },
			publishedAt: { type: Date },
			readTime: { type: Number, default: 0 },
			views: { type: Number, default: 0 },
			likes: { type: Number, default: 0 },
			featured: { type: Boolean, default: false },
			published: { type: Boolean, default: false },
			featuredAt: { type: Date },
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
		})
	);

export const Recipe =
	mongoose.models.Recipe ||
	mongoose.model(
		'Recipe',
		new mongoose.Schema({
			title: { type: String, required: true },
			description: { type: String, required: true },
			imageUrl: { type: String },
			servings: { type: Number, required: true },
			prepTime: { type: Number, required: true },
			cookTime: { type: Number, required: true },
			ingredients: { type: String, required: true },
			instructions: { type: String, required: true },
			categories: [{ type: String }],
			tags: [{ type: String }],
			prepInstructions: { type: String },
			cookingInstructions: { type: String },
			freezerPrep: { type: String },
			containerSuggestions: { type: String },
			storageTime: { type: String },
			defrostInstructions: { type: String },
			servingInstructions: { type: String },
			isPublic: { type: Boolean, default: false },
			createdAt: { type: Date, default: Date.now, index: true },
			updatedAt: { type: Date, default: Date.now },
		})
	);

export const ImageReport =
	mongoose.models.ImageReport ||
	mongoose.model(
		'ImageReport',
		new mongoose.Schema({
			recipeId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Recipe',
				required: true,
			},
			reason: {
				type: String,
				required: true,
			},
			status: {
				type: String,
				enum: ['pending', 'resolved'],
				default: 'pending',
			},
			createdAt: {
				type: Date,
				default: Date.now,
			},
			updatedAt: {
				type: Date,
				default: Date.now,
			},
			imageUrl: {
				type: String,
				required: true,
			},
			reporterId: {
				type: String,
				required: true,
			},
			reporterName: {
				type: String,
				required: true,
			},
			reporterEmail: {
				type: String,
				required: true,
			},
		})
	);
