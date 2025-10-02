import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
	userId: string;
	type: 'message' | 'comment' | 'follow' | 'collaboration';
	content: string;
	data: Record<string, any>;
	isRead: boolean;
	createdAt: Date;
}

const NotificationSchema = new Schema({
	userId: { type: String, required: true, index: true },
	type: { type: String, required: true },
	content: { type: String, required: true },
	data: { type: Schema.Types.Mixed },
	isRead: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

export const Notification = mongoose.model<INotification>(
	'Notification',
	NotificationSchema
);
