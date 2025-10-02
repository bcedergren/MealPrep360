import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
	clerkId: string;
	email: string;
	displayName: string;
	avatarUrl: string;
	role: string;
	followers: mongoose.Types.ObjectId[];
	following: mongoose.Types.ObjectId[];
	preferences: {
		showPublicFeed: boolean;
		defaultBatchSize: number;
		notifications: {
			email: boolean;
			push: boolean;
			inApp: boolean;
			types: {
				new_follower: boolean;
				new_comment: boolean;
				new_reaction: boolean;
				new_share: boolean;
				meal_prep_invite: boolean;
				challenge_completed: boolean;
			};
		};
	};
	createdAt: Date;
	lastLogin: Date;
}

const UserSchema = new Schema<IUser>({
	clerkId: {
		type: String,
		required: true,
		unique: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	displayName: {
		type: String,
		required: true,
	},
	avatarUrl: {
		type: String,
		default: '',
	},
	role: {
		type: String,
		enum: ['user', 'admin'],
		default: 'user',
	},
	followers: [
		{
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	],
	following: [
		{
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	],
	preferences: {
		showPublicFeed: {
			type: Boolean,
			default: true,
		},
		defaultBatchSize: {
			type: Number,
			default: 4,
		},
		notifications: {
			email: {
				type: Boolean,
				default: true,
			},
			push: {
				type: Boolean,
				default: true,
			},
			inApp: {
				type: Boolean,
				default: true,
			},
			types: {
				new_follower: {
					type: Boolean,
					default: true,
				},
				new_comment: {
					type: Boolean,
					default: true,
				},
				new_reaction: {
					type: Boolean,
					default: true,
				},
				new_share: {
					type: Boolean,
					default: true,
				},
				meal_prep_invite: {
					type: Boolean,
					default: true,
				},
				challenge_completed: {
					type: Boolean,
					default: true,
				},
			},
		},
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	lastLogin: {
		type: Date,
		default: Date.now,
	},
});

// Add methods to the schema
UserSchema.methods.updateLastLogin = async function () {
	this.lastLogin = new Date();
	return this.save();
};

UserSchema.methods.follow = async function (userId: mongoose.Types.ObjectId) {
	if (!this.following.includes(userId)) {
		this.following.push(userId);
		await this.save();
	}
};

UserSchema.methods.unfollow = async function (userId: mongoose.Types.ObjectId) {
	this.following = this.following.filter(
		(id: mongoose.Types.ObjectId) => !id.equals(userId)
	);
	await this.save();
};

// Create the model if it doesn't exist, or use the existing one
export const User =
	mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
