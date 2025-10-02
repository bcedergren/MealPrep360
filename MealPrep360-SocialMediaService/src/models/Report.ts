import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
	contentId: string;
	reporterId: string;
	reason: string;
	status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'removed';
	moderatorId?: string;
	reviewedAt?: Date;
	flaggedAt?: Date;
	removedAt?: Date;
	createdAt: Date;
}

const ReportSchema = new Schema({
	contentId: { type: String, required: true, index: true },
	reporterId: { type: String, required: true },
	reason: { type: String, required: true },
	status: { type: String, required: true, default: 'pending' },
	moderatorId: String,
	reviewedAt: Date,
	flaggedAt: Date,
	removedAt: Date,
	createdAt: { type: Date, default: Date.now },
});

export const Report = mongoose.model<IReport>('Report', ReportSchema);
