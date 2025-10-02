import mongoose, { Schema, Document, Types } from 'mongoose';

// Minimal IPost interface
export interface IPost extends Document {
	authorId: Types.ObjectId;
	createdAt: Date;
	tags?: string[];
	// Add other fields as needed
}

// Define PostSchema
const PostSchema = new Schema<IPost>({
	authorId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
	createdAt: { type: Date, default: Date.now },
	tags: [{ type: String }],
	// Add other fields as needed
});

// Index for efficient querying
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });

export const Post =
	mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
