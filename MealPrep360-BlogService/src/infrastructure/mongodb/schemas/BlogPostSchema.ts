import { Schema } from 'mongoose';
import { BlogPost } from '../../../core/models/BlogPost';

export const BlogPostSchema: Schema = new Schema<BlogPost>(
	{
		title: {
			type: String,
			required: [true, 'Please provide a title for this blog post'],
			maxlength: [100, 'Title cannot be more than 100 characters'],
		},
		content: {
			type: String,
			required: [true, 'Please provide content for this blog post'],
		},
		slug: {
			type: String,
			required: true,
			unique: true,
		},
		featuredImage: {
			type: String,
			required: false,
		},
		excerpt: {
			type: String,
			required: true,
			maxlength: [200, 'Excerpt cannot be more than 200 characters'],
		},
		author: {
			type: String,
			required: true,
		},
		tags: [
			{
				type: String,
			},
		],
		status: {
			type: String,
			enum: ['draft', 'published'],
			default: 'draft',
		},
	},
	{
		timestamps: true,
	}
);
