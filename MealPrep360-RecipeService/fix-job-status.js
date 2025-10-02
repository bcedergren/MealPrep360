#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixJobStatus() {
	try {
		console.log('Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});

		console.log('Connected to MongoDB');

		// Import the Job model
		const { Job } = await import('./dist/models/job.js');

		// Find the stuck job
		const jobId = '2bea05f8-b9f0-461e-9345-e7b45528c8d1';
		const job = await Job.findOne({ id: jobId });

		if (job) {
			console.log('Found job:', {
				id: job.id,
				status: job.status,
				progress: job.progress,
				error: job.error,
				attempts: job.attempts,
			});

			// Fix the job status
			if (job.status === 'processing' && job.error) {
				console.log('Fixing job status from processing to failed...');
				job.status = 'failed';
				job.updatedAt = new Date();
				await job.save();
				console.log('✅ Job status fixed to failed');
			} else {
				console.log("Job status is already correct or doesn't need fixing");
			}
		} else {
			console.log('Job not found');
		}
	} catch (error) {
		console.error('Error:', error.message);
	} finally {
		await mongoose.disconnect();
		console.log('Disconnected from MongoDB');
	}
}

fixJobStatus();
