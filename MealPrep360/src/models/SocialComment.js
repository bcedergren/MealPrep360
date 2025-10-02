import mongoose from 'mongoose';

const socialCommentSchema = new mongoose.Schema(
	{
		postId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SocialPost',
			required: true,
		},
		authorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SocialProfile',
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'SocialProfile',
			},
		],
		replies: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'SocialComment',
			},
		],
	},
	{
		timestamps: true,
	}
);

// Index for efficient querying
socialCommentSchema.index({ postId: 1, createdAt: -1 });

// Virtual for likes count
socialCommentSchema.virtual('likesCount').get(function () {
	return this.likes ? this.likes.length : 0;
});

const SocialComment =
	mongoose.models.SocialComment ||
	mongoose.model('SocialComment', socialCommentSchema);

export default SocialComment;
