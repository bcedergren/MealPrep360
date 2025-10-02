import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import {
	User,
	Recipe,
	Feedback,
	ImageReport,
	BlogPost,
} from '@/lib/mongodb/schemas';

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get system statistics (Admin only)
 *     description: Retrieves comprehensive system statistics including users, recipes, feedback, and reports
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     recentSignups:
 *                       type: number
 *                 recipes:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     public:
 *                       type: number
 *                     private:
 *                       type: number
 *                 feedback:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     averageRating:
 *                       type: number
 *                 reports:
 *                   type: object
 *                   properties:
 *                     imageReports:
 *                       type: number
 *                     pendingReports:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET() {
	const authCheck = await adminAuth('canViewAnalytics');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		// Get current date and 30 days ago for recent signups
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// Run all queries in parallel for better performance
		const [
			totalUsers,
			recentSignups,
			totalRecipes,
			publicRecipes,
			totalFeedback,
			averageRating,
			totalImageReports,
			pendingImageReports,
			totalBlogPosts,
			publishedBlogPosts,
		] = await Promise.all([
			User.countDocuments(),
			User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
			Recipe.countDocuments(),
			Recipe.countDocuments({ isPublic: true }),
			Feedback.countDocuments(),
			Feedback.aggregate([
				{ $group: { _id: null, avgRating: { $avg: '$rating' } } },
			]),
			ImageReport.countDocuments(),
			ImageReport.countDocuments({ status: 'pending' }),
			BlogPost.countDocuments(),
			BlogPost.countDocuments({ published: true }),
		]);

		const stats = {
			users: {
				total: totalUsers,
				recentSignups,
			},
			recipes: {
				total: totalRecipes,
				public: publicRecipes,
				private: totalRecipes - publicRecipes,
			},
			feedback: {
				total: totalFeedback,
				averageRating:
					averageRating.length > 0 ? averageRating[0].avgRating : 0,
			},
			reports: {
				imageReports: totalImageReports,
				pendingReports: pendingImageReports,
			},
			blog: {
				total: totalBlogPosts,
				published: publishedBlogPosts,
				drafts: totalBlogPosts - publishedBlogPosts,
			},
			lastUpdated: new Date().toISOString(),
		};

		return NextResponse.json(stats);
	} catch (error) {
		console.error('Failed to fetch admin stats:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch statistics' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
