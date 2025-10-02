import { NextRequest, NextResponse } from 'next/server';
import { queueService } from '../../src/services/queueService';
import { RecipeGenerationWorker } from '../../src/workers/recipeGenerationWorker';

export async function GET(request: NextRequest) {
	// Verify this is called by Vercel Cron
	const authHeader = request.headers.get('authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Process up to 3 jobs per cron run (to stay within 10s limit)
		const maxJobs = 3;
		const results = [];
		const worker = new RecipeGenerationWorker();

		for (let i = 0; i < maxJobs; i++) {
			const job = await queueService.getNextJob('recipe-generation-queue');
			if (!job) break;

			try {
				// Process the job with timeout
				const result = await Promise.race([
					worker.processJob(job),
					new Promise((_, reject) =>
						setTimeout(() => reject(new Error('Timeout')), 8000)
					),
				]);

				results.push({ jobId: job.id, status: 'completed' });
			} catch (error) {
				// If job fails, requeue it or mark as failed
				await queueService.requeueJob(job.id);
				results.push({
					jobId: job.id,
					status: 'requeued',
					error: error.message,
				});
			}
		}

		return NextResponse.json({
			processed: results.length,
			results,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Cron job error:', error);
		return NextResponse.json(
			{
				error: 'Processing failed',
				message: error.message,
			},
			{ status: 500 }
		);
	}
}

// Configure for Edge Runtime (faster cold starts)
export const runtime = 'nodejs';
export const maxDuration = 10; // 10 seconds max
