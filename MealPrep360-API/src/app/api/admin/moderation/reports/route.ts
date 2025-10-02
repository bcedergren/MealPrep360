import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { RecipeReport, ImageReport, User, Recipe } from '@/lib/mongodb/schemas';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/moderation/reports:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get content reports (Admin only)
 *     description: Retrieves content reports for moderation with filtering and pagination
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, recipe, image]
 *         description: Filter by report type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, reviewed, resolved, dismissed]
 *         description: Filter by report status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [all, low, medium, high, critical]
 *         description: Filter by priority level
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
 *         description: Number of reports per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, priority]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     type: object
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
 *                     totalReports:
 *                       type: number
 *                     pendingReports:
 *                       type: number
 *                     resolvedReports:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type') || 'all';
		const status = searchParams.get('status') || 'all';
		const priority = searchParams.get('priority') || 'all';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const sortBy = searchParams.get('sortBy') || 'createdAt';
		const sortOrder = searchParams.get('sortOrder') || 'desc';
		const skip = (page - 1) * limit;

		// Build aggregation pipeline for combined reports
		const matchStage: any = {};

		if (status !== 'all') {
			matchStage.status = status;
		}

		if (priority !== 'all') {
			matchStage.priority = priority;
		}

		// Create sort object
		const sortObj: any = {};
		sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

		let reports = [];
		let total = 0;

		if (type === 'all' || type === 'recipe') {
			const recipeReports = await RecipeReport.aggregate([
				{ $match: matchStage },
				{
					$lookup: {
						from: 'users',
						localField: 'userId',
						foreignField: '_id',
						as: 'reporter',
					},
				},
				{
					$lookup: {
						from: 'recipes',
						localField: 'recipeId',
						foreignField: '_id',
						as: 'content',
					},
				},
				{
					$addFields: {
						type: 'recipe',
						reporter: { $arrayElemAt: ['$reporter', 0] },
						content: { $arrayElemAt: ['$content', 0] },
					},
				},
				{ $sort: sortObj },
				{ $skip: skip },
				{ $limit: limit },
			]);
			reports.push(...recipeReports);
		}

		if (type === 'all' || type === 'image') {
			const imageReports = await ImageReport.aggregate([
				{ $match: matchStage },
				{
					$lookup: {
						from: 'users',
						localField: 'userId',
						foreignField: '_id',
						as: 'reporter',
					},
				},
				{
					$lookup: {
						from: 'recipes',
						localField: 'recipeId',
						foreignField: '_id',
						as: 'content',
					},
				},
				{
					$addFields: {
						type: 'image',
						reporter: { $arrayElemAt: ['$reporter', 0] },
						content: { $arrayElemAt: ['$content', 0] },
					},
				},
				{ $sort: sortObj },
				{ $skip: skip },
				{ $limit: limit },
			]);
			reports.push(...imageReports);
		}

		// Get total counts for pagination and stats
		const [recipeReportStats, imageReportStats] = await Promise.all([
			RecipeReport.aggregate([
				{
					$group: {
						_id: null,
						total: { $sum: 1 },
						pending: {
							$sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
						},
						resolved: {
							$sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
						},
					},
				},
			]),
			ImageReport.aggregate([
				{
					$group: {
						_id: null,
						total: { $sum: 1 },
						pending: {
							$sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
						},
						resolved: {
							$sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
						},
					},
				},
			]),
		]);

		const recipeStats = recipeReportStats[0] || {
			total: 0,
			pending: 0,
			resolved: 0,
		};
		const imageStats = imageReportStats[0] || {
			total: 0,
			pending: 0,
			resolved: 0,
		};

		const stats = {
			totalReports: recipeStats.total + imageStats.total,
			pendingReports: recipeStats.pending + imageStats.pending,
			resolvedReports: recipeStats.resolved + imageStats.resolved,
			recipeReports: recipeStats.total,
			imageReports: imageStats.total,
		};

		// Sort combined results if needed
		if (type === 'all') {
			reports.sort((a, b) => {
				const aVal = a[sortBy];
				const bVal = b[sortBy];
				if (sortOrder === 'desc') {
					return bVal > aVal ? 1 : -1;
				}
				return aVal > bVal ? 1 : -1;
			});
		}

		total =
			type === 'all'
				? stats.totalReports
				: type === 'recipe'
				? recipeStats.total
				: imageStats.total;

		console.log(
			`[Admin] Retrieved ${reports.length} moderation reports (${type}, ${status})`
		);
		return NextResponse.json({
			reports,
			pagination: {
				total,
				pages: Math.ceil(total / limit),
				current: page,
			},
			stats,
		});
	} catch (error) {
		console.error('Error fetching moderation reports:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch reports' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
