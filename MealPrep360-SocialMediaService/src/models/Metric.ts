import mongoose, { Schema, Document } from 'mongoose';

export interface IMetric extends Document {
	userId: string;
	endpoint: string;
	method: string;
	duration: number;
	statusCode: number;
	timestamp: Date;
}

const MetricSchema = new Schema<IMetric>(
	{
		userId: {
			type: String,
			required: true,
			index: true,
		},
		endpoint: {
			type: String,
			required: true,
		},
		method: {
			type: String,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
		},
		statusCode: {
			type: Number,
			required: true,
		},
		timestamp: {
			type: Date,
			required: true,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

// Create compound index for efficient querying
MetricSchema.index({ userId: 1, timestamp: -1 });

export const Metric =
	mongoose.models.Metric || mongoose.model<IMetric>('Metric', MetricSchema);
