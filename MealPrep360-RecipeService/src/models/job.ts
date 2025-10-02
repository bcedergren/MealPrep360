import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
	id: string;
	type: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	progress: number;
	total: number;
	data: any;
	error?: string;
	attempts: number;
	webhookUrl?: string;
	result?: any;
	createdAt: Date;
	updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
	{
		id: { type: String, required: true, unique: true },
		type: { type: String, required: true },
		status: {
			type: String,
			required: true,
			enum: ['pending', 'processing', 'completed', 'failed'],
			default: 'pending',
		},
		progress: { type: Number, default: 0 },
		total: { type: Number, default: 0 },
		data: { type: Schema.Types.Mixed, required: true },
		error: { type: String },
		attempts: { type: Number, default: 0 },
		webhookUrl: { type: String },
		result: { type: Schema.Types.Mixed },
	},
	{
		timestamps: true,
	}
);

// Create index for faster queries
JobSchema.index({ status: 1, createdAt: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
