import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

async function resetFailedJob() {
	try {
		console.log('Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('✅ MongoDB connected\n');

		// Import the Job model
		const { Job } = await import('./dist/models/job.js');

		// Find the failed job
		const failedJob = await Job.findOne({ status: 'failed' });

		if (!failedJob) {
			console.log('No failed jobs found.');
			return;
		}

		console.log(`Found failed job: ${failedJob.id}`);
		console.log(`Type: ${failedJob.type}`);
		console.log(`Season: ${failedJob.data?.season}`);
		console.log(`Error: ${failedJob.error}`);
		console.log(`Created: ${failedJob.createdAt}\n`);

		// Reset the job to pending
		failedJob.status = 'pending';
		failedJob.progress = 0;
		failedJob.error = undefined;
		failedJob.attempts = 0;
		await failedJob.save();

		console.log('✅ Job reset to pending status!');
		console.log(
			'The job can now be processed by workers or the manual processor.'
		);
	} catch (error) {
		console.error('❌ Error:', error.message);
	} finally {
		await mongoose.disconnect();
	}
}

resetFailedJob();
