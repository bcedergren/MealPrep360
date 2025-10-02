import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile extends Document {
	clerkId: string;
	displayName: string;
	bio?: string;
	profilePicture?: string;
	badges: string[];
	privacySettings: {
		isProfilePublic: boolean;
		isMealPlansPublic: boolean;
	};
	followers: string[];
	following: string[];
	createdAt: Date;
	updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
	{
		clerkId: { type: String, required: true, unique: true },
		displayName: { type: String, required: true },
		bio: { type: String },
		profilePicture: { type: String },
		badges: [{ type: String }],
		privacySettings: {
			isProfilePublic: { type: Boolean, default: true },
			isMealPlansPublic: { type: Boolean, default: false },
		},
		followers: [{ type: String }],
		following: [{ type: String }],
	},
	{ timestamps: true }
);

export const UserProfile =
	mongoose.models.UserProfile ||
	mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
