import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
	{
		postId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Post',
			required: true,
		},
		authorId: {
			type: String,
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		parentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Comment',
		},
		likes: [String],
	},
	{
		timestamps: true,
	}
);

export const Comment =
	mongoose.models.Comment || mongoose.model('Comment', commentSchema);
