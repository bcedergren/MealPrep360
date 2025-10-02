import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Job } from '@/lib/mongodb/schemas';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/jobs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get system jobs (Admin only)
 *     description: Retrieves system jobs with filtering and pagination for monitoring
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, running, completed, failed, cancelled]
 *         description: Filter by job status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by job type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of jobs per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, completedAt, type, status]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: all
 *         description: Filter by time range
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       progress:
 *                         type: number
 *                       total:
 *                         type: number
 *                       attempts:
 *                         type: number
 *                       maxAttempts:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                       error:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *                     current:
 *                       type: number
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalJobs:
 *                       type: number
 *                     pendingJobs:
 *                       type: number
 *                     runningJobs:
 *                       type: number
 *                     completedJobs:
 *                       type: number
 *                     failedJobs:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
	const authCheck = await adminAuth('canViewAnalytics');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status') || 'all';
		const type = searchParams.get('type');
		const timeRange = searchParams.get('timeRange') || 'all';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const sortBy = searchParams.get('sortBy') || 'createdAt';
		const sortOrder = searchParams.get('sortOrder') || 'desc';
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {};

		if (status !== 'all') {
			query.status = status;
		}

		if (type) {
			query.type = type;
		}

		// Add time range filter
		if (timeRange !== 'all') {
			const now = new Date();
			let startDate: Date;

			switch (timeRange) {
				case 'today':
					startDate = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate()
					);
					break;
				case 'week':
					startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case 'month':
					startDate = new Date(now.getFullYear(), now.getMonth(), 1);
					break;
				default:
					startDate = new Date(0);
			}

			query.createdAt = { $gte: startDate };
		}

		// Create sort object
		const sortObj: any = {};
		sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Execute queries in parallel
		const [jobs, total, stats] = await Promise.all([
			Job.find(query)
				.sort(sortObj)
				.skip(skip)
				.limit(limit)
				.select('-data -result') // Exclude potentially large data fields
				.lean(),
			Job.countDocuments(query),
			Job.aggregate([
				{
					$group: {
						_id: null,
						totalJobs: { $sum: 1 },
						pendingJobs: {
							$sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
						},
						runningJobs: {
							$sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] },
						},
						completedJobs: {
							$sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
						},
						failedJobs: {
							$sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
						},
						cancelledJobs: {
							$sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
						},
					},
				},
			]),
		]);

		const statsData = stats[0] || {
			totalJobs: 0,
			pendingJobs: 0,
			runningJobs: 0,
			completedJobs: 0,
			failedJobs: 0,
			cancelledJobs: 0,
		};

		// Calculate job durations for completed jobs
		const jobsWithDuration = jobs.map((job) => {
			let duration = null;
			if (job.completedAt && job.startedAt) {
				duration =
					new Date(job.completedAt).getTime() -
					new Date(job.startedAt).getTime();
			}
			return {
				...job,
				duration,
				progressPercentage:
					job.total > 0 ? Math.round((job.progress / job.total) * 100) : 0,
			};
		});

		console.log(
			`[Admin] Retrieved ${jobs.length} jobs (${status}, ${
				type || 'all types'
			})`
		);
		return NextResponse.json({
			jobs: jobsWithDuration,
			pagination: {
				total,
				pages: Math.ceil(total / limit),
				current: page,
			},
			stats: statsData,
		});
	} catch (error) {
		console.error('Error fetching jobs:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch jobs' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/jobs:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create a new job (Admin only)
 *     description: Creates a new background job for processing
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - data
 *             properties:
 *               type:
 *                 type: string
 *                 description: Job type identifier
 *               data:
 *                 type: object
 *                 description: Job data payload
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, critical]
 *                 default: normal
 *               maxAttempts:
 *                 type: number
 *                 default: 3
 *               delay:
 *                 type: number
 *                 description: Delay in milliseconds before job execution
 *     responses:
 *       201:
 *         description: Job created successfully
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
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const body = await request.json();
		const {
			type,
			data,
			priority = 'normal',
			maxAttempts = 3,
			delay = 0,
		} = body;

		if (!type || !data) {
			return NextResponse.json(
				{ error: 'Job type and data are required' },
				{ status: 400 }
			);
		}

		// Generate unique job ID
		const jobId = `${type}_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;

		// Calculate start time if delay is specified
		const scheduledAt = delay > 0 ? new Date(Date.now() + delay) : new Date();

		const job = new Job({
			id: jobId,
			type,
			status: delay > 0 ? 'scheduled' : 'pending',
			data,
			maxAttempts,
			attempts: 0,
			progress: 0,
			total: data.total || 1,
			scheduledAt: delay > 0 ? scheduledAt : undefined,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await job.save();

		console.log(`[Admin] Created job: ${jobId} (${type})`);
		return NextResponse.json(
			{
				job: {
					id: job.id,
					type: job.type,
					status: job.status,
					createdAt: job.createdAt,
					scheduledAt: job.scheduledAt,
				},
				message: 'Job created successfully',
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating job:', error);
		return NextResponse.json(
			{ error: 'Failed to create job' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
