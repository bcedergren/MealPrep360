import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
	{
		followerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SocialProfile',
			required: true,
		},
		followingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SocialProfile',
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Ensure a user can't follow the same person twice
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow = mongoose.models.Follow || mongoose.model('Follow', followSchema);

export default Follow;
