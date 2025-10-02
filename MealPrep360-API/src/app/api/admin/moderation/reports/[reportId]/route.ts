import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { RecipeReport, ImageReport, Recipe, User } from '@/lib/mongodb/schemas';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/moderation/reports/{reportId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get report details (Admin only)
 *     description: Retrieves detailed information about a specific content report
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID to retrieve
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [recipe, image]
 *         description: Report type (required for lookup)
 *     responses:
 *       200:
 *         description: Report details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report:
 *                   type: object
 *                 content:
 *                   type: object
 *                 reporter:
 *                   type: object
 *       400:
 *         description: Invalid report ID or missing type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
	request: Request,
	{ params }: { params: { reportId: string } }
) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.reportId)) {
			return NextResponse.json(
				{ error: 'Invalid report ID format' },
				{ status: 400 }
			);
		}

		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type');

		if (!type || !['recipe', 'image'].includes(type)) {
			return NextResponse.json(
				{ error: 'Report type (recipe or image) is required' },
				{ status: 400 }
			);
		}

		let report;
		if (type === 'recipe') {
			report = await RecipeReport.findById(params.reportId)
				.populate('userId', 'name email image')
				.populate('recipeId');
		} else {
			report = await ImageReport.findById(params.reportId)
				.populate('userId', 'name email image')
				.populate('recipeId');
		}

		if (!report) {
			return NextResponse.json({ error: 'Report not found' }, { status: 404 });
		}

		console.log(`[Admin] Retrieved ${type} report details: ${params.reportId}`);
		return NextResponse.json({
			report,
			type,
		});
	} catch (error) {
		console.error('Error fetching report details:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch report details' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/moderation/reports/{reportId}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update report status (Admin only)
 *     description: Updates the status and resolution of a content report
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - status
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [recipe, image]
 *                 description: Report type
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved, dismissed]
 *                 description: New report status
 *               resolution:
 *                 type: string
 *                 description: Resolution notes or action taken
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Priority level
 *               actionTaken:
 *                 type: string
 *                 enum: [none, content_removed, user_warned, user_suspended, content_edited]
 *                 description: Action taken on the reported content
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report:
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
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
	request: Request,
	{ params }: { params: { reportId: string } }
) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.reportId)) {
			return NextResponse.json(
				{ error: 'Invalid report ID format' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const { type, status, resolution, priority, actionTaken } = body;

		if (!type || !['recipe', 'image'].includes(type)) {
			return NextResponse.json(
				{ error: 'Valid report type (recipe or image) is required' },
				{ status: 400 }
			);
		}

		if (
			!status ||
			!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)
		) {
			return NextResponse.json(
				{ error: 'Valid status is required' },
				{ status: 400 }
			);
		}

		const updateData: any = {
			status,
			updatedAt: new Date(),
		};

		if (resolution) updateData.resolution = resolution;
		if (priority) updateData.priority = priority;
		if (actionTaken) updateData.actionTaken = actionTaken;

		// Add resolution timestamp if status is resolved or dismissed
		if (status === 'resolved' || status === 'dismissed') {
			updateData.resolvedAt = new Date();
		}

		let report;
		if (type === 'recipe') {
			report = await RecipeReport.findByIdAndUpdate(
				params.reportId,
				updateData,
				{ new: true }
			)
				.populate('userId', 'name email image')
				.populate('recipeId');
		} else {
			report = await ImageReport.findByIdAndUpdate(
				params.reportId,
				updateData,
				{ new: true }
			)
				.populate('userId', 'name email image')
				.populate('recipeId');
		}

		if (!report) {
			return NextResponse.json({ error: 'Report not found' }, { status: 404 });
		}

		// If action was taken on content, update the related content
		if (actionTaken === 'content_removed' && report.recipeId) {
			if (type === 'recipe') {
				await Recipe.findByIdAndUpdate(report.recipeId, {
					isPublic: false,
					moderationStatus: 'removed',
					moderationReason: resolution || 'Content removed due to report',
				});
			} else if (type === 'image') {
				await Recipe.findByIdAndUpdate(report.recipeId, {
					imageUrl: null,
					moderationStatus: 'image_removed',
					moderationReason: resolution || 'Image removed due to report',
				});
			}
		}

		console.log(`[Admin] Updated ${type} report ${params.reportId}: ${status}`);
		return NextResponse.json({
			report,
			message: `Report ${status} successfully`,
		});
	} catch (error) {
		console.error('Error updating report:', error);
		return NextResponse.json(
			{ error: 'Failed to update report' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/moderation/reports/{reportId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete report (Admin only)
 *     description: Permanently deletes a content report
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID to delete
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [recipe, image]
 *         description: Report type (required for deletion)
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid report ID or missing type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
	request: Request,
	{ params }: { params: { reportId: string } }
) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.reportId)) {
			return NextResponse.json(
				{ error: 'Invalid report ID format' },
				{ status: 400 }
			);
		}

		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type');

		if (!type || !['recipe', 'image'].includes(type)) {
			return NextResponse.json(
				{ error: 'Report type (recipe or image) is required' },
				{ status: 400 }
			);
		}

		let deletedReport;
		if (type === 'recipe') {
			deletedReport = await RecipeReport.findByIdAndDelete(params.reportId);
		} else {
			deletedReport = await ImageReport.findByIdAndDelete(params.reportId);
		}

		if (!deletedReport) {
			return NextResponse.json({ error: 'Report not found' }, { status: 404 });
		}

		console.log(`[Admin] Deleted ${type} report: ${params.reportId}`);
		return NextResponse.json({
			success: true,
			message: 'Report deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting report:', error);
		return NextResponse.json(
			{ error: 'Failed to delete report' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
