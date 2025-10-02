import mongoose from 'mongoose';

const socialProfileSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
			unique: true,
		},
		displayName: {
			type: String,
			required: true,
		},
		avatar: {
			type: String,
		},
		bio: {
			type: String,
		},
		location: {
			type: String,
		},
		website: {
			type: String,
		},
		socialLinks: {
			instagram: String,
			twitter: String,
			facebook: String,
			linkedin: String,
		},
		privacySettings: {
			showEmail: {
				type: Boolean,
				default: false,
			},
			showLocation: {
				type: Boolean,
				default: true,
			},
			showSocialLinks: {
				type: Boolean,
				default: true,
			},
		},
		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'SocialProfile',
			},
		],
		followers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'SocialProfile',
			},
		],
	},
	{
		timestamps: true,
	}
);

// Virtual for followers count
socialProfileSchema.virtual('followersCount').get(function () {
	return this.followers ? this.followers.length : 0;
});

// Virtual for following count
socialProfileSchema.virtual('followingCount').get(function () {
	return this.following ? this.following.length : 0;
});

// Virtual for posts count
socialProfileSchema.virtual('postsCount').get(function () {
	return this.posts ? this.posts.length : 0;
});

const SocialProfile =
	mongoose.models.SocialProfile ||
	mongoose.model('SocialProfile', socialProfileSchema);

export default SocialProfile;
