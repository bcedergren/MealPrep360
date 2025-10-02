import mongoose from 'mongoose';

const socialPostSchema = new mongoose.Schema(
	{
		authorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SocialProfile',
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		images: [
			{
				type: String,
			},
		],
		visibility: {
			type: String,
			enum: ['PUBLIC', 'FRIENDS', 'PRIVATE'],
			default: 'PUBLIC',
		},
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'SocialProfile',
			},
		],
		comments: [
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
socialPostSchema.index({ authorId: 1, createdAt: -1 });
socialPostSchema.index({ hashtags: 1 });

// Virtual for likes count
socialPostSchema.virtual('likesCount').get(function () {
	return this.likes ? this.likes.length : 0;
});

// Virtual for comments count
socialPostSchema.virtual('commentsCount').get(function () {
	return this.comments ? this.comments.length : 0;
});

const SocialPost =
	mongoose.models.SocialPost || mongoose.model('SocialPost', socialPostSchema);

export default SocialPost;
