import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { User, Recipe, Job, BlogPost, MealPlan } from '@/lib/mongodb/schemas';

/**
 * @swagger
 * /api/admin/monitoring/system:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get system monitoring data (Admin only)
 *     description: Retrieves comprehensive system health and performance metrics
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Time range for metrics
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include detailed breakdown
 *     responses:
 *       200:
 *         description: System monitoring data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 system:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     uptime:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     connectionCount:
 *                       type: number
 *                     responseTime:
 *                       type: number
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                     recipes:
 *                       type: object
 *                     jobs:
 *                       type: object
 *                     content:
 *                       type: object
 *                 performance:
 *                   type: object
 *                   properties:
 *                     memory:
 *                       type: object
 *                     cpu:
 *                       type: object
 *                     requests:
 *                       type: object
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
		const { searchParams } = new URL(request.url);
		const timeRange = searchParams.get('timeRange') || 'day';
		const includeDetails = searchParams.get('includeDetails') === 'true';

		const startTime = Date.now();

		// Calculate time range for metrics
		const now = new Date();
		let startDate: Date;

		switch (timeRange) {
			case 'hour':
				startDate = new Date(now.getTime() - 60 * 60 * 1000);
				break;
			case 'day':
				startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				break;
			case 'week':
				startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case 'month':
				startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			default:
				startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		}

		await connectDB();

		// Get database connection status and response time
		const dbStartTime = Date.now();
		const dbHealthCheck = await User.findOne().limit(1).lean();
		const dbResponseTime = Date.now() - dbStartTime;

		// Collect system metrics in parallel
		const [userStats, recipeStats, jobStats, blogStats, mealPlanStats] =
			await Promise.all([
				// User metrics
				User.aggregate([
					{
						$facet: {
							total: [{ $count: 'count' }],
							recent: [
								{ $match: { createdAt: { $gte: startDate } } },
								{ $count: 'count' },
							],
							active: [
								{ $match: { lastLogin: { $gte: startDate } } },
								{ $count: 'count' },
							],
						},
					},
				]),
				// Recipe metrics
				Recipe.aggregate([
					{
						$facet: {
							total: [{ $count: 'count' }],
							recent: [
								{ $match: { createdAt: { $gte: startDate } } },
								{ $count: 'count' },
							],
							public: [{ $match: { isPublic: true } }, { $count: 'count' }],
						},
					},
				]),
				// Job metrics
				Job.aggregate([
					{
						$facet: {
							total: [{ $count: 'count' }],
							recent: [
								{ $match: { createdAt: { $gte: startDate } } },
								{ $count: 'count' },
							],
							pending: [{ $match: { status: 'pending' } }, { $count: 'count' }],
							running: [{ $match: { status: 'running' } }, { $count: 'count' }],
							failed: [{ $match: { status: 'failed' } }, { $count: 'count' }],
						},
					},
				]),
				// Blog metrics
				BlogPost.aggregate([
					{
						$facet: {
							total: [{ $count: 'count' }],
							recent: [
								{ $match: { createdAt: { $gte: startDate } } },
								{ $count: 'count' },
							],
							published: [{ $match: { published: true } }, { $count: 'count' }],
						},
					},
				]),
				// Meal plan metrics
				MealPlan.aggregate([
					{
						$facet: {
							total: [{ $count: 'count' }],
							recent: [
								{ $match: { createdAt: { $gte: startDate } } },
								{ $count: 'count' },
							],
							active: [
								{
									$match: {
										startDate: { $lte: now },
										endDate: { $gte: now },
									},
								},
								{ $count: 'count' },
							],
						},
					},
				]),
			]);

		// Process memory usage
		const memoryUsage = process.memoryUsage();
		const memoryInMB = {
			rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
			heapTotal: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
			heapUsed: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
			external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
		};

		// CPU usage approximation
		const cpuUsage = process.cpuUsage();

		// Build response
		const systemStatus = {
			system: {
				status: 'healthy',
				uptime: process.uptime(),
				timestamp: new Date().toISOString(),
				version: process.env.npm_package_version || '1.0.0',
				nodeVersion: process.version,
				platform: process.platform,
				environment: process.env.NODE_ENV || 'development',
			},
			database: {
				status: dbHealthCheck !== null ? 'connected' : 'disconnected',
				responseTime: dbResponseTime,
				connectionState: 'ready', // MongoDB connection state
			},
			metrics: {
				users: {
					total: userStats[0]?.total[0]?.count || 0,
					recent: userStats[0]?.recent[0]?.count || 0,
					active: userStats[0]?.active[0]?.count || 0,
				},
				recipes: {
					total: recipeStats[0]?.total[0]?.count || 0,
					recent: recipeStats[0]?.recent[0]?.count || 0,
					public: recipeStats[0]?.public[0]?.count || 0,
				},
				jobs: {
					total: jobStats[0]?.total[0]?.count || 0,
					recent: jobStats[0]?.recent[0]?.count || 0,
					pending: jobStats[0]?.pending[0]?.count || 0,
					running: jobStats[0]?.running[0]?.count || 0,
					failed: jobStats[0]?.failed[0]?.count || 0,
				},
				content: {
					blogPosts: {
						total: blogStats[0]?.total[0]?.count || 0,
						recent: blogStats[0]?.recent[0]?.count || 0,
						published: blogStats[0]?.published[0]?.count || 0,
					},
					mealPlans: {
						total: mealPlanStats[0]?.total[0]?.count || 0,
						recent: mealPlanStats[0]?.recent[0]?.count || 0,
						active: mealPlanStats[0]?.active[0]?.count || 0,
					},
				},
			},
			performance: {
				memory: {
					...memoryInMB,
					heapUsagePercentage: Math.round(
						(memoryInMB.heapUsed / memoryInMB.heapTotal) * 100
					),
				},
				cpu: {
					user: cpuUsage.user,
					system: cpuUsage.system,
				},
				responseTime: Date.now() - startTime,
			},
			timeRange: {
				period: timeRange,
				startDate: startDate.toISOString(),
				endDate: now.toISOString(),
			},
		};

		// Add detailed breakdowns if requested
		if (includeDetails) {
			const [jobTypeBreakdown, userActivityBreakdown] = await Promise.all([
				Job.aggregate([
					{
						$group: {
							_id: '$type',
							count: { $sum: 1 },
							pending: {
								$sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
							},
							running: {
								$sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] },
							},
							completed: {
								$sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
							},
							failed: {
								$sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
							},
						},
					},
				]),
				User.aggregate([
					{
						$group: {
							_id: {
								$dateToString: {
									format:
										timeRange === 'hour'
											? '%Y-%m-%d %H:00'
											: timeRange === 'day'
											? '%Y-%m-%d'
											: '%Y-%m-%d',
									date: '$lastLogin',
								},
							},
							activeUsers: { $sum: 1 },
						},
					},
					{ $sort: { _id: 1 } },
				]),
			]);

			(systemStatus as any).details = {
				jobTypes: jobTypeBreakdown,
				userActivity: userActivityBreakdown,
			};
		}

		console.log(`[Admin] Retrieved system monitoring data (${timeRange})`);
		return NextResponse.json(systemStatus);
	} catch (error) {
		console.error('Error fetching system monitoring data:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch system monitoring data',
				system: {
					status: 'error',
					timestamp: new Date().toISOString(),
				},
			},
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
