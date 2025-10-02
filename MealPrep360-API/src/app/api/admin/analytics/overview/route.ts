import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import {
	User,
	Recipe,
	MealPlan,
	BlogPost,
	Job,
	Subscription,
} from '@/lib/mongodb/schemas';

/**
 * @swagger
 * /api/admin/analytics/overview:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get analytics overview (Admin only)
 *     description: Retrieves comprehensive analytics and reporting data for the platform
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year, all]
 *           default: month
 *         description: Time range for analytics
 *       - in: query
 *         name: compareWith
 *         schema:
 *           type: string
 *           enum: [previous, year_ago]
 *         description: Compare with previous period
 *       - in: query
 *         name: includeCharts
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include time series data for charts
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                   properties:
 *                     range:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     new:
 *                       type: number
 *                     active:
 *                       type: number
 *                     retention:
 *                       type: number
 *                 content:
 *                   type: object
 *                   properties:
 *                     recipes:
 *                       type: object
 *                     mealPlans:
 *                       type: object
 *                     blogPosts:
 *                       type: object
 *                 engagement:
 *                   type: object
 *                   properties:
 *                     avgSessionDuration:
 *                       type: number
 *                     avgRecipesPerUser:
 *                       type: number
 *                     avgMealPlansPerUser:
 *                       type: number
 *                 revenue:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     subscriptions:
 *                       type: object
 *                 system:
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: object
 *                     performance:
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
		await connectDB();

		const { searchParams } = new URL(request.url);
		const timeRange = searchParams.get('timeRange') || 'month';
		const compareWith = searchParams.get('compareWith');
		const includeCharts = searchParams.get('includeCharts') === 'true';

		// Calculate time periods
		const now = new Date();
		let startDate: Date;
		let endDate = now;

		switch (timeRange) {
			case 'today':
				startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				break;
			case 'week':
				startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case 'month':
				startDate = new Date(now.getFullYear(), now.getMonth(), 1);
				break;
			case 'quarter':
				const quarterStart = Math.floor(now.getMonth() / 3) * 3;
				startDate = new Date(now.getFullYear(), quarterStart, 1);
				break;
			case 'year':
				startDate = new Date(now.getFullYear(), 0, 1);
				break;
			case 'all':
			default:
				startDate = new Date(0);
				break;
		}

		// Calculate comparison period if requested
		let compareStartDate: Date | null = null;
		let compareEndDate: Date | null = null;

		if (compareWith === 'previous') {
			const periodLength = endDate.getTime() - startDate.getTime();
			compareEndDate = new Date(startDate.getTime() - 1);
			compareStartDate = new Date(startDate.getTime() - periodLength);
		} else if (compareWith === 'year_ago') {
			compareStartDate = new Date(
				startDate.getFullYear() - 1,
				startDate.getMonth(),
				startDate.getDate()
			);
			compareEndDate = new Date(
				endDate.getFullYear() - 1,
				endDate.getMonth(),
				endDate.getDate()
			);
		}

		// Execute analytics queries in parallel
		const [
			userAnalytics,
			recipeAnalytics,
			mealPlanAnalytics,
			blogAnalytics,
			jobAnalytics,
			subscriptionAnalytics,
			comparisonData,
		] = await Promise.all([
			// User analytics
			User.aggregate([
				{
					$facet: {
						total: [{ $count: 'count' }],
						new: [
							{ $match: { createdAt: { $gte: startDate, $lte: endDate } } },
							{ $count: 'count' },
						],
						active: [
							{ $match: { lastLogin: { $gte: startDate, $lte: endDate } } },
							{ $count: 'count' },
						],
						retention: [
							{
								$match: {
									createdAt: { $lt: startDate },
									lastLogin: { $gte: startDate, $lte: endDate },
								},
							},
							{ $count: 'count' },
						],
					},
				},
			]),
			// Recipe analytics
			Recipe.aggregate([
				{
					$facet: {
						total: [{ $count: 'count' }],
						new: [
							{ $match: { createdAt: { $gte: startDate, $lte: endDate } } },
							{ $count: 'count' },
						],
						public: [{ $match: { isPublic: true } }, { $count: 'count' }],
						avgRating: [
							{ $match: { rating: { $exists: true, $ne: null } } },
							{ $group: { _id: null, avgRating: { $avg: '$rating' } } },
						],
					},
				},
			]),
			// Meal plan analytics
			MealPlan.aggregate([
				{
					$facet: {
						total: [{ $count: 'count' }],
						new: [
							{ $match: { createdAt: { $gte: startDate, $lte: endDate } } },
							{ $count: 'count' },
						],
						active: [
							{
								$match: {
									startDate: { $lte: endDate },
									endDate: { $gte: startDate },
								},
							},
							{ $count: 'count' },
						],
					},
				},
			]),
			// Blog analytics
			BlogPost.aggregate([
				{
					$facet: {
						total: [{ $count: 'count' }],
						new: [
							{ $match: { createdAt: { $gte: startDate, $lte: endDate } } },
							{ $count: 'count' },
						],
						published: [{ $match: { published: true } }, { $count: 'count' }],
					},
				},
			]),
			// Job analytics
			Job.aggregate([
				{
					$facet: {
						total: [{ $count: 'count' }],
						recent: [
							{ $match: { createdAt: { $gte: startDate, $lte: endDate } } },
							{ $count: 'count' },
						],
						completed: [
							{
								$match: {
									status: 'completed',
									completedAt: { $gte: startDate, $lte: endDate },
								},
							},
							{ $count: 'count' },
						],
						failed: [
							{
								$match: {
									status: 'failed',
									updatedAt: { $gte: startDate, $lte: endDate },
								},
							},
							{ $count: 'count' },
						],
						avgDuration: [
							{
								$match: {
									status: 'completed',
									startedAt: { $exists: true },
									completedAt: {
										$exists: true,
										$gte: startDate,
										$lte: endDate,
									},
								},
							},
							{
								$project: {
									duration: {
										$subtract: ['$completedAt', '$startedAt'],
									},
								},
							},
							{
								$group: {
									_id: null,
									avgDuration: { $avg: '$duration' },
								},
							},
						],
					},
				},
			]),
			// Subscription analytics
			Subscription.aggregate([
				{
					$facet: {
						total: [{ $count: 'count' }],
						active: [
							{
								$match: {
									status: 'ACTIVE',
									currentPeriodEnd: { $gte: now },
								},
							},
							{ $count: 'count' },
						],
						new: [
							{ $match: { createdAt: { $gte: startDate, $lte: endDate } } },
							{ $count: 'count' },
						],
						revenue: [
							{
								$match: {
									status: 'ACTIVE',
									currentPeriodStart: { $gte: startDate, $lte: endDate },
								},
							},
							{
								$group: {
									_id: '$plan',
									count: { $sum: 1 },
								},
							},
						],
					},
				},
			]),
			// Comparison data (if requested)
			compareStartDate && compareEndDate
				? Promise.all([
						User.aggregate([
							{
								$facet: {
									new: [
										{
											$match: {
												createdAt: {
													$gte: compareStartDate,
													$lte: compareEndDate,
												},
											},
										},
										{ $count: 'count' },
									],
									active: [
										{
											$match: {
												lastLogin: {
													$gte: compareStartDate,
													$lte: compareEndDate,
												},
											},
										},
										{ $count: 'count' },
									],
								},
							},
						]),
						Recipe.aggregate([
							{
								$facet: {
									new: [
										{
											$match: {
												createdAt: {
													$gte: compareStartDate,
													$lte: compareEndDate,
												},
											},
										},
										{ $count: 'count' },
									],
								},
							},
						]),
				  ])
				: null,
		]);

		// Process results
		const analytics = {
			period: {
				range: timeRange,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
			users: {
				total: userAnalytics[0]?.total[0]?.count || 0,
				new: userAnalytics[0]?.new[0]?.count || 0,
				active: userAnalytics[0]?.active[0]?.count || 0,
				retention: userAnalytics[0]?.retention[0]?.count || 0,
			},
			content: {
				recipes: {
					total: recipeAnalytics[0]?.total[0]?.count || 0,
					new: recipeAnalytics[0]?.new[0]?.count || 0,
					public: recipeAnalytics[0]?.public[0]?.count || 0,
					avgRating: recipeAnalytics[0]?.avgRating[0]?.avgRating || 0,
				},
				mealPlans: {
					total: mealPlanAnalytics[0]?.total[0]?.count || 0,
					new: mealPlanAnalytics[0]?.new[0]?.count || 0,
					active: mealPlanAnalytics[0]?.active[0]?.count || 0,
				},
				blogPosts: {
					total: blogAnalytics[0]?.total[0]?.count || 0,
					new: blogAnalytics[0]?.new[0]?.count || 0,
					published: blogAnalytics[0]?.published[0]?.count || 0,
				},
			},
			engagement: {
				avgRecipesPerUser:
					userAnalytics[0]?.total[0]?.count > 0
						? Math.round(
								((recipeAnalytics[0]?.total[0]?.count || 0) /
									userAnalytics[0].total[0].count) *
									100
						  ) / 100
						: 0,
				avgMealPlansPerUser:
					userAnalytics[0]?.total[0]?.count > 0
						? Math.round(
								((mealPlanAnalytics[0]?.total[0]?.count || 0) /
									userAnalytics[0].total[0].count) *
									100
						  ) / 100
						: 0,
				userRetentionRate:
					userAnalytics[0]?.new[0]?.count > 0
						? Math.round(
								((userAnalytics[0]?.retention[0]?.count || 0) /
									userAnalytics[0].new[0].count) *
									100
						  )
						: 0,
			},
			revenue: {
				total: 0, // Would need to calculate from actual payment data
				subscriptions: {
					total: subscriptionAnalytics[0]?.total[0]?.count || 0,
					active: subscriptionAnalytics[0]?.active[0]?.count || 0,
					new: subscriptionAnalytics[0]?.new[0]?.count || 0,
					plans: subscriptionAnalytics[0]?.revenue || [],
				},
			},
			system: {
				jobs: {
					total: jobAnalytics[0]?.total[0]?.count || 0,
					recent: jobAnalytics[0]?.recent[0]?.count || 0,
					completed: jobAnalytics[0]?.completed[0]?.count || 0,
					failed: jobAnalytics[0]?.failed[0]?.count || 0,
					avgDuration: jobAnalytics[0]?.avgDuration[0]?.avgDuration || 0,
					successRate:
						jobAnalytics[0]?.recent[0]?.count > 0
							? Math.round(
									((jobAnalytics[0]?.completed[0]?.count || 0) /
										jobAnalytics[0].recent[0].count) *
										100
							  )
							: 0,
				},
			},
		};

		// Add comparison data if available
		if (comparisonData && compareWith) {
			const [compareUsers, compareRecipes] = comparisonData;
			(analytics as any).comparison = {
				period: compareWith,
				startDate: compareStartDate?.toISOString(),
				endDate: compareEndDate?.toISOString(),
				users: {
					new: compareUsers[0]?.new[0]?.count || 0,
					active: compareUsers[0]?.active[0]?.count || 0,
				},
				recipes: {
					new: compareRecipes[0]?.new[0]?.count || 0,
				},
				growth: {
					users: calculateGrowth(
						analytics.users.new,
						compareUsers[0]?.new[0]?.count || 0
					),
					recipes: calculateGrowth(
						analytics.content.recipes.new,
						compareRecipes[0]?.new[0]?.count || 0
					),
				},
			};
		}

		// Add time series data for charts if requested
		if (includeCharts) {
			const chartData = await generateChartData(startDate, endDate, timeRange);
			(analytics as any).charts = chartData;
		}

		console.log(`[Admin] Retrieved analytics overview (${timeRange})`);
		return NextResponse.json(analytics);
	} catch (error) {
		console.error('Error fetching analytics:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch analytics data' },
			{ status: 500 }
		);
	}
}

function calculateGrowth(current: number, previous: number): number {
	if (previous === 0) return current > 0 ? 100 : 0;
	return Math.round(((current - previous) / previous) * 100);
}

async function generateChartData(
	startDate: Date,
	endDate: Date,
	timeRange: string
) {
	const format =
		timeRange === 'today'
			? '%Y-%m-%d %H:00'
			: timeRange === 'week'
			? '%Y-%m-%d'
			: timeRange === 'month'
			? '%Y-%m-%d'
			: '%Y-%m';

	const [userGrowth, recipeGrowth] = await Promise.all([
		User.aggregate([
			{
				$match: { createdAt: { $gte: startDate, $lte: endDate } },
			},
			{
				$group: {
					_id: {
						$dateToString: { format, date: '$createdAt' },
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]),
		Recipe.aggregate([
			{
				$match: { createdAt: { $gte: startDate, $lte: endDate } },
			},
			{
				$group: {
					_id: {
						$dateToString: { format, date: '$createdAt' },
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]),
	]);

	return {
		userGrowth: userGrowth.map((item) => ({
			date: item._id,
			value: item.count,
		})),
		recipeGrowth: recipeGrowth.map((item) => ({
			date: item._id,
			value: item.count,
		})),
	};
}

export const dynamic = 'force-dynamic';
