import mongoose, { Schema, Document } from 'mongoose';

export interface IFlaggedContent extends Document {
	contentType: 'post' | 'comment' | 'user';
	contentId: mongoose.Types.ObjectId;
	reportedBy: mongoose.Types.ObjectId[];
	reason: string;
	status: 'pending' | 'reviewed' | 'resolved';
	resolution?: {
		action: 'removed' | 'warned' | 'ignored';
		notes: string;
		resolvedBy: mongoose.Types.ObjectId;
		resolvedAt: Date;
	};
	createdAt: Date;
	updatedAt: Date;
}

const FlaggedContentSchema = new Schema<IFlaggedContent>({
	contentType: {
		type: String,
		enum: ['post', 'comment', 'user'],
		required: true,
	},
	contentId: {
		type: Schema.Types.ObjectId,
		required: true,
	},
	reportedBy: [
		{
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	],
	reason: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		enum: ['pending', 'reviewed', 'resolved'],
		default: 'pending',
	},
	resolution: {
		action: {
			type: String,
			enum: ['removed', 'warned', 'ignored'],
		},
		notes: String,
		resolvedBy: {
			type: Schema.Types.ObjectId,
			ref: 'AdminUser',
		},
		resolvedAt: Date,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Create indexes for better query performance
FlaggedContentSchema.index({ contentType: 1, contentId: 1 });
FlaggedContentSchema.index({ status: 1 });
FlaggedContentSchema.index({ createdAt: -1 });

// Update the updatedAt timestamp before saving
FlaggedContentSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Create the model if it doesn't exist, or use the existing one
export const FlaggedContent =
	mongoose.models.FlaggedContent ||
	mongoose.model<IFlaggedContent>('FlaggedContent', FlaggedContentSchema);
