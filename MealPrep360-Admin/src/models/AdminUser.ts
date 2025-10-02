import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
	clerkId: string;
	email: string;
	displayName: string;
	role: 'admin' | 'moderator';
	permissions: {
		canManageUsers: boolean;
		canModerateContent: boolean;
		canViewAnalytics: boolean;
		canManageSystem: boolean;
	};
	lastLogin: Date;
	createdAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>({
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
	role: {
		type: String,
		enum: ['admin', 'moderator'],
		default: 'moderator',
	},
	permissions: {
		canManageUsers: {
			type: Boolean,
			default: false,
		},
		canModerateContent: {
			type: Boolean,
			default: true,
		},
		canViewAnalytics: {
			type: Boolean,
			default: false,
		},
		canManageSystem: {
			type: Boolean,
			default: false,
		},
	},
	lastLogin: {
		type: Date,
		default: Date.now,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

AdminUserSchema.methods.hasPermission = function (perm: string) {
	return this.permissions && this.permissions[perm] === true;
};

AdminUserSchema.methods.updateLastLogin = async function () {
	this.lastLogin = new Date();
	await this.save();
};

// Create the model if it doesn't exist, or use the existing one
export const AdminUser =
	mongoose.models.AdminUser ||
	mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
