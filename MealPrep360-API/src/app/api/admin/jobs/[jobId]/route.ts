import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Job } from '@/lib/mongodb/schemas';

/**
 * @swagger
 * /api/admin/jobs/{jobId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get job details (Admin only)
 *     description: Retrieves detailed information about a specific job
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to retrieve
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     data:
 *                       type: object
 *                     result:
 *                       type: object
 *                     error:
 *                       type: string
 *                     progress:
 *                       type: number
 *                     total:
 *                       type: number
 *                     attempts:
 *                       type: number
 *                     maxAttempts:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     startedAt:
 *                       type: string
 *                       format: date-time
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                     duration:
 *                       type: number
 *                     progressPercentage:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ jobId: string }> }
) {
	const authCheck = await adminAuth('canViewAnalytics');
	if (authCheck) return authCheck;

	try {
		await connectDB();
		const { jobId } = await params;

		const job = await Job.findOne({ id: jobId }).lean();

		if (!job) {
			return NextResponse.json({ error: 'Job not found' }, { status: 404 });
		}

		// Calculate duration and progress percentage
		let duration = null;
		if ((job as any).completedAt && (job as any).startedAt) {
			duration =
				new Date((job as any).completedAt).getTime() -
				new Date((job as any).startedAt).getTime();
		}

		const progressPercentage =
			(job as any).total > 0
				? Math.round(((job as any).progress / (job as any).total) * 100)
				: 0;

		const jobWithMetrics = {
			...job,
			duration,
			progressPercentage,
		};

		console.log(`[Admin] Retrieved job details: ${jobId}`);
		return NextResponse.json({ job: jobWithMetrics });
	} catch (error) {
		console.error('Error fetching job details:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch job details' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/jobs/{jobId}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update job status (Admin only)
 *     description: Updates job status, progress, or cancels a job
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [cancel, retry, reset, updateProgress]
 *                 description: Action to perform on the job
 *               progress:
 *                 type: number
 *                 description: Update job progress (for updateProgress action)
 *               reason:
 *                 type: string
 *                 description: Reason for the action
 *     responses:
 *       200:
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ jobId: string }> }
) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		await connectDB();
		const { jobId } = await params;

		const body = await request.json();
		const { action, progress, reason } = body;

		if (!action) {
			return NextResponse.json(
				{ error: 'Action is required' },
				{ status: 400 }
			);
		}

		const job = await Job.findOne({ id: jobId });

		if (!job) {
			return NextResponse.json({ error: 'Job not found' }, { status: 404 });
		}

		let updateData: any = {
			updatedAt: new Date(),
		};

		switch (action) {
			case 'cancel':
				if (job.status === 'running' || job.status === 'pending') {
					updateData.status = 'cancelled';
					updateData.completedAt = new Date();
					updateData.error = reason || 'Cancelled by admin';
				} else {
					return NextResponse.json(
						{ error: 'Job cannot be cancelled in current status' },
						{ status: 400 }
					);
				}
				break;

			case 'retry':
				if (job.status === 'failed' || job.status === 'cancelled') {
					updateData.status = 'pending';
					updateData.attempts = 0;
					updateData.error = null;
					updateData.startedAt = null;
					updateData.completedAt = null;
					updateData.progress = 0;
				} else {
					return NextResponse.json(
						{ error: 'Job cannot be retried in current status' },
						{ status: 400 }
					);
				}
				break;

			case 'reset':
				updateData.status = 'pending';
				updateData.attempts = 0;
				updateData.error = null;
				updateData.startedAt = null;
				updateData.completedAt = null;
				updateData.progress = 0;
				break;

			case 'updateProgress':
				if (typeof progress !== 'number') {
					return NextResponse.json(
						{ error: 'Progress must be a number' },
						{ status: 400 }
					);
				}
				updateData.progress = Math.max(0, Math.min(progress, job.total || 100));
				break;

			default:
				return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
		}

		const updatedJob = await Job.findOneAndUpdate({ id: jobId }, updateData, {
			new: true,
		}).lean();

		console.log(`[Admin] Updated job ${jobId}: ${action}`);
		return NextResponse.json({
			job: updatedJob,
			message: `Job ${action} successfully`,
		});
	} catch (error) {
		console.error('Error updating job:', error);
		return NextResponse.json(
			{ error: 'Failed to update job' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/jobs/{jobId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete job (Admin only)
 *     description: Permanently deletes a job from the system
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to delete
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Job not found
 *       409:
 *         description: Cannot delete running job
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ jobId: string }> }
) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		await connectDB();
		const { jobId } = await params;

		const job = await Job.findOne({ id: jobId });

		if (!job) {
			return NextResponse.json({ error: 'Job not found' }, { status: 404 });
		}

		// Prevent deletion of running jobs
		if (job.status === 'running') {
			return NextResponse.json(
				{ error: 'Cannot delete running job. Cancel it first.' },
				{ status: 409 }
			);
		}

		await Job.findOneAndDelete({ id: jobId });

		console.log(`[Admin] Deleted job: ${jobId}`);
		return NextResponse.json({
			success: true,
			message: 'Job deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting job:', error);
		return NextResponse.json(
			{ error: 'Failed to delete job' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
