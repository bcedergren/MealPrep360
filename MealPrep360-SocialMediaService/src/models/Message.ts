import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
	senderId: string;
	recipientId: string;
	content: string;
	isRead: boolean;
	createdAt: Date;
}

const MessageSchema = new Schema({
	senderId: { type: String, required: true },
	recipientId: { type: String, required: true },
	content: { type: String, required: true },
	isRead: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
