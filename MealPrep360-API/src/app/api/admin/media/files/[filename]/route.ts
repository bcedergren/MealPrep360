import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import { stat, unlink } from 'fs/promises';
import { join } from 'path';

/**
 * @swagger
 * /api/admin/media/files/{filename}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get media file details (Admin only)
 *     description: Retrieves detailed information about a specific media file
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Filename to retrieve details for
 *     responses:
 *       200:
 *         description: File details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 file:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *                     size:
 *                       type: number
 *                     type:
 *                       type: string
 *                     extension:
 *                       type: string
 *                     lastModified:
 *                       type: string
 *                       format: date-time
 *                     created:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid filename
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ filename: string }> }
) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		const { filename } = await params;

		// Validate filename to prevent directory traversal
		if (
			filename.includes('..') ||
			filename.includes('/') ||
			filename.includes('\\')
		) {
			return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
		}

		const uploadsDir = join(process.cwd(), 'public', 'uploads');
		const filePath = join(uploadsDir, filename);

		try {
			const stats = await stat(filePath);

			if (!stats.isFile()) {
				return NextResponse.json({ error: 'File not found' }, { status: 404 });
			}

			const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
			const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
			const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'csv'];

			let fileType = 'other';
			if (imageExtensions.includes(fileExtension)) {
				fileType = 'image';
			} else if (documentExtensions.includes(fileExtension)) {
				fileType = 'document';
			}

			const fileInfo = {
				name: filename,
				url: `/uploads/${filename}`,
				size: stats.size,
				type: fileType,
				extension: fileExtension,
				lastModified: stats.mtime.toISOString(),
				created: stats.birthtime.toISOString(),
			};

			console.log(`[Admin] Retrieved file details: ${filename}`);
			return NextResponse.json({ file: fileInfo });
		} catch (fileError) {
			if ((fileError as any).code === 'ENOENT') {
				return NextResponse.json({ error: 'File not found' }, { status: 404 });
			}
			throw fileError;
		}
	} catch (error) {
		console.error('Error getting file details:', error);
		return NextResponse.json(
			{ error: 'Failed to get file details' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/media/files/{filename}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete media file (Admin only)
 *     description: Deletes a specific media file from the server
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Filename to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 file:
 *                   type: string
 *       400:
 *         description: Invalid filename
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ filename: string }> }
) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		const { filename } = await params;

		// Validate filename to prevent directory traversal
		if (
			filename.includes('..') ||
			filename.includes('/') ||
			filename.includes('\\')
		) {
			return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
		}

		const uploadsDir = join(process.cwd(), 'public', 'uploads');
		const filePath = join(uploadsDir, filename);

		try {
			await unlink(filePath);
			console.log(`[Admin] Deleted file: ${filename}`);
			return NextResponse.json({
				success: true,
				message: 'File deleted successfully',
				file: filename,
			});
		} catch (fileError) {
			if ((fileError as any).code === 'ENOENT') {
				return NextResponse.json({ error: 'File not found' }, { status: 404 });
			}
			throw fileError;
		}
	} catch (error) {
		console.error('Error deleting file:', error);
		return NextResponse.json(
			{ error: 'Failed to delete file' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
